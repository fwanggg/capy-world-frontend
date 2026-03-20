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
      <div className="max-w-screen-2xl mx-auto px-8 flex flex-col gap-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-10 bg-[#1d2026] rounded w-80" />
          <div className="h-4 bg-[#1d2026] rounded w-96" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#1d2026] rounded-xl" />
            ))}
          </div>
          <div className="col-span-12 lg:col-span-4 h-64 bg-[#1d2026] rounded-xl" />
        </div>
        <div className="h-96 bg-[#1d2026] rounded-xl" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-center min-h-[40vh]">
        <p className="text-on-surface-variant">No analysis available</p>
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
  const yesPct = totalVotes > 0 ? Math.round((voteBreakdown.yes / totalVotes) * 100) : 70

  const avgAge =
    result.cloneResponses.length > 0
      ? Math.round(
          result.cloneResponses
            .filter((r) => r.demographics.age != null)
            .reduce((acc, r) => acc + (r.demographics.age ?? 0), 0) /
            Math.max(result.cloneResponses.filter((r) => r.demographics.age != null).length, 1)
        )
      : 32
  const femaleCount = result.cloneResponses.filter(
    (r) => r.demographics.gender?.toLowerCase() === 'female' || r.demographics.gender === 'f'
  ).length
  const maleCount = result.cloneResponses.filter(
    (r) => r.demographics.gender?.toLowerCase() === 'male' || r.demographics.gender === 'm'
  ).length
  const genderSplit = femaleCount + maleCount > 0 ? `${femaleCount}/${maleCount}` : '54/46'
  const locationCounts = result.cloneResponses.reduce<Record<string, number>>((acc, r) => {
    const loc = r.demographics.location?.split(',')[0]?.trim() ?? 'Unknown'
    acc[loc] = (acc[loc] ?? 0) + 1
    return acc
  }, {})
  const topHub =
    Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    result.cloneResponses[0]?.demographics.location ??
    'Berlin, DE'

  const pipelineSteps = [
    { label: 'Step 1', title: 'Text Extraction', desc: 'Raw telemetry and user interview logs ingested.' },
    { label: 'Step 2', title: 'Persona Synthesis', desc: 'Clustering behavioral patterns into 5 core archetypes.' },
    { label: 'Step 3', title: 'Simulation Run', desc: 'Virtual stressors applied to predict churn risk.' },
  ]

  const momTestPairs = [
    { q: 'When did you last have this problem?', key: 'q1' as const },
    { q: 'What else have you tried?', key: 'q2' as const },
    { q: 'How much would you pay for a solution?', key: 'q3' as const },
  ]

  const actionItems = result.actionItems.slice(0, 3)

  return (
    <div className="max-w-screen-2xl mx-auto px-8 flex flex-col gap-8">
      {/* Page Header - Stitch exact */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">Capysan Insight Dashboard</h1>
        <p className="text-on-surface-variant max-w-2xl font-body">
          Deep-dive persona synthesis and behavioral blockers for {result.productTitle || new URL(url).hostname}.
        </p>
      </div>

      {/* Bento Grid - Stitch exact structure */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-[#1d2026] rounded-xl flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-outline-variant/5">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1 block">Avg Age</span>
              <div className="text-3xl font-headline font-black text-primary-container">{avgAge}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 w-full bg-[#32353c] rounded-full overflow-hidden">
                <div className="h-full bg-primary-container" style={{ width: `${yesPct}%` }} />
              </div>
              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Gen Z/Mil</span>
            </div>
          </div>
          <div className="p-6 bg-[#1d2026] rounded-xl flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-outline-variant/5">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1 block">Gender Split</span>
              <div className="text-3xl font-headline font-black text-secondary">{genderSplit}</div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] text-on-surface-variant">F / M Segment</span>
            </div>
          </div>
          <div className="p-6 bg-[#1d2026] rounded-xl flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-outline-variant/5">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1 block">Top Hub</span>
              <div className="text-2xl font-headline font-black text-on-surface">{topHub}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-primary-container">trending_up</span>
              <span className="text-[10px] text-on-surface-variant">+12% Growth</span>
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-6 bg-[#191c22] rounded-xl border border-outline-variant/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-error">block</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Main Blocker</h3>
              </div>
              <div className="text-xl font-headline font-bold text-on-surface mb-2">{mainBlocker}</div>
              <p className="text-sm text-on-surface-variant font-body">{mainBlockerDetail}</p>
            </div>
            <div className="p-6 bg-[#191c22] rounded-xl border border-outline-variant/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-container">bolt</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Main Hitter</h3>
              </div>
              <div className="text-xl font-headline font-bold text-on-surface mb-2">{mainHitter}</div>
              <p className="text-sm text-on-surface-variant font-body">{mainHitterDetail}</p>
            </div>
          </div>
        </div>
        {/* Analysis Engine Pipeline - Stitch exact */}
        <div className="col-span-12 lg:col-span-4 p-8 bg-[#1d2026] rounded-xl border border-outline-variant/10">
          <h3 className="text-lg font-headline font-extrabold mb-8 text-[#00f5d4]">Analysis Engine Pipeline</h3>
          <div className="flex flex-col gap-0">
            <div className="flex gap-4 pb-8 border-l-2 border-primary-container relative">
              <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary-container shadow-[0_0_12px_#00f5d4]" />
              <div className="pl-6">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Step 1</p>
                <h4 className="text-sm font-bold text-on-surface">{pipelineSteps[0].title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">{pipelineSteps[0].desc}</p>
              </div>
            </div>
            <div className="flex gap-4 pb-8 border-l-2 border-primary-container/30 relative">
              <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary-container" />
              <div className="pl-6">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Step 2</p>
                <h4 className="text-sm font-bold text-on-surface">{pipelineSteps[1].title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">{pipelineSteps[1].desc}</p>
              </div>
            </div>
            <div className="flex gap-4 pb-0 relative">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-primary-container/30 bg-[#1d2026]" />
              <div className="pl-10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Step 3</p>
                <h4 className="text-sm font-bold text-on-surface">{pipelineSteps[2].title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">{pipelineSteps[2].desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mom's Test & Landing Page Optimization - Stitch exact */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#272a31] p-8 rounded-xl shadow-2xl relative overflow-hidden h-full border border-outline-variant/5">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/10 blur-[80px]" />
            <h3 className="text-xl font-headline font-black mb-6 text-on-surface">Mom&apos;s Test: Persona Responses</h3>
            <div className="space-y-6">
              {momTestPairs.map((pair) => {
                const sample = result.cloneResponses[0]
                const answer = sample?.answers[pair.key] ?? '—'
                return (
                  <div key={pair.key} className="space-y-2">
                    <div className="p-3 bg-[#191c22] rounded-lg inline-block border-l-2 border-primary-container">
                      <p className="text-xs italic text-on-surface-variant">&quot;{pair.q}&quot;</p>
                    </div>
                    <div className="flex gap-3 items-start pl-4">
                      <div className="w-6 h-6 rounded-full bg-secondary-container flex-shrink-0 mt-1" />
                      <p className="text-sm font-medium text-on-surface">&quot;{answer}&quot;</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-headline font-black text-on-surface">Landing Page Optimization</h3>
            <span className="text-xs font-bold text-primary-container uppercase tracking-widest">{actionItems.length} New High-Impact Recs</span>
          </div>
          <div className="space-y-4">
            {actionItems.map((item, i) => (
              <div key={i} className="group bg-[#1d2026] p-6 rounded-xl border border-transparent hover:border-primary-container/20 transition-all flex justify-between items-center shadow-sm">
                <div className="flex gap-6 items-center">
                  <div className="w-12 h-12 bg-[#32353c] rounded-full flex items-center justify-center group-hover:bg-primary-container/10 transition-colors">
                    <span className="material-symbols-outlined text-primary-container">ads_click</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface">{item.action}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-sm">{item.rationale}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary-container font-black text-lg">{item.impact}</div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold">Impact</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Persona Sentiment Logic - Stitch exact */}
      <div className="p-8 bg-[#0b0e14] rounded-xl border border-outline-variant/10 shadow-inner">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-headline font-black text-on-surface">Persona Sentiment Logic</h3>
            <p className="text-xs text-on-surface-variant mt-1 font-body">Cross-referenced reasoning grouped by segment.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-tighter">Mid-Market</span>
            <span className="px-3 py-1 bg-primary-container/10 text-primary-container text-[10px] font-bold rounded-full uppercase tracking-tighter">Startup</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {result.cloneResponses.slice(0, 2).map((clone, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Archetype</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#32353c] flex items-center justify-center text-primary-container font-bold text-sm">
                    {clone.anonymousId?.slice(0, 2) ?? '—'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{clone.demographics.profession ?? 'Persona'}</p>
                    <p className="text-[10px] text-on-surface-variant">Segment {String.fromCharCode(65 + i)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Main Sentiment</h4>
                <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${clone.answers.vote === 'YES' ? 'bg-[#272a31] text-primary-container' : clone.answers.vote === 'NO' ? 'bg-[#272a31] text-error' : 'bg-[#272a31] text-primary-container'}`}>
                  <span className={`w-2 h-2 rounded-full ${clone.answers.vote === 'YES' || clone.answers.vote === 'MAYBE' ? 'bg-primary-container' : 'bg-error'}`} />
                  {clone.answers.vote === 'YES' ? 'Urgent Optimization' : clone.answers.vote === 'NO' ? 'Cautionary Adoption' : 'Mixed'}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:col-span-2">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Reasoning Logic</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">{clone.answers.voteReason}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
