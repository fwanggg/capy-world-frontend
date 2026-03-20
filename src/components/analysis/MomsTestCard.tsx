interface MomTestPair {
  readonly q: string
  readonly key: 'q1' | 'q2' | 'q3'
}

interface MomsTestCardProps {
  readonly pairs: readonly MomTestPair[]
  readonly answers: Partial<Record<'q1' | 'q2' | 'q3', string>>
}

export function MomsTestCard({ pairs, answers }: Readonly<MomsTestCardProps>) {
  return (
    <div className="bg-surface-container-high p-8 rounded-xl shadow-2xl relative overflow-hidden h-full border border-outline-variant/5">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/10 blur-[80px]" />
      <h3 className="text-xl font-headline font-black mb-6 text-on-surface">
        Mom&apos;s Test: Persona Responses
      </h3>
      <div className="space-y-6">
        {pairs.map((pair) => {
          const answer = answers[pair.key] ?? '—'
          return (
            <div key={pair.key} className="space-y-2">
              <div className="p-3 bg-surface-container-low rounded-lg inline-block border-l-2 border-primary-container">
                <p className="text-xs italic text-on-surface-variant">&quot;{pair.q}&quot;</p>
              </div>
              <div className="flex gap-3 items-start pl-4">
                <div className="w-6 h-6 rounded-full bg-secondary-container flex-shrink-0 mt-1" />
                <p className="text-sm font-medium text-on-surface">&quot;{answer}&quot;</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
