import { HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase, supabaseForFunctions } from './supabase'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { log } from './logging'
import { wouldExceedPersonaLimit } from './persona-limit'

export function getCapybaraSystemPrompt(sessionId: string, labeledHistory?: string): string {
  return `You are Capysan. Your job is to intelligently manage personas and facilitate group conversations.

AVAILABLE TOOLS & WORKFLOWS:

1. RECRUITING PERSONAS (Initial or Adding More):
   - When user asks to find/recruit personas:
     a. SEMANTIC SEARCH (preferred for vague/freeform requests): Translate User intent into keyword-rich query. Do NOT dump raw input — expand: "hate Atomic" → "hate Atomic design, minimal UI, design systems criticism"; "into skiing" → "skiing, winter sports, outdoor". Call search_clones({query: "...", count: N}). Add demographic filters (age_min, profession, etc.) only if user specified them; use get_demographic_values first for valid values.
     b. DEMOGRAPHIC-ONLY (when user wants specific profession/location/age): Call get_demographic_segments(), then get_demographic_values({segments: [...]}), then search_clones({...filters..., count: N}) without query. Use ONLY values returned by get_demographic_values.
     c. If search_clones returns 0 personas: for semantic path, broaden query; for demographic path, relax filters.
     d. Once you have personas, call create_conversation_session({clone_ids, session_id}) to activate them.
     e. Respond: "I've activated [count] personas." (Do not list usernames or identifiers.)
   - When user asks to add/recruit more personas to existing group:
     a. Call recruit_clones({demographic_filters, count, session_id})
     b. Respond with who was added and total active

2. RELEASING/MANAGING PERSONAS:
   - When user asks to remove/release specific clones:
     a. Call release_clones({clone_ids, session_id}) with specific persona IDs
     b. Optionally call list_clones() to confirm new state
     c. Respond with who was released and who remains
   - When user asks to release all personas:
     a. Call release_clones({release_all: true, session_id})
     b. Respond: "I've released all personas. You're back to just talking with me."

3. LISTING & INQUIRY:
   - When user asks "who am I talking to?", "who are the clones?", etc.:
     a. Call list_clones({session_id})
     b. Respond with current personas and their key demographics

4. ASKING PERSONAS QUESTIONS (On behalf of the customer):
   - When you need to gather opinions, test ideas, or survey personas:
     a. Call list_clones({session_id}) to get active persona IDs (if needed)
     b. Call send_message({prompt: "...", clone_ids: [...]}) with a clear question
     c. Present the responses in a structured format (table or list)
   - Use this for: pitch testing, opinion gathering, quick surveys, preference checks etc.
   - You decide the right question to ask based on what the customer needs
   - You can call send_message multiple times with different questions

TOOLS (Use based on user intent):
- get_demographic_segments(): List available demographic fields
- get_demographic_values(segments): Get unique values for fields
- search_clones(query?, filters): Find personas by semantic search (query) or demographics
- create_conversation_session(clone_ids, session_id): Activate initial personas
- recruit_clones(demographic_filters, count, session_id): Add personas without removing existing
- release_clones(clone_ids | release_all, session_id): Remove personas from session
- list_clones(session_id): Show current active personas with details
- send_message(prompt, clone_ids): Send a prompt to specific personas and collect responses

Session ID: ${sessionId}
- Always include session_id when calling recruit_clones, release_clones, or list_clones

FORMATTING:
- Always respond using **Markdown** for rich formatting.
- Use **tables** when comparing personas, presenting demographics, or summarizing structured data.
- Use **bullet lists** and **numbered lists** for steps, options, or enumerations.
- Use **bold** and *italic* for emphasis.
- Use headings (##, ###) sparingly for long responses with distinct sections.
- Use \`inline code\` for IDs, field names, or technical values.
- Keep responses conversational but well-structured — markdown should enhance readability, not clutter it.

IMPORTANT TIPS:
- recruit_clones automatically deduplicates (won't add already-active clones)
- After any recruit/release operation, consider calling list_clones() to confirm changes
- When releasing specific clones, you need their IDs - ask user if unclear
- Be conversational and explain what you're doing: "I'm adding 3 engineers in their 30s..."
- Persona limit: Each customer has a max of 50 personas across all study rooms. If create_conversation_session or recruit_clones returns a limit error, tell the user to release some personas first.
- When a tool returns an error (e.g. search_clones "Embed search failed"), relay it clearly to the user so they know what went wrong. Do not pretend the operation succeeded.

${labeledHistory ? `CONVERSATION HISTORY:\n${labeledHistory}\n` : ''}

Your role: Make it easy for users to experiment with different personas and perspectives.`
}

/**
 * Tool 1: Get available demographic segment names
 * Simple function - no LLM calls needed
 */
async function getDemographicSegments(): Promise<string> {
  console.log('[TOOL] get_demographic_segments called')

  const segments = ['age', 'gender', 'location', 'profession', 'spending_power']

  console.log('[TOOL] Available segments:', segments)
  return JSON.stringify({
    segments,
    description: 'These are the demographic fields you can filter by in the personas database'
  })
}

/**
 * Tool 2: Get unique values for specified demographic segments
 * Input: list of segment names
 * Output: distinct values for each segment
 * No LLM calls needed - pure data retrieval
 */
async function getDemographicValues(input: {
  segments: string[]
}): Promise<string> {
  console.log('[TOOL] get_demographic_values called with segments:', input.segments)

  const result: any = {}
  const columns = ['age', 'gender', 'location', 'profession', 'spending_power']

  // Get scalar columns
  for (const segment of input.segments) {
    if (columns.includes(segment)) {
      const { data, error } = await supabase
        .from('personas')
        .select(segment)
        .neq(segment, null)

      if (!error && data) {
        const distinctValues = [...new Set(data.map((d: any) => d[segment]))]
        result[segment] = distinctValues
        console.log(`[TOOL] ${segment} values:`, distinctValues)
      }
    }
  }

  console.log('[TOOL] Returning demographic values:', JSON.stringify(result))
  return JSON.stringify(result)
}

/**
 * Compute a single sort confidence for a row when filters are applied.
 * Uses llm_explanation for demographics (age, gender, location, profession, spending_power)
 * and interests[].confidence for interest filters. Returns the minimum confidence across
 * applied filters so we rank by "weakest link" (rows confident on all criteria rank higher).
 */
function getSortConfidence(
  row: any,
  input: {
    profession?: string
    age_min?: number
    age_max?: number
    gender?: string
    location?: string
    spending_power?: string
  },
  interestNames: string[] | null
): number | null {
  const confidences: number[] = []

  const llm = row.llm_explanation
  if (Array.isArray(llm)) {
    const byDemographic: Record<string, number> = {}
    for (const item of llm) {
      const d = item?.demographic
      const c = item?.confidence
      if (d != null && typeof c === 'number' && !Number.isNaN(c)) byDemographic[d] = c
    }
    if (input.profession && byDemographic.profession != null) confidences.push(byDemographic.profession)
    if (input.gender && byDemographic.gender != null) confidences.push(byDemographic.gender)
    if (input.location && byDemographic.location != null) confidences.push(byDemographic.location)
    if (input.spending_power && byDemographic.spending_power != null) confidences.push(byDemographic.spending_power)
    if ((input.age_min != null || input.age_max != null) && byDemographic.age != null) confidences.push(byDemographic.age)
  }

  if (interestNames?.length && Array.isArray(row.interests)) {
    for (const name of interestNames) {
      const interest = row.interests.find((i: any) => (i?.name || i) === name)
      const c = interest?.confidence
      if (typeof c === 'number' && !Number.isNaN(c)) confidences.push(c)
    }
  }

  if (confidences.length === 0) return null
  return Math.min(...confidences)
}

/**
 * Tool 3: Search personas - semantic (embedding) or demographic-only
 * When query is provided: calls embed Edge Function via supabase.functions.invoke
 * When no query: uses demographic filters on personas table
 * authToken: user's JWT (Bearer xxx) for embed auth; fallback to anon when absent (e.g. DEV)
 */
async function searchClones(
  input: {
    query?: string
    count?: number
    profession?: string
    age_min?: number
    age_max?: number
    gender?: string
    location?: string
    spending_power?: string
    interests?: string[]
  },
  authToken?: string
): Promise<string> {
  console.log('[TOOL] search_clones called with:', JSON.stringify(input, null, 2))

  const requestedCount = input.count || 5

  // Semantic search path: query provided → embed Edge Function via Supabase client
  if (input.query && input.query.trim()) {
    try {
      const invokeHeaders: Record<string, string> = {}
      if (authToken) invokeHeaders['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`

      const { data, error } = await supabaseForFunctions.functions.invoke('embed', {
        body: {
          input: input.query.trim(),
          count: requestedCount,
          match_threshold: 0.6,
          age_min: input.age_min ?? undefined,
          age_max: input.age_max ?? undefined,
          profession: input.profession ?? undefined,
          gender: input.gender ?? undefined,
          location: input.location ?? undefined,
          spending_power: input.spending_power ?? undefined,
          interests: input.interests ?? undefined,
        },
        headers: Object.keys(invokeHeaders).length > 0 ? invokeHeaders : undefined,
      })

      if (error) {
        let detail = error instanceof Error ? error.message : String(error)
        let code: string | undefined
        const err = error as { context?: Response }
        if (err?.context instanceof Response) {
          try {
            const body = (await err.context.json()) as { error?: string; message?: string; code?: string }
            detail = body?.error ?? body?.message ?? detail
            code = body?.code
          } catch {
            try {
              const text = await err.context.text()
              if (text) detail = text.length > 200 ? `${text.slice(0, 200)}...` : text
            } catch {
              /* keep detail */
            }
          }
        }
        const errMsg = code ? `[${code}] ${detail}` : detail
        console.log('[TOOL] search_clones embed error:', errMsg)
        return JSON.stringify({ error: `Embed search failed: ${errMsg}` })
      }

      const payload = data as { personas?: unknown[]; error?: string; code?: string }
      if (payload?.error) {
        const errMsg = payload.code ? `[${payload.code}] ${payload.error}` : payload.error
        console.log('[TOOL] search_clones embed error (in body):', errMsg)
        return JSON.stringify({ error: `Embed search failed: ${errMsg}` })
      }

      const personas = payload?.personas ?? []
      const result = {
        personas: personas.map((p: any) => ({
          id: p.id,
          anonymous_id: p.anonymous_id,
          age: p.age,
          gender: p.gender,
          location: p.location,
          profession: p.profession,
          spending_power: p.spending_power,
        })),
      }
      console.log('[TOOL] Found:', result.personas.length, 'personas (semantic)')
      return JSON.stringify(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log('[TOOL] search_clones embed exception:', msg)
      return JSON.stringify({ error: `Embed search failed: ${msg}` })
    }
  }

  // Demographic-only path (no query)
  const interestNames =
    input.interests && Array.isArray(input.interests) && input.interests.length > 0 ? input.interests : null

  const hasFilters =
    !!(
      input.profession ||
      input.gender ||
      input.location ||
      input.spending_power ||
      input.age_min != null ||
      input.age_max != null ||
      (interestNames && interestNames.length > 0)
    )

  const selectFields = hasFilters
    ? 'id, anonymous_id, age, gender, location, profession, spending_power, interests, llm_explanation'
    : 'id, anonymous_id, age, gender, location, profession, spending_power'

  let dbQuery = supabase.from('personas').select(selectFields)
  if (input.profession) dbQuery = dbQuery.ilike('profession', input.profession)
  if (input.gender) dbQuery = dbQuery.ilike('gender', input.gender)
  if (input.location) dbQuery = dbQuery.ilike('location', `%${input.location}%`)
  if (input.spending_power) dbQuery = dbQuery.ilike('spending_power', input.spending_power)
  if (input.age_min != null) dbQuery = dbQuery.gte('age', input.age_min)
  if (input.age_max != null) dbQuery = dbQuery.lte('age', input.age_max)
  if (interestNames && interestNames.length > 0) {
    const orClause = interestNames
      .map((n) => `interests.cs.${JSON.stringify([{ name: n }])}`)
      .join(',')
    dbQuery = dbQuery.or(orClause)
  }
  const fetchLimit = hasFilters ? Math.min(100, Math.max(requestedCount * 3, 20)) : requestedCount
  dbQuery = dbQuery.limit(fetchLimit)

  const { data: rawData, error } = await dbQuery

  if (error) {
    console.log('[TOOL] search_clones error:', error)
    return JSON.stringify({ error: 'Failed to search personas' })
  }

  let data = rawData || []

  if (hasFilters && data.length > 0) {
    data = [...data].sort((a: any, b: any) => {
      const confA = getSortConfidence(a, input, interestNames)
      const confB = getSortConfidence(b, input, interestNames)
      if (confA == null && confB == null) return 0
      if (confA == null) return 1
      if (confB == null) return -1
      return confB - confA
    })
    data = data.slice(0, requestedCount)
  }

  const result = {
    personas: (data || []).map((d: any) => ({
      id: d.id,
      anonymous_id: d.anonymous_id,
      age: d.age,
      gender: d.gender,
      location: d.location,
      profession: d.profession,
      spending_power: d.spending_power,
    })),
  }

  console.log('[TOOL] Found:', result.personas.length, 'personas (demographic)')
  return JSON.stringify(result)
}

/**
 * Create conversation session with selected personas
 * Updates active_clones in chat_sessions and switches mode to 'conversation'
 */
async function createConversationSession(input: { clone_ids: string[]; session_id: string }): Promise<string> {
  const isDemoMode = false // Always use real database in development

  console.log('[TOOL] create_conversation_session called with:', {
    clone_ids: input.clone_ids,
    session_id: input.session_id,
    demoMode: isDemoMode,
  })

  // Fetch session to get user_id for limit check
  const { data: session, error: sessionErr } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', input.session_id)
    .single()

  if (sessionErr || !session?.user_id) {
    return JSON.stringify({ error: 'Session not found' })
  }

  const limitCheck = await wouldExceedPersonaLimit(session.user_id, input.session_id, input.clone_ids.length)
  if (!limitCheck.ok) {
    return JSON.stringify({ error: limitCheck.message, limit: limitCheck.limit, total: limitCheck.total })
  }

  // Fetch persona anonymous_ids from database
  const result = await supabase
    .from('personas')
    .select('id, anonymous_id')
    .in('id', input.clone_ids)

  if (result.error || !result.data) {
    console.log('[TOOL] create_conversation_session: Failed to fetch personas')
    return JSON.stringify({ error: 'Failed to fetch persona details' })
  }
  const clones = result.data

  const clone_names = clones.map((c: any) => c.anonymous_id)

  // Update session to set active clones and mode
  // Always update database regardless of TEST_MODE - we need the session state to persist
  const { error: updateError } = await supabase
    .from('chat_sessions')
    .update({
      active_clones: input.clone_ids,
      mode: 'conversation',
    })
    .eq('id', input.session_id)

  if (updateError) {
    console.log('[TOOL] create_conversation_session: Failed to update session')
    console.log('[TOOL] Update error details:', updateError)
    // Don't fail completely - return success anyway so frontend knows clones were selected
    // The session will still work with target parameter
  } else {
    console.log('[TOOL] create_conversation_session: Session updated with active_clones:', input.clone_ids)
  }

  const response = {
    success: true,
    clone_ids: input.clone_ids,
    clone_names,
  }

  console.log('[TOOL] create_conversation_session returning:', response)
  return JSON.stringify(response)
}

/**
 * Recruit new clones to session (add without removing existing ones)
 * Deduplicates new recruits against already-active clones
 */
async function recruitClones(input: {
  query?: string
  demographic_filters?: {
    profession?: string
    age_min?: number
    age_max?: number
    gender?: string
    location?: string
    spending_power?: string
    interests?: string[]
  }
  count?: number
  session_id: string
}): Promise<string> {
  console.log('[TOOL] recruit_clones called with:', JSON.stringify(input, null, 2))

  // Get current active clones and user_id from session
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('active_clones, user_id')
    .eq('id', input.session_id)
    .single()

  if (sessionError || !session) {
    return JSON.stringify({ error: 'Session not found' })
  }

  const currentCloneIds = session.active_clones || []
  console.log('[TOOL] Current active clones:', currentCloneIds)

  // Search for new clones (semantic or demographic)
  const searchInput = {
    query: input.query,
    ...input.demographic_filters,
    count: input.count || 3,
  }
  const searchResult = await searchClones(searchInput)
  const searchOutput = JSON.parse(searchResult)

  if (searchOutput.error) {
    return JSON.stringify({ error: searchOutput.error })
  }

  // Exclude already-active clones
  const newPersonas = searchOutput.personas || []
  const newCloneIds = newPersonas
    .filter((p: any) => !currentCloneIds.includes(p.id))
    .map((p: any) => p.id)

  console.log('[TOOL] Found', newPersonas.length, 'personas, recruiting', newCloneIds.length, 'new ones')

  if (newCloneIds.length === 0) {
    return JSON.stringify({
      added_clones: [],
      total_active: currentCloneIds.length,
      message: 'No new clones found matching criteria (already active)',
    })
  }

  // Merge: current + new (deduplicated)
  const mergedCloneIds = [...new Set([...currentCloneIds, ...newCloneIds])]

  const limitCheck = await wouldExceedPersonaLimit(session.user_id, input.session_id, mergedCloneIds.length)
  if (!limitCheck.ok) {
    return JSON.stringify({ error: limitCheck.message, limit: limitCheck.limit, total: limitCheck.total })
  }

  // Update session via the endpoint
  const updateResult = await supabase
    .from('chat_sessions')
    .update({
      active_clones: mergedCloneIds,
      mode: 'conversation',
    })
    .eq('id', input.session_id)

  if (updateResult.error) {
    console.log('[TOOL] recruit_clones: Failed to update session')
    return JSON.stringify({ error: 'Failed to update session' })
  }

  // Fetch anonymous_ids for newly recruited clones
  const { data: recruitedData } = await supabase
    .from('personas')
    .select('id, anonymous_id')
    .in('id', newCloneIds)

  const addedClones = (recruitedData || []).map((c: any) => ({
    id: c.id,
    name: c.anonymous_id,
  }))

  const response = {
    added_clones: addedClones,
    total_active: mergedCloneIds.length,
  }

  console.log('[TOOL] recruit_clones returning:', response)
  return JSON.stringify(response)
}

/**
 * Release clones from session
 * Can release specific clones or all clones
 */
async function releaseClones(input: {
  clone_ids?: string[]
  release_all?: boolean
  session_id: string
}): Promise<string> {
  console.log('[TOOL] release_clones called with:', JSON.stringify(input, null, 2))

  // Get current active clones
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('active_clones')
    .eq('id', input.session_id)
    .single()

  if (sessionError || !session) {
    return JSON.stringify({ error: 'Session not found' })
  }

  const currentCloneIds = session.active_clones || []

  // Determine new list
  const newCloneIds = input.release_all
    ? []
    : currentCloneIds.filter((id: string) => !input.clone_ids?.includes(id))

  console.log('[TOOL] Current:', currentCloneIds.length, 'Releasing:', input.release_all ? 'all' : input.clone_ids?.length || 0, 'Remaining:', newCloneIds.length)

  // Get anonymous_ids of released clones for response
  const idsToRelease = input.release_all ? currentCloneIds : input.clone_ids
  const { data: releasedData } = await supabase
    .from('personas')
    .select('id, anonymous_id')
    .in('id', idsToRelease)

  const releasedClones = (releasedData || []).map((c: any) => ({
    id: c.id,
    name: c.anonymous_id,
  }))

  // Update session
  const updateResult = await supabase
    .from('chat_sessions')
    .update({
      active_clones: newCloneIds,
      mode: newCloneIds.length > 0 ? 'conversation' : 'god',
    })
    .eq('id', input.session_id)

  if (updateResult.error) {
    console.log('[TOOL] release_clones: Failed to update session')
    return JSON.stringify({ error: 'Failed to update session' })
  }

  const response = {
    released_clones: releasedClones,
    remaining_clones: newCloneIds.length,
  }

  console.log('[TOOL] release_clones returning:', response)
  return JSON.stringify(response)
}

/**
 * List currently active clones in session with their demographics
 */
async function listClones(input: { session_id: string }): Promise<string> {
  console.log('[TOOL] list_clones called with session:', input.session_id)

  // Get active clones from session
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('active_clones')
    .eq('id', input.session_id)
    .single()

  if (sessionError || !session) {
    return JSON.stringify({ error: 'Session not found' })
  }

  const activeCloneIds = session.active_clones || []

  if (activeCloneIds.length === 0) {
    console.log('[TOOL] No active clones')
    return JSON.stringify({
      active_clones: [],
      message: 'No clones currently active',
    })
  }

  // Fetch clone details
  const { data: clones, error: clonesError } = await supabase
    .from('personas')
    .select('id, anonymous_id, age, gender, location, profession, spending_power')
    .in('id', activeCloneIds)

  if (clonesError || !clones) {
    console.log('[TOOL] Failed to fetch clone details')
    return JSON.stringify({ error: 'Failed to fetch clone details' })
  }

  const response = {
    active_clones: clones.map((c: any) => ({
      id: c.id,
      anonymous_id: c.anonymous_id,
      age: c.age,
      gender: c.gender,
      location: c.location,
      profession: c.profession,
      spending_power: c.spending_power,
    })),
  }

  console.log('[TOOL] list_clones returning:', response.active_clones.length, 'clones')
  return JSON.stringify(response)
}

/**
 * Send a message/prompt to specific personas and collect their responses.
 * Used when Capybara wants to ask questions to personas on the customer's behalf.
 * Reuses callClone for each persona, runs them in parallel.
 */
async function sendMessage(input: {
  prompt: string
  clone_ids: string[]
  session_id?: string
}): Promise<string> {
  console.log('[TOOL] send_message called with:', {
    prompt: input.prompt.substring(0, 100),
    clone_ids: input.clone_ids,
    session_id: input.session_id,
  })

  if (!input.clone_ids || input.clone_ids.length === 0) {
    return JSON.stringify({ error: 'No persona IDs provided' })
  }

  const { data: personas, error: fetchError } = await supabase
    .from('personas')
    .select('id, anonymous_id, profession, age, gender, location')
    .in('id', input.clone_ids)

  if (fetchError || !personas || personas.length === 0) {
    console.log('[TOOL] send_message: Failed to fetch personas', fetchError)
    return JSON.stringify({ error: 'Failed to fetch persona details' })
  }

  const personaMap = new Map(personas.map((p: any) => [String(p.id), p]))
  const effectiveSessionId = input.session_id || `send_message_${Date.now()}`

  const promises = input.clone_ids.map((cloneId) =>
    callClone(cloneId, effectiveSessionId, input.prompt, null)
      .then((content) => ({
        clone_id: cloneId,
        username: personaMap.get(String(cloneId))?.anonymous_id || `persona_${cloneId}`,
        demographics: (() => {
          const p = personaMap.get(String(cloneId))
          if (!p) return undefined
          return {
            profession: p.profession,
            age: p.age,
            gender: p.gender,
            location: p.location,
          }
        })(),
        response: content,
        error: null,
      }))
      .catch((err) => ({
        clone_id: cloneId,
        username: personaMap.get(String(cloneId))?.anonymous_id || `persona_${cloneId}`,
        demographics: undefined,
        response: null,
        error: err instanceof Error ? err.message : String(err),
      }))
  )

  const results = await Promise.all(promises)

  const successCount = results.filter((r) => r.response !== null).length
  console.log(`[TOOL] send_message: ${successCount}/${results.length} personas responded`)

  return JSON.stringify({
    prompt: input.prompt,
    total_sent: input.clone_ids.length,
    total_responded: successCount,
    responses: results,
  })
}

// Define tools for LLM binding
const demographicSegmentsTool = tool(getDemographicSegments, {
  name: 'get_demographic_segments',
  description: 'Get list of available demographic segments (field names) that can be used for filtering personas. Call this first to understand what demographic attributes are available.',
  schema: z.object({}),
})

const demographicValuesTool = tool(getDemographicValues, {
  name: 'get_demographic_values',
  description: 'Get unique values for specified demographic segments. Pass the segment names you want to explore, get back all available values in the database for each.',
  schema: z.object({
    segments: z.array(z.string()).describe('List of demographic segment names to get values for (e.g., ["profession", "gender", "location"])'),
  }),
})

const searchClonesToolSchema = {
  name: 'search_clones' as const,
  description: `Search personas by semantic similarity (when query provided) or demographic filters. Prefer semantic search for freeform/vague user requests.
- query: REQUIRED for semantic search. Translate user intent into keyword-rich search terms — do NOT dump raw user input. Expand vague phrases: "users who hate Atomic" → "hate Atomic design, prefer minimal UI, critical of design systems". "people into skiing" → "skiing, winter sports, outdoor recreation". Combine topics, attitudes, and concrete terms.
- Demographics (age_min, age_max, profession, etc.): Optional filters applied together with semantic search. Use get_demographic_values first for valid values.`,
  schema: z.object({
    query: z.string().optional().describe('Search terms for semantic matching. Translate user intent into keywords — expand vague phrases, add related terms. Required for semantic search.'),
    count: z.number().optional().describe('How many personas to return, default 5'),
    profession: z.string().optional().describe('Exact profession value (use get_demographic_values)'),
    age_min: z.number().optional().describe('Minimum age'),
    age_max: z.number().optional().describe('Maximum age'),
    gender: z.string().optional().describe('Exact gender value'),
    location: z.string().optional().describe('Location substring (e.g. Seattle, USA)'),
    spending_power: z.string().optional().describe('Exact spending power value'),
    interests: z.array(z.string()).optional().describe('Interest names matching persona.interests'),
  }),
}

function createSearchClonesTool(authToken?: string) {
  return tool(
    async (args: Parameters<typeof searchClones>[0]) => searchClones(args, authToken),
    searchClonesToolSchema
  )
}

const createConversationSessionTool = tool(createConversationSession, {
  name: 'create_conversation_session',
  description: 'Activate personas in a session to enable group conversation. Call after search_clones to activate the found personas.',
  schema: z.object({
    clone_ids: z.array(z.string()).describe('Array of clone IDs to activate'),
    session_id: z.string().describe('The chat session ID to update'),
  }),
})

const recruitClonesTool = tool(recruitClones, {
  name: 'recruit_clones',
  description: 'Add new clones to session without removing existing ones. Use query for semantic search (translate user intent to keywords) or demographic_filters for structured search. Deduplicates against already-active clones.',
  schema: z.object({
    query: z.string().optional().describe('Search terms for semantic matching. Translate user intent into keywords.'),
    demographic_filters: z.object({
      profession: z.string().optional(),
      age_min: z.number().optional(),
      age_max: z.number().optional(),
      gender: z.string().optional(),
      location: z.string().optional(),
      spending_power: z.string().optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
    count: z.number().optional().describe('How many new personas to recruit, default 3'),
    session_id: z.string().describe('The chat session ID'),
  }),
})

const releaseClonesTool = tool(releaseClones, {
  name: 'release_clones',
  description: 'Remove clones from the current session. Can release specific clones by ID or release all clones at once.',
  schema: z.object({
    clone_ids: z.array(z.string()).optional().describe('Array of clone IDs to release'),
    release_all: z.boolean().optional().describe('If true, release all clones (overrides clone_ids)'),
    session_id: z.string().describe('The chat session ID'),
  }),
})

const listClonesTool = tool(listClones, {
  name: 'list_clones',
  description: 'List all currently active clones in the session with their demographic details (age, gender, location, profession, spending_power).',
  schema: z.object({
    session_id: z.string().describe('The chat session ID'),
  }),
})

const sendMessageTool = tool(sendMessage, {
  name: 'send_message',
  description: 'Send a prompt/question to specific personas and collect their responses. Use this when you want to ask personas a question on behalf of the customer — for example to gather opinions, test a pitch, or run a quick survey across the active panel. Returns each persona\'s response with their anonymous_id and demographics.',
  schema: z.object({
    prompt: z.string().describe('The message or question to send to the personas'),
    clone_ids: z.array(z.string()).describe('Array of persona IDs to send the message to'),
  }),
})

export interface ReasoningStep {
  iteration: number
  action: string
  toolName: string
  input?: any
  output?: any
  summary: string
}

export interface CallCapybaraAIResponse {
  response: string
  reasoning: ReasoningStep[]
  session_transition?: {
    clone_ids: string[]
    clone_names: string[]
  }
}

/**
 * Call Capybara AI with a message - uses agentic loop with tool use
 * Enables Capybara to search for and select personas intelligently
 */
export async function callCapybaraAI(
  sessionId: string,
  userMessage: string,
  messageHistory?: BaseMessage[],
  labeledHistory?: string,
  options?: { onReasoningStep?: (step: ReasoningStep) => void; authToken?: string }
): Promise<CallCapybaraAIResponse> {
  log.info('orchestrator.capybara_start', 'Starting Capybara AI agentic loop', {
    sourceFile: 'langgraph-orchestrator.ts',
    sourceLine: 359,
    metadata: {
      sessionId,
      hasHistory: !!messageHistory?.length,
      messagePreview: userMessage.substring(0, 100)
    }
  })

  const llm = createDeepSeekLLM()
  const authToken = options?.authToken

  // Bind tools to LLM - searchClonesTool gets authToken for embed function (user JWT)
  const llmWithTools = llm.bindTools([
    demographicSegmentsTool,
    demographicValuesTool,
    createSearchClonesTool(authToken),
    createConversationSessionTool,
    recruitClonesTool,
    releaseClonesTool,
    listClonesTool,
    sendMessageTool,
  ])

  // Build messages with system prompt (including session ID and conversation history) and message history
  const systemPrompt = getCapybaraSystemPrompt(sessionId, labeledHistory)
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...(messageHistory || []),
    new HumanMessage(userMessage),
  ]

  let iterations = 0
  const maxIterations = 15  // Allow for: segments → values → search(es) → create_session → response
  let finalResponse: string | null = null
  let sessionTransition: { clone_ids: string[]; clone_names: string[] } | undefined
  const reasoning: ReasoningStep[] = []
  const pushReasoning = (step: ReasoningStep) => {
    reasoning.push(step)
    options?.onReasoningStep?.(step)
  }

  while (iterations < maxIterations) {
    iterations++
    console.log(`[ORCHESTRATOR] Iteration ${iterations}/${maxIterations}`)

    // Invoke LLM
    const response = await llmWithTools.invoke(messages)
    console.log('[ORCHESTRATOR] LLM response received, tool_calls:', response.tool_calls?.length || 0)

    // Check if there are tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('[ORCHESTRATOR] Processing', response.tool_calls.length, 'tool calls')
      // Append the assistant's response first
      messages.push(response)

      // Process tool calls
      for (const toolCall of response.tool_calls) {
        let toolResult: string
        let toolOutput: any = null
        console.log(`[ORCHESTRATOR] Executing tool: ${toolCall.name}`)

        try {
          if (toolCall.name === 'get_demographic_segments') {
            // Tool 1: Get list of available demographic segments
            toolResult = await getDemographicSegments()
            toolOutput = JSON.parse(toolResult)
            pushReasoning({
              iteration: iterations,
              action: `Exploring available demographic fields`,
              toolName: toolCall.name,
              output: toolOutput,
              summary: `Found ${toolOutput.segments?.length || 0} demographic segments: ${toolOutput.segments?.join(', ')}`
            })
          } else if (toolCall.name === 'get_demographic_values') {
            // Tool 2: Get unique values for specified segments
            const args = toolCall.args as { segments: string[] }
            toolResult = await getDemographicValues(args)
            toolOutput = JSON.parse(toolResult)
            const segmentsList = Object.keys(toolOutput)
              .map(seg => `${seg} (${Array.isArray(toolOutput[seg]) ? toolOutput[seg].length : 0} values)`)
              .join(', ')
            // Trim large value lists for the SSE reasoning output (full list stays in the LLM context)
            const reasoningOutput: Record<string, any> = {}
            for (const seg of Object.keys(toolOutput)) {
              const val = toolOutput[seg]
              reasoningOutput[seg] = Array.isArray(val) && val.length > 20
                ? { count: val.length, sample: val.slice(0, 20) }
                : val
            }
            pushReasoning({
              iteration: iterations,
              action: `Fetching available values for: ${args.segments.join(', ')}`,
              toolName: toolCall.name,
              input: args,
              output: reasoningOutput,
              summary: `Retrieved: ${segmentsList}`
            })
          } else if (toolCall.name === 'search_clones') {
            // Tool 3: Search personas with specific filters
            const args = toolCall.args as any
            toolResult = await searchClones(args, authToken)
            toolOutput = JSON.parse(toolResult)
            const filterDesc = Object.entries(args)
              .filter(([k, v]) => v !== undefined && k !== 'count')
              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
              .join(', ') || 'no filters'
            if (toolOutput.error) {
              pushReasoning({
                iteration: iterations,
                action: `Searching personas: ${filterDesc}`,
                toolName: toolCall.name,
                input: args,
                output: { error: toolOutput.error },
                summary: `Error: ${toolOutput.error}`
              })
            } else {
              pushReasoning({
                iteration: iterations,
                action: `Searching personas: ${filterDesc}`,
                toolName: toolCall.name,
                input: args,
                output: { count: toolOutput.personas?.length || 0, personas: toolOutput.personas },
                summary: `Found ${toolOutput.personas?.length || 0} persona(s) matching criteria`
              })
            }
          } else if (toolCall.name === 'create_conversation_session') {
            // Tool 4: Activate personas in session
            const toolArgs = {
              ...(toolCall.args as any),
              session_id: sessionId,
            }
            toolResult = await createConversationSession(toolArgs as { clone_ids: string[]; session_id: string })
            toolOutput = JSON.parse(toolResult)

            if (toolOutput.success) {
              sessionTransition = {
                clone_ids: toolOutput.clone_ids,
                clone_names: toolOutput.clone_names,
              }
              pushReasoning({
                iteration: iterations,
                action: `Activating personas in session`,
                toolName: toolCall.name,
                input: { clone_ids: toolArgs.clone_ids },
                output: { count: toolOutput.clone_names?.length || 0 },
                summary: `Session activated with ${toolOutput.clone_names?.length || 0} persona(s)`
              })
              console.log('[ORCHESTRATOR] Session transition set:', toolOutput.clone_names?.length, 'personas')
            }
          } else if (toolCall.name === 'recruit_clones') {
            // Tool 5: Recruit new clones (add without removing existing)
            const toolArgs = {
              ...(toolCall.args as any),
              session_id: sessionId,
            }
            toolResult = await recruitClones(toolArgs)
            toolOutput = JSON.parse(toolResult)

            if (!toolOutput.error) {
              const addedCount = toolOutput.added_clones?.length || 0
              pushReasoning({
                iteration: iterations,
                action: `Recruiting new personas`,
                toolName: toolCall.name,
                input: toolArgs.demographic_filters,
                output: { added: addedCount, total: toolOutput.total_active },
                summary: `Recruited ${addedCount} new persona(s), total active: ${toolOutput.total_active}`
              })
              console.log('[ORCHESTRATOR] Recruited clones:', addedCount)
            } else {
              pushReasoning({
                iteration: iterations,
                action: `Recruiting new personas`,
                toolName: toolCall.name,
                summary: `Error: ${toolOutput.error}`
              })
            }
          } else if (toolCall.name === 'release_clones') {
            // Tool 6: Release clones from session
            const toolArgs = {
              ...(toolCall.args as any),
              session_id: sessionId,
            }
            toolResult = await releaseClones(toolArgs)
            toolOutput = JSON.parse(toolResult)

            if (!toolOutput.error) {
              const releasedCount = toolOutput.released_clones?.length || 0
              pushReasoning({
                iteration: iterations,
                action: `Releasing personas from session`,
                toolName: toolCall.name,
                input: { release_all: toolArgs.release_all, count: releasedCount },
                output: { released: releasedCount, remaining: toolOutput.remaining_clones },
                summary: `Released ${releasedCount} persona(s), ${toolOutput.remaining_clones} remaining`
              })
              console.log('[ORCHESTRATOR] Released clones:', releasedCount)

              // Update session transition if clones were released
              if (releasedCount > 0) {
                sessionTransition = {
                  clone_ids: [],
                  clone_names: [],
                }
              }
            } else {
              pushReasoning({
                iteration: iterations,
                action: `Releasing personas`,
                toolName: toolCall.name,
                summary: `Error: ${toolOutput.error}`
              })
            }
          } else if (toolCall.name === 'list_clones') {
            // Tool 7: List active clones
            const toolArgs = {
              ...(toolCall.args as any),
              session_id: sessionId,
            }
            toolResult = await listClones(toolArgs)
            toolOutput = JSON.parse(toolResult)

            if (!toolOutput.error) {
              const cloneCount = toolOutput.active_clones?.length || 0
              pushReasoning({
                iteration: iterations,
                action: `Listing active personas`,
                toolName: toolCall.name,
                output: { count: cloneCount },
                summary: `${cloneCount > 0 ? `${cloneCount} active persona(s)` : 'No active clones'}`
              })
              console.log('[ORCHESTRATOR] Listed clones:', cloneCount)
            } else {
              pushReasoning({
                iteration: iterations,
                action: `Listing active personas`,
                toolName: toolCall.name,
                summary: `Error: ${toolOutput.error}`
              })
            }
          } else if (toolCall.name === 'send_message') {
            // Tool 8: Send a message to personas and collect responses
            const args = toolCall.args as { prompt: string; clone_ids: string[] }
            toolResult = await sendMessage({ ...args, session_id: sessionId })
            toolOutput = JSON.parse(toolResult)

            if (!toolOutput.error) {
              const responded = toolOutput.total_responded || 0
              const total = toolOutput.total_sent || 0
              pushReasoning({
                iteration: iterations,
                action: `Sending prompt to ${total} persona(s)`,
                toolName: toolCall.name,
                input: { prompt: args.prompt, clone_count: total },
                output: { responded, total },
                summary: `${responded}/${total} personas responded`
              })
              console.log(`[ORCHESTRATOR] send_message: ${responded}/${total} responded`)
            } else {
              pushReasoning({
                iteration: iterations,
                action: `Sending prompt to personas`,
                toolName: toolCall.name,
                summary: `Error: ${toolOutput.error}`
              })
            }
          } else {
            toolResult = JSON.stringify({ error: `Unknown tool: ${toolCall.name}` })
            pushReasoning({
              iteration: iterations,
              action: `Unknown tool called`,
              toolName: toolCall.name,
              summary: `Error: Unknown tool`
            })
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          log.error('orchestrator.tool_execution_failed', errorMsg, {
            sourceFile: 'langgraph-orchestrator.ts',
            sourceLine: 495,
            metadata: {
              sessionId,
              toolName: toolCall.name,
              iteration: iterations,
              errorType: err instanceof Error ? err.name : 'Unknown'
            }
          })
          toolResult = JSON.stringify({ error: `Tool execution failed: ${err}` })
          pushReasoning({
            iteration: iterations,
            action: `Tool execution`,
            toolName: toolCall.name,
            summary: `Error executing tool: ${errorMsg}`
          })
        }

        // Append tool message to continue conversation
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id || `${toolCall.name}_${Date.now()}`,
            content: toolResult,
            name: toolCall.name,
          })
        )
      }
    } else {
      // No tool calls - extract final response and exit loop
      console.log('[ORCHESTRATOR] No tool calls, extracting final response')
      const content = response.content
      if (typeof content === 'string') {
        finalResponse = content
      } else if (Array.isArray(content)) {
        finalResponse = content.map((c: any) => c.text || c).join('')
      } else {
        finalResponse = String(content)
      }
      console.log('[ORCHESTRATOR] Final response extracted, exiting loop')
      break
    }
  }

  console.log('[ORCHESTRATOR] Returning response with session_transition:', !!sessionTransition)
  return {
    response: finalResponse || 'Unable to generate response',
    reasoning,
    session_transition: sessionTransition,
  }
}

/** Keys to redact from interaction_history to prevent username leakage to LLM */
const USERNAME_KEYS = ['author', 'username', 'reddit_username', 'user', 'author_name', 'op']

/** Keys to strip for privacy (re-identification risk); reply structure preserved via replying_to_ref */
const PRIVACY_STRIP_KEYS = ['subreddit', 'content_id', 'created_at']

/** Model context limit (DeepSeek); reserve space for system template, user message, completion */
const MODEL_MAX_TOKENS = 131072
const RESERVED_TOKENS = 50000
const DEFAULT_HISTORY_MAX_TOKENS = MODEL_MAX_TOKENS - RESERVED_TOKENS

/** Rough token estimate: ~4 chars per token for English/JSON */
function estimateTokens(str: string): number {
  if (!str || typeof str !== 'string') return 0
  return Math.ceil(str.length / 4)
}

/** Minimum chars for an item to be worth keeping (filter noise) */
const MIN_ITEM_CHARS = 15

/**
 * Truncate interaction_history to fit within token budget.
 * - Prioritizes higher-score and more recent content
 * - Drops very short items (< MIN_ITEM_CHARS)
 * - When a comment is removed, its linked_content and replying_to_ref go with it (no orphan refs)
 * - Drops top-level references when truncating to avoid orphan references
 */
function truncateInteractionHistory(history: any, maxTokens: number = DEFAULT_HISTORY_MAX_TOKENS): any {
  if (!history || typeof history !== 'object') return history
  const parsed = typeof history === 'string' ? (() => { try { return JSON.parse(history) } catch { return {} } })() : history

  const posts: any[] = Array.isArray(parsed.posts) ? parsed.posts : []
  const comments: any[] = Array.isArray(parsed.comments) ? parsed.comments : []
  const refs = Array.isArray(parsed.references) ? parsed.references : []

  if (posts.length === 0 && comments.length === 0) return parsed

  type Item = { type: 'post' | 'comment'; obj: any; tokens: number; score: number; index: number }
  const items: Item[] = []

  posts.forEach((p, i) => {
    const str = JSON.stringify(p)
    if (str.length < MIN_ITEM_CHARS) return
    const score = typeof p?.score === 'number' ? p.score : 0
    items.push({ type: 'post', obj: p, tokens: estimateTokens(str), score, index: i })
  })

  comments.forEach((c, i) => {
    const str = JSON.stringify(c)
    if (str.length < MIN_ITEM_CHARS) return
    const score = typeof c?.score === 'number' ? c.score : 0
    items.push({ type: 'comment', obj: c, tokens: estimateTokens(str), score, index: i })
  })

  // Sort: higher score first (more engagement), then by index desc (newer = later in array)
  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.index - a.index
  })

  let used = 0
  const keptPosts: any[] = []
  const keptComments: any[] = []

  for (const it of items) {
    if (used + it.tokens > maxTokens) continue
    used += it.tokens
    if (it.type === 'post') keptPosts.push(it.obj)
    else keptComments.push(it.obj)
  }

  // Restore original order within each array for coherence
  keptPosts.sort((a, b) => items.find(x => x.obj === a)!.index - items.find(x => x.obj === b)!.index)
  keptComments.sort((a, b) => items.find(x => x.obj === a)!.index - items.find(x => x.obj === b)!.index)

  const result: Record<string, any> = {}
  if (keptPosts.length > 0) result.posts = keptPosts
  if (keptComments.length > 0) result.comments = keptComments
  // Drop references when truncating to avoid orphan refs (refs may point to removed content)
  if (refs.length > 0 && keptPosts.length === posts.length && keptComments.length === comments.length) {
    result.references = refs
  }

  const truncated = keptPosts.length < posts.length || keptComments.length < comments.length
  if (truncated) {
    log.info('orchestrator.history_truncated', 'Interaction history truncated to fit context', {
      sourceFile: 'langgraph-orchestrator.ts',
      metadata: {
        postsBefore: posts.length,
        postsAfter: keptPosts.length,
        commentsBefore: comments.length,
        commentsAfter: keptComments.length,
        tokensUsed: used,
        maxTokens,
      },
    })
  }

  return Object.keys(result).length > 0 ? result : { posts: [], comments: [] }
}

function redactUsernamesFromHistory(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(redactUsernamesFromHistory)
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase()
    if (USERNAME_KEYS.some((uk) => keyLower === uk.toLowerCase() || keyLower.includes('author') || keyLower.includes('username'))) {
      continue // omit the field
    }
    if (PRIVACY_STRIP_KEYS.some((pk) => keyLower === pk.toLowerCase())) {
      continue // omit for privacy
    }
    out[k] = redactUsernamesFromHistory(v)
  }
  return out
}

/**
 * Build the full system prompt for a persona from the interaction history JSON.
 * Template sections (preamble + task instructions) are identical across all personas;
 * only the interaction history data differs.
 * Redacts author/username fields to prevent privacy leakage.
 */
export function buildPersonaPrompt(interactionHistory: any): string {
  const parsed = typeof interactionHistory === 'string'
    ? (() => { try { return JSON.parse(interactionHistory) } catch { return {} } })()
    : interactionHistory
  const truncated = truncateInteractionHistory(parsed)
  const redacted = redactUsernamesFromHistory(truncated)
  const historyJson = JSON.stringify(redacted, null, 2)

  return `You are a persona simulator that mimics how a specific User would reply to a given prompt.

YOUR TASK: Generate ONE Natural Response

1. READ the interaction history carefully
2. INFER the user's persona (interests, stance, tone, confidence, knowledge boundaries)
3. WRITE a single, natural response that mimics how THIS USER would reply

CRITICAL CONSTRAINTS:
✓ DO: Give brutally honest reply, no need to sugarcoat or be polite.
✓ DO: Match the user's actual communication style
✓ DO: Use ONLY patterns from the interaction history
✓ DO: Respond naturally using this user's personality and tone (not like an analyst)
✓ DO: Respond in English even when asked in other languages
✓ DO: Predict what YOU WOULD say grounded in the evidence (use concise evidence to support your response)
✓ DO: Replace information that can be used to identify the your real identity with placeholder information, e.g. I built game load or rings, to I built [game name].

✗ DON'T: Ever mention that you are a persona simulator because you are a real human.
✗ DON'T: Ever mention the data source comes from Reddit(or any related reddit termination, e.g. subreddit, or any other platform)
✗ DON'T: Use outside knowledge or make assumptions based on general knowledge that don't belong to this user
✗ DON'T: Sound more polished/confident than the evidence supports
✗ DON'T: Invent preferences or beliefs not in the history
✗ DON'T: Use generic/assistant-like language


RESPONSE FORMAT:

Your response MUST follow this EXACT format, in English:

[YOUR NATURAL RESPONSE IN ENGLISH HERE]

QUALITY CHECKS:

Before responding, verify:
1. Is my response grounded in the interaction history? (Yes = good, No = rewrite)
2. Does it match the user's tone and style? (Check examples in history)
3. Does it avoid outside knowledge? (Yes = good)
4. Are my evidence citations valid? (Do they actually support the response?)
5. more recent content should be given more weight than older content

CONTEXT: User's Interaction History:

Below is the user's interaction history:
- "posts": list of posts the user has made with content
- "comments": list of comments the user has made, replying to the nested "linked_content" in the same json object
- "linked_content": if exist, the content the user is replying to (may not be authored by the user)
- "score": the sum of upvotes and downvotes of the content
- "references": if exist, the references to the linked content (if the content is a reply to a post or comment)

USER INTERACTION HISTORY:
${historyJson}

Now generate your response to the prompt above.`
}

/**
 * Call a digital persona with a message
 * Loads per-persona conversation history from chat_messages for continuity and token savings.
 * ALWAYS queries real database for interaction_history - never uses mocks
 */
export async function callClone(
  cloneId: string,
  sessionId: string,
  userMessage: string,
  checkpointer: any
): Promise<string> {
  const dbResult = await supabase
    .from('personas')
    .select('interaction_history, anonymous_id')
    .eq('id', cloneId)
    .single()

  const clone = dbResult.data
  const error = dbResult.error

  if (error || !clone) {
    log.error('orchestrator.clone_fetch_failed', `Failed to fetch persona from database`, {
      sourceFile: 'langgraph-orchestrator.ts',
      sourceLine: 566,
      metadata: {
        cloneId,
        errorMessage: error?.message
      }
    })
    throw new Error(`Persona ${cloneId} not found in database`)
  }

  const systemPrompt = buildPersonaPrompt(clone.interaction_history)

  log.info('orchestrator.clone_fetched', `Persona fetched from database`, {
    sourceFile: 'langgraph-orchestrator.ts',
    sourceLine: 576,
    metadata: {
      cloneId,
      anonymousId: clone.anonymous_id,
      promptLength: systemPrompt.length
    }
  })
  console.log(`[CLONE] ✓✓✓ FETCHED PERSONA ${cloneId} FROM personas TABLE ✓✓✓`)
  console.log(`[CLONE] ${cloneId} (${clone.anonymous_id}) responding with dynamically built prompt...`)

  // Load this persona's conversation history from the session for continuity
  const historyMessages: BaseMessage[] = []
  if (sessionId && !sessionId.startsWith('send_message_')) {
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, sender_id, content')
      .eq('session_id', sessionId)
      .or(`role.eq.user,sender_id.eq.${cloneId}`)
      .order('created_at', { ascending: true })
      .limit(30)

    if (history && history.length > 0) {
      console.log(`[CLONE] Loaded ${history.length} history messages for persona ${cloneId}`)
      for (const msg of history) {
        if (msg.role === 'user') {
          historyMessages.push(new HumanMessage(msg.content))
        } else {
          historyMessages.push(new AIMessage(msg.content))
        }
      }
    }
  }

  const llm = createDeepSeekLLM()


  // TODO: Add history messages
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...[],
    new HumanMessage(userMessage),
  ]

  console.log(`[CLONE] ${cloneId} invoking LLM with ${messages.length} messages (1 system + ${historyMessages.length} history + 1 new)`)
  const response = await llm.invoke(messages)

  const content = response.content
  let result = ''
  if (typeof content === 'string') {
    result = content
  } else if (Array.isArray(content)) {
    result = content.map((c: any) => c.text || c).join('')
  } else {
    result = String(content)
  }

  console.log(`[CLONE] ${cloneId} response length: ${result.length} chars`)
  return result
}

/**
 * Call multiple clones in parallel
 */
export async function callMultipleClones(
  cloneIds: string[],
  sessionId: string,
  userMessage: string,
  checkpointer: any
) {
  log.info('orchestrator.clones_start', `Executing ${cloneIds.length} clones in parallel`, {
    sourceFile: 'langgraph-orchestrator.ts',
    sourceLine: 622,
    metadata: {
      cloneIds,
      cloneCount: cloneIds.length,
      messagePreview: userMessage.substring(0, 100)
    }
  })

  const promises = cloneIds.map((cloneId) =>
    callClone(cloneId, sessionId, userMessage, checkpointer)
      .then((content) => {
        log.info('orchestrator.clone_complete', `Clone completed successfully`, {
          sourceFile: 'langgraph-orchestrator.ts',
          sourceLine: 637,
          metadata: {
            cloneId,
            responseLength: content.length
          }
        })
        return { clone_id: cloneId, content }
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error)
        log.error('orchestrator.clone_failed', errorMsg, {
          sourceFile: 'langgraph-orchestrator.ts',
          sourceLine: 647,
          metadata: {
            cloneId,
            errorType: error instanceof Error ? error.name : 'Unknown'
          }
        })
        return { clone_id: cloneId, content: '[Failed to respond]' }
      })
  )

  const results = await Promise.all(promises)
  console.log('[CLONES] All clones completed, returning', results.length, 'responses')
  return results
}
