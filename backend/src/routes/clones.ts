import { Router, Response } from 'express'
import { supabase } from 'shared'
import { AuthRequest } from '../middleware/auth'

const router = Router()

/**
 * POST /clones/search
 * Search for clones matching a query
 */
router.post('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { query, limit = 100 } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Missing query' })
    }

    const { data: clones, error } = await supabase
      .from('agent_memory')
      .select('id, reddit_username, system_prompt')
      .ilike('reddit_username', `%${query}%`)
      .limit(limit)

    if (error) throw error

    res.json({
      query,
      count: clones?.length || 0,
      clones,
    })
  } catch (error) {
    console.error('Clone search error:', error)
    res.status(500).json({ error: 'Failed to search clones' })
  }
})

/**
 * GET /clones/list
 * List clones in current session
 */
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id } = req.query

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('active_clones')
      .eq('id', session_id)
      .single()

    if (sessionError) throw sessionError

    const cloneIds = session?.active_clones || []

    if (cloneIds.length === 0) {
      return res.json({ clones: [] })
    }

    const { data: clones, error } = await supabase
      .from('agent_memory')
      .select('id, reddit_username, system_prompt')
      .in('id', cloneIds)

    if (error) throw error

    res.json({ clones })
  } catch (error) {
    console.error('Clone list error:', error)
    res.status(500).json({ error: 'Failed to fetch clones' })
  }
})

/**
 * PUT /clones/update-session
 * Update active clones in a session
 * Returns extended response with clone_names
 */
router.put('/update-session', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id, clone_ids } = req.body
    const userId = req.userId!

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Set mode based on whether clones are active
    const mode = clone_ids && clone_ids.length > 0 ? 'conversation' : 'god'

    const { data: updated, error } = await supabase
      .from('chat_sessions')
      .update({ active_clones: clone_ids, mode })
      .eq('id', session_id)
      .select()
      .single()

    if (error) throw error

    // Fetch clone names for the response
    let clone_names: string[] = []
    if (clone_ids && clone_ids.length > 0) {
      const { data: clones, error: clonesError } = await supabase
        .from('personas')
        .select('reddit_username')
        .in('id', clone_ids)

      if (!clonesError && clones) {
        clone_names = clones.map((c: any) => c.reddit_username)
      }
    }

    // Return extended response with clone_names
    res.json({
      ...updated,
      clone_names,
    })
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

export default router
