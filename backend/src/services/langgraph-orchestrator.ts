import { HumanMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from 'shared'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export function getCapybaraSystemPrompt(sessionId: string, labeledHistory?: string): string {
  return `You are Capybara AI. Your job is to search for and activate digital personas.

REQUIRED WORKFLOW - ALWAYS FOLLOW THIS:
1. When user mentions clones, research goals, testing, pitches, or feedback:
   - EXTRACT demographics from user request: profession, age range, gender, location, spending power
   - Call search_clones(research_goal, count, filters) with EXTRACTED filters
   - Get back list of personas with IDs
   - IMMEDIATELY call create_conversation_session with top persona IDs
   - Respond: "I've activated [count] personas: [list their usernames from tool response]"

2. IMPORTANT - FILTER EXTRACTION:
   - If user says "engineers" → add profession: "engineer" to filters
   - If user says "female founders in their 30s from NYC" → add gender: "female", age_min: 30, age_max: 39, location: "NYC"
   - If user says "high spending power users" → add spending_power: "high"
   - ALWAYS extract ALL mentioned demographics into filters object

3. CRITICAL: You MUST make TWO tool calls in sequence:
   - First: search_clones (with extracted filters!)
   - Then: create_conversation_session (DO NOT WAIT for user approval)

4. Session ID for this chat: ${sessionId}
   - Use this in create_conversation_session calls
   - Never ask the user for the session ID
   - You already have it: just pass it along

5. When user asks for analysis (e.g., "what objections came up?"), use CONVERSATION HISTORY to reference specific personas by username

FILTER EXAMPLES:
- "2 software engineers" → search_clones(count=2, filters={profession: "engineer"})
- "3 female founders in their 30s from NYC" → search_clones(count=3, filters={gender: "female", profession: "founder", age_min: 30, age_max: 39, location: "NYC"})
- "5 high-spending power users" → search_clones(count=5, filters={spending_power: "high"})

${labeledHistory ? `CONVERSATION HISTORY:\n${labeledHistory}\n` : ''}

After activation, users can chat with the personas directly.`
}

/**
 * Get demographic schema - distinct values for each demographic column
 * This helps the LLM understand what values actually exist in the database
 */
async function getDemographicSchema(): Promise<any> {
  console.log('[TOOL] Getting demographic schema from personas table')

  const columns = ['age', 'gender', 'location', 'profession', 'spending_power']
  const schema: any = {}

  // Get simple columns (scalar values)
  for (const column of columns) {
    const { data, error } = await supabase
      .from('personas')
      .select(column)
      .neq(column, null)

    if (!error && data) {
      // Get distinct values
      const distinctValues = [...new Set(data.map((d: any) => d[column]))]
      schema[column] = distinctValues
      console.log(`[TOOL] ${column} distinct values:`, distinctValues)
    }
  }

  // Handle interests column (array/JSON field)
  console.log('[TOOL] Processing interests column (array/JSON field)')
  const { data: interestsData, error: interestsError } = await supabase
    .from('personas')
    .select('interests')
    .neq('interests', null)

  if (!interestsError && interestsData) {
    const allInterests = new Set<string>()

    // Extract individual interests from array/JSON
    for (const record of interestsData) {
      const interests = record.interests

      if (Array.isArray(interests)) {
        // If it's an array
        interests.forEach((interest: any) => {
          if (typeof interest === 'string') {
            allInterests.add(interest)
          } else if (typeof interest === 'object' && interest?.name) {
            allInterests.add(interest.name)
          }
        })
      } else if (typeof interests === 'object' && interests !== null) {
        // If it's a JSON object with keys as interests
        Object.keys(interests).forEach((key) => {
          allInterests.add(key)
        })
      } else if (typeof interests === 'string') {
        // If it's a string (comma-separated or single value)
        interests.split(',').forEach((interest) => {
          allInterests.add(interest.trim())
        })
      }
    }

    schema.interests = Array.from(allInterests)
    console.log(`[TOOL] interests distinct values:`, schema.interests)
  }

  return schema
}

/**
 * Search personas by research goal
 * Two-step process:
 * 1. Get distinct demographic values from database
 * 2. Convert natural language goal to actual filter values
 * 3. Execute search with verified filters
 */
async function searchClones(input: {
  research_goal: string
  count?: number
}): Promise<string> {
  console.log('[TOOL] search_clones called with goal:', input.research_goal, 'count:', input.count || 5)

  // STEP 1: Get demographic schema
  const demographicSchema = await getDemographicSchema()
  console.log('[TOOL] Demographic schema retrieved for filter matching')

  // STEP 2: Use LLM to convert natural language goal to filter values
  // Build a prompt for the LLM to understand the user's intent
  const filterExtractionPrompt = `
Given the user's research goal: "${input.research_goal}"

Available demographic values in database:
- Ages: ${demographicSchema.age?.join(', ') || 'various'}
- Genders: ${demographicSchema.gender?.join(', ') || 'various'}
- Locations: ${demographicSchema.location?.join(', ') || 'various'}
- Professions: ${demographicSchema.profession?.join(', ') || 'various'}
- Spending Power: ${demographicSchema.spending_power?.join(', ') || 'various'}
- Interests: ${demographicSchema.interests?.join(', ') || 'various'}

Extract filter criteria from the user's goal. Return a JSON object with only the filters mentioned:
{
  "gender": null or string value from available genders,
  "location": null or string value from available locations,
  "profession": null or string value from available professions,
  "age_min": null or number,
  "age_max": null or number,
  "spending_power": null or string value from available spending power,
  "interests": null or array of interest strings from available interests,
  "reasoning": "explain how you matched user intent to available values"
}

Only include filters that are explicitly mentioned or strongly implied. Use null for filters not mentioned.
For interests, return an array of matching interests if mentioned, or null otherwise.
  `

  const llm = createDeepSeekLLM()
  const filterResponse = await llm.invoke([new HumanMessage(filterExtractionPrompt)])

  let extractedFilters: any = {}
  try {
    const responseText = typeof filterResponse.content === 'string'
      ? filterResponse.content
      : String(filterResponse.content)

    console.log('[NLP_CONVERSION] LLM Raw Response:')
    console.log(responseText)
    console.log('[NLP_CONVERSION] ---END RAW RESPONSE---')

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      extractedFilters = parsed

      console.log('[NLP_CONVERSION] Successfully extracted filters:')
      console.log('[NLP_CONVERSION] profession:', extractedFilters.profession)
      console.log('[NLP_CONVERSION] age_min:', extractedFilters.age_min)
      console.log('[NLP_CONVERSION] age_max:', extractedFilters.age_max)
      console.log('[NLP_CONVERSION] gender:', extractedFilters.gender)
      console.log('[NLP_CONVERSION] location:', extractedFilters.location)
      console.log('[NLP_CONVERSION] spending_power:', extractedFilters.spending_power)
      console.log('[NLP_CONVERSION] interests:', extractedFilters.interests)
      console.log('[NLP_CONVERSION] reasoning:', extractedFilters.reasoning)
    }
  } catch (e) {
    console.log('[NLP_CONVERSION] Filter extraction parsing error:', e)
  }

  // STEP 3: Execute search with verified filters
  let query = supabase.from('personas').select('id, reddit_username, age, gender, location, profession, spending_power, interests')

  // Apply demographic filters
  if (extractedFilters.gender) {
    query = query.eq('gender', extractedFilters.gender)
  }
  if (extractedFilters.location) {
    query = query.eq('location', extractedFilters.location)
  }
  if (extractedFilters.profession) {
    query = query.eq('profession', extractedFilters.profession)
  }
  if (extractedFilters.spending_power) {
    query = query.eq('spending_power', extractedFilters.spending_power)
  }
  if (extractedFilters.age_min !== null && extractedFilters.age_min !== undefined) {
    query = query.gte('age', extractedFilters.age_min)
  }
  if (extractedFilters.age_max !== null && extractedFilters.age_max !== undefined) {
    query = query.lte('age', extractedFilters.age_max)
  }

  // Handle interests filter (needs client-side filtering since it's JSON/array)
  // Limit to requested count (default 5)
  query = query.limit(input.count || 5)

  // Build and log the SQL query
  const sqlQueryLog = `
[SEARCH_SQL] Generated Query:
  SELECT id, reddit_username, age, gender, location, profession, spending_power, interests
  FROM personas
  WHERE 1=1
  ${extractedFilters.profession ? `AND profession = '${extractedFilters.profession}'` : ''}
  ${extractedFilters.gender ? `AND gender = '${extractedFilters.gender}'` : ''}
  ${extractedFilters.location ? `AND location = '${extractedFilters.location}'` : ''}
  ${extractedFilters.spending_power ? `AND spending_power = '${extractedFilters.spending_power}'` : ''}
  ${extractedFilters.age_min !== null && extractedFilters.age_min !== undefined ? `AND age >= ${extractedFilters.age_min}` : ''}
  ${extractedFilters.age_max !== null && extractedFilters.age_max !== undefined ? `AND age <= ${extractedFilters.age_max}` : ''}
  LIMIT ${input.count || 5};
  `
  console.log(sqlQueryLog)

  let { data, error } = await query

  console.log(`[SEARCH_SQL] Database returned ${data?.length || 0} rows before interest filtering`)

  // Filter by interests on client side (since it's an array/JSON field)
  if (!error && data && extractedFilters.interests && Array.isArray(extractedFilters.interests) && extractedFilters.interests.length > 0) {
    console.log('[SEARCH_FILTER] Filtering results by interests:', extractedFilters.interests)
    data = data.filter((persona: any) => {
      const personaInterests = persona.interests
      if (!personaInterests) return false

      // Check if any of the requested interests are in the persona's interests
      let hasMatchingInterest = false

      if (Array.isArray(personaInterests)) {
        hasMatchingInterest = personaInterests.some((pi: any) => {
          const piStr = typeof pi === 'string' ? pi : pi?.name || ''
          return extractedFilters.interests.some((requested: string) =>
            piStr.toLowerCase().includes(requested.toLowerCase()) ||
            requested.toLowerCase().includes(piStr.toLowerCase())
          )
        })
      } else if (typeof personaInterests === 'object') {
        hasMatchingInterest = Object.keys(personaInterests).some((key) =>
          extractedFilters.interests.some((requested: string) =>
            key.toLowerCase().includes(requested.toLowerCase()) ||
            requested.toLowerCase().includes(key.toLowerCase())
          )
        )
      }

      return hasMatchingInterest
    })
  }

  if (error) {
    console.log('[TOOL] search_clones error:', error)
    return JSON.stringify({ error: 'Failed to search personas' })
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
    filters_used: extractedFilters,
  }

  console.log('[TOOL] search_clones returning:', result.personas.length, 'personas with filters:', extractedFilters)
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
const searchClonesTool = tool(searchClones, {
  name: 'search_clones',
  description: 'Search for relevant digital personas based on research goal. The tool automatically extracts demographic filters from the natural language goal by: 1) querying the database for distinct demographic values, 2) using LLM to match user intent to actual values, 3) returning matching personas.',
  schema: z.object({
    research_goal: z.string().describe('The user\'s natural language research goal (e.g., "software engineers in their 30s", "female founders from NYC")'),
    count: z.number().optional().describe('How many personas to return - infer from user request, default 5'),
  }),
})

const createConversationSessionTool = tool(createConversationSession, {
  name: 'create_conversation_session',
  description:
    'Create a conversation session with selected clones. Updates the session to activate the clones and switch to conversation mode.',
  schema: z.object({
    clone_ids: z.array(z.string()).describe('Array of clone IDs to activate'),
    session_id: z.string().describe('The chat session ID to update'),
  }),
})

export interface CallCapybaraAIResponse {
  response: string
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

  // Bind tools to LLM
  const llmWithTools = llm.bindTools([searchClonesTool, createConversationSessionTool])

  // Build messages with system prompt (including session ID and conversation history) and message history
  const systemPrompt = getCapybaraSystemPrompt(sessionId, labeledHistory)
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...(messageHistory || []),
    new HumanMessage(userMessage),
  ]

  let iterations = 0
  const maxIterations = 5
  let finalResponse: string | null = null
  let sessionTransition: { clone_ids: string[]; clone_names: string[] } | undefined

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
        console.log(`[ORCHESTRATOR] Executing tool: ${toolCall.name}`)

        try {
          if (toolCall.name === 'search_clones') {
            // Call the search clones function directly
            toolResult = await searchClones(toolCall.args as { research_goal: string })
          } else if (toolCall.name === 'create_conversation_session') {
            // Add sessionId to the tool call
            const toolArgs = {
              ...(toolCall.args as any),
              session_id: sessionId,
            }
            toolResult = await createConversationSession(toolArgs as { clone_ids: string[]; session_id: string })

            // Parse the result to extract clone info for session transition
            try {
              const result = JSON.parse(toolResult)
              if (result.success) {
                sessionTransition = {
                  clone_ids: result.clone_ids,
                  clone_names: result.clone_names,
                }
                console.log('[ORCHESTRATOR] Session transition set:', result.clone_names)
              }
            } catch {}
          } else {
            toolResult = JSON.stringify({ error: `Unknown tool: ${toolCall.name}` })
          }
        } catch (err) {
          console.log('[ORCHESTRATOR] Tool execution error:', err)
          toolResult = JSON.stringify({ error: `Tool execution failed: ${err}` })
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
