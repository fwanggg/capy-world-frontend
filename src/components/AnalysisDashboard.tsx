'use client'

import React from 'react'
import type { AnalysisResult } from '@/types/analysis'
import { MOM_TEST_V2, MOM_TEST_QUESTIONS } from '@/data/momTestV2'
import { ParticipantsDemographicsCard } from '@/components/analysis/ParticipantsDemographicsCard'
import { HeatMapCard } from '@/components/analysis/HeatMapCard'
import { SignalStrengthCard } from '@/components/analysis/SignalStrengthCard'
import { MomsTestCard } from '@/components/analysis/MomsTestCard'

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

      {/* Problem, Solution, ICP — context for Mom Test questions */}
      {(result.problem || result.solution || result.icp) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.problem && (
            <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest">Problem</p>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-container hover:underline">
                  View landing page →
                </a>
              </div>
              <p className="text-sm text-on-surface font-body">{result.problem}</p>
            </div>
          )}
          {result.solution && (
            <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
              <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest mb-1">Solution</p>
              <p className="text-sm text-on-surface font-body">{result.solution}</p>
            </div>
          )}
          {result.icp && (
            <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
              <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest mb-1">Target Customer</p>
              <p className="text-sm text-on-surface font-body">{result.icp}</p>
            </div>
          )}
        </div>
      )}

      {/* Row 1: Participants (left) + Signal Strength (right) — full width, equal height */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {result.participantDemographics && (
          <div className="col-span-12 lg:col-span-6 min-h-[280px] flex">
            <ParticipantsDemographicsCard demographics={result.participantDemographics} className="h-full w-full" />
          </div>
        )}
        {result.heatMap && (
          <div className="col-span-12 lg:col-span-6 min-h-[280px] flex">
            <SignalStrengthCard heatMap={result.heatMap} className="h-full w-full" />
          </div>
        )}
      </div>

      {/* Row 2: Friction Density — full width below */}
      {result.heatMap && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <HeatMapCard heatMap={result.heatMap} momsTest={result.momsTest} />
          </div>
        </div>
      )}

      {/* Mom's Test: Persona Responses — full width */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col">
          <MomsTestCard
            pairs={momTestPairs}
            momsTest={result.momsTest}
            cloneResponses={result.cloneResponses}
            problem={result.problem || `The core pain point that ${result.productTitle || 'this product'} addresses for its users`}
          />
        </div>
      </div>
    </div>
  )
}
