import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import type { HeatMap, MomsTestConsolidated } from '@/types/analysis'
import { MOM_TEST_QUESTIONS, MOM_TEST_V2 } from '@/data/momTestV2'

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
    temperature: 0.2,
  })

  const prompt = `You are aggregating participant answers from a Mom Test survey into a single heat map.

Product context: ${productContext?.problem ?? 'N/A'} — ${productContext?.solution ?? 'N/A'}

PARTICIPANT ANSWERS:
${participantText}

FIDELITY (CRITICAL): Every participant MUST be assigned to exactly ONE theme per question. Sum of theme counts per question MUST equal the number of participants (P1, P2, ... PN).
- If an answer is "—", "No response", "not relevant", vague, or low-quality, assign it to "Not relevant". Never drop a participant.
- MERGE AGGRESSIVELY: Create at most 4–6 canonical themes per question. Combine similar phrasings into one label (e.g. "Manual outreach to forums" and "Manual outreach to communities" → "Manual outreach"). Never create more than 6 distinct themes.
- If an answer mentions multiple concepts, pick the PRIMARY one for assignment.
- Use 3–5 substantive themes + "Not relevant" for non-substantive answers. Avoid granular one-off labels.

TASK:
1. For EACH question, assign EVERY participant (P1, P2, ...) to exactly ONE theme. Sum of counts = N. Merge similar answers into top themes; put non-substantive answers in "Not relevant".
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
Each question's assignments array must have exactly one entry per participant (P1, P2, ... PN). Theme labels: short (3-6 words), no double-quotes or newlines inside (use apostrophes if needed). Sum of theme counts per question MUST equal N. Aim for 4–6 themes per question max; merge similar answers into canonical labels. Include "Not relevant" for non-substantive answers.`

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
      rows: MOM_TEST_QUESTIONS.map((q) => ({
        question: q.label,
        questionKey: q.key,
        questionText: MOM_TEST_V2[q.key as keyof typeof MOM_TEST_V2],
        themes: [],
      })),
    }
  }

  const assignments = (parsed.assignments as Record<string, Array<{ p?: string; theme?: string }>>) ?? {}
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
    return { question: q.label, questionKey: q.key, questionText, themes }
  })

  return {
    conclusion: (parsed.conclusion as string) ?? 'No conclusion extracted.',
    status: parsed.status as string | undefined,
    rows,
  }
}
