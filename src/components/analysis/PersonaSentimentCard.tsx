import type { CloneResponse } from '@/types/analysis'

interface PersonaSentimentCardProps {
  readonly clones: readonly CloneResponse[]
}

export function PersonaSentimentCard({ clones }: Readonly<PersonaSentimentCardProps>) {
  return (
    <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-inner">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-headline font-black text-on-surface">
            Persona Sentiment Logic
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 font-body">
            Cross-referenced reasoning grouped by segment.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-tighter">
            Mid-Market
          </span>
          <span className="px-3 py-1 bg-primary-container/10 text-primary-container text-[10px] font-bold rounded-full uppercase tracking-tighter">
            Startup
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {clones.slice(0, 2).map((clone, i) => (
          <div key={i} className="contents">
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Archetype
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-primary-container font-bold text-sm">
                  {clone.anonymousId?.slice(0, 2) ?? '—'}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {clone.demographics.profession ?? 'Persona'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    Segment {String.fromCharCode(65 + i)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Main Sentiment
              </h4>
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  clone.answers.vote === 'YES'
                    ? 'bg-surface-container-high text-primary-container'
                    : clone.answers.vote === 'NO'
                      ? 'bg-surface-container-high text-error'
                      : 'bg-surface-container-high text-primary-container'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    clone.answers.vote === 'YES' || clone.answers.vote === 'MAYBE'
                      ? 'bg-primary-container'
                      : 'bg-error'
                  }`}
                />
                {clone.answers.vote === 'YES'
                  ? 'Urgent Optimization'
                  : clone.answers.vote === 'NO'
                    ? 'Cautionary Adoption'
                    : 'Mixed'}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:col-span-2">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Reasoning Logic
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {clone.answers.voteReason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
