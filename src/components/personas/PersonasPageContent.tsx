import { PersonasNav } from './PersonasNav'
import { MetricsCard } from './MetricsCard'
import { InterestDistributionCard } from './InterestDistributionCard'
import { ProfessionBreakdownCard } from './ProfessionBreakdownCard'
import { AgeGroupsCard } from './AgeGroupsCard'
import { DemographicsCard } from './DemographicsCard'
import { demographicsFootnote } from '@/data/personasPageData'

interface PersonasPageContentProps {
  readonly title?: string
  readonly description?: string
}

interface PersonasAnalytics {
  totalActive: number
  liveClusters: number
  totalDataPoints: number
  interests: Array<{ label: string; percent: number }>
  professions: Array<{ label: string; count: string }>
  ageGroups: Record<string, number>
  demographics: Array<{ label: string; count: number }>
}

async function fetchPersonasAnalytics(): Promise<PersonasAnalytics> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/personas/analytics`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  } catch (err) {
    console.error('[PersonasPage] Failed to fetch analytics:', err)
    // Return default empty state
    return {
      totalActive: 0,
      liveClusters: 0,
      totalDataPoints: 0,
      interests: [],
      professions: [],
      ageGroups: { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 },
      demographics: [
        { label: 'Male', count: 0 },
        { label: 'Female', count: 0 },
        { label: 'Not Specified', count: 0 },
      ],
    }
  }
}

export async function PersonasPageContent({
  title = 'Synthetic Personas',
  description = 'Real-time segment intelligence for AI-driven user modeling.',
}: Readonly<PersonasPageContentProps>) {
  const analytics = await fetchPersonasAnalytics()

  return (
    <div className="dark min-h-screen bg-surface">
      <PersonasNav activeLink="personas" />

      <main className="pt-20 pb-16 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - Stitch: Synthetic Personas */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-4 text-on-surface font-headline">
              {title}
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl font-body leading-relaxed">
              {description}
            </p>
          </div>

          {/* Top Metrics - Stitch: Total Active, Live Clusters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MetricsCard
              label="Total Active"
              value={analytics.totalActive.toLocaleString()}
            />
            <MetricsCard
              label="Live Clusters"
              value={analytics.liveClusters.toString()}
            />
          </div>

          {/* Stats Grid - Stitch: Interests, Profession, Age Groups, Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InterestDistributionCard items={analytics.interests} />
            <ProfessionBreakdownCard items={analytics.professions} />
            <AgeGroupsCard groups={Object.entries(analytics.ageGroups).map(([label, count]) => ({ label, count }))} />
            <DemographicsCard items={analytics.demographics} footnote={demographicsFootnote} />
          </div>
        </div>
      </main>
    </div>
  )
}
