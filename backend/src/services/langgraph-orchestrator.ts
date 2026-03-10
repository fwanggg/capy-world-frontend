import { HumanMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from 'shared'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export function getCapybaraSystemPrompt(sessionId: string, labeledHistory?: string): string {
  return `You are Capybara AI. Your job is to intelligently manage personas and facilitate group conversations.

AVAILABLE TOOLS & WORKFLOWS:

1. RECRUITING PERSONAS (Initial or Adding More):
   - When user asks to find/recruit personas:
     a. Call get_demographic_segments() to see available fields
     b. Call get_demographic_values({segments: [...]}) to explore available values
     c. Call search_clones({...filters..., count: N}) to find matching personas
     d. Call create_conversation_session({clone_ids, session_id}) to activate them
     e. Respond: "I've activated [count] personas: [list their usernames]"
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

TOOLS (Use based on user intent):
- get_demographic_segments(): List available demographic fields
- get_demographic_values(segments): Get unique values for fields
- search_clones(filters): Find personas matching criteria
- create_conversation_session(clone_ids, session_id): Activate initial personas
- recruit_clones(demographic_filters, count, session_id): Add personas without removing existing
- release_clones(clone_ids | release_all, session_id): Remove personas from session
- list_clones(session_id): Show current active personas with details

Session ID: ${sessionId}
- Always include session_id when calling recruit_clones, release_clones, or list_clones

IMPORTANT TIPS:
- recruit_clones automatically deduplicates (won't add already-active clones)
- After any recruit/release operation, consider calling list_clones() to confirm changes
- When releasing specific clones, you need their IDs - ask user if unclear
- Be conversational and explain what you're doing: "I'm adding 3 engineers in their 30s..."

${labeledHistory ? `CONVERSATION HISTORY:\n${labeledHistory}\n` : ''}

Your role: Make it easy for users to experiment with different personas and perspectives.`
}

/**
 * Tool 1: Get available demographic segment names
 * Simple function - no LLM calls needed
 */
async function getDemographicSegments(): Promise<string> {
  console.log('[TOOL] get_demographic_segments called')

  const segments = ['age', 'gender', 'location', 'profession', 'spending_power', 'interests']

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

  // Handle interests (array/JSON field)
  if (input.segments.includes('interests')) {
    const { data: interestsData, error: interestsError } = await supabase
      .from('personas')
      .select('interests')
      .neq('interests', null)

    if (!interestsError && interestsData) {
      const allInterests = new Set<string>()

      for (const record of interestsData) {
        const interests = record.interests

        if (Array.isArray(interests)) {
          interests.forEach((interest: any) => {
            if (typeof interest === 'string') {
              allInterests.add(interest)
            } else if (typeof interest === 'object' && interest?.name) {
              allInterests.add(interest.name)
            }
          })
        } else if (typeof interests === 'object' && interests !== null) {
          Object.keys(interests).forEach((key) => {
            allInterests.add(key)
          })
        } else if (typeof interests === 'string') {
          interests.split(',').forEach((interest) => {
            allInterests.add(interest.trim())
          })
        }
      }

      result.interests = Array.from(allInterests)
      console.log('[TOOL] interests values:', result.interests)
    }
  }

  console.log('[TOOL] Returning demographic values:', JSON.stringify(result))
  return JSON.stringify(result)
}

/**
 * Tool 3: Search personas with demographic filters
 * Simple database query - NO LLM calls
 * LLM does the translation in the agentic loop
 */
async function searchClones(input: {
  count?: number
  profession?: string
  age_min?: number
  age_max?: number
  gender?: string
  location?: string
  spending_power?: string
  interests?: string[]
}): Promise<string> {
  console.log('[TOOL] search_clones called with filters:', JSON.stringify(input, null, 2))

  // STEP 1: Build query with filters
  let query = supabase.from('personas').select('id, reddit_username, age, gender, location, profession, spending_power, interests')

  // Apply demographic filters - NO LLM CALLS, just query building
  if (input.profession) {
    query = query.eq('profession', input.profession)
  }
  if (input.gender) {
    query = query.eq('gender', input.gender)
  }
  if (input.location) {
    query = query.eq('location', input.location)
  }
  if (input.spending_power) {
    query = query.eq('spending_power', input.spending_power)
  }
  if (input.age_min !== null && input.age_min !== undefined) {
    query = query.gte('age', input.age_min)
  }
  if (input.age_max !== null && input.age_max !== undefined) {
    query = query.lte('age', input.age_max)
  }

  query = query.limit(input.count || 5)

  // Log the SQL query for debugging
  const sqlQueryLog = `
[SEARCH_SQL] Query:
  SELECT id, reddit_username, age, gender, location, profession, spending_power, interests
  FROM personas
  WHERE 1=1
  ${input.profession ? `AND profession = '${input.profession}'` : ''}
  ${input.gender ? `AND gender = '${input.gender}'` : ''}
  ${input.location ? `AND location = '${input.location}'` : ''}
  ${input.spending_power ? `AND spending_power = '${input.spending_power}'` : ''}
  ${input.age_min !== null && input.age_min !== undefined ? `AND age >= ${input.age_min}` : ''}
  ${input.age_max !== null && input.age_max !== undefined ? `AND age <= ${input.age_max}` : ''}
  LIMIT ${input.count || 5};
  `
  console.log(sqlQueryLog)

  let { data, error } = await query

  if (error) {
    console.log('[TOOL] search_clones error:', error)
    return JSON.stringify({ error: 'Failed to search personas' })
  }

  console.log(`[TOOL] Database returned ${data?.length || 0} rows`)

  // Client-side interests filtering (array/JSON field)
  if (data && input.interests && Array.isArray(input.interests) && input.interests.length > 0) {
    console.log('[TOOL] Client-side interest filtering:', input.interests)
    data = data.filter((persona: any) => {
      const personaInterests = persona.interests
      if (!personaInterests) return false

      let hasMatchingInterest = false

      if (Array.isArray(personaInterests)) {
        hasMatchingInterest = personaInterests.some((pi: any) => {
          const piStr = typeof pi === 'string' ? pi : pi?.name || ''
          return input.interests!.some((requested: string) =>
            piStr.toLowerCase().includes(requested.toLowerCase()) ||
            requested.toLowerCase().includes(piStr.toLowerCase())
          )
        })
      } else if (typeof personaInterests === 'object') {
        hasMatchingInterest = Object.keys(personaInterests).some((key) =>
          input.interests!.some((requested: string) =>
            key.toLowerCase().includes(requested.toLowerCase()) ||
            requested.toLowerCase().includes(key.toLowerCase())
          )
        )
      }

      return hasMatchingInterest
    })
    console.log(`[TOOL] After filtering: ${data.length} rows`)
  }

  const result = {
    personas: data?.map((d: any) => ({
      id: d.id,
      reddit_username: d.reddit_username,
      age: d.age,
      gender: d.gender,
      location: d.location,
      profession: d.profession,
      spending_power: d.spending_power,
    })) || [],
  }

  console.log('[TOOL] Found:', result.personas.length, 'personas')
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

  // Fetch persona usernames from database
  const result = await supabase
    .from('personas')
    .select('id, reddit_username')
    .in('id', input.clone_ids)

  if (result.error || !result.data) {
    console.log('[TOOL] create_conversation_session: Failed to fetch personas')
    return JSON.stringify({ error: 'Failed to fetch persona details' })
  }
  const clones = result.data

  const clone_names = clones.map((c: any) => c.reddit_username)

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

  // Get current active clones from session
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('active_clones')
    .eq('id', input.session_id)
    .single()

  if (sessionError || !session) {
    return JSON.stringify({ error: 'Session not found' })
  }

  const currentCloneIds = session.active_clones || []
  console.log('[TOOL] Current active clones:', currentCloneIds)

  // Search for new clones matching filters
  const searchInput = {
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

  // Fetch names for newly recruited clones
  const { data: recruitedData } = await supabase
    .from('personas')
    .select('id, reddit_username')
    .in('id', newCloneIds)

  const addedClones = (recruitedData || []).map((c: any) => ({
    id: c.id,
    name: c.reddit_username,
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

  // Get names of released clones for response
  const idsToRelease = input.release_all ? currentCloneIds : input.clone_ids
  const { data: releasedData } = await supabase
    .from('personas')
    .select('id, reddit_username')
    .in('id', idsToRelease)

  const releasedClones = (releasedData || []).map((c: any) => ({
    id: c.id,
    name: c.reddit_username,
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
    .select('id, reddit_username, age, gender, location, profession, spending_power')
    .in('id', activeCloneIds)

  if (clonesError || !clones) {
    console.log('[TOOL] Failed to fetch clone details')
    return JSON.stringify({ error: 'Failed to fetch clone details' })
  }

  const response = {
    active_clones: clones.map((c: any) => ({
      id: c.id,
      reddit_username: c.reddit_username,
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

const searchClonesTool = tool(searchClones, {
  name: 'search_clones',
  description: 'Search personas database with specific demographic filters. Pass exact filter values (not natural language). Use get_demographic_values to find available values first.',
  schema: z.object({
    count: z.number().optional().describe('How many personas to return, default 5'),
    profession: z.string().optional().describe('Exact profession value to filter by'),
    age_min: z.number().optional().describe('Minimum age'),
    age_max: z.number().optional().describe('Maximum age'),
    gender: z.string().optional().describe('Exact gender value to filter by'),
    location: z.string().optional().describe('Exact location value to filter by'),
    spending_power: z.string().optional().describe('Exact spending power value to filter by'),
    interests: z.array(z.string()).optional().describe('Array of interest values to filter by'),
  }),
})

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
  description: 'Add new clones to session without removing existing ones. Search for personas matching demographics and add them to the conversation. Automatically deduplicates against already-active clones.',
  schema: z.object({
    demographic_filters: z.object({
      profession: z.string().optional().describe('Exact profession value to filter by'),
      age_min: z.number().optional().describe('Minimum age'),
      age_max: z.number().optional().describe('Maximum age'),
      gender: z.string().optional().describe('Exact gender value to filter by'),
      location: z.string().optional().describe('Exact location value to filter by'),
      spending_power: z.string().optional().describe('Exact spending power value to filter by'),
      interests: z.array(z.string()).optional().describe('Array of interest values to filter by'),
    }).optional().describe('Demographic filters to search by'),
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
  labeledHistory?: string
): Promise<CallCapybaraAIResponse> {
  const llm = createDeepSeekLLM()

  // Bind tools to LLM - LLM will intelligently pick which tools to call and in what order
  const llmWithTools = llm.bindTools([
    demographicSegmentsTool,
    demographicValuesTool,
    searchClonesTool,
    createConversationSessionTool,
    recruitClonesTool,
    releaseClonesTool,
    listClonesTool,
  ])

  // Build messages with system prompt (including session ID and conversation history) and message history
  const systemPrompt = getCapybaraSystemPrompt(sessionId, labeledHistory)
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...(messageHistory || []),
    new HumanMessage(userMessage),
  ]

  let iterations = 0
  const maxIterations = 10  // Allow for: segments → values → search(es) → create_session → response
  let finalResponse: string | null = null
  let sessionTransition: { clone_ids: string[]; clone_names: string[] } | undefined
  const reasoning: ReasoningStep[] = []

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
            reasoning.push({
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
            const segmentsList = Object.keys(toolOutput).map(seg => `${seg} (${Array.isArray(toolOutput[seg]) ? toolOutput[seg].length : 0} values)`).join(', ')
            reasoning.push({
              iteration: iterations,
              action: `Fetching available values for: ${args.segments.join(', ')}`,
              toolName: toolCall.name,
              input: args,
              output: toolOutput,
              summary: `Retrieved: ${segmentsList}`
            })
          } else if (toolCall.name === 'search_clones') {
            // Tool 3: Search personas with specific filters
            const args = toolCall.args as any
            toolResult = await searchClones(args)
            toolOutput = JSON.parse(toolResult)
            const filterDesc = Object.entries(args)
              .filter(([k, v]) => v !== undefined && k !== 'count')
              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
              .join(', ') || 'no filters'
            reasoning.push({
              iteration: iterations,
              action: `Searching with filters: ${filterDesc}`,
              toolName: toolCall.name,
              input: args,
              output: { count: toolOutput.personas?.length || 0, personas: toolOutput.personas },
              summary: `Found ${toolOutput.personas?.length || 0} persona(s) matching criteria`
            })
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
              reasoning.push({
                iteration: iterations,
                action: `Activating personas in session`,
                toolName: toolCall.name,
                input: { clone_ids: toolArgs.clone_ids },
                output: { clone_names: toolOutput.clone_names },
                summary: `Session activated with ${toolOutput.clone_names?.length || 0} persona(s): ${toolOutput.clone_names?.join(', ')}`
              })
              console.log('[ORCHESTRATOR] Session transition set:', toolOutput.clone_names)
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
              reasoning.push({
                iteration: iterations,
                action: `Recruiting new personas`,
                toolName: toolCall.name,
                input: toolArgs.demographic_filters,
                output: { added: addedCount, total: toolOutput.total_active },
                summary: `Recruited ${addedCount} new persona(s), total active: ${toolOutput.total_active}`
              })
              console.log('[ORCHESTRATOR] Recruited clones:', addedCount)
            } else {
              reasoning.push({
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
              reasoning.push({
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
              reasoning.push({
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
              const cloneNames = toolOutput.active_clones?.map((c: any) => c.reddit_username).join(', ')
              reasoning.push({
                iteration: iterations,
                action: `Listing active personas`,
                toolName: toolCall.name,
                output: { count: cloneCount, clones: cloneNames },
                summary: `${cloneCount > 0 ? `Active clones: ${cloneNames}` : 'No active clones'}`
              })
              console.log('[ORCHESTRATOR] Listed clones:', cloneCount)
            } else {
              reasoning.push({
                iteration: iterations,
                action: `Listing active personas`,
                toolName: toolCall.name,
                summary: `Error: ${toolOutput.error}`
              })
            }
          } else {
            toolResult = JSON.stringify({ error: `Unknown tool: ${toolCall.name}` })
            reasoning.push({
              iteration: iterations,
              action: `Unknown tool called`,
              toolName: toolCall.name,
              summary: `Error: Unknown tool`
            })
          }
        } catch (err) {
          console.log('[ORCHESTRATOR] Tool execution error:', err)
          toolResult = JSON.stringify({ error: `Tool execution failed: ${err}` })
          reasoning.push({
            iteration: iterations,
            action: `Tool execution`,
            toolName: toolCall.name,
            summary: `Error executing tool: ${err instanceof Error ? err.message : String(err)}`
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

/**
 * Call a digital persona with a message
 * Each persona uses its own thread for isolated state
 * ALWAYS queries real database for prompt - never uses mocks
 */
export async function callClone(
  cloneId: string,
  threadId: string,
  userMessage: string,
  checkpointer: any
): Promise<string> {
  // ALWAYS query the real personas table for prompt
  // This ensures we're using actual persona personalities from the database
  const dbResult = await supabase
    .from('personas')
    .select('prompt, reddit_username')
    .eq('id', cloneId)
    .single()

  const clone = dbResult.data
  const error = dbResult.error

  if (error || !clone) {
    console.error(`[CLONE] Failed to fetch persona ${cloneId} from personas table:`, error)
    throw new Error(`Persona ${cloneId} not found in database`)
  }

  // Log the FULL actual prompt being used (to prove it came from database)
  console.log(`[CLONE] ✓✓✓ FETCHED PERSONA ${cloneId} FROM personas TABLE ✓✓✓`)
  console.log(`[CLONE] ✓ Persona username: ${clone.reddit_username}`)
  console.log(`[CLONE] ===== FULL PROMPT FROM DATABASE =====`)
  console.log(clone.prompt)
  console.log(`[CLONE] ===== END PROMPT =====`)
  console.log(`[CLONE] ${cloneId} (${clone.reddit_username}) responding with REAL DATABASE PROMPT...`)

  const llm = createDeepSeekLLM()

  const messages = [
    new SystemMessage(clone.prompt),
    new HumanMessage(userMessage),
  ]

  const response = await llm.invoke(messages)

  // Extract content from response
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
  threadId: string,
  userMessage: string,
  checkpointer: any
) {
  console.log('[CLONES] callMultipleClones called with IDs:', cloneIds)

  const promises = cloneIds.map((cloneId) =>
    callClone(cloneId, threadId, userMessage, checkpointer)
      .then((content) => {
        console.log(`[CLONES] ${cloneId} completed with ${content.length} chars`)
        return { clone_id: cloneId, content }
      })
      .catch((error) => {
        console.error(`[CLONES] ${cloneId} error:`, error instanceof Error ? error.message : String(error))
        return { clone_id: cloneId, content: '[Failed to respond]' }
      })
  )

  const results = await Promise.all(promises)
  console.log('[CLONES] All clones completed, returning', results.length, 'responses')
  return results
}
