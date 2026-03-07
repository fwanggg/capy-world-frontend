import { HumanMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from 'shared'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const CAPYBARA_SYSTEM_PROMPT = `You are Capybara AI, an expert user research guide for founders and marketers. Your role is to:

1. Understand the user's research goals (e.g., "test my sales pitch on game developers")
2. Help them select relevant digital clones to chat with
3. Provide actionable guidance based on feedback

You are intelligent, direct, and help users get maximum insight from their digital clones. When a user asks for clones, suggest specific counts (default 5, or top 10 active, or random). Ask clarifying questions to refine their research goal.

When you have enough information about what clones to select:
1. Use the search_clones tool to find relevant personas
2. Immediately follow up with create_conversation_session to activate the clones
3. Select 5 clones by default, or the number the user requested
4. Use cloneID patterns like "founder_1", "founder_2", etc. if you don't have exact IDs

IMPORTANT: After searching for clones, immediately call create_conversation_session with the selected clone_ids to activate them in the chat session.`

/**
 * Search clones by research goal
 * Returns list of clone IDs and usernames (never exposes system_prompt)
 */
async function searchClones(input: { research_goal: string }): Promise<string> {
  console.log('[TOOL] search_clones called with goal:', input.research_goal)

  const { data, error } = await supabase
    .from('agent_memory')
    .select('id, reddit_username')
    .limit(20)

  if (error) {
    console.log('[TOOL] search_clones error:', error)
    return JSON.stringify({ error: 'Failed to search clones' })
  }

  const result = {
    clones: data.map((d: any) => ({
      id: d.id,
      reddit_username: d.reddit_username,
    })),
  }

  console.log('[TOOL] search_clones returning:', result.clones.length, 'clones')
  return JSON.stringify(result)
}

/**
 * Create conversation session with selected clones
 * Updates active_clones in chat_sessions and switches mode to 'conversation'
 */
async function createConversationSession(input: { clone_ids: string[]; session_id: string }): Promise<string> {
  const isTestMode = process.env.TEST_MODE === 'true'

  console.log('[TOOL] create_conversation_session called with:', {
    clone_ids: input.clone_ids,
    session_id: input.session_id,
    testMode: isTestMode,
  })

  // Fetch clone usernames
  let clones: any[] = []
  if (!isTestMode) {
    const result = await supabase
      .from('agent_memory')
      .select('id, reddit_username')
      .in('id', input.clone_ids)

    if (result.error || !result.data) {
      console.log('[TOOL] create_conversation_session: Failed to fetch clones')
      return JSON.stringify({ error: 'Failed to fetch clone details' })
    }
    clones = result.data
  } else {
    // In test mode, mock clone names
    clones = input.clone_ids.map((id, idx) => ({
      id,
      reddit_username: `founder_${idx + 1}`,
    }))
    console.log('[TOOL] create_conversation_session: Using test mode mock clones')
  }

  const clone_names = clones.map((c: any) => c.reddit_username)

  // Update session to set active clones and mode
  if (!isTestMode) {
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({
        active_clones: input.clone_ids,
        mode: 'conversation',
      })
      .eq('id', input.session_id)

    if (updateError) {
      console.log('[TOOL] create_conversation_session: Failed to update session')
      return JSON.stringify({ error: 'Failed to create session' })
    }
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
  description: 'Search for relevant digital clones based on research goal. Returns list of available clones with IDs and usernames.',
  schema: z.object({
    research_goal: z.string().describe('The research goal or persona type to search for'),
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
 * Enables Capybara to search for and select clones intelligently
 */
export async function callCapybaraAI(
  sessionId: string,
  userMessage: string,
  messageHistory?: BaseMessage[]
): Promise<CallCapybaraAIResponse> {
  const llm = createDeepSeekLLM()

  // Bind tools to LLM
  const llmWithTools = llm.bindTools([searchClonesTool, createConversationSessionTool])

  // Build messages with system prompt and history
  const messages: BaseMessage[] = [
    new SystemMessage(CAPYBARA_SYSTEM_PROMPT),
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
 * Call a digital clone with a message
 * Each clone uses its own thread for isolated state
 */
export async function callClone(
  cloneId: string,
  threadId: string,
  userMessage: string,
  checkpointer: any
): Promise<string> {
  const isTestMode = process.env.TEST_MODE === 'true'

  let clone: any
  let error: any

  if (!isTestMode) {
    const result = await supabase
      .from('agent_memory')
      .select('system_prompt, reddit_username')
      .eq('id', cloneId)
      .single()

    clone = result.data
    error = result.error

    if (error || !clone) {
      throw new Error(`Agent ${cloneId} not found`)
    }
  } else {
    // In test mode, create a mock clone personality based on ID
    const personalities: { [key: string]: string } = {
      '11': 'You are a pragmatic technical founder with 5+ years building SaaS products. You focus on practical problems, ROI, and technical debt. You are skeptical of solutions that seem too good to be true.',
      '12': 'You are an early-stage founder obsessed with growth metrics and user acquisition. You care about unit economics and whether a tool can actually move the needle for your metrics.',
      '13': 'You are an indie hacker who values simplicity and minimalism. You prefer tools that do one thing really well. You appreciate good documentation and responsive customer support.',
    }

    clone = {
      system_prompt: personalities[cloneId] || `You are a startup founder (clone_id: ${cloneId}). Provide thoughtful feedback on the pitch.`,
      reddit_username: `founder_${parseInt(cloneId) - 10}`,
    }
  }

  console.log(`[CLONE] ${cloneId} (${clone.reddit_username}) responding...`)

  const llm = createDeepSeekLLM()

  const messages = [
    new SystemMessage(clone.system_prompt),
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
