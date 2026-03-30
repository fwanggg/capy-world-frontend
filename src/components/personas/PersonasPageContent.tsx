import { getPersonasAnalytics } from '@/lib/personas-analytics'
import { PersonasNav } from './PersonasNav'
import { PersonasFilteredContent } from './PersonasFilteredContent'

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

          {/* Filtered Content - Stitch: Date filter + metrics cards */}
          <PersonasFilteredContent initialAnalytics={analytics} />
        </div>
      </main>
    </div>
  )
}
