import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import type { HeatMap, MomsTestConsolidated } from '@/types/analysis'
import { MOM_TEST_QUESTIONS } from '@/data/momTestV2'

/** DeepSeek does not support withStructuredOutput (json_schema). Use plain JSON + parse. */

/** Escape unescaped double-quotes inside "theme" and "p" values (common LLM error) */
function repairJsonQuotes(s: string): string {
  const out: string[] = []
  let i = 0
  while (i < s.length) {
    const qKeys = ['"theme": "', '"p": "', '"conclusion": "', '"status": "']
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
  const allAnswers: Array<{ key: string; label: string; answers: Array<{ answer: string }> }> = []
  let totalCount = 0
  for (const { key, label } of MOM_TEST_QUESTIONS) {
    const arr = momsTest[key]?.filter((a) => a.answer && a.answer !== '—' && a.answer !== 'No response') ?? []
    allAnswers.push({ key, label, answers: arr })
    totalCount += arr.length
  }

  if (totalCount === 0) {
    return {
      conclusion: 'No participant responses to aggregate.',
      rows: MOM_TEST_QUESTIONS.map((q) => ({ question: q.label, questionKey: q.key, themes: [] })),
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
    temperature: 0.2,
  })

  const prompt = `You are aggregating participant answers from a Mom Test survey into a single heat map.

Product context: ${productContext?.problem ?? 'N/A'} — ${productContext?.solution ?? 'N/A'}

PARTICIPANT ANSWERS:
${participantText}

CRITICAL: Each participant answers ONCE per question. Assign each answer to exactly ONE theme.
- Each participant contributes to exactly one theme per question. Sum of theme counts per question MUST equal the number of participants who answered that question (no double-counting).
- AGGREGATE similar concepts into a single canonical theme label. E.g. "Willing to test if integrates well" (P1) and "Willing to test if Godot integration" (P2) → both assign to "Willing to test if integration works well". Use consistent labels so similar answers group together.
- If an answer mentions multiple concepts, pick the PRIMARY one for assignment.

TASK:
1. For EACH question, assign each participant (P1, P2, ...) to exactly ONE theme. Use aggregated/canonical labels for similar concepts so they group naturally.
2. Write ONE conclusion that synthesizes the patterns.
3. Assign a status: "High Resistance" (mostly negative), "Mixed Signals", or "Strong Fit" (mostly positive).

Respond with ONLY valid JSON, no other text. Use these exact questionKeys:
- q1_validation (Validation)
- q2_alternatives (Alternatives)
- q3_impact (Impact)
- q4_search (Search)
- q5_commitment (Commitment)
- q6_expansion (Expansion)

{
  "conclusion": "1-2 sentence synthesis of the patterns",
  "status": "High Resistance" | "Mixed Signals" | "Strong Fit",
  "assignments": {
    "q1_validation": [{"p": "P1", "theme": "short theme (3-6 words)"}, {"p": "P2", "theme": "..."}, ...],
    "q2_alternatives": [...],
    "q3_impact": [...],
    "q4_search": [...],
    "q5_commitment": [...],
    "q6_expansion": [...]
  }
}
Each question's assignments array must have one entry per participant (P1, P2, ...) listed for that question. Theme labels: short (3-6 words), no double-quotes or newlines inside (use apostrophes if needed).`

  const response = await llm.invoke([new HumanMessage(prompt)])
  const raw = response.content
  const content =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw.map((c: unknown) => (typeof c === 'string' ? c : (c as { text?: string })?.text ?? '')).join('')
        : String(raw ?? '')
  const parsed = tryParseHeatMapJson(content)
  if (!parsed) {
    console.error('[heatmap] Failed to parse LLM JSON. Raw (first 500 chars):', content.slice(0, 500))
    return {
      conclusion: 'Failed to parse heat map from response.',
      rows: MOM_TEST_QUESTIONS.map((q) => ({ question: q.label, questionKey: q.key, themes: [] })),
    }
  }

  // Derive themes from assignments: group by theme label, count = participants. Guarantees sum = participantCount.
  const assignments = (parsed.assignments as Record<string, Array<{ p?: string; theme?: string }>>) ?? {}
  const rows = MOM_TEST_QUESTIONS.map((q) => {
    const arr = assignments[q.key] ?? []
    const byTheme = new Map<string, number>()
    for (const { theme } of arr) {
      const t = (theme || '').trim()
      if (t) byTheme.set(t, (byTheme.get(t) ?? 0) + 1)
    }
    const themes = [...byTheme.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
    return { question: q.label, questionKey: q.key, themes }
  })

  return {
    conclusion: (parsed.conclusion as string) ?? 'No conclusion extracted.',
    status: parsed.status as string | undefined,
    rows,
  }
}
