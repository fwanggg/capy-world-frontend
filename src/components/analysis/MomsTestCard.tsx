import type { CloneResponse, MomsTestConsolidated } from '@/types/analysis'

interface MomTestPair {
  readonly q: string
  readonly key: string
}

interface MomsTestCardProps {
  readonly pairs: readonly MomTestPair[]
  readonly momsTest?: MomsTestConsolidated
  readonly cloneResponses?: readonly CloneResponse[]
  /** Fills [X] in q1 — always provided (guaranteed by API + dashboard fallback) */
  readonly problem: string
}

/** Mom's Test: all answers per question (no limit). Dynamic based on pairs. Uses momsTest when available, else cloneResponses. */
export function MomsTestCard({ pairs, momsTest, cloneResponses, problem }: Readonly<MomsTestCardProps>) {
  const fillPlaceholder = (q: string) => q.replace(/\[X\]/g, problem)
  const getAnswers = (key: string): Array<{ answer: string; anonymous_id?: string }> => {
    if (momsTest) {
      const arr = momsTest[key]
      return arr?.map((a) => (typeof a === 'string' ? { answer: a } : a)) ?? []
    }
    if (cloneResponses) {
      return cloneResponses
        .map((c) => {
          const ans = c.answers.momTest?.[key]
          return { answer: ans && ans !== 'No response' ? ans : '—', anonymous_id: c.anonymousId }
        })
        .filter((a) => a.answer !== '—' && a.answer !== 'No response')
    }
    return []
  }

  return (
    <div className="flex flex-col bg-surface-container-high rounded-xl shadow-2xl relative overflow-hidden border border-outline-variant/5">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/10 blur-[80px] pointer-events-none" />
      <div className="p-8 pb-4">
        <h3 className="text-xl font-headline font-black text-on-surface">
          Mom&apos;s Test: Persona Responses
        </h3>
        <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest mt-1">
          Synthesized User Validation — All Responses
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar max-h-[480px]">
        <div className="space-y-10">
          {pairs.map((pair) => {
            const answers = getAnswers(pair.key)
            const displayAnswers = answers.length > 0 ? answers : [{ answer: '—', anonymous_id: undefined }]
            return (
              <div key={pair.key} className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-[10px] font-black text-primary-container">
                    {pair.key.replace(/^q(\d)_.*/, 'Q$1')}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface text-base leading-tight">
                      {fillPlaceholder(pair.q)}
                    </h4>
                    <div className="h-px w-12 bg-primary-container mt-2" />
                  </div>
                </div>
                <div className="space-y-3 pl-12">
                  {displayAnswers.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start group">
                      <div className="w-6 h-6 rounded-full bg-secondary-container/50 border border-outline-variant/10 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface leading-snug">
                          &quot;{item.answer}&quot;
                        </p>
                        {item.anonymous_id && (
                          <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                            {item.anonymous_id}
                          </span>
                        )}
                      </div>
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
