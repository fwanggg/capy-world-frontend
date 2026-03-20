'use client'

import type { ReasoningStep } from '@/types/chat'

interface AnalysisProcessingStateProps {
  readonly currentStep?: number
  readonly progress?: number
  readonly estimatedSeconds?: number
  readonly reasoningSteps?: readonly ReasoningStep[]
}

const PIPELINE_STEPS = [
  { id: 1, title: 'Text Extraction', desc: 'Raw telemetry and user interview logs ingested.', toolHint: 'analyze' },
  { id: 2, title: 'Persona Synthesis', desc: 'Clustering behavioral patterns into 5 core archetypes...', toolHint: 'search' },
  { id: 3, title: 'Simulation Run', desc: 'Virtual stressors applied to predict churn risk.', toolHint: 'call' },
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

export function AnalysisProcessingState({
  currentStep: propStep,
  progress: propProgress,
  estimatedSeconds = 12,
  reasoningSteps = [],
}: Readonly<AnalysisProcessingStateProps>) {
  const stepFromReasoning = inferStepFromReasoning(reasoningSteps)
  const currentStep = propStep ?? stepFromReasoning
  const progress = propProgress ?? (currentStep / 3) * 100

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-8">
      <div className="max-w-xl w-full text-center">
        {/* Badge - Stitch: sync Engine Running */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-container/20 bg-primary-container/5 mb-8">
          <span className="material-symbols-outlined text-primary-container text-lg animate-pulse">sync</span>
          <span className="text-[10px] font-bold text-primary-container tracking-[0.2em] uppercase">
            Engine Running
          </span>
        </div>

        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-headline font-black text-on-surface mb-4">
          Synthesizing Insights
        </h2>
        <p className="text-on-surface-variant font-body leading-relaxed mb-12">
          Our LLM engine is processing telemetry data to build your competitive advantage.
        </p>

        {/* Pipeline steps */}
        <div className="flex flex-col gap-0 text-left mb-4">
          {PIPELINE_STEPS.map((s, i) => {
            const isComplete = currentStep > s.id
            const isActive = currentStep === s.id
            return (
              <div
                key={s.id}
                className={`flex gap-4 py-4 ${i < PIPELINE_STEPS.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                  {isComplete ? (
                    <span className="material-symbols-outlined text-primary-container text-xl">check</span>
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary-container animate-pulse' : 'bg-surface-variant'}`}
                    />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Step {s.id}
                  </p>
                  <h4 className="text-sm font-bold text-on-surface">{s.title}</h4>
                  <p className={`text-xs mt-1 ${isActive ? 'text-on-surface-variant' : 'text-on-surface-variant/70'}`}>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Overall Progress</span>
            <span className="text-primary-container tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant">
            Estimated completion: {estimatedSeconds} seconds
          </p>
        </div>
      </div>
    </div>
  )
}
