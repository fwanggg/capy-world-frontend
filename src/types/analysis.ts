import type { VisualizationPayload, ReasoningStep } from './chat'

/** Mom Test v2 — participant JSON. answers.momTest keys match MOM_TEST_QUESTIONS. */
export interface CloneResponse {
  personaId: string
  anonymousId: string
  demographics: {
    age?: number
    gender?: string
    profession?: string
    location?: string
    interests?: string[]
  }
  answers: {
    /** Mom Test answers keyed by question (e.g. q1_validation, q2_alternatives) */
    momTest: Record<string, string | undefined>
    vote: 'YES' | 'NO' | 'MAYBE'
    voteReason: string
  }
}

/** Heat map: Mom Test analysis with per-axis scores, themes, and overall score. */
export interface HeatMap {
  /** Synthesized conclusion from the patterns */
  conclusion: string
  /** Status label (e.g. "High Resistance", "Mixed Signals") */
  status?: string
  /** Overall Mom Test score 0–10 across all axes */
  overallScore?: number
  /** Rationale for overall score */
  overallRationale?: string
  /** Each row = one Mom's Test question with themes and axis score */
  rows: Array<{
    question: string
    questionKey: string
    /** Full question text asked to participants */
    questionText?: string
    /** Per-axis score 0–10 (Gold signals = high, Red flags = low) */
    score?: number
    /** Summary with cited phrases — summary text + phrase → pIds map. Phrases must appear verbatim in summary. */
    rationaleWithCitations?: {
      summary: string
      cited_phrases: Record<string, string[]>
    }
    /** @deprecated Use rationaleWithCitations.summary */
    scoreRationale?: string
    /** @deprecated Use rationaleWithCitations.cited_phrases */
    evidenceCitations?: Array<{ phrase: string; pIds: string[] }>
    themes: Array<{ label: string; count: number }>
  }>
}

/** Participants who joined (personas-style demographics) */
export interface ParticipantDemographics {
  professions: Array<{ label: string; count: number }>
  ageGroups: Array<{ label: string; count: number }>
  demographics: Array<{ label: string; count: number }>
  interests: Array<{ label: string; count: number }>
}

export interface ActionItem {
  action: string
  impact: 'High' | 'Medium' | 'Low'
  rationale: string
  /** Optional predicted conversion lift (e.g. 15.4 for +15.4%) — Stitch Final Results */
  predictedConvPercent?: number
}

/** Mom's Test answers from consolidation — Record<questionKey, answers[]>. Dynamic per MOM_TEST_QUESTIONS. */
export interface MomsTestConsolidated {
  [questionKey: string]: Array<{ answer: string; anonymous_id?: string }> | undefined
}

export interface AnalysisResult {
  url: string
  productTitle: string
  problem: string
  solution: string
  icp: string
  visualization: VisualizationPayload
  cloneResponses: CloneResponse[]
  actionItems: ActionItem[]
  reasoning: ReasoningStep[]
  summary: string
  heatMap?: HeatMap
  participantDemographics?: ParticipantDemographics
  /** Mom's Test — all answers per question (from consolidation or derived from cloneResponses) */
  momsTest?: MomsTestConsolidated
}

export interface AnalysisSSEEvent {
  type: 'progress' | 'relay' | 'complete' | 'error'
  step?: ReasoningStep
  messages?: { role: string; sender_id: string; content: string }[]
  result?: AnalysisResult
  error?: string
}
