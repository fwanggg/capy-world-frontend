import { Router, Response } from 'express'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'

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
 * Delete a studyroom (session and messages cascade via FK)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { id } = req.params

    // Fetch the studyroom to get its session_id before deleting
    const { data: studyroom } = await supabase
      .from('studyrooms')
      .select('session_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!studyroom) {
      return res.status(404).json({ error: 'Studyroom not found' })
    }

    // Delete the studyroom (ON DELETE SET NULL on session_id)
    const { error } = await supabase
      .from('studyrooms')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    // Also delete the orphaned chat session (cascades to chat_messages)
    if (studyroom.session_id) {
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', studyroom.session_id)
    }

    console.log(`[STUDYROOMS] Deleted ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error('[STUDYROOMS] Delete error:', error)
    res.status(500).json({ error: 'Failed to delete studyroom' })
  }
})

export default router
