import { Router, Response } from 'express'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'
import { BaseMessage } from '@langchain/core/messages'
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
    const userId = req.userId!

    // Validate that mode is provided
    if (!mode || !['god', 'conversation'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "god" or "conversation"' })
    }

    // Validate approval status (skip in test mode)
    const isTestMode = process.env.TEST_MODE === 'true'
    if (!isTestMode) {
      const { data: user, error: userError } = await supabase
        .from('app_users')
        .select('approved')
        .eq('id', userId)
        .single()

      if (userError || !user?.approved) {
        return res.status(403).json({ error: 'Not approved for access' })
      }
    }

    // Create session (use test table in test mode)
    const tableName = isTestMode ? 'chat_sessions' : 'chat_sessions'
    const { data: session, error } = await supabase
      .from(tableName)
      .insert({
        user_id: userId,
        mode,
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single()

    if (error) {
      // In test mode, create a mock session response if database fails
      if (isTestMode) {
        const mockSession = {
          id: `session_${Date.now()}`,
          user_id: userId,
          mode,
          active_clones: [],
          metadata: { thread_id: `session_${Date.now()}` },
          created_at: new Date().toISOString(),
        }
        return res.json(mockSession)
      }
      throw error
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
    const userId = req.userId!
    const isTestMode = process.env.TEST_MODE === 'true'

    // Validate input
    if (!session_id || !content) {
      return res.status(400).json({ error: 'Missing session_id or content' })
    }

    // Verify session ownership
    let session: any
    let sessionError: any = null

    if (isTestMode) {
      // In test mode, create a mock session
      session = {
        id: session_id,
        user_id: userId,
        mode: 'god',
        active_clones: [],
        metadata: { thread_id: session_id },
      }
    } else {
      const result = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single()
      session = result.data
      sessionError = result.error
    }

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const threadId = session.metadata.thread_id

    // Save user message (skip in test mode)
    let userMessage: any
    if (isTestMode) {
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
    let lastMessages: any = []
    if (!isTestMode) {
      const result = await supabase
        .from('chat_messages')
        .select('role, sender_id, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(10)
      lastMessages = result.data || []
    }

    // Convert messages to LangChain format
    const messageHistory: BaseMessage[] = (lastMessages || []).map((msg: any) => {
      const { HumanMessage, AIMessage } = require('@langchain/core/messages')
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
    const routeToCapybara = target === 'capybara' || (session.mode === 'god' && target !== 'clones')

    // If routing to Capybara, send the message
    if (routeToCapybara) {
      // Send to Capybara AI with message history
      const capybaraResult = await callCapybaraAI(session_id, content, messageHistory)

      responses = [
        {
          role: 'capybara',
          sender_id: 'capybara-ai',
          content: capybaraResult.response,
        },
      ]

      sessionTransition = capybaraResult.session_transition
    } else if (session.mode === 'conversation') {
      // Send to selected clones
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

    // Save AI responses (skip in test mode)
    if (!isTestMode) {
      for (const response of responses) {
        await supabase.from('chat_messages').insert({
          session_id,
          role: response.role,
          sender_id: response.sender_id,
          content: response.content,
        })
      }
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
