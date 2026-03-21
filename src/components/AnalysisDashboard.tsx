'use client'

import React from 'react'
import type { AnalysisResult } from '@/types/analysis'
import { MOM_TEST_V2, MOM_TEST_QUESTIONS } from '@/data/momTestV2'
import { ParticipantsDemographicsCard } from '@/components/analysis/ParticipantsDemographicsCard'
import { HeatMapCard } from '@/components/analysis/HeatMapCard'
import { SignalStrengthCard } from '@/components/analysis/SignalStrengthCard'
import { MomsTestCard } from '@/components/analysis/MomsTestCard'
import { LandingPageOptimizationCard } from '@/components/analysis/LandingPageOptimizationCard'

interface Props {
  result: AnalysisResult | null
  loading: boolean
  url: string
}

/** Mom Test pairs — dynamic from config. Add questions in momTestV2.ts to extend. */
const momTestPairs = MOM_TEST_QUESTIONS.map(({ key }) => ({
  q: MOM_TEST_V2[key],
  key,
}))

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

      {/* Row 1: Participants (left) + Signal Strength (right) — full width, equal height */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {result.participantDemographics && (
          <div className="col-span-12 lg:col-span-6 min-h-[280px] flex">
            <ParticipantsDemographicsCard demographics={result.participantDemographics} className="h-full w-full" />
          </div>
        )}
        {result.heatMap && (
          <div className="col-span-12 lg:col-span-6 min-h-[280px] flex">
            <SignalStrengthCard status={result.heatMap.status} className="h-full w-full" />
          </div>
        )}
      </div>

      {/* Row 2: Friction Density — full width below */}
      {result.heatMap && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <HeatMapCard heatMap={result.heatMap} />
          </div>
        </div>
      )}

      {/* Mom's Test (all answers) + Landing Page */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <MomsTestCard
            pairs={momTestPairs}
            momsTest={result.momsTest}
            cloneResponses={result.cloneResponses}
          />
        </div>
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <LandingPageOptimizationCard actionItems={actionItems} />
        </div>
      </div>
    </div>
  )
}
