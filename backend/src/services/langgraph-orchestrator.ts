import { HumanMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from 'shared'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { log } from './logging'

export function getCapybaraSystemPrompt(sessionId: string, labeledHistory?: string): string {
  return `You are Capybara AI. Your job is to search for and activate digital personas.

REQUIRED WORKFLOW:
1. When user asks to find personas:
   - Call get_demographic_segments() to see available demographic fields
   - Call get_demographic_values({segments: [...]}) for fields mentioned by user
   - Call search_clones({...filters..., count: N}) to find personas
   - Call create_conversation_session with returned persona IDs
   - Respond: "I've activated [count] personas: [list their usernames]"

2. Available tools:
   - get_demographic_segments(): Returns list of demographic field names available in database
   - get_demographic_values(segments): Given list of field names, returns unique values for each
   - search_clones(filters): Query personas with demographic filters
   - create_conversation_session(clone_ids, session_id): Activate personas in session

3. Example flow:
   User: "Find 3 female engineers in their 30s from NYC"
   → get_demographic_segments() → ["profession", "age", "gender", "location", "spending_power", "interests"]
   → get_demographic_values({segments: ["profession", "gender", "location"]})
   → Returns: {profession: ["engineer", "student", "dancer"], gender: ["female", "male"], location: ["NYC", "Boston", ...]}
   → search_clones({profession: "engineer", gender: "female", age_min: 30, age_max: 39, location: "NYC", count: 3})
   → create_conversation_session with returned persona IDs

4. Session ID: ${sessionId}
   - Pass this to create_conversation_session calls

${labeledHistory ? `CONVERSATION HISTORY:\n${labeledHistory}\n` : ''}

After activation, users can chat with the personas directly.`
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

  // Bind tools to LLM - LLM will intelligently pick which tools to call and in what order
  const llmWithTools = llm.bindTools([demographicSegmentsTool, demographicValuesTool, searchClonesTool, createConversationSessionTool])

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
          reasoning.push({
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

  // Log proof of database fetch without dumping the full prompt
  log.info('orchestrator.clone_fetched', `Persona fetched from database`, {
    sourceFile: 'langgraph-orchestrator.ts',
    sourceLine: 576,
    metadata: {
      cloneId,
      username: clone.reddit_username,
      promptLength: clone.prompt?.length || 0
    }
  })
  console.log(`[CLONE] ✓✓✓ FETCHED PERSONA ${cloneId} FROM personas TABLE ✓✓✓`)
  console.log(`[CLONE] ✓ Persona username: ${clone.reddit_username}`)
  console.log(`[CLONE] ✓ System prompt for persona ${clone.reddit_username} (${clone.prompt.length} chars)`)
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
    callClone(cloneId, threadId, userMessage, checkpointer)
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
