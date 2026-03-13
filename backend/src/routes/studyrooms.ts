import { Router, Response } from 'express'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'
import { log } from '../services/logging'

const router = Router()

/**
 * GET /studyrooms
 * List all studyrooms for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const { data, error } = await supabase
      .from('studyrooms')
      .select('id, name, session_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('[STUDYROOMS] List error:', error)
    res.status(500).json({ error: 'Failed to list studyrooms' })
  }
})

/**
 * GET /studyrooms/:id
 * Get a single studyroom with its session details
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { id } = req.params

    const { data: studyroom, error } = await supabase
      .from('studyrooms')
      .select('id, name, session_id, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !studyroom) {
      return res.status(404).json({ error: 'Studyroom not found' })
    }

    let session = null
    if (studyroom.session_id) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('id, mode, active_clones, metadata')
        .eq('id', studyroom.session_id)
        .single()
      session = data
    }

    res.json({ ...studyroom, session })
  } catch (error) {
    console.error('[STUDYROOMS] Get error:', error)
    res.status(500).json({ error: 'Failed to get studyroom' })
  }
})

/**
 * POST /studyrooms
 * Create a new studyroom with a linked chat session
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { name } = req.body

    // Auto-generate name if not provided
    let studyroomName = name
    if (!studyroomName) {
      const { count } = await supabase
        .from('studyrooms')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      studyroomName = `Studyroom ${(count || 0) + 1}`
    }

    // Create a chat session for this studyroom
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        mode: 'god',
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('[STUDYROOMS] Session creation error:', sessionError)
      throw sessionError || new Error('Failed to create session')
    }

    // Create the studyroom linked to the session
    const { data: studyroom, error } = await supabase
      .from('studyrooms')
      .insert({
        user_id: userId,
        name: studyroomName,
        session_id: session.id,
      })
      .select()
      .single()

    if (error) throw error

    console.log(`[STUDYROOMS] Created "${studyroomName}" (${studyroom.id}) with session ${session.id}`)
    res.json({ ...studyroom, session })
  } catch (error) {
    console.error('[STUDYROOMS] Create error:', error)
    res.status(500).json({ error: 'Failed to create studyroom' })
  }
})

/**
 * PATCH /studyrooms/:id
 * Rename a studyroom
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' })
    }

    const { data, error } = await supabase
      .from('studyrooms')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Studyroom not found' })
    }

    console.log(`[STUDYROOMS] Renamed ${id} to "${name}"`)
    res.json(data)
  } catch (error) {
    console.error('[STUDYROOMS] Rename error:', error)
    res.status(500).json({ error: 'Failed to rename studyroom' })
  }
})

/**
 * DELETE /studyrooms/:id
 * Delete a studyroom and all associated persistent state:
 * - studyroom row
 * - chat_session (cascades to chat_messages via FK)
 * - checkpoint_writes and checkpoint_blobs (LangGraph thread state)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { id } = req.params

    // 1. Fetch studyroom and linked session (need session_id and thread_id for cascading deletes)
    const { data: studyroom, error: srFetchError } = await supabase
      .from('studyrooms')
      .select('id, name, session_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (srFetchError || !studyroom) {
      log.warn('studyrooms.delete_not_found', 'Studyroom not found for delete', {
        userId,
        metadata: { studyroomId: id, error: srFetchError?.message }
      })
      return res.status(404).json({ error: 'Studyroom not found' })
    }

    let sessionId: string | null = studyroom.session_id
    let threadId: string | null = null
    let messageCount = 0

    if (sessionId) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id, metadata')
        .eq('id', sessionId)
        .single()

      if (session?.metadata?.thread_id) {
        threadId = session.metadata.thread_id as string
      }

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
      messageCount = count ?? 0
    }

    log.info('studyrooms.delete_start', 'Deleting studyroom and all associated state', {
      userId,
      metadata: {
        studyroomId: id,
        studyroomName: studyroom.name,
        sessionId,
        threadId,
        messageCount
      }
    })

    // 2. Delete studyroom row
    const { error: deleteError } = await supabase
      .from('studyrooms')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      log.error('studyrooms.delete_studyroom_failed', 'Failed to delete studyroom row', {
        userId,
        metadata: { studyroomId: id, error: deleteError.message }
      })
      throw deleteError
    }

    // 3. Delete LangGraph checkpoint state (blobs first due to FK, then writes)
    if (threadId) {
      const { error: blobsError } = await supabase
        .from('checkpoint_blobs')
        .delete()
        .eq('thread_id', threadId)

      if (blobsError) {
        log.warn('studyrooms.delete_checkpoint_blobs_failed', 'Failed to delete checkpoint blobs (may not exist)', {
          userId,
          metadata: { threadId, studyroomId: id, error: blobsError.message }
        })
      }

      const { error: writesError } = await supabase
        .from('checkpoint_writes')
        .delete()
        .eq('thread_id', threadId)

      if (writesError) {
        log.warn('studyrooms.delete_checkpoint_writes_failed', 'Failed to delete checkpoint writes (may not exist)', {
          userId,
          metadata: { threadId, studyroomId: id, error: writesError.message }
        })
      }
    }

    // 4. Delete chat session (cascades to chat_messages via ON DELETE CASCADE)
    if (sessionId) {
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        log.error('studyrooms.delete_session_failed', 'Failed to delete chat session and messages', {
          userId,
          metadata: { sessionId, studyroomId: id, error: sessionError.message }
        })
        throw sessionError
      }
    }

    log.info('studyrooms.delete_complete', 'Studyroom and all associated state deleted', {
      userId,
      metadata: {
        studyroomId: id,
        studyroomName: studyroom.name,
        sessionId,
        threadId,
        messageCount
      }
    })

    res.json({ success: true })
  } catch (error) {
    const err = error as { message?: string }
    log.error('studyrooms.delete_failed', `Studyroom delete failed: ${err?.message ?? String(error)}`, {
      userId: req.userId,
      metadata: { studyroomId: req.params.id }
    })
    res.status(500).json({ error: 'Failed to delete studyroom' })
  }
})

export default router
