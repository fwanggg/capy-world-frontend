import type { CloneResponse } from '@/types/analysis'

interface MomTestPair {
  readonly q: string
  readonly key: 'q1' | 'q2' | 'q3'
}

interface MomsTestCardProps {
  readonly pairs: readonly MomTestPair[]
  readonly cloneResponses: readonly CloneResponse[]
}

/** Stitch: Q1/Q2 badges, multiple persona answers per question */
export function MomsTestCard({ pairs, cloneResponses }: Readonly<MomsTestCardProps>) {
  return (
    <div className="flex flex-col bg-surface-container-high rounded-xl shadow-2xl relative overflow-hidden border border-outline-variant/5">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/10 blur-[80px] pointer-events-none" />
      <div className="p-8 pb-4">
        <h3 className="text-xl font-headline font-black text-on-surface">
          Mom&apos;s Test: Persona Responses
        </h3>
        <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest mt-1">
          Synthesized User Validation
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
        <div className="space-y-10">
          {pairs.map((pair) => {
            const answers = cloneResponses
              .slice(0, 2)
              .map((c) => c.answers[pair.key] || '—')
              .filter((a) => a !== '—')
            if (answers.length === 0) answers.push('—')
            return (
              <div key={pair.key} className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-[10px] font-black text-primary-container">
                    {pair.key.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface text-base leading-tight">
                      {pair.q}
                    </h4>
                    <div className="h-px w-12 bg-primary-container mt-2" />
                  </div>
                </div>
                <div className="space-y-3 pl-12">
                  {answers.map((answer, i) => (
                    <div key={i} className="flex gap-3 items-start group">
                      <div className="w-6 h-6 rounded-full bg-secondary-container/50 border border-outline-variant/10 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-on-surface leading-snug">
                        &quot;{answer}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
