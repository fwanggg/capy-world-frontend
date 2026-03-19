'use client'

import React from 'react'
import type { ReasoningStep } from '@/types/chat'

interface Props {
  steps: ReasoningStep[]
  loading: boolean
}

const TOOL_LABELS: Record<string, string> = {
  analyze_landing_page: 'Analyzing landing page',
  search_clones: 'Searching personas',
  create_conversation_session: 'Setting up panel',
  send_message: 'Running Mom Test',
}

export default function ReasoningTimeline({ steps, loading }: Props) {
  const maxSteps = 4

  return (
    <div className="sticky top-4 w-72 h-fit">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 bg-gradient-to-b from-teal-500 to-teal-600 rounded" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Analysis Progress
          </h3>
        </div>
        <p className="text-xs text-slate-500 ml-3">Step-by-step execution</p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {/* Skeleton state when loading with no steps */}
        {loading && steps.length === 0 && (
          <>
            {[...Array(maxSteps)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-700/40 flex-shrink-0 animate-pulse" />
                  {i < maxSteps - 1 && <div className="w-0.5 h-8 bg-slate-700/20 my-1" />}
                </div>
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-3 bg-slate-700/40 rounded w-24 animate-pulse" />
                  <div className="h-2 bg-slate-700/20 rounded w-20 animate-pulse" />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Populated steps */}
        {steps.map((step, i) => {
          const toolLabel = step.toolName ? TOOL_LABELS[step.toolName] || step.toolName : step.action
          const isLast = i === steps.length - 1
          const isActive = i === steps.length - 1 && loading
          const isCompleted = i < steps.length - 1 || !loading

          return (
            <div key={`${step.iteration}-${i}`} className="flex gap-4 items-start">
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 ring-2 ring-teal-400/50 shadow-lg shadow-teal-500/20 animate-pulse'
                      : isCompleted
                        ? 'bg-gradient-to-br from-teal-600 to-teal-700'
                        : 'bg-slate-700/50'
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    isCompleted ? 'text-teal-100' : 'text-slate-400'
                  }`}>
                    {step.iteration}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className={`w-0.5 h-8 my-1 transition-colors ${
                    i < steps.length - 1 ? 'bg-slate-600/40' : 'bg-slate-700/20'
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 mt-0.5">
                <p className={`text-sm font-semibold transition-colors ${
                  isCompleted ? 'text-slate-100' : 'text-slate-400'
                }`}>
                  {toolLabel}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {step.summary}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion indicator */}
      {!loading && steps.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-400" />
            <p className="text-xs font-semibold text-teal-400">
              Analysis complete
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
