import type { VisualizationPayload, ReasoningStep } from './chat'

export interface CloneResponse {
  personaId: string
  anonymousId: string
  demographics: {
    age?: number
    gender?: string
    profession?: string
    location?: string
  }
  answers: {
    q1: string          // "Do you have this problem?"
    q2: string          // "How do you solve it today?"
    q3: string          // "How much would you pay?"
    vote: 'YES' | 'NO' | 'MAYBE'
    voteReason: string  // Q4 reasoning
  }
}

export interface ActionItem {
  action: string
  impact: 'High' | 'Medium' | 'Low'
  rationale: string
  /** Optional predicted conversion lift (e.g. 15.4 for +15.4%) — Stitch Final Results */
  predictedConvPercent?: number
}

export interface AnalysisResult {
  url: string
  productTitle: string
  problem: string
  solution: string
  icp: string                          // Ideal Customer Profile
  visualization: VisualizationPayload
  cloneResponses: CloneResponse[]
  actionItems: ActionItem[]
  reasoning: ReasoningStep[]
  summary: string                      // Full markdown from LLM
}

export interface AnalysisSSEEvent {
  type: 'progress' | 'relay' | 'complete' | 'error'
  step?: ReasoningStep
  messages?: { role: string; sender_id: string; content: string }[]
  result?: AnalysisResult
  error?: string
}
