'use client'

import React from 'react'
import type { AnalysisResult } from '@/types/analysis'
import type { ChartSpec } from '@/types/chat'
import { AnalysisStatsCards } from '@/components/analysis/AnalysisStatsCards'
import { BlockerHitterCards } from '@/components/analysis/BlockerHitterCards'
import { MomsTestCard } from '@/components/analysis/MomsTestCard'
import { LandingPageOptimizationCard } from '@/components/analysis/LandingPageOptimizationCard'
import { PersonaSentimentCard } from '@/components/analysis/PersonaSentimentCard'

interface Props {
  result: AnalysisResult | null
  loading: boolean
  url: string
}

function findChart(charts: ChartSpec[], type: string): ChartSpec | undefined {
  return charts.find((c) => c.type === type)
}

// Stitch Final Results — Q1/Q2 only (Q3 optional)
const momTestPairs = [
  { q: 'When did you last have this problem?', key: 'q1' as const },
  { q: 'What else have you tried?', key: 'q2' as const },
  { q: 'Why do you need to solve this now?', key: 'q3' as const },
]

export default function AnalysisDashboard({ result, loading, url }: Props) {
  if (loading && !result) {
    return null
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

  const avgAgeRaw =
    result.cloneResponses.length > 0
      ? result.cloneResponses
          .filter((r) => r.demographics.age != null)
          .reduce((acc, r) => acc + (r.demographics.age ?? 0), 0) /
        Math.max(result.cloneResponses.filter((r) => r.demographics.age != null).length, 1)
      : 32
  const avgAge = Number.isInteger(avgAgeRaw) ? avgAgeRaw : Math.round(avgAgeRaw * 10) / 10
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

  const actionItems = result.actionItems.slice(0, 4)

  return (
    <div className="max-w-screen-2xl mx-auto px-8 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
          Capysan Insight Dashboard
        </h1>
        <p className="text-on-surface-variant max-w-2xl font-body">
          Deep-dive persona synthesis and behavioral blockers for{' '}
          {result.productTitle || new URL(url).hostname}.
        </p>
      </div>

      {/* Stitch: Demographics + Blocker/Hitter (Pipeline removed) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnalysisStatsCards
            avgAge={avgAge}
            genderSplit={genderSplit}
            topHub={topHub}
            yesPct={yesPct}
          />
        </div>
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <BlockerHitterCards
            mainBlocker={mainBlocker}
            mainBlockerDetail={mainBlockerDetail}
            mainHitter={mainHitter}
            mainHitterDetail={mainHitterDetail}
          />
        </div>
      </div>

      {/* Stitch: Mom's Test + Landing Page */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <MomsTestCard pairs={momTestPairs} cloneResponses={result.cloneResponses} />
        </div>
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <LandingPageOptimizationCard actionItems={actionItems} />
        </div>
      </div>

      <PersonaSentimentCard clones={result.cloneResponses} />
    </div>
  )
}
