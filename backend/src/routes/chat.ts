import { Router, Response } from 'express'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { generateUUID } from '../utils/uuid'
import {
  callCapybaraAI,
  callMultipleClones,
} from '../services/langgraph-orchestrator'

const router = Router()

/**
 * POST /chat/init
 * Initialize a new chat session
 */
router.post('/init', async (req: AuthRequest, res: Response) => {
  try {
    const { mode } = req.body // 'god' or 'conversation'
    // User ID comes from JWT (set by requireAuth middleware)
    // Use Supabase user ID directly - no conversion needed
    const userId = req.userId!
    const isDev = process.env.DEV === 'true'

    // Validate that mode is provided
    if (!mode || !['god', 'conversation'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "god" or "conversation"' })
    }

    // In dev mode, auto-create user if not exists
    if (isDev) {
      console.log('[INIT] DEV MODE: Auto-creating user if needed:', userId)
      // Try to insert, ignore if already exists
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert({
          user_id: userId,
          approval_status: 'approved',
        })

      if (insertError && !insertError.message?.includes('duplicate')) {
        console.warn('[INIT] User insert warning:', insertError.message)
      }
    }

    // Verify user exists in waitlist (skip in dev mode for testing)
    if (!isDev) {
      const { data: user, error: userError } = await supabase
        .from('waitlist')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (userError || !user) {
        console.error('[INIT] User not found in waitlist:', userId)
        return res.status(403).json({ error: 'Not on waitlist. Please sign up at /waitlist first.' })
      }

      console.log('[INIT] User found in waitlist, creating session:', userId)
    } else {
      console.log('[INIT] DEV MODE: Skipping waitlist check, creating session:', userId)
    }

    // Create session
    // In dev mode, don't require user record due to foreign key constraints
    let session
    let error

    if (isDev) {
      // Generate a proper UUID session for dev testing
      const sessionId = generateUUID()
      session = {
        id: sessionId,
        user_id: userId,
        mode,
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      }
      console.log(`[INIT] DEV MODE: Created mock session ${session.id} for user ${userId}`)
    } else {
      const result = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          mode,
          active_clones: [],
          metadata: { thread_id: `session_${Date.now()}` },
        })
        .select()
        .single()

      session = result.data
      error = result.error

      if (error) {
        console.error('[INIT] Session creation error:', error)
        throw error
      }

      console.log(`[INIT] Created session ${session.id} for user ${userId}`)
    }

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
    // Extract user ID from JWT token - use directly without conversion
    const userId = req.userId!

    // Validate input
    if (!session_id || !content) {
      return res.status(400).json({ error: 'Missing session_id or content' })
    }

    // Fetch session from database
    const isDev = process.env.DEV === 'true'
    let session

    const result = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    session = result.data
    const sessionError = result.error

    if (sessionError) {
      // In dev mode, create a mock session instead of failing
      if (isDev) {
        console.log('[MESSAGE] DEV MODE: Session not in database, using mock:', session_id)
        session = {
          id: session_id,
          user_id: userId,
          mode: 'god',
          active_clones: [],
          metadata: { thread_id: `session_${Date.now()}` },
        }
      } else {
        console.error('[MESSAGE] Session fetch error:', sessionError.message)
        return res.status(500).json({ error: 'Failed to fetch session', details: sessionError.message })
      }
    }

    if (!session) {
      if (isDev) {
        console.log('[MESSAGE] DEV MODE: Creating mock session:', session_id)
        session = {
          id: session_id,
          user_id: userId,
          mode: 'god',
          active_clones: [],
          metadata: { thread_id: `session_${Date.now()}` },
        }
      } else {
        console.warn('[MESSAGE] Session not found for user:', userId, 'session_id:', session_id)
        return res.status(404).json({ error: 'Session not found' })
      }
    }

    const threadId = session.metadata.thread_id

    // Save user message
    let userMessage: any
    const devMessages: any[] = [] // In-memory storage for dev mode

    if (isDev) {
      // Mock message for dev testing
      userMessage = {
        id: `msg_${Date.now()}`,
        session_id,
        role: 'user',
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
      }
      devMessages.push(userMessage)
      console.log('[MESSAGE] DEV MODE: Saved user message (mock)')
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

    // Load last 20 messages for context
    let lastMessages: any[] = []

    if (isDev) {
      // In dev mode, use empty message history (no previous context)
      lastMessages = []
      console.log('[MESSAGE] DEV MODE: Using empty message history for context')
    } else {
      const messageResult = await supabase
        .from('chat_messages')
        .select('role, sender_id, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(20)
      lastMessages = messageResult.data || []
    }

    // Convert messages to LangChain format
    const messageHistory: BaseMessage[] = (lastMessages || []).map((msg: any) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content)
      } else {
        return new AIMessage(msg.content)
      }
    })

    // Build labeled history for Capybara to analyze
    const labeledHistory = lastMessages
      .map((msg: any) => {
        if (msg.role === 'user') return `[USER]: ${msg.content}`
        if (msg.role === 'capybara') return `[CAPYBARA]: ${msg.content}`
        if (msg.role === 'clone') return `[CLONE ${msg.sender_id}]: ${msg.content}`
        return `[${msg.role.toUpperCase()}]: ${msg.content}`
      })
      .join('\n')

    // Route message based on target or mode
    let responses: Array<{ role: string; sender_id: string; content: string }> = []
    let sessionTransition: { clone_ids: string[]; clone_names: string[] } | undefined
    let capybaraReasoning: any[] | undefined

    // Determine routing: explicit target takes precedence
    const hasActiveClones = session.active_clones && session.active_clones.length > 0
    const hasExplicitClones = target_clones && target_clones.length > 0

    // Route to Capybara only if explicitly requested OR if no clones available
    const routeToCapybara = target === 'capybara' || (!hasActiveClones && !hasExplicitClones)

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
      // Send to Capybara AI with message history and labeled history
      console.log('[ROUTE] Routing to Capybara AI')
      const capybaraResult = await callCapybaraAI(session_id, content, messageHistory, labeledHistory)

      responses = [
        {
          role: 'capybara',
          sender_id: 'capybara-ai',
          content: capybaraResult.response,
        },
      ]

      sessionTransition = capybaraResult.session_transition
      capybaraReasoning = capybaraResult.reasoning
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
        sender_id: response.clone_id,
        content: String(response.content),
      }))
    }

    // Save AI responses - skip in dev mode due to foreign key constraints
    if (!isDev) {
      for (const response of responses) {
        await supabase.from('chat_messages').insert({
          session_id,
          role: response.role,
          sender_id: response.sender_id,
          content: response.content,
        })
      }
    } else {
      console.log('[MESSAGE] DEV MODE: Skipped saving responses to database')
    }

    const responseBody: any = {
      user_message: userMessage,
      ai_responses: responses,
    }

    if (sessionTransition) {
      responseBody.session_transition = sessionTransition
    }

    if (capybaraReasoning) {
      responseBody.capybara_reasoning = capybaraReasoning
    }

    res.json(responseBody)
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('[MESSAGE] Error:', errorMessage)
      console.error('[MESSAGE] Stack:', error.stack)
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error)
      console.error('[MESSAGE] Object error:', errorMessage)
    } else {
      errorMessage = String(error)
      console.error('[MESSAGE] Error:', errorMessage)
    }

    res.status(500).json({
      error: 'Failed to process message',
      details: errorMessage,
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
    // Extract user ID from JWT token - use directly without conversion
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
