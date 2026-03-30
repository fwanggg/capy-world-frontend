'use client'

import { useState, useCallback, useEffect } from 'react'
import type { PersonasAnalytics } from '@/lib/personas-analytics'
import { PersonasDateFilter } from './PersonasDateFilter'
import { MetricsCard } from './MetricsCard'
import { InterestDistributionCard } from './InterestDistributionCard'
import { ProfessionBreakdownCard } from './ProfessionBreakdownCard'
import { AgeGroupsCard } from './AgeGroupsCard'
import { DemographicsCard } from './DemographicsCard'
import { demographicsFootnote } from '@/data/personasPageData'

interface PersonasFilteredContentProps {
  readonly initialAnalytics: PersonasAnalytics
}

export function PersonasFilteredContent({ initialAnalytics }: Readonly<PersonasFilteredContentProps>) {
  const [analytics, setAnalytics] = useState<PersonasAnalytics>(initialAnalytics)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const handleDateChange = useCallback(async (date: string | null) => {
    setSelectedDate(date)
    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      if (date) {
        // Convert date string to ISO format for API
        const isoDate = new Date(date).toISOString()
        params.set('createdAfter', isoDate)
      }

      const response = await fetch(`/api/personas/analytics?${params.toString()}`)
      if (response.ok) {
        const newAnalytics = await response.json()
        setAnalytics(newAnalytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <>
      <PersonasDateFilter onDateChange={handleDateChange} isLoading={isLoading} />

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MetricsCard label="Total Active" value={analytics.totalActive.toLocaleString()} />
        <MetricsCard label="Live Clusters" value={analytics.liveClusters.toString()} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InterestDistributionCard
          items={analytics.interests}
          totalUnique={analytics.totalUniqueInterests}
        />
        <ProfessionBreakdownCard
          items={analytics.professions}
          totalUnique={analytics.totalUniqueProfessions}
        />
        <AgeGroupsCard
          groups={Object.entries(analytics.ageGroups).map(([label, count]) => ({ label, count }))}
        />
        <DemographicsCard items={analytics.demographics} footnote={demographicsFootnote} />
      </div>
    </>
  )
}
