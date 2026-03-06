import { StateGraph, START, END, MessagesState } from '@langchain/langgraph'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from 'shared'

const CAPYBARA_SYSTEM_PROMPT = `You are Capybara AI, an expert user research guide for founders and marketers. Your role is to:

1. Understand the user's research goals (e.g., "test my sales pitch on game developers")
2. Help them select relevant digital clones to chat with
3. Provide actionable guidance based on feedback

You are intelligent, direct, and help users get maximum insight from their digital clones. When a user asks for clones, suggest specific counts (default 5, or top 10 active, or random). Ask clarifying questions to refine their research goal.`

/**
 * Create the Capybara AI graph for orchestration
 */
export function createCapybaraGraph() {
  const llm = createDeepSeekLLM()

  const graph = new StateGraph<MessagesState>(MessagesState)

  // Define the Capybara AI node
  const capybaraNode = async (state: MessagesState) => {
    const messages = [
      { role: 'system', content: CAPYBARA_SYSTEM_PROMPT },
      ...state.messages,
    ]

    const response = await llm.invoke(state.messages)

    return {
      messages: [response],
    }
  }

  graph.addNode('capybara', capybaraNode)
  graph.addEdge(START, 'capybara')
  graph.addEdge('capybara', END)

  return graph.compile()
}

/**
 * Create a clone graph for a specific clone
 */
export async function createCloneGraph(cloneId: string) {
  const { data: clone, error } = await supabase
    .from('clones')
    .select('system_prompt')
    .eq('id', cloneId)
    .single()

  if (error || !clone) {
    throw new Error(`Clone ${cloneId} not found`)
  }

  const llm = createDeepSeekLLM()

  const graph = new StateGraph<MessagesState>(MessagesState)

  const cloneNode = async (state: MessagesState) => {
    const response = await llm.invoke([
      { role: 'system', content: clone.system_prompt },
      ...state.messages,
    ])

    return {
      messages: [response],
    }
  }

  graph.addNode('clone', cloneNode)
  graph.addEdge(START, 'clone')
  graph.addEdge('clone', END)

  return graph.compile()
}

/**
 * Call Capybara AI with a message
 * Uses thread-based checkpointing for session memory
 */
export async function callCapybaraAI(
  threadId: string,
  userMessage: string,
  checkpointer: any
) {
  const graph = createCapybaraGraph()

  const response = await graph.invoke(
    { messages: [new HumanMessage(userMessage)] },
    { configurable: { thread_id: threadId }, checkpoint_config: { checkpointer } }
  )

  return response.messages[response.messages.length - 1].content
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
) {
  const graph = await createCloneGraph(cloneId)

  const response = await graph.invoke(
    { messages: [new HumanMessage(userMessage)] },
    { configurable: { thread_id: threadId }, checkpoint_config: { checkpointer } }
  )

  return response.messages[response.messages.length - 1].content
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
