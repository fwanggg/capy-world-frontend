'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ReasoningStep } from '@/types/chat'

interface AnalysisProcessingStateProps {
  readonly currentStep?: number
  readonly progress?: number
  readonly estimatedSeconds?: number
  readonly reasoningSteps?: readonly ReasoningStep[]
}

/* Stitch design tokens from Capysan Analysis - Focused Processing State (projects/6878601031183939918) */
const PRIMARY = '#00f5d4' // primary_container - Electric Teal
const PRIMARY_GLOW = 'rgba(0, 245, 212, 0.4)'
const PRIMARY_DIM = '#00dfc1' // primary_fixed_dim - gradient start
const SURFACE_LOWEST = '#0b0e14' // surface_container_lowest
const SURFACE = '#10131a' // surface
const ON_SURFACE = '#e1e2eb' // on_surface
const SECONDARY = '#94d3c3' // secondary - muted labels
const OUTLINE_VARIANT = '#3a4a46' // outline_variant - ghost borders
const SURFACE_CONTAINER = '#1d2026' // surface_container - muted track

const PIPELINE_STEPS = [
  { id: 1, title: 'Text Extraction', desc: 'Raw telemetry and user interview logs ingested.', toolHint: 'analyze' },
  { id: 2, title: 'Persona Synthesis', desc: 'Clustering behavioral patterns into 5 core archetypes.', toolHint: 'search' },
  { id: 3, title: 'Simulation Run', desc: 'Virtual stressors applied to predict churn risk.', toolHint: 'call' },
]

/** Max pipeline step (1–3) reached so far — never decreases, so progress only goes up */
function maxPipelineStepReached(steps: readonly ReasoningStep[]): number {
  if (steps.length === 0) return 0
  let max = 0
  for (const s of steps) {
    const p = stepToPipelineStep(s)
    if (p > max) max = p
  }
  return Math.min(max, 3)
}

/** Map a reasoning step to pipeline step 1, 2, or 3 based on tool */
function stepToPipelineStep(step: ReasoningStep): number {
  const tool = (step.toolName || '').toLowerCase()
  if (tool.includes('analyze') || tool.includes('landing')) return 1
  if (tool.includes('search') || tool.includes('clone') || tool.includes('recruit')) return 2
  if (tool.includes('call') || tool.includes('message')) return 3
  return 2
}

/** Deduplicate steps by iteration + summary to avoid repeated progress events */
function deduplicateSteps(steps: readonly ReasoningStep[]): ReasoningStep[] {
  const seen = new Set<string>()
  return steps.filter((s) => {
    const key = `${s.iteration}:${s.summary || s.action}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Get events for a pipeline step, deduplicated */
function getStepsForPipeline(
  allSteps: readonly ReasoningStep[],
  pipelineStepId: number
): ReasoningStep[] {
  const filtered = allSteps.filter((s) => stepToPipelineStep(s) === pipelineStepId)
  return deduplicateSteps(filtered)
}

/** Progress % from reasoning steps: ~33% per major step, cap at 95% until complete. Uses max step so progress never reverts. */
function progressFromSteps(steps: readonly ReasoningStep[]): number {
  if (steps.length === 0) return 5
  const maxStep = maxPipelineStepReached(steps)
  const base = (maxStep / 3) * 75
  const fine = Math.min(steps.length * 3, 20)
  return Math.min(base + fine, 95)
}

export function AnalysisProcessingState({
  currentStep: propStep,
  progress: propProgress,
  estimatedSeconds = 12,
  reasoningSteps = [],
}: Readonly<AnalysisProcessingStateProps>) {
  const maxStep = maxPipelineStepReached(reasoningSteps)
  const currentStep = propStep ?? (maxStep === 0 ? 1 : maxStep)
  const progress = propProgress ?? progressFromSteps(reasoningSteps)

  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center px-8"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 245, 212, 0.06) 0%, transparent 60%), ${SURFACE_LOWEST}`,
      }}
    >
      <div className="max-w-xl w-full text-center">
        {/* Badge — Stitch: primary_container border, ambient glow (designMd: diffused shadow) */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            border: `1px solid ${PRIMARY}`,
            background: 'rgba(0, 245, 212, 0.08)',
            boxShadow: `0 0 12px ${PRIMARY_GLOW}`,
          }}
        >
          <span className="material-symbols-outlined animate-spin" style={{ color: PRIMARY, fontSize: 18 }}>sync</span>
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase tabular-nums font-label"
            style={{ color: PRIMARY }}
          >
            ENGINE RUNNING
          </span>
        </div>

        {/* Header — Stitch: Manrope headline, on_surface for hierarchy */}
        <h2 className="text-3xl md:text-4xl font-headline font-black mb-4" style={{ color: ON_SURFACE }}>
          Synthesizing Insights
        </h2>
        <p className="font-body leading-relaxed mb-10" style={{ color: SECONDARY }}>
          Our LLM engine is processing telemetry data to build your competitive advantage.
        </p>

        {/* Vertical stepper — line extends to center of current step (use currentStep/3 so teal reaches the circle) */}
        <div className="relative text-left mb-8">
          <div
            className="absolute left-4 top-0 bottom-0 w-px transition-all duration-700"
            style={{
              background: `linear-gradient(to bottom, ${PRIMARY} 0%, ${PRIMARY} ${Math.min(100, (currentStep / 3) * 100)}%, ${OUTLINE_VARIANT} ${Math.min(100, (currentStep / 3) * 100)}%, ${SURFACE_CONTAINER} 100%)`,
              boxShadow: currentStep > 1 ? `0 0 8px ${PRIMARY_GLOW}` : 'none',
            }}
          />

          {PIPELINE_STEPS.map((s) => {
            const isComplete = currentStep > s.id
            const isActive = currentStep === s.id
            const isPending = currentStep < s.id
            const stepsForThis = getStepsForPipeline(reasoningSteps, s.id)

            return (
              <div key={s.id} className="relative flex gap-6 py-6 first:pt-0">
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                  {isComplete ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: PRIMARY,
                        boxShadow: `0 0 20px ${PRIMARY_GLOW}, 0 0 40px rgba(0, 245, 212, 0.15)`,
                      }}
                    >
                      <span className="material-symbols-outlined text-lg" style={{ color: SURFACE_LOWEST, fontVariationSettings: "'wght' 700" }}>check</span>
                    </div>
                  ) : isActive ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 animate-pulse"
                      style={{ borderColor: PRIMARY, background: SURFACE_LOWEST }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: PRIMARY }} />
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: OUTLINE_VARIANT, opacity: 0.5 }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: SURFACE_CONTAINER }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em] font-label"
                    style={isPending ? { color: OUTLINE_VARIANT } : { color: PRIMARY }}
                  >
                    STEP {s.id}
                  </p>
                  <h4
                    className="text-base font-bold mt-0.5 font-headline"
                    style={isPending ? { color: OUTLINE_VARIANT } : { color: ON_SURFACE }}
                  >
                    {s.title}
                  </h4>
                  <p
                    className="text-sm mt-1 leading-relaxed font-body"
                    style={isPending ? { color: SURFACE_CONTAINER } : { color: SECONDARY }}
                  >
                    {s.desc}{isActive && stepsForThis.length === 0 ? '…' : ''}
                  </p>

                  {stepsForThis.length > 0 && (
                    <ul className="mt-4 space-y-2.5 pl-0 list-disc list-inside">
                      {stepsForThis.map((step, idx) => {
                        const text = step.summary || step.action || ''
                        return (
                          <li key={`${step.summary || step.action}-${idx}`} className="flex gap-3 items-start">
                            <div
                              className="text-sm font-body leading-snug markdown-content [&_strong]:font-semibold [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
                              style={{ color: ON_SURFACE }}
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {text}
                              </ReactMarkdown>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress bar — Stitch: Glass & Gradient (primary_fixed_dim → primary_container), ambient glow */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] font-label" style={{ color: PRIMARY }}>
            <span>OVERALL PROGRESS</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: SURFACE_CONTAINER }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${PRIMARY_DIM} 0%, ${PRIMARY} 60%, #5eead4 100%)`,
                boxShadow: `0 0 12px ${PRIMARY_GLOW}`,
              }}
            />
          </div>
          <p className="text-xs font-body" style={{ color: OUTLINE_VARIANT }}>
            Estimated completion: {estimatedSeconds} seconds
          </p>
        </div>
      </div>
    </div>
  )
}
