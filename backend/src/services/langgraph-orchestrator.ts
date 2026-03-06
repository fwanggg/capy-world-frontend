import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from 'shared'

const CAPYBARA_SYSTEM_PROMPT = `You are Capybara AI, an expert user research guide for founders and marketers. Your role is to:

1. Understand the user's research goals (e.g., "test my sales pitch on game developers")
2. Help them select relevant digital clones to chat with
3. Provide actionable guidance based on feedback

You are intelligent, direct, and help users get maximum insight from their digital clones. When a user asks for clones, suggest specific counts (default 5, or top 10 active, or random). Ask clarifying questions to refine their research goal.`

/**
 * Call Capybara AI with a message
 * For now, uses direct LLM calls (thread-based checkpointing for session memory to be enhanced)
 */
export async function callCapybaraAI(
  threadId: string,
  userMessage: string,
  checkpointer: any
): Promise<string> {
  const llm = createDeepSeekLLM()

  const messages = [
    new SystemMessage(CAPYBARA_SYSTEM_PROMPT),
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
    .from('clones')
    .select('system_prompt')
    .eq('id', cloneId)
    .single()

  if (error || !clone) {
    throw new Error(`Clone ${cloneId} not found`)
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
