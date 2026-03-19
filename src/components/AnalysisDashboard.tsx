'use client'

import React, { useState } from 'react'
import type { AnalysisResult } from '@/types/analysis'
import { VisualizationCard } from './VisualizationCard'

interface Props {
  result: AnalysisResult | null
  loading: boolean
  url: string
}

export default function AnalysisDashboard({ result, loading, url }: Props) {
  const [expandedSection, setExpandedSection] = useState<'q1' | 'q2' | 'q3' | 'q4' | null>(null)

  const questions = [
    {
      id: 'q1',
      title: 'Q1: Do they have this problem?',
      description: 'Understand if personas actually experience the pain point',
    },
    {
      id: 'q2',
      title: 'Q2: How do they solve it today?',
      description: 'Learn about current alternatives and workarounds',
    },
    {
      id: 'q3',
      title: 'Q3: Willingness to pay',
      description: 'Gauge monetization potential',
    },
    {
      id: 'q4',
      title: 'Q4: Would you use this?',
      description: 'Final verdict and reasoning',
    },
  ]

  if (loading && !result) {
    return (
      <div className="flex-1 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-slate-700 rounded w-64" />
          <div className="h-4 bg-slate-700 rounded w-40" />
        </div>

        {/* Cards skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-700 rounded-lg" />
        ))}

        {/* Visualization skeleton */}
        <div className="h-96 bg-slate-700 rounded-lg" />

        {/* Q&A skeleton */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-700 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400">No analysis available</p>
      </div>
    )
  }

  const voteBreakdown = result.visualization.charts
    .find(c => c.type === 'pie')
    ?.data.reduce((acc, d) => {
      if (d.name === 'YES') acc.yes = d.value || 0
      if (d.name === 'NO') acc.no = d.value || 0
      if (d.name === 'MAYBE') acc.maybe = d.value || 0
      return acc
    }, { yes: 0, no: 0, maybe: 0 }) || { yes: 0, no: 0, maybe: 0 }

  const totalVotes = voteBreakdown.yes + voteBreakdown.no + voteBreakdown.maybe

  return (
    <div className="flex-1 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-700/50 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
              {result.productTitle}
            </h1>
            <p className="text-sm text-slate-500">
              {new URL(url).hostname}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span className="text-xs font-semibold text-slate-300">
                10 personas analyzed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Analysis Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm hover:border-teal-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-3 bg-teal-500 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Problem</p>
          </div>
          <p className="text-slate-200 leading-relaxed text-sm">{result.problem}</p>
        </div>
        <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm hover:border-teal-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-3 bg-teal-500 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Solution</p>
          </div>
          <p className="text-slate-200 leading-relaxed text-sm">{result.solution}</p>
        </div>
        <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm hover:border-teal-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-3 bg-teal-500 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Customer</p>
          </div>
          <p className="text-slate-200 leading-relaxed text-sm">{result.icp}</p>
        </div>
      </div>

      {/* Vote Summary */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-xl border border-slate-700/50 p-8 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-slate-100 mb-6">Vote Summary</h2>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <p className="text-5xl font-bold bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent mb-2">
                {voteBreakdown.yes}
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-green-400 rounded-full mb-2" />
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">YES ({Math.round((voteBreakdown.yes / totalVotes) * 100)}%)</p>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <p className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent mb-2">
                {voteBreakdown.no}
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-red-400 rounded-full mb-2" />
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">NO ({Math.round((voteBreakdown.no / totalVotes) * 100)}%)</p>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <p className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent mb-2">
                {voteBreakdown.maybe}
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full mb-2" />
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">MAYBE ({Math.round((voteBreakdown.maybe / totalVotes) * 100)}%)</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
          <p className="text-slate-300 text-sm leading-relaxed">
            {voteBreakdown.yes > totalVotes / 2
              ? '✓ Strong product-market fit signals. Most personas see clear value.'
              : voteBreakdown.yes >= totalVotes / 3
                ? '◐ Mixed feedback. Strong core appeal but address concerns.'
                : '✗ Weak fit signals. Reconsider positioning or problem-solution match.'}
          </p>
        </div>
      </div>

      {/* Visualization */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-6">Detailed Analysis</h2>
        <VisualizationCard payload={result.visualization} />
      </div>

      {/* Q&A Accordions */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-4 bg-gradient-to-b from-teal-500 to-teal-600 rounded" />
          <h2 className="text-xl font-bold text-slate-100">Mom Test Q&A</h2>
        </div>
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() =>
                  setExpandedSection(expandedSection === q.id ? null : (q.id as any))
                }
                className="w-full p-5 text-left hover:border-teal-600/30 hover:bg-gradient-to-r hover:from-slate-800/70 hover:to-slate-800/50 transition-all flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-100 text-sm">{q.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{q.description}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className={`text-teal-400 text-lg font-light transition-transform duration-300 ${
                    expandedSection === q.id ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </div>
              </button>

              {expandedSection === q.id && (
                <div className="border-t border-slate-700/50 bg-slate-900/20">
                  <div className="p-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-slate-400 border-b border-slate-700/50">
                          <th className="text-left py-3 px-3 font-semibold">Persona</th>
                          <th className="text-left py-3 px-3 font-semibold">Demographics</th>
                          <th className="text-left py-3 px-3 font-semibold">Answer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {result.cloneResponses.map((clone, i) => (
                          <tr key={i} className="hover:bg-slate-700/10 transition-colors">
                            <td className="py-3 px-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                              {clone.anonymousId}
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-xs">
                              <span className="inline-block">
                                {clone.demographics.profession && <span>{clone.demographics.profession}</span>}
                                {clone.demographics.profession && clone.demographics.location && <span>, </span>}
                                {clone.demographics.location && <span>{clone.demographics.location}</span>}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              <p className="text-xs leading-relaxed">
                                {q.id === 'q1' && clone.answers.q1}
                                {q.id === 'q2' && clone.answers.q2}
                                {q.id === 'q3' && clone.answers.q3}
                                {q.id === 'q4' && (
                                  <>
                                    <span className="font-semibold text-teal-400 mr-1">
                                      {clone.answers.vote}
                                    </span>
                                    <span className="text-slate-400">— {clone.answers.voteReason}</span>
                                  </>
                                )}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
