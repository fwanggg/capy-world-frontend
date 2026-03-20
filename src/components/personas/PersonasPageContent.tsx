'use client'

import { PersonasNav } from './PersonasNav'
import { MetricsCard } from './MetricsCard'
import { PersonaArchetypeCard } from './PersonaArchetypeCard'
import { metricsData, personaArchetypes } from '@/data/personasPageData'

interface PersonasPageContentProps {
  readonly title?: string
  readonly description?: string
}

export function PersonasPageContent({ title = 'AI Persona Library', description = 'Meet the 10 high-fidelity synthetic users that power Capysan. Each persona represents distinct market behaviors and decision-making patterns.' }: Readonly<PersonasPageContentProps>) {
  return (
    <div className="dark min-h-screen bg-surface">
      <PersonasNav activeLink="personas" />

      <main className="pt-20 pb-16 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4 text-on-surface font-headline">
              {title}
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl font-body leading-relaxed">
              {description}
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <MetricsCard label={metricsData.totalActive.label} value={metricsData.totalActive.value} />
            <MetricsCard label={metricsData.liveClusters.label} value={metricsData.liveClusters.value} />
            <MetricsCard label={metricsData.avgAge.label} value={metricsData.avgAge.value} />
          </div>

          {/* Persona Archetypes Section */}
          <div>
            <h2 className="text-2xl font-headline font-black mb-8 text-on-surface">
              Persona Archetypes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {personaArchetypes.map((persona) => (
                <PersonaArchetypeCard
                  key={persona.id}
                  name={persona.name}
                  role={persona.role}
                  tags={persona.tags}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
