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

When you have enough information about what clones to select, use the search_clones tool to find relevant personas, then use create_conversation_session to activate them.`

/**
 * Search clones by research goal
 * Returns list of clone IDs and usernames (never exposes system_prompt)
 */
async function searchClones(input: { research_goal: string }): Promise<string> {
  const { data, error } = await supabase
    .from('agent_memory')
    .select('id, reddit_username')
    .limit(20)

  if (error) {
    return JSON.stringify({ error: 'Failed to search clones' })
  }

  return JSON.stringify({
    clones: data.map((d: any) => ({
      id: d.id,
      reddit_username: d.reddit_username,
    })),
  })
}

/**
 * Create conversation session with selected clones
 * Updates active_clones in chat_sessions and switches mode to 'conversation'
 */
async function createConversationSession(input: { clone_ids: string[]; session_id: string }): Promise<string> {
  // Fetch clone usernames
  const { data: clones, error: fetchError } = await supabase
    .from('agent_memory')
    .select('id, reddit_username')
    .in('id', input.clone_ids)

  if (fetchError || !clones) {
    return JSON.stringify({ error: 'Failed to fetch clone details' })
  }

  const clone_names = clones.map((c: any) => c.reddit_username)

  // Update session to set active clones and mode
  const { error: updateError } = await supabase
    .from('chat_sessions')
    .update({
      active_clones: input.clone_ids,
      mode: 'conversation',
    })
    .eq('id', input.session_id)

  if (updateError) {
    return JSON.stringify({ error: 'Failed to create session' })
  }

  return JSON.stringify({
    success: true,
    clone_ids: input.clone_ids,
    clone_names,
  })
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

    // Invoke LLM
    const response = await llmWithTools.invoke(messages)

    // Check if there are tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Append the assistant's response first
      messages.push(response)

      // Process tool calls
      for (const toolCall of response.tool_calls) {
        let toolResult: string

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
              }
            } catch {}
          } else {
            toolResult = JSON.stringify({ error: `Unknown tool: ${toolCall.name}` })
          }
        } catch (err) {
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
      const content = response.content
      if (typeof content === 'string') {
        finalResponse = content
      } else if (Array.isArray(content)) {
        finalResponse = content.map((c: any) => c.text || c).join('')
      } else {
        finalResponse = String(content)
      }
      break
    }
  }

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
  const { data: clone, error } = await supabase
    .from('agent_memory')
    .select('system_prompt, reddit_username')
    .eq('id', cloneId)
    .single()

  if (error || !clone) {
    throw new Error(`Agent ${cloneId} not found`)
  }

  const llm = createDeepSeekLLM()

  const messages = [
    new SystemMessage(clone.system_prompt),
    new HumanMessage(userMessage),
  ]

  const response = await llm.invoke(messages)

  // Extract content from response
  const content = response.content
  if (typeof content === 'string') {
    return content
  } else if (Array.isArray(content)) {
    return content.map((c: any) => c.text || c).join('')
  }
  return String(content)
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
  const promises = cloneIds.map((cloneId) =>
    callClone(cloneId, threadId, userMessage, checkpointer)
      .then((content) => ({ clone_id: cloneId, content }))
      .catch((error) => {
        console.error(`Clone ${cloneId} error:`, error)
        return { clone_id: cloneId, content: '[Failed to respond]' }
      })
  )

  return Promise.all(promises)
}
