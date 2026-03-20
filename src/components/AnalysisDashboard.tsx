'use client'

import React from 'react'
import type { AnalysisResult } from '@/types/analysis'
import type { ChartSpec } from '@/types/chat'

interface Props {
  result: AnalysisResult | null
  loading: boolean
  url: string
}

function findChart(charts: ChartSpec[], type: string): ChartSpec | undefined {
  return charts.find((c) => c.type === type)
}

export default function AnalysisDashboard({ result, loading, url }: Props) {
  if (loading && !result) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col gap-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-10 bg-[#1d2026] rounded w-80" />
          <div className="h-4 bg-[#1d2026] rounded w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#1d2026] rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-4 h-64 bg-[#1d2026] rounded-xl" />
        </div>
        <div className="h-96 bg-[#1d2026] rounded-xl" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-center min-h-[40vh]">
        <p className="text-[#b9cac4]">No analysis available</p>
      </div>
    )
  }

  const charts = result.visualization.charts
  const topConcerns = findChart(charts, 'top_concerns')
  const topBenefits = findChart(charts, 'top_benefits')
  const pieChart = findChart(charts, 'pie')

  const mainBlocker = (topConcerns?.data?.[0] as { name?: string })?.name ?? result.problem
  const mainBlockerDetail = (topConcerns?.data?.[0] as { note?: string })?.note ?? 'Personas reported concerns'
  const mainHitter = (topBenefits?.data?.[0] as { name?: string })?.name ?? result.solution
  const mainHitterDetail = (topBenefits?.data?.[0] as { note?: string })?.note ?? 'Personas cited value'

  const voteBreakdown = pieChart?.data?.reduce(
    (acc, d) => {
      if (d.name === 'YES') acc.yes = d.value ?? 0
      if (d.name === 'NO') acc.no = d.value ?? 0
      if (d.name === 'MAYBE') acc.maybe = d.value ?? 0
      return acc
    },
    { yes: 0, no: 0, maybe: 0 }
  ) ?? { yes: 0, no: 0, maybe: 0 }
  const totalVotes = voteBreakdown.yes + voteBreakdown.no + voteBreakdown.maybe
  const yesPct = totalVotes > 0 ? Math.round((voteBreakdown.yes / totalVotes) * 100) : 0

  const avgAge =
    result.cloneResponses.length > 0
      ? Math.round(
          result.cloneResponses
            .filter((r) => r.demographics.age != null)
            .reduce((acc, r) => acc + (r.demographics.age ?? 0), 0) /
            Math.max(result.cloneResponses.filter((r) => r.demographics.age != null).length, 1)
        )
      : 0
  const femaleCount = result.cloneResponses.filter(
    (r) => r.demographics.gender?.toLowerCase() === 'female' || r.demographics.gender === 'f'
  ).length
  const maleCount = result.cloneResponses.filter(
    (r) => r.demographics.gender?.toLowerCase() === 'male' || r.demographics.gender === 'm'
  ).length
  const genderSplit =
    femaleCount + maleCount > 0 ? `${femaleCount}/${maleCount}` : '—'
  const locationCounts = result.cloneResponses.reduce<Record<string, number>>((acc, r) => {
    const loc = r.demographics.location?.split(',')[0]?.trim() ?? 'Unknown'
    acc[loc] = (acc[loc] ?? 0) + 1
    return acc
  }, {})
  const topHub =
    Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    result.cloneResponses[0]?.demographics.location ??
    '—'

  const pipelineSteps = [
    { label: 'Step 1', title: 'Text Extraction', desc: 'Landing page content and structure extracted.' },
    { label: 'Step 2', title: 'Persona Synthesis', desc: 'Clustering behavioral patterns into core archetypes.' },
    { label: 'Step 3', title: 'Mom Test Run', desc: 'Virtual personas run through Mom\'s Test questions.' },
  ]

  const momTestPairs = [
    { q: 'When did you last have this problem?', key: 'q1' as const },
    { q: 'What else have you tried?', key: 'q2' as const },
    { q: 'How much would you pay for a solution?', key: 'q3' as const },
  ]

  const actionItems = result.actionItems.slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#e1e2eb] tracking-tight">
          Capysan Insight Dashboard
        </h1>
        <p className="text-[#b9cac4] max-w-2xl text-sm">
          Deep-dive persona synthesis and behavioral blockers for {result.productTitle || new URL(url).hostname}.
        </p>
      </div>

      {/* Bento Grid: Demographics & Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-[#1d2026] rounded-xl flex flex-col justify-between border border-[#2a3a36]/30">
            <div>
              <span className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-[0.2em] mb-1 block">
                Avg Age
              </span>
              <div className="text-3xl font-black text-[#00f5d4]">{avgAge || '—'}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 w-full bg-[#32353c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00f5d4]"
                  style={{ width: `${yesPct}%` }}
                />
              </div>
              <span className="text-[10px] text-[#b9cac4] whitespace-nowrap">{yesPct}% YES</span>
            </div>
          </div>
          <div className="p-6 bg-[#1d2026] rounded-xl flex flex-col justify-between border border-[#2a3a36]/30">
            <div>
              <span className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-[0.2em] mb-1 block">
                Gender Split
              </span>
              <div className="text-3xl font-black text-[#94d3c3]">{genderSplit}</div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] text-[#b9cac4]">F / M Segment</span>
            </div>
          </div>
          <div className="p-6 bg-[#1d2026] rounded-xl flex flex-col justify-between border border-[#2a3a36]/30">
            <div>
              <span className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-[0.2em] mb-1 block">
                Top Hub
              </span>
              <div className="text-2xl font-black text-[#e1e2eb]">{topHub}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00f5d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              <span className="text-[10px] text-[#b9cac4]">{result.cloneResponses.length} personas</span>
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-6 bg-[#191c22] rounded-xl border border-[#2a3a36]/30">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#ffb4ab]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#b9cac4]">Main Blocker</h3>
              </div>
              <div className="text-xl font-bold text-[#e1e2eb] mb-2">{mainBlocker}</div>
              <p className="text-sm text-[#b9cac4]">{mainBlockerDetail}</p>
            </div>
            <div className="p-6 bg-[#191c22] rounded-xl border border-[#2a3a36]/30">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#00f5d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#b9cac4]">Main Hitter</h3>
              </div>
              <div className="text-xl font-bold text-[#e1e2eb] mb-2">{mainHitter}</div>
              <p className="text-sm text-[#b9cac4]">{mainHitterDetail}</p>
            </div>
          </div>
        </div>
        {/* Analysis Engine Pipeline */}
        <div className="lg:col-span-4 p-8 bg-[#1d2026] rounded-xl border border-[#2a3a36]/40">
          <h3 className="text-lg font-extrabold mb-8 text-[#00f5d4]">Analysis Engine Pipeline</h3>
          <div className="flex flex-col gap-0">
            {pipelineSteps.map((step, i) => (
              <div
                key={step.label}
                className={`flex gap-4 pb-8 border-l-2 relative pl-6 ${
                  i < pipelineSteps.length - 1 ? 'border-[#00f5d4]/40' : 'border-[#00f5d4]'
                }`}
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#00f5d4]" />
                <div>
                  <p className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-widest">
                    {step.label}
                  </p>
                  <h4 className="text-sm font-bold text-[#e1e2eb]">{step.title}</h4>
                  <p className="text-xs text-[#b9cac4] mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mom's Test & Landing Page Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#272a31] p-8 rounded-xl relative overflow-hidden h-full border border-[#2a3a36]/30">
            <h3 className="text-xl font-black mb-6 text-[#e1e2eb]">
              Mom&apos;s Test: Persona Responses
            </h3>
            <div className="space-y-6">
              {momTestPairs.map((pair) => {
                const sample = result.cloneResponses[0]
                const answer = sample?.answers[pair.key] ?? '—'
                return (
                  <div key={pair.key} className="space-y-2">
                    <div className="p-3 bg-[#191c22] rounded-lg inline-block border-l-2 border-[#00f5d4]">
                      <p className="text-xs italic text-[#b9cac4]">&quot;{pair.q}&quot;</p>
                    </div>
                    <div className="flex gap-3 items-start pl-4">
                      <div className="w-6 h-6 rounded-full bg-[#0b5347] flex-shrink-0 mt-1" />
                      <p className="text-sm font-medium text-[#e1e2eb]">&quot;{answer}&quot;</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#e1e2eb]">Landing Page Optimization</h3>
            <span className="text-xs font-bold text-[#00f5d4] uppercase tracking-widest">
              {actionItems.length} High-Impact Recs
            </span>
          </div>
          <div className="space-y-4">
            {actionItems.map((item, i) => (
              <div
                key={i}
                className="group bg-[#1d2026] p-6 rounded-xl border border-[#2a3a36]/30 hover:border-[#00f5d4]/30 transition-colors flex justify-between items-center"
              >
                <div className="flex gap-6 items-center">
                  <div className="w-12 h-12 bg-[#32353c] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#00f5d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#e1e2eb]">{item.action}</h4>
                    <p className="text-xs text-[#b9cac4] mt-1 max-w-sm">{item.rationale}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#00f5d4] font-black text-lg">{item.impact}</div>
                  <div className="text-[10px] text-[#b9cac4] uppercase font-bold">Impact</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Persona Sentiment Logic */}
      <div className="p-8 bg-[#0b0e14] rounded-xl border border-[#2a3a36]/40">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-[#e1e2eb]">Persona Sentiment Logic</h3>
            <p className="text-xs text-[#b9cac4] mt-1">
              Cross-referenced reasoning grouped by segment.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-[#0b5347]/50 text-[#86c4b5] text-[10px] font-bold rounded-full uppercase">
              {voteBreakdown.yes} YES
            </span>
            <span className="px-3 py-1 bg-[#00f5d4]/10 text-[#00f5d4] text-[10px] font-bold rounded-full uppercase">
              {voteBreakdown.yes > totalVotes / 2 ? 'Strong Fit' : 'Mixed'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {result.cloneResponses.slice(0, 2).map((clone, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-widest">
                  Archetype
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#32353c] flex items-center justify-center text-[#00f5d4] font-bold text-sm">
                    {clone.anonymousId?.slice(0, 2) ?? '—'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#e1e2eb]">
                      {clone.demographics.profession ?? 'Persona'}
                    </p>
                    <p className="text-[10px] text-[#b9cac4]">
                      {clone.demographics.location ?? 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-widest">
                  Main Sentiment
                </h4>
                <div
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    clone.answers.vote === 'YES'
                      ? 'bg-[#272a31] text-[#00f5d4]'
                      : clone.answers.vote === 'NO'
                        ? 'bg-[#272a31] text-[#ffb4ab]'
                        : 'bg-[#272a31] text-[#00f5d4]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      clone.answers.vote === 'YES'
                        ? 'bg-[#00f5d4]'
                        : clone.answers.vote === 'NO'
                          ? 'bg-[#ffb4ab]'
                          : 'bg-[#00f5d4]'
                    }`}
                  />
                  {clone.answers.vote === 'YES'
                    ? 'Positive'
                    : clone.answers.vote === 'NO'
                      ? 'Cautionary'
                      : 'Mixed'}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:col-span-2">
                <h4 className="text-[10px] font-bold text-[#b9cac4] uppercase tracking-widest">
                  Reasoning Logic
                </h4>
                <p className="text-sm text-[#b9cac4] leading-relaxed">
                  {clone.answers.voteReason}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
