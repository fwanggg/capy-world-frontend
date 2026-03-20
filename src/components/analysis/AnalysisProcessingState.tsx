'use client'

import type { ReasoningStep } from '@/types/chat'

interface AnalysisProcessingStateProps {
  readonly currentStep?: number
  readonly progress?: number
  readonly estimatedSeconds?: number
  readonly reasoningSteps?: readonly ReasoningStep[]
}

const PIPELINE_STEPS = [
  { id: 1, title: 'Landing Page Analysis', desc: 'Extracting problem, solution, and ideal customer profile.', toolHint: 'analyze' },
  { id: 2, title: 'Persona Recruitment', desc: 'Recruiting AI personas with matching demographics (trial).', toolHint: 'search' },
  { id: 3, title: 'Interviewing AI Personas', desc: 'Gathering product feedback from recruited personas.', toolHint: 'call' },
]

function inferStepFromReasoning(steps: readonly ReasoningStep[]): number {
  if (steps.length === 0) return 0
  const last = steps[steps.length - 1]
  const tool = (last.toolName || '').toLowerCase()
  if (tool.includes('analyze') || tool.includes('landing')) return 1
  if (tool.includes('search') || tool.includes('clone')) return 2
  if (tool.includes('call') || tool.includes('message')) return 3
  return Math.min(steps.length, 3)
}

/** Progress % from reasoning steps: ~25% per major step, cap at 95% until complete */
function progressFromSteps(steps: readonly ReasoningStep[]): number {
  if (steps.length === 0) return 5
  const step = inferStepFromReasoning(steps)
  const base = (step / 3) * 75
  const fine = Math.min(steps.length * 3, 20)
  return Math.min(base + fine, 95)
}

/** Mockup art style: deep charcoal bg, teal accent, pure white titles, subtle gray labels */
export function AnalysisProcessingState({
  currentStep: propStep,
  progress: propProgress,
  estimatedSeconds = 12,
  reasoningSteps = [],
}: Readonly<AnalysisProcessingStateProps>) {
  const stepFromReasoning = inferStepFromReasoning(reasoningSteps)
  const currentStep = propStep ?? stepFromReasoning
  const progress = propProgress ?? progressFromSteps(reasoningSteps)
  const hasSteps = reasoningSteps.length > 0

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 bg-[#0B1117]">
      <div className="max-w-xl w-full text-center">
        {/* Badge — teal accent, subtle border */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 mb-8">
          <span className="material-symbols-outlined text-[#14B8A6] text-lg animate-pulse">sync</span>
          <span className="text-[10px] font-bold text-[#14B8A6] tracking-[0.2em] uppercase">
            Engine Running
          </span>
        </div>

        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-headline font-black text-white mb-4">
          Synthesizing Insights
        </h2>
        <p className="text-[#94a3b8] font-body leading-relaxed mb-8">
          Our LLM engine is processing telemetry data to build your competitive advantage.
        </p>

        {/* Live activity — streamed SSE reasoning steps, same stepper art style */}
        {hasSteps && (
          <div className="text-left mb-6 p-5 rounded-xl bg-[#0f172a]/80 border border-[#334155]/50 max-h-36 overflow-y-auto">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">
              Live activity
            </p>
            <ul className="space-y-2">
              {reasoningSteps.slice(-5).map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14B8A6]/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#14B8A6]">{s.iteration}</span>
                  </span>
                  <span className="text-sm text-[#cbd5e1] leading-snug">{s.summary || s.action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pipeline stepper — mockup style: teal checkmark, teal active dot, muted pending */}
        <div className="flex flex-col gap-0 text-left mb-6 bg-[#0B1117]">
          {PIPELINE_STEPS.map((s, i) => {
            const isComplete = currentStep > s.id
            const isActive = currentStep === s.id
            return (
              <div
                key={s.id}
                className={`flex gap-4 py-5 ${i < PIPELINE_STEPS.length - 1 ? 'border-b border-[#334155]/40' : ''}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                  {isComplete ? (
                    <span className="material-symbols-outlined text-[#14B8A6] text-xl" style={{ fontVariationSettings: "'wght' 600" }}>check</span>
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full transition-colors ${
                        isActive ? 'bg-[#14B8A6] animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-[#475569]'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.25em]">
                    Step {s.id}
                  </p>
                  <h4 className="text-base font-bold text-white mt-0.5">{s.title}</h4>
                  <p className={`text-sm mt-1 ${isActive ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress bar — teal fill, subtle track */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
            <span>Overall Progress</span>
            <span className="text-[#14B8A6] tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-[#334155]/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#14B8A6] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#64748b]">
            {hasSteps ? `${reasoningSteps.length} step${reasoningSteps.length === 1 ? '' : 's'} completed` : 'Starting...'}
          </p>
        </div>
      </div>
    </div>
  )
}
