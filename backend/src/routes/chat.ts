import { Router, Response } from 'express'
import { createHash } from 'crypto'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import {
  callCapybaraAI,
  callMultipleClones,
} from '../services/langgraph-orchestrator'

const router = Router()

// Helper: Generate deterministic UUID v4 from string
const userHeaderToUUID = (header: string): string => {
  const hash = createHash('md5').update(header).digest('hex')
  // Convert first 16 hex chars to UUID v4 format
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`
}

// Helper: Generate random UUID v4
const generateUUID = (): string => {
  const chars = '0123456789abcdef'
  let uuid = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-'
    } else if (i === 14) {
      uuid += '4' // UUID v4
    } else {
      uuid += chars[Math.floor(Math.random() * (i === 19 ? 4 : 16))]
    }
  }
  return uuid
}

/**
 * POST /chat/init
 * Initialize a new chat session
 */
router.post('/init', async (req: AuthRequest, res: Response) => {
  try {
    const { mode } = req.body // 'god' or 'conversation'
    const userHeader = req.userId!
    // Convert user header to deterministic UUID
    const userId = userHeaderToUUID(userHeader)

    // Validate that mode is provided
    if (!mode || !['god', 'conversation'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "god" or "conversation"' })
    }

    // In development mode, skip approval check and ensure user exists
    const isDev = process.env.NODE_ENV === 'development' || process.env.DEV === 'true'

    if (isDev) {
      // Auto-create user if doesn't exist
      const { error: userError } = await supabase.from('app_users').upsert({
        id: userId,
        approved: true,
        email: `${userHeader}@dev.local`,
        google_id: `dev_${userHeader}`, // Required field
      }, { onConflict: 'id' })
      if (userError) {
        console.log('[INIT] User upsert error:', userError.message)
      }
    } else {
      // Production: check approval
      const { data: user, error: userError } = await supabase
        .from('app_users')
        .select('approved')
        .eq('id', userId)
        .single()

      if (userError || !user?.approved) {
        return res.status(403).json({ error: 'Not approved for access' })
      }
    }

    // Create session
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        mode,
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single()

    if (error) {
      console.error('[INIT] Session creation error:', error)
      throw error
    }

    console.log(`[INIT] Created session ${session.id} for user ${userId}`)
    res.json(session)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Chat init error:', errorMsg, error)
    res.status(500).json({ error: 'Failed to initialize chat', details: errorMsg })
  }
})

/**
 * POST /chat/message
 * Send a message in a chat session
 * Routes to Capybara AI or clones based on mode/target
 */
router.post('/message', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id, content, target_clones, target } = req.body
    const userHeader = req.userId!
    const userId = userHeaderToUUID(userHeader)

    // Validate input
    if (!session_id || !content) {
      return res.status(400).json({ error: 'Missing session_id or content' })
    }

    // Fetch session from database
    const result = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    const session = result.data
    const sessionError = result.error

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const threadId = session.metadata.thread_id

    // Save user message
    let userMessage: any
    if (false) { // Never use mock mode - always use database
      userMessage = {
        id: `msg_${Date.now()}`,
        session_id,
        role: 'user',
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
      }
    } else {
      const result = await supabase
        .from('chat_messages')
        .insert({
          session_id,
          role: 'user',
          sender_id: userId,
          content,
        })
        .select()
        .single()

      if (result.error) throw result.error
      userMessage = result.data
    }

    // Load last 10 messages for context
    const messageResult = await supabase
      .from('chat_messages')
      .select('role, sender_id, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10)
    const lastMessages = messageResult.data || []

    // Convert messages to LangChain format
    const messageHistory: BaseMessage[] = (lastMessages || []).map((msg: any) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content)
      } else {
        return new AIMessage(msg.content)
      }
    })

    // Route message based on target or mode
    let responses: Array<{ role: string; sender_id: string; content: string }> = []
    let sessionTransition: { clone_ids: string[]; clone_names: string[] } | undefined

    // Determine routing: explicit target takes precedence, then mode
    // Priority: target='capybara' > target_clones provided > session mode
    const hasActiveClones = session.active_clones && session.active_clones.length > 0
    const hasExplicitClones = target_clones && target_clones.length > 0
    const routeToCapybara = target === 'capybara' || (session.mode === 'god' && target !== 'clones' && !hasActiveClones && !hasExplicitClones)

    console.log('[ROUTE] Decision:',{
      target,
      target_clones,
      session_mode: session.mode,
      hasActiveClones,
      hasExplicitClones,
      routeToCapybara,
    })

    // If routing to Capybara, send the message
    if (routeToCapybara) {
      // Send to Capybara AI with message history
      console.log('[ROUTE] Routing to Capybara AI')
      const capybaraResult = await callCapybaraAI(session_id, content, messageHistory)

      responses = [
        {
          role: 'capybara',
          sender_id: 'capybara-ai',
          content: capybaraResult.response,
        },
      ]

      sessionTransition = capybaraResult.session_transition
    } else if (session.mode === 'conversation' || hasActiveClones || hasExplicitClones || target === 'clones') {
      // Send to selected clones
      console.log('[ROUTE] Routing to clones, explicit_clones:', target_clones, 'active:', session.active_clones)
      const clonesInScope = target_clones || session.active_clones

      if (!clonesInScope || clonesInScope.length === 0) {
        return res.status(400).json({ error: 'No active clones in session' })
      }

      // Call all clones in parallel (each uses own thread for isolated state)
      const cloneResponses = await callMultipleClones(clonesInScope, threadId, content, null)

      responses = cloneResponses.map((response) => ({
        role: 'clone',
        sender_id: `User_${response.clone_id.slice(0, 4)}`,
        content: String(response.content),
      }))
    }

    // Save AI responses - always save to database
    for (const response of responses) {
      await supabase.from('chat_messages').insert({
        session_id,
        role: response.role,
        sender_id: response.sender_id,
        content: response.content,
      })
    }

    const responseBody: any = {
      user_message: userMessage,
      ai_responses: responses,
    }

    if (sessionTransition) {
      responseBody.session_transition = sessionTransition
    }

    res.json(responseBody)
  } catch (error) {
    console.error('Message error:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    res.status(500).json({
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * GET /chat/history
 * Get conversation history for a session
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id } = req.query
    const userId = req.userId!

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid session_id' })
    }

    // Verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    res.json(messages)
  } catch (error) {
    console.error('History error:', error)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

export default router
