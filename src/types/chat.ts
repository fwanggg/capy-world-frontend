export interface ReasoningStep {
  iteration: number
  action: string
  toolName?: string
  input?: any
  output?: any
  summary: string
}

export interface ChartDataPoint {
  name: string
  value?: number
  color?: string
  label?: string    // text badge for horizontal_bar (e.g. "YES")
  note?: string     // expandable tooltip/footnote
  [key: string]: unknown  // for grouped_bar series keys
}

export interface BarSeriesConfig {
  key: string
  color: string
}

export interface ChartSpec {
  type: 'pie' | 'grouped_bar' | 'horizontal_bar' | 'top_concerns' | 'top_benefits'
  title: string
  subtitle?: string
  data: ChartDataPoint[]
  // grouped_bar only:
  xKey?: string
  bars?: BarSeriesConfig[]
  // pie only:
  innerRadius?: number
}

export interface VisualizationPayload {
  title: string         // top-level card title e.g. "Landing Page Analysis — vercel.com"
  charts: ChartSpec[]
  generatedAt: string
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
  visualization?: VisualizationPayload
}

export interface ChatResponse {
  ai_responses: ChatMessageData[]
  user_message: ChatMessageData
  capybara_reasoning?: ReasoningStep[]
  session_transition?: {
    clone_ids: (number | string)[]
    clone_names: string[]
  }
  visualization?: VisualizationPayload
}

export type RespondingState =
  | null
  | { type: 'capybara'; reasoning: ReasoningStep[] }
  | { type: 'clones'; names: string[] }
