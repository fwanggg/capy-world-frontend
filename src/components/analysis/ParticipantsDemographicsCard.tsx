import type { ParticipantDemographics } from '@/types/analysis'
import { DemographicsBarChartCard } from './DemographicsBarChartCard'

interface ParticipantsDemographicsCardProps {
  readonly demographics: ParticipantDemographics
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

/** Who joined — Stitch design: aggregated persona distribution, teal accent, percentage bars */
export function ParticipantsDemographicsCard({ demographics }: Readonly<ParticipantsDemographicsCardProps>) {
  const participantCount = getParticipantCount(demographics)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <p className="text-sm text-on-surface-variant font-body">
          Aggregated Persona Distribution
        </p>
        <p className="text-sm font-semibold text-primary-container tabular-nums">
          {participantCount.toLocaleString()} Total Participants
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DemographicsBarChartCard
          title="Profession"
          icon="work"
          items={demographics.professions}
        />
        <DemographicsBarChartCard
          title="Age Groups"
          icon="calendar_month"
          items={demographics.ageGroups}
        />
        <DemographicsBarChartCard
          title="Gender Segment"
          icon="diversity_3"
          items={demographics.demographics}
          footnote="Participants who joined the survey"
        />
        <DemographicsBarChartCard
          title="Interests"
          icon="insights"
          items={demographics.interests}
        />
      </div>
    </div>
  )
}
