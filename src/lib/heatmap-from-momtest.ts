import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import type { HeatMap, MomsTestConsolidated } from '@/types/analysis'
import { MOM_TEST_QUESTIONS, MOM_TEST_V2 } from '@/data/momTestV2'

/** DeepSeek does not support withStructuredOutput (json_schema). Use plain JSON + parse. */

/** Escape unescaped double-quotes inside string values (common LLM error) */
function repairJsonQuotes(s: string): string {
  const out: string[] = []
  let i = 0
  while (i < s.length) {
    const qKeys = ['"theme": "', '"p": "', '"conclusion": "', '"status": "', '"overallRationale": "', '"summary": "', '"q1_validation": "', '"q2_alternatives": "', '"q3_impact": "', '"q4_search": "', '"q5_commitment": "', '"q6_expansion": "']
    const match = qKeys.find((k) => s.slice(i).startsWith(k))
    if (match) {
      const key = match
      out.push(key)
      i += key.length
      while (i < s.length) {
        const c = s[i]
        if (c === '\\') {
          out.push(s.slice(i, i + 2))
          i += 2
          continue
        }
        if (c === '"') {
          const after = s.slice(i + 1).match(/^\s*[,}\]]/)
          if (after) {
            out.push('"')
            i++
            break
          }
          out.push('\\"')
          i++
          continue
        }
        out.push(c)
        i++
      }
      continue
    }
    out.push(s[i])
    i++
  }
  return out.join('')
}

/** Attempt to parse JSON, with repair for common LLM output issues */
function tryParseHeatMapJson(raw: string): Record<string, unknown> | null {
  let s = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  s = s.replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(s) as Record<string, unknown>
  } catch {
    s = repairJsonQuotes(s)
  }
  try {
    return JSON.parse(s) as Record<string, unknown>
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const posMatch = msg.match(/position (\d+)/)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const from = Math.max(0, pos - 80)
      const to = Math.min(s.length, pos + 80)
      console.error('[heatmap] JSON parse error at position', pos, 'context:', JSON.stringify(s.slice(from, to)))
    }
    // Try extracting first complete {...} block (handles leading/trailing junk)
    const start = s.indexOf('{')
    if (start >= 0) {
      let depth = 0
      for (let i = start; i < s.length; i++) {
        const c = s[i]
        if (c === '{') depth++
        else if (c === '}') {
          depth--
          if (depth === 0) {
            try {
              return JSON.parse(s.slice(start, i + 1)) as Record<string, unknown>
            } catch {
              break
            }
          }
        }
      }
    }
  }
  return null
}

/**
 * Derive a single heat map from Mom Test answers.
 * Rows = questions, each row has categorized themes from answers. Hotter = more frequently hit.
 * Conclusion = synthesized insight (e.g. "Majority don't like core value because they already find alternatives").
 */
export async function deriveHeatMapFromMomTestAnswers(
  momsTest: MomsTestConsolidated,
  productContext?: { problem?: string; solution?: string }
): Promise<HeatMap> {
  // Include ALL answers for fidelity: if 10 interviewed, sum of theme counts = 10. No filtering.
  const allAnswers: Array<{ key: string; label: string; answers: Array<{ answer: string }> }> = []
  let totalCount = 0
  for (const { key, label } of MOM_TEST_QUESTIONS) {
    const arr = momsTest[key] ?? []
    allAnswers.push({ key, label, answers: arr })
    totalCount += arr.length
  }

  if (totalCount === 0) {
    return {
      conclusion: 'No participant responses to aggregate.',
      rows: MOM_TEST_QUESTIONS.map((q) => ({
        question: q.label,
        questionKey: q.key,
        questionText: MOM_TEST_V2[q.key as keyof typeof MOM_TEST_V2],
        themes: [],
      })),
    }
  }

  const participantText = allAnswers
    .map(
      ({ key, label, answers }) =>
        `${key} (${label}):\n${answers.map((a, i) => `  P${i + 1}: "${a.answer}"`).join('\n')}`
    )
    .join('\n\n')

  const llm = new ChatOpenAI({
    modelName: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: { baseURL: 'https://api.deepseek.com/v1' },
    temperature: 0.5,
  })

  const prompt = `You are aggregating participant answers from a Mom Test survey. Your job is to score each axis using the Mom Test philosophy—looking for Gold signals (real pain, specific behavior) vs Red flags (generics, hypotheticals, "just annoying").

Product context: ${productContext?.problem ?? 'N/A'} — ${productContext?.solution ?? 'N/A'}

PARTICIPANT ANSWERS:
${participantText}

## MOM TEST FRAMEWORK (use this to score each axis)

For each axis: Question | Theme (insight) | Gold (good) | Red flag (bad)

---
**q1_validation — Validation**
Question: Tell me about the last time you ran into [Problem]. Walk me through what happened.
Theme: Workflow Gap — where things go wrong in the real world.
Gold: Specific date, sequence of events. Problem is real and recent.
Red flag: Generics ("Usually I just..."), hypotheticals ("In the future I would..."). Don't experience it often enough.

---
**q2_alternatives — Alternatives**
Question: What are you doing to get around that right now? Any specific tools or hacks?
Theme: True Competition — what they already "pay" for with time/effort.
Gold: Messy spreadsheet, hacky Zapier, physical notebook. Already paying for a solution.
Red flag: "I just deal with it" or "I haven't really thought about it." Won't buy.

---
**q3_impact — Impact**
Question: When that happened last time, what was the consequence?
Theme: Value Proposition — what you're really selling (revenue, time, emotion).
Gold: Numbers or high-stakes emotion ("$2,000 lost", "missed my son's soccer game").
Red flag: "It's just annoying." Annoyances are rarely must-buy.

---
**q4_search — Search**
Question: Have you looked for other tools? What did you try and why didn't you stick?
Theme: Market Gap — what competitors are missing.
Gold: Names competitors, tells you why they hate them.
Red flag: "No, figured there wasn't anything." Pain not high enough to search.

---
**q5_commitment — Commitment**
Question: Would you be open to a 20-minute demo to give feedback?
Theme: Reality Check / Skin in the Game. Will they give time now → money later?
Gold: Checks calendar, commits to a time.
Red flag: "Sounds cool, keep me posted!" Polite disinterest.

---
**q6_expansion — Expansion**
Question: Who else in your circle deals with this same mess?
Theme: Niche / Lead Cluster — who else to target.
Gold: Names specific people/roles ("Talk to Sarah in Accounting").
Red flag: "I think it's just me."

## SCORING (0–10 per axis)
- 8–10: Majority Gold signals. Strong validation.
- 5–7: Mixed; some Gold, some Red. Partial validation.
- 2–4: Mostly Red flags; weak validation.
- 0–1: Almost all Red flags or no substantive answers.

## TASK
1. For EACH question: assign every participant (P1, P2, ...) to exactly ONE theme. Themes should reflect Gold vs Red patterns when possible. Sum of counts = N. Merge similar answers; use "Not relevant" for non-substantive answers. Max 4–6 themes per question.
2. For EACH question: give axisScore (0–10).
3. For EACH question: give rationaleWithCitations — summary + cited_phrases together:
   - summary: 1–2 sentences. Write it first, then pick 3–6 phrases from it to cite.
   - cited_phrases: object mapping each phrase (verbatim from summary) to pIds. Only include participants whose answer EXPLICITLY supports that phrase. "I haven't looked" → do NOT cite for "actively searched". Every question MUST have 2+ cited phrases.
4. Give overallScore (0–10) and overallRationale (1–2 sentences).
5. Write conclusion (1–2 sentence synthesis) and status: "High Resistance" | "Mixed Signals" | "Strong Fit".

Respond with ONLY valid JSON. Use exact questionKeys: q1_validation, q2_alternatives, q3_impact, q4_search, q5_commitment, q6_expansion.

{
  "conclusion": "1-2 sentence synthesis",
  "status": "High Resistance" | "Mixed Signals" | "Strong Fit",
  "overallScore": 0,
  "overallRationale": "1-2 sentences why this overall score",
  "scores": { "q1_validation": 0, "q2_alternatives": 0, "q3_impact": 0, "q4_search": 0, "q5_commitment": 0, "q6_expansion": 0 },
  "rationaleWithCitations": {
    "q1_validation": { "summary": "1-2 sentences. Include citable phrases.", "cited_phrases": { "phrase from summary": ["P1","P2"], "another phrase": ["P3"] } },
    "q2_alternatives": { "summary": "...", "cited_phrases": { "buying asset packs": ["P1","P3"], "hiring freelancers": ["P2","P5"] } },
    "q3_impact": { "summary": "...", "cited_phrases": {} },
    "q4_search": { "summary": "...", "cited_phrases": {} },
    "q5_commitment": { "summary": "...", "cited_phrases": {} },
    "q6_expansion": { "summary": "...", "cited_phrases": {} }
  },
  "assignments": {
    "q1_validation": [{"p": "P1", "theme": "short (3-6 words)"}, ...],
    "q2_alternatives": [...],
    "q3_impact": [...],
    "q4_search": [...],
    "q5_commitment": [...],
    "q6_expansion": [...]
  }
}
Theme labels: short (3-6 words), no double-quotes or newlines. Every participant MUST have exactly one assignment per question. Sum of theme counts per question MUST equal N. rationaleWithCitations: each cited_phrases key MUST appear verbatim in summary; 2+ cited phrases per question.`

  const response = await llm.invoke([new HumanMessage(prompt)])
  const raw = response.content
  const content =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw.map((c: unknown) => (typeof c === 'string' ? c : (c as { text?: string })?.text ?? '')).join('')
        : String(raw ?? '')

  console.log('[heatmap] DeepSeek raw response length:', content.length)
  console.log('[heatmap] DeepSeek raw response (first 2000 chars):', content.slice(0, 2000))
  if (content.length > 2000) {
    console.log('[heatmap] DeepSeek raw response (last 1000 chars):', content.slice(-1000))
  }

  const parsed = tryParseHeatMapJson(content)
  if (!parsed) {
    console.error('[heatmap] Failed to parse LLM JSON. Raw (first 500 chars):', content.slice(0, 500))
    return {
      conclusion: 'Failed to parse heat map from response.',
      rows: MOM_TEST_QUESTIONS.map((q) => ({
        question: q.label,
        questionKey: q.key,
        questionText: MOM_TEST_V2[q.key as keyof typeof MOM_TEST_V2],
        themes: [],
      })),
    }
  }

  const assignments = (parsed.assignments as Record<string, Array<{ p?: string; theme?: string }>>) ?? {}
  const scores = (parsed.scores as Record<string, number>) ?? {}
  const scoreRationales = (parsed.scoreRationales as Record<string, string>) ?? {}
  const evidenceCitations = (parsed.evidenceCitations as Record<string, Array<{ phrase?: string; pIds?: string[] }>>) ?? {}
  const rationaleWithCitationsRaw = (parsed.rationaleWithCitations as Record<string, { summary?: string; cited_phrases?: Record<string, string[]> }>) ?? {}

  console.log('[heatmap] parsed.rationaleWithCitations:', JSON.stringify(rationaleWithCitationsRaw, null, 2))
  console.log('[heatmap] parsed.scoreRationales:', JSON.stringify(parsed.scoreRationales, null, 2))
  console.log('[heatmap] parsed.evidenceCitations:', JSON.stringify(parsed.evidenceCitations, null, 2))

  const rows = MOM_TEST_QUESTIONS.map((q) => {
    const expectedCount = allAnswers.find((a) => a.key === q.key)?.answers.length ?? 0
    const arr = assignments[q.key] ?? []
    const byTheme = new Map<string, number>()
    for (const { theme } of arr) {
      const t = (theme || '').trim()
      if (t) byTheme.set(t, (byTheme.get(t) ?? 0) + 1)
    }
    const assignedSum = [...byTheme.values()].reduce((a, b) => a + b, 0)
    if (assignedSum < expectedCount) {
      const gap = expectedCount - assignedSum
      byTheme.set('Not categorized', (byTheme.get('Not categorized') ?? 0) + gap)
      console.warn(`[heatmap] ${q.key}: LLM assigned ${assignedSum}/${expectedCount}, adding "Not categorized" for ${gap}`)
    }
    const themes = [...byTheme.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => {
        const aOther = /not relevant|other|not categorized/i.test(a.label)
        const bOther = /not relevant|other|not categorized/i.test(b.label)
        if (aOther && !bOther) return 1
        if (!aOther && bOther) return -1
        return b.count - a.count
      })
    const questionText = MOM_TEST_V2[q.key as keyof typeof MOM_TEST_V2]
    const rawScore = scores[q.key]
    const score = typeof rawScore === 'number' && rawScore >= 0 && rawScore <= 10 ? Math.round(rawScore) : undefined
    const rwc = rationaleWithCitationsRaw[q.key]
    const summary = (rwc?.summary ?? scoreRationales[q.key])?.trim() || undefined
    const citedPhrases = rwc?.cited_phrases && typeof rwc.cited_phrases === 'object' ? rwc.cited_phrases : {}
    const rationaleWithCitations =
      summary && Object.keys(citedPhrases).length > 0
        ? { summary, cited_phrases: citedPhrases as Record<string, string[]> }
        : undefined
    if (!rationaleWithCitations && summary) {
      console.warn(`[heatmap] ${q.key}: No cited_phrases (got ${Object.keys(citedPhrases).length} keys). rwc=`, rwc)
    }
    const evidenceCitationsRow: Array<{ phrase: string; pIds: string[] }> = rationaleWithCitations
      ? Object.entries(rationaleWithCitations.cited_phrases)
          .filter(([, ids]) => Array.isArray(ids) && ids.length > 0)
          .map(([phrase, pIds]) => ({ phrase: phrase.trim(), pIds: pIds.filter((id): id is string => typeof id === 'string') }))
          .filter((c) => c.phrase && c.pIds.length > 0)
      : (() => {
          const raw = evidenceCitations[q.key]
          if (!Array.isArray(raw)) return []
          return raw
            .map((c) => ({
              phrase: (c.phrase ?? '').trim(),
              pIds: Array.isArray(c.pIds) ? c.pIds.filter((id): id is string => typeof id === 'string') : [],
            }))
            .filter((c) => c.phrase && c.pIds.length > 0)
        })()
    return {
      question: q.label,
      questionKey: q.key,
      questionText,
      themes,
      score,
      rationaleWithCitations,
      scoreRationale: rationaleWithCitations?.summary ?? summary,
      evidenceCitations: evidenceCitationsRow.length > 0 ? evidenceCitationsRow : undefined,
    }
  })

  const rawOverall = parsed.overallScore
  const overallScore = typeof rawOverall === 'number' && rawOverall >= 0 && rawOverall <= 10 ? Math.round(rawOverall) : undefined
  const overallRationale = (parsed.overallRationale as string)?.trim() || undefined

  return {
    conclusion: (parsed.conclusion as string) ?? 'No conclusion extracted.',
    status: parsed.status as string | undefined,
    overallScore,
    overallRationale,
    rows,
  }
}
