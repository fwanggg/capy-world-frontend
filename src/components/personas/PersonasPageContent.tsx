import { getPersonasAnalytics, type PersonasAnalytics } from '@/lib/personas-analytics'
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

export async function PersonasPageContent({
  title = 'Synthetic Personas',
  description = 'Real-time segment intelligence for AI-driven user modeling.',
}: Readonly<PersonasPageContentProps>) {
  const analytics = await getPersonasAnalytics()

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
            <InterestDistributionCard items={analytics.interests} totalUnique={analytics.totalUniqueInterests} />
            <ProfessionBreakdownCard items={analytics.professions} totalUnique={analytics.totalUniqueProfessions} />
            <AgeGroupsCard groups={Object.entries(analytics.ageGroups).map(([label, count]) => ({ label, count }))} />
            <DemographicsCard items={analytics.demographics} footnote={demographicsFootnote} />
          </div>
        </div>
      </main>
    </div>
  )
}
