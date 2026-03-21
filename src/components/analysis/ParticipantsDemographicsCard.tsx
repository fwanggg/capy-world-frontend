import type { ParticipantDemographics } from '@/types/analysis'
import { AnalysisCard } from './AnalysisCard'
import { DemographicsBarChartCard } from './DemographicsBarChartCard'

interface ParticipantsDemographicsCardProps {
  readonly demographics: ParticipantDemographics
  readonly className?: string
}

/** Participant count — use profession sum as canonical (each person has one profession) */
function getParticipantCount(d: ParticipantDemographics): number {
  const n = d.professions.reduce((a, i) => a + i.count, 0)
  return n > 0 ? n : Math.max(
    d.ageGroups.reduce((a, i) => a + i.count, 0),
    d.demographics.reduce((a, i) => a + i.count, 0),
    1
  )
}

/** Participants Who Joined — single card with scrollable sub-areas (Profession, Age, Gender, Interests) */
export function ParticipantsDemographicsCard({ demographics, className }: Readonly<ParticipantsDemographicsCardProps>) {
  const participantCount = getParticipantCount(demographics)

  return (
    <AnalysisCard
      title="Participants Who Joined"
      subtitle={`${participantCount.toLocaleString()} total participants`}
      scrollable
      className={className}
    >
      <div className="space-y-6">
        <DemographicsBarChartCard
          title="Profession"
          icon="work"
          items={demographics.professions}
          compact
        />
        <DemographicsBarChartCard
          title="Age Groups"
          icon="calendar_month"
          items={demographics.ageGroups}
          compact
        />
        <DemographicsBarChartCard
          title="Gender Segment"
          icon="diversity_3"
          items={demographics.demographics}
          footnote="Participants who joined the survey"
          compact
        />
        <DemographicsBarChartCard
          title="Interests"
          icon="insights"
          items={demographics.interests}
          compact
        />
      </div>
    </AnalysisCard>
  )
}
