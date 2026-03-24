'use client'

import { useCallback, useMemo, useState } from 'react'
import type { HeatMap, MomsTestConsolidated } from '@/types/analysis'
import { AnalysisCard } from './AnalysisCard'

interface HeatMapCardProps {
  readonly heatMap: HeatMap
  /** Raw answers per question — used for citation links */
  readonly momsTest?: MomsTestConsolidated | null
}

/** Parse P1, P2, ... to 0-based index */
function pIdToIndex(pId: string): number {
  const m = pId.match(/^P(\d+)$/i)
  return m ? Math.max(0, parseInt(m[1], 10) - 1) : -1
}

/** Check if answer supports the phrase; exclude clear contradictions */
function answerSupportsPhrase(answer: string, phrase: string): boolean {
  const a = answer.toLowerCase()
  const p = phrase.toLowerCase()
  const negatedSearch =
    /\b(haven't|hasn't|didn't|don't|never|not\s+really|barely|hardly)\s+(\w+\s+){0,6}(look|looked|search|searched|tried|find|found)\b/i
  const phraseImpliesSearch = /\b(search|look|tried|searched)\b/i.test(p)
  if (phraseImpliesSearch && negatedSearch.test(a)) return false
  const negatedWorkaround = /\b(just\s+deal|don't\s+really|haven't\s+thought|nothing\s+really)\b/i
  const phraseImpliesWorkaround = /\b(using|workaround|spreadsheet|zapier|hiring|buying|tool)\b/i.test(p)
  if (phraseImpliesWorkaround && negatedWorkaround.test(a)) return false
  if (a.includes(p)) return true
  const words = p.split(/\s+/).filter((w) => w.length > 2)
  for (let n = Math.min(3, words.length); n >= 2; n--) {
    const sub = words.slice(-n).join(' ')
    if (sub.length >= 6 && a.includes(sub)) return true
  }
  return false
}

/** Infer citations: find rationale phrases that appear in answers, link to those responses */
function inferCitationsFromRationale(
  rationale: string,
  answers: Array<{ answer: string }>
): Array<{ phrase: string; pIds: string[] }> {
  if (!answers.length) return []
  const citations: Array<{ phrase: string; pIds: string[] }> = []
  const seen = new Set<string>()
  const answerTexts = answers.map((a) => (a.answer || '').toLowerCase())
  const stripMd = (s: string) => s.replace(/\*\*/g, '').trim()
  const lowerRationale = rationale.toLowerCase()

  const candidates = rationale
    .split(/[,;]|\s+or\s+|\s+and\s+|\s+like\s+|\s+include[sd]?\s+|\s+such\s+as\s+/i)
    .map((p) => p.trim().replace(/^['"]|['"]$/g, '').replace(/^\s*(or|and|like|including)\s+/i, '').trim())
  for (const raw of candidates) {
    const phrase = stripMd(raw)
    if (!phrase || phrase.length < 4 || phrase.length > 50) continue
    const key = phrase.toLowerCase()
    if (seen.has(key)) continue
    const wordCount = phrase.split(/\s+/).length
    if (wordCount < 1) continue
    const pIds: string[] = []
    const words = key.split(/\s+/).filter((w) => w.length > 1)
    for (let i = 0; i < answerTexts.length; i++) {
      const ans = answerTexts[i]
      const match = ans.includes(key) || (words.length >= 2 && words.some((_, j) => {
        const sub = words.slice(j, j + 2).join(' ')
        return sub.length >= 4 && ans.includes(sub)
      }))
      if (match) pIds.push(`P${i + 1}`)
    }
    const inRationale = lowerRationale.includes(key) || rationale.toLowerCase().includes(raw.toLowerCase())
    if (pIds.length > 0 && inRationale) {
      seen.add(key)
      citations.push({ phrase: raw.includes('**') ? raw : phrase, pIds })
    }
  }
  return citations.slice(0, 8)
}

/** Render rationale with cited phrases as links; click shows supporting responses */
function RationaleWithCitations({
  rationale,
  citations: llmCitations,
  questionKey,
  momsTest,
  trustCitations,
}: {
  rationale: string
  citations?: Array<{ phrase: string; pIds: string[] }>
  questionKey: string
  momsTest?: MomsTestConsolidated | null
  /** When true (LLM-provided rationaleWithCitations), use citations as-is. When false, validate each pId. */
  trustCitations?: boolean
}) {
  const [openPhrase, setOpenPhrase] = useState<string | null>(null)
  const allAnswers = momsTest?.[questionKey] ?? []

  const citations = useMemo(() => {
    const raw = llmCitations?.length ? llmCitations : inferCitationsFromRationale(rationale, allAnswers)
    if (trustCitations) return raw.filter((c) => c.pIds.length > 0)
    return raw
      .map((c) => {
        const validPIds = c.pIds.filter((pid) => {
          const idx = pIdToIndex(pid)
          const ans = allAnswers[idx]?.answer
          return ans && answerSupportsPhrase(ans, c.phrase)
        })
        return validPIds.length > 0 ? { phrase: c.phrase, pIds: validPIds } : null
      })
      .filter((c): c is { phrase: string; pIds: string[] } => c != null)
  }, [llmCitations, rationale, allAnswers, trustCitations])

  const segments = useMemo(() => {
    if (!citations?.length) return [{ type: 'text' as const, content: rationale }]
    const matches: Array<{ start: number; end: number; phrase: string; pIds: string[] }> = []
    for (const { phrase, pIds } of citations) {
      const clean = phrase.replace(/\*\*/g, '')
      let idx = rationale.indexOf(phrase)
      if (idx < 0) idx = rationale.indexOf(clean)
      if (idx < 0) idx = rationale.toLowerCase().indexOf(clean.toLowerCase())
      if (idx >= 0) {
        let start = idx
        let end = idx + clean.length
        if (rationale.slice(Math.max(0, start - 2), start) === '**') start -= 2
        if (rationale.slice(end, end + 2) === '**') end += 2
        const overlap = matches.some((m) => start < m.end && end > m.start)
        if (!overlap) matches.push({ start, end, phrase: rationale.slice(start, end), pIds })
      }
    }
    matches.sort((a, b) => a.start - b.start)
    const out: Array<{ type: 'text' | 'link'; content: string; pIds?: string[] }> = []
    let pos = 0
    for (const m of matches) {
      if (m.start > pos) out.push({ type: 'text', content: rationale.slice(pos, m.start) })
      out.push({ type: 'link', content: m.phrase, pIds: m.pIds })
      pos = m.end
    }
    if (pos < rationale.length) out.push({ type: 'text', content: rationale.slice(pos) })
    return out
  }, [rationale, citations])

  const citedAnswers = useMemo(() => {
    if (!openPhrase || !momsTest?.[questionKey]) return []
    const cit = citations.find((c) => c.phrase === openPhrase)
    if (!cit) return []
    return cit.pIds
      .map((pid) => {
        const idx = pIdToIndex(pid)
        const ans = momsTest[questionKey]?.[idx]
        return ans ? { pId: pid, answer: ans.answer, anonymous_id: ans.anonymous_id } : null
      })
      .filter((a): a is NonNullable<typeof a> => a != null)
  }, [openPhrase, citations, momsTest, questionKey])

  const handlePhraseClick = useCallback(
    (phrase: string) => {
      setOpenPhrase((p) => (p === phrase ? null : phrase))
    },
    []
  )

  return (
    <div className="space-y-2">
      <p className="text-xs text-on-surface-variant/80 font-body leading-relaxed">
        {segments.map((seg, i) =>
          seg.type === 'text' ? (
            <span key={i}>{seg.content}</span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => handlePhraseClick(seg.content)}
              className="underline decoration-primary-container/80 decoration-dotted underline-offset-1 hover:decoration-solid text-primary-container/90 font-medium cursor-pointer"
              title={`See ${seg.pIds?.length ?? 0} response(s) mentioning this`}
            >
              {seg.content}
            </button>
          )
        )}
      </p>
      {openPhrase && citedAnswers.length > 0 && (
        <div className="pl-3 border-l-2 border-primary-container/30 py-2 space-y-2 bg-surface-container-high/50 rounded-r-lg">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Responses supporting &ldquo;{openPhrase}&rdquo;
          </p>
          {citedAnswers.map((a) => (
            <div key={a.pId} className="text-xs text-on-surface font-body">
              <span className="text-on-surface-variant/70 font-medium">{a.pId}</span>
              {a.anonymous_id && (
                <span className="text-on-surface-variant/50 ml-1">({a.anonymous_id})</span>
              )}
              <p className="mt-0.5 italic">&ldquo;{a.answer}&rdquo;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Mom Test score badge 0–10 with color gradient */
function ScoreBadge({ score }: { score: number }) {
  const hue = score >= 7 ? 160 : score >= 4 ? 45 : 0
  const sat = score >= 7 ? 70 : score >= 4 ? 80 : 75
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold tabular-nums shrink-0"
      style={{ backgroundColor: `hsl(${hue}, ${sat}%, 25%)`, color: 'white' }}
      title={`Mom Test score: ${score}/10`}
    >
      {score}
    </span>
  )
}

const PIE_COLORS = ['#00f5d4', '#00c4a7', '#00a890', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#5a6b6b'] as const

/** Show top 10 themes by count. Only use "Other" for overflow (themes 11+) so the pie reveals actual insights. */
function aggregateForPie(themes: Array<{ label: string; count: number }>): Array<{ label: string; count: number }> {
  const sorted = [...themes].sort((a, b) => b.count - a.count)
  if (sorted.length <= 10) return sorted
  const top9 = sorted.slice(0, 9)
  const otherCount = sorted.slice(9).reduce((s, t) => s + t.count, 0)
  return [...top9, { label: 'Other', count: otherCount }]
}

function PieChart({
  data,
  size = 120,
}: {
  data: Array<{ label: string; count: number }>
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const [hovered, setHovered] = useState<number | null>(null)

  const slices = useMemo(() => {
    if (total === 0) return []
    let acc = 0
    return data.map((d, i) => {
      const pct = (d.count / total) * 100
      const start = acc
      acc += pct
      return { ...d, start, end: acc, pct, color: PIE_COLORS[i % PIE_COLORS.length], index: i }
    })
  }, [data, total])

  if (total === 0) {
    return (
      <div className="rounded-full bg-surface-variant/20 flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-on-surface-variant">No data</span>
      </div>
    )
  }

  const r = size / 2
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-full">
        {slices.map((s) => {
          const startAngle = (s.start / 100) * 360 - 90 // -90 so 0° is top
          const endAngle = (s.end / 100) * 360 - 90
          const rad = (deg: number) => (deg * Math.PI) / 180
          const x1 = r + r * Math.cos(rad(startAngle))
          const y1 = r + r * Math.sin(rad(startAngle))
          const x2 = r + r * Math.cos(rad(endAngle))
          const y2 = r + r * Math.sin(rad(endAngle))
          const large = s.pct > 50 ? 1 : 0
          const d = `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
          const isHover = hovered === s.index
          return (
            <path
              key={s.index}
              d={d}
              fill={s.color}
              opacity={isHover ? 1 : hovered === null ? 0.9 : 0.4}
              className="transition-opacity cursor-pointer"
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{s.label}: {s.count} ({s.pct.toFixed(1)}%)</title>
            </path>
          )
        })}
      </svg>
      {hovered !== null && slices[hovered] && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs bg-surface-container-high text-on-surface border border-outline-variant/30 whitespace-nowrap z-10 pointer-events-none"
          style={{ minWidth: 120 }}
        >
          {slices[hovered].label}: {slices[hovered].count} ({slices[hovered].pct.toFixed(1)}%)
        </div>
      )}
    </div>
  )
}

/** Friction Density — Mom Test scores + pie charts per question */
export function HeatMapCard({ heatMap, momsTest }: Readonly<HeatMapCardProps>) {
  const { rows } = heatMap
  const safeRows = Array.isArray(rows) ? rows : []

  if (safeRows.length === 0) {
    return (
      <AnalysisCard title="Friction Density" subtitle="Conversion funnel resistance analysis">
        <p className="text-sm text-on-surface-variant font-body">No participant responses to aggregate.</p>
      </AnalysisCard>
    )
  }

  return (
    <AnalysisCard title="Friction Density" subtitle="Conversion funnel resistance analysis">
      <div className="space-y-6">
        {safeRows.map((row) => {
          const themes = Array.isArray(row.themes) ? row.themes : []
          const pieData = aggregateForPie(themes)
          const hasScore = row.score !== undefined

          return (
            <div key={row.questionKey} className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {hasScore && (
                    <>
                      <ScoreBadge score={row.score!} />
                      <span className="text-on-surface-variant/60">/10</span>
                    </>
                  )}
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide shrink-0">
                    {row.question}
                  </span>
                  {row.questionText && (
                    <>
                      <span className="text-on-surface-variant/50">—</span>
                      <span className="text-base text-on-surface-variant/90 font-body">
                        {row.questionText}
                      </span>
                    </>
                  )}
                </div>
                {(row.rationaleWithCitations ?? row.scoreRationale) && (
                  <RationaleWithCitations
                    rationale={row.rationaleWithCitations?.summary ?? row.scoreRationale ?? ''}
                    citations={
                      row.rationaleWithCitations
                        ? Object.entries(row.rationaleWithCitations.cited_phrases).map(([phrase, pIds]) => ({
                            phrase,
                            pIds: Array.isArray(pIds) ? pIds : [],
                          }))
                        : row.evidenceCitations
                    }
                    questionKey={row.questionKey}
                    momsTest={momsTest}
                    trustCitations={!!row.rationaleWithCitations}
                  />
                )}
              </div>
              <div className="shrink-0 self-center">
                <PieChart data={pieData} size={120} />
              </div>
            </div>
          )
        })}
      </div>
    </AnalysisCard>
  )
}
