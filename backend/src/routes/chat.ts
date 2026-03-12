import { Router, Response } from 'express'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { generateUUID } from '../utils/uuid'
import { log } from '../services/logging'
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
    const { mode, studyroom_id } = req.body
    const userId = req.userId!
    const isDev = process.env.DEV === 'true'

    // Validate that mode is provided
    if (!mode || !['god', 'conversation'].includes(mode)) {
      log.error('chat.init.invalid_mode', 'Invalid mode provided', {
        sourceFile: 'chat.ts',
        sourceLine: 26,
        userId,
        metadata: { providedMode: mode }
      })
      return res.status(400).json({ error: 'Invalid mode. Must be "god" or "conversation"' })
    }

    // In dev mode, auto-create user if not exists
    if (isDev) {
      console.log('[INIT] DEV MODE: Auto-creating user if needed:', userId)
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

    // If studyroom_id provided, reuse its existing session instead of creating new
    if (studyroom_id) {
      const { data: studyroom, error: srError } = await supabase
        .from('studyrooms')
        .select('session_id')
        .eq('id', studyroom_id)
        .eq('user_id', userId)
        .single()

      if (!srError && studyroom?.session_id) {
        const { data: existingSession, error: sessError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', studyroom.session_id)
          .single()

        if (!sessError && existingSession) {
          console.log(`[INIT] Reusing existing session ${existingSession.id} for studyroom ${studyroom_id}`)
          log.info('chat.session_reuse', `Reusing session for studyroom`, {
            sourceFile: 'chat.ts',
            sourceLine: 80,
            userId,
            metadata: { sessionId: existingSession.id, studyroomId: studyroom_id }
          })
          return res.json(existingSession)
        }
      }
      console.warn(`[INIT] Studyroom ${studyroom_id} has no valid session, creating new one`)
    }

    // Create new session
    let session
    let error

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

    if (isDev) {
      console.log(`[INIT] DEV MODE: Created session ${result.data?.id} for user ${userId}`)
    }

    session = result.data
    error = result.error

    if (error) {
      console.error('[INIT] Session creation error:', error)
      throw error
    }

    console.log(`[INIT] Created session ${session.id} for user ${userId}`)

    log.info('chat.session_init', `Session initialized with mode: ${mode}`, {
      sourceFile: 'chat.ts',
      sourceLine: 103,
      userId,
      metadata: { sessionId: session.id, mode }
    })

    res.json(session)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.name : 'Unknown'
    log.error('chat.init_failed', errorMsg, {
      sourceFile: 'chat.ts',
      sourceLine: 115,
      userId: req.userId,
      metadata: { errorType, stack: error instanceof Error ? error.stack : undefined }
    })
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
      log.error('chat.message.invalid_input', 'Missing required fields', {
        sourceFile: 'chat.ts',
        sourceLine: 132,
        userId,
        metadata: { hasSessionId: !!session_id, hasContent: !!content }
      })
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

    log.info('chat.route_decision', 'Message routing decision', {
      sourceFile: 'chat.ts',
      sourceLine: 263,
      userId,
      metadata: {
        target,
        sessionMode: session.mode,
        hasActiveClones,
        hasExplicitClones,
        routingTo: routeToCapybara ? 'capybara' : 'clones'
      }
    })

    // Detect streaming request: body.stream === true
    const wantsStream = !!req.body.stream

    // If routing to Capybara, send the message
    if (routeToCapybara) {
      log.info('chat.route_capybara', 'Routing message to Capybara AI', {
        sourceFile: 'chat.ts',
        sourceLine: 278,
        userId,
        metadata: { sessionId: session_id, streaming: wantsStream }
      })

      if (wantsStream) {
        // SSE streaming path: send reasoning steps as they happen
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.flushHeaders()

        const writeSSE = (obj: any) => {
          res.write(`data: ${JSON.stringify(obj)}\n\n`)
        }

        try {
          const capybaraResult = await callCapybaraAI(
            session_id, content, messageHistory, labeledHistory,
            {
              onReasoningStep(step) {
                writeSSE({ type: 'reasoning', step })
              }
            }
          )

          sessionTransition = capybaraResult.session_transition
          capybaraReasoning = capybaraResult.reasoning

          responses = [{
            role: 'capybara',
            sender_id: 'capybara-ai',
            content: capybaraResult.response,
          }]

          // Save AI responses
          if (!isDev) {
            for (const response of responses) {
              await supabase.from('chat_messages').insert({
                session_id, role: response.role, sender_id: response.sender_id, content: response.content,
              })
            }
          }

          const donePayload: any = {
            type: 'done',
            user_message: userMessage,
            ai_responses: responses,
            capybara_reasoning: capybaraReasoning,
          }
          if (sessionTransition) donePayload.session_transition = sessionTransition
          writeSSE(donePayload)
        } catch (streamErr) {
          const msg = streamErr instanceof Error ? streamErr.message : String(streamErr)
          writeSSE({ type: 'error', error: msg })
        }

        res.end()
        return
      }

      // Non-streaming path (unchanged)
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
      const clonesInScope = target_clones || session.active_clones
      log.info('chat.route_clones', 'Routing message to clones', {
        sourceFile: 'chat.ts',
        sourceLine: 295,
        userId,
        metadata: {
          sessionId: session_id,
          cloneCount: clonesInScope?.length || 0,
          cloneIds: clonesInScope
        }
      })

      if (!clonesInScope || clonesInScope.length === 0) {
        log.error('chat.route_clones_failed', 'No active clones in session', {
          sourceFile: 'chat.ts',
          sourceLine: 303,
          userId,
          metadata: { sessionId: session_id }
        })
        return res.status(400).json({ error: 'No active clones in session' })
      }

      // Call all clones in parallel, passing session_id for per-persona history loading
      const cloneResponses = await callMultipleClones(clonesInScope, session_id, content, null)

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
    let errorType = 'Unknown'
    if (error instanceof Error) {
      errorMessage = error.message
      errorType = error.name
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }

    log.error('chat.message_failed', errorMessage, {
      sourceFile: 'chat.ts',
      sourceLine: 404,
      userId: req.userId,
      metadata: {
        errorType,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }
    })

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
