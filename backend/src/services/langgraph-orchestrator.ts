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
 * Search personas by research goal with optional demographic filters
 * Returns list of persona IDs and usernames (never exposes prompt)
 */
async function searchClones(input: {
  research_goal: string
  count?: number
  filters?: {
    age_min?: number
    age_max?: number
    gender?: string
    location?: string
    profession?: string
    spending_power?: string
  }
}): Promise<string> {
  console.log('[TOOL] search_clones called with goal:', input.research_goal)
  console.log('[TOOL] search_clones count:', input.count, 'filters:', input.filters)

  let query = supabase.from('personas').select('id, reddit_username, age, gender, location, profession, spending_power')

  // Apply demographic filters
  if (input.filters?.gender) {
    query = query.eq('gender', input.filters.gender)
  }
  if (input.filters?.location) {
    query = query.ilike('location', `%${input.filters.location}%`)
  }
  if (input.filters?.profession) {
    query = query.ilike('profession', `%${input.filters.profession}%`)
  }
  if (input.filters?.spending_power) {
    query = query.ilike('spending_power', `%${input.filters.spending_power}%`)
  }
  if (input.filters?.age_min) {
    query = query.gte('age', input.filters.age_min)
  }
  if (input.filters?.age_max) {
    query = query.lte('age', input.filters.age_max)
  }

  // Limit to requested count (default 5)
  query = query.limit(input.count || 5)

  const { data, error } = await query

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
  }

  console.log('[TOOL] search_clones returning:', result.personas.length, 'personas')
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
  description: 'Search for relevant digital personas based on research goal with demographic filters. IMPORTANT: Always extract filters from user request! If user mentions profession (engineer, founder, developer, manager, etc.), ALWAYS include profession filter. If user mentions age range, gender, location, or spending level, ALWAYS include those filters too.',
  schema: z.object({
    research_goal: z.string().describe('The research goal or persona type to search for'),
    count: z.number().optional().describe('How many personas to activate — infer from user request, default 5'),
    filters: z
      .object({
        age_min: z.number().optional().describe('Minimum age filter - include if user mentions age like "30s", "20-30", "millennial", etc.'),
        age_max: z.number().optional().describe('Maximum age filter - include if user mentions age range'),
        gender: z.string().optional().describe('Gender filter like "female", "male", "non-binary" - include if user mentions gender'),
        location: z.string().optional().describe('Location filter like "NYC", "San Francisco", "Austin" - include if user mentions location'),
        profession: z.string().optional().describe('Profession filter like "engineer", "founder", "developer", "manager", "designer" - ALWAYS include if user mentions job title or profession'),
        spending_power: z.string().optional().describe('Spending power filter like "high", "medium", "low" - include if user mentions budget or spending level'),
      })
      .optional()
      .describe('REQUIRED: Extract demographic filters from user request. Do NOT leave filters empty if user mentioned any demographics.'),
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
