export interface ReasoningStep {
  iteration: number
  action: string
  toolName?: string
  input?: any
  output?: any
  summary: string
}

export interface ChatMessageData {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: number
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  reasoning?: ReasoningStep[]
  recipient?: string
}

export interface ChatResponse {
  ai_responses: ChatMessageData[]
  user_message: ChatMessageData
  capybara_reasoning?: ReasoningStep[]
  session_transition?: {
    clone_ids: (number | string)[]
    clone_names: string[]
  }
}

export type RespondingState =
  | null
  | { type: 'capybara'; reasoning: ReasoningStep[] }
  | { type: 'clones'; names: string[] }
