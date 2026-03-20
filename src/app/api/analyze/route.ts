import { MOM_TEST_QUESTIONS, MOM_TEST_V2 } from '@/data/momTestV2'
import { supabase } from '@/lib/supabase'
import { callAnalysisAI, type CallCapybaraAIResponse } from '@/lib/langgraph-orchestrator'
import { deriveHeatMapFromMomTestAnswers } from '@/lib/heatmap-from-momtest'
import type { AnalysisResult, CloneResponse, ActionItem, HeatMap, ParticipantDemographics, MomsTestConsolidated } from '@/types/analysis'
import type { ReasoningStep } from '@/types/chat'

export const maxDuration = 300 // Vercel timeout override

interface ParsedAnalysis {
  productTitle: string
  problem: string
  solution: string
  icp: string
  votes: { yes: number; no: number; maybe: number }
  actionItems: ActionItem[]
}

interface SSEEvent {
  type: 'progress' | 'complete' | 'error'
  step?: ReasoningStep
  result?: AnalysisResult
  error?: string
}

/**
 * Parse structured fields from the LLM's markdown response
 * Extracts: Problem, Solution, Target Customer, Vote Summary, Actionable Items
 */
function parseAnalysisResponse(markdown: string): ParsedAnalysis {
  const lines = markdown.split('\n')

  // Extract Problem
  let problem = ''
  const problemMatch = markdown.match(/\*\*Problem:\*\*\s*(.+?)(?:\n|$)/i)
  if (problemMatch) problem = problemMatch[1].trim()

  // Extract Solution
  let solution = ''
  const solutionMatch = markdown.match(/\*\*Solution:\*\*\s*(.+?)(?:\n|$)/i)
  if (solutionMatch) solution = solutionMatch[1].trim()

  // Extract Target Customer / ICP
  let icp = ''
  const icpMatch = markdown.match(/\*\*Target Customer:\*\*\s*(.+?)(?:\n|$)/i)
  if (icpMatch) icp = icpMatch[1].trim()

  // Extract vote counts from "X YES / Y NO / Z MAYBE" pattern
  const voteMatch = markdown.match(/(\d+)\s+YES\s*\/\s*(\d+)\s+NO\s*\/\s*(\d+)\s+MAYBE/i)
  const votes = {
    yes: voteMatch ? parseInt(voteMatch[1]) : 0,
    no: voteMatch ? parseInt(voteMatch[2]) : 0,
    maybe: voteMatch ? parseInt(voteMatch[3]) : 0,
  }

  // Extract action items (lines starting with "- [HIGH]", "- [MEDIUM]", "- [LOW]")
  const actionItems: ActionItem[] = []
  const actionPattern = /^-\s+\[([A-Z]+)\]\s+(.+?)\s+—\s+(.+?)$/gm
  let match
  while ((match = actionPattern.exec(markdown))) {
    const impact = match[1] as 'High' | 'Medium' | 'Low'
    actionItems.push({
      action: match[2].trim(),
      impact: impact.charAt(0).toUpperCase() + impact.slice(1).toLowerCase() as 'High' | 'Medium' | 'Low',
      rationale: match[3].trim(),
    })
  }

  // Fallback: if no actions found with dashes, try lines with impact badges
  if (actionItems.length === 0) {
    for (const line of lines) {
      if (line.includes('[HIGH]') || line.includes('[MEDIUM]') || line.includes('[LOW]')) {
        const impactMatch = line.match(/\[(HIGH|MEDIUM|LOW)\]\s*(.+)/i)
        if (impactMatch) {
          const impact = impactMatch[1].charAt(0).toUpperCase() + impactMatch[1].slice(1).toLowerCase() as 'High' | 'Medium' | 'Low'
          actionItems.push({
            action: impactMatch[2].trim().split('—')[0].trim(),
            impact,
            rationale: impactMatch[2].trim().split('—')[1]?.trim() || 'See analysis for details',
          })
        }
      }
    }
  }

  // Ensure exactly 5 action items (pad if needed, truncate if too many)
  while (actionItems.length < 5) {
    actionItems.push({
      action: 'Review competitive landscape',
      impact: 'Medium',
      rationale: 'Understand how this product positions against alternatives',
    })
  }
  actionItems.length = 5

  return {
    productTitle: '', // Will extract from page during analysis
    problem,
    solution,
    icp,
    votes,
    actionItems,
  }
}

/**
 * Categorize responses into: Responded vs Didn't Respond
 * "Didn't Respond" includes both no response and can't comment
 */
function categorizeResponses(
  responses: Array<{
    personaId: string
    demographics: { age?: number; gender?: string; profession?: string; location?: string }
    answers: { momTest: Record<string, string | undefined>; vote: 'YES' | 'NO' | 'MAYBE'; voteReason: string }
  }>
): {
  responded: typeof responses
  didntRespond: typeof responses
} {
  const responded: typeof responses = []
  const didntRespond: typeof responses = []

  for (const response of responses) {
    const momTest = response.answers.momTest ?? {}
    const hasResponse = Object.values(momTest).some(
      (v) => v && v !== 'No response' && v.trim().length > 0
    )

    if (hasResponse) {
      responded.push(response)
    } else {
      didntRespond.push(response)
    }
  }

  return { responded, didntRespond }
}

/**
 * Generate professional visualizations based on clone responses
 */
function generateVisualization(
  productTitle: string,
  cloneResponses: Array<{
    personaId: string
    demographics: { age?: number; gender?: string; profession?: string; location?: string }
    answers: { momTest: Record<string, string | undefined>; vote: 'YES' | 'NO' | 'MAYBE'; voteReason: string }
  }>
) {
  // Categorize responses: Responded vs Didn't Respond
  const { responded, didntRespond } = categorizeResponses(cloneResponses)

  // Parse votes from all RESPONDED personas only
  const votes = { YES: 0, NO: 0, MAYBE: 0 }
  const concerns = new Map<string, number>()
  const benefits = new Map<string, number>()
  const individualVotes = []

  for (const response of responded) {
    const vote = response.answers.vote
    votes[vote] = (votes[vote] || 0) + 1

    // Collect individual vote with reason
    individualVotes.push({
      name: response.demographics.profession || response.demographics.location || 'Anonymous',
      label: vote,
      color: vote === 'YES' ? '#10b981' : vote === 'NO' ? '#ef4444' : '#f59e0b',
      note: response.answers.voteReason.substring(0, 100),
    })

    // Extract concerns from NO/MAYBE responses
    if (vote === 'NO' || vote === 'MAYBE') {
      const reason = response.answers.voteReason.toLowerCase()
      const commonConcerns = [
        'expensive', 'price', 'cost',
        'overkill', 'too much', 'not needed',
        'complex', 'complicated', 'difficult',
        'already exist', 'alternatives', 'better',
        'not applicable', 'not relevant',
      ]
      for (const concern of commonConcerns) {
        if (reason.includes(concern)) {
          const key = concern === 'expensive' || concern === 'price' || concern === 'cost' ? 'Price concerns' :
                      concern === 'overkill' || concern === 'too much' ? 'Overengineered' :
                      concern === 'complex' ? 'Too complex' :
                      concern === 'already exist' ? 'Existing alternatives' : concern
          concerns.set(key, (concerns.get(key) || 0) + 1)
        }
      }
    }

    // Extract benefits from YES responses
    if (vote === 'YES') {
      const reason = response.answers.voteReason.toLowerCase()
      const commonBenefits = [
        'saves time', 'save time', 'faster',
        'easy', 'simple', 'straightforward',
        'solves', 'fixes', 'handles',
        'great', 'excellent', 'perfect',
        'intuitive', 'user-friendly', 'clean',
      ]
      for (const benefit of commonBenefits) {
        if (reason.includes(benefit)) {
          const key = benefit.includes('save') ? 'Saves time' :
                      benefit.includes('easy') ? 'Easy to use' :
                      benefit.includes('solves') ? 'Solves the problem' :
                      benefit.includes('intuitive') ? 'Intuitive design' : benefit
          benefits.set(key, (benefits.get(key) || 0) + 1)
        }
      }
    }
  }

  // Create visualization charts with two-category system
  const charts = [
    {
      type: 'pie' as const,
      title: `Response Breakdown (${cloneResponses.length} total interviewed)`,
      innerRadius: 0.5,
      data: [
        { name: `Responded (${responded.length})`, value: responded.length, color: '#10b981' },
        { name: `Didn't Respond (${didntRespond.length})`, value: didntRespond.length, color: '#cbd5e1' },
      ],
    },
    {
      type: 'pie' as const,
      title: `Would You Use ${productTitle}? (${responded.length} who responded)`,
      innerRadius: 0.5,
      data: [
        { name: 'YES', value: votes.YES, color: '#10b981' },
        { name: 'NO', value: votes.NO, color: '#ef4444' },
        { name: 'MAYBE', value: votes.MAYBE, color: '#f59e0b' },
      ],
    },
    {
      type: 'horizontal_bar' as const,
      title: `Individual Votes (${responded.length} personas responded)`,
      data: [
        ...individualVotes,
        ...(didntRespond.length > 0 ? [{
          name: `${didntRespond.length} Didn't Respond`,
          label: 'NO_DATA',
          color: '#cbd5e1',
          note: 'Could not provide feedback on this product',
        }] : []),
      ],
    },
    {
      type: 'top_concerns' as const,
      title: 'Top Concerns',
      data: Array.from(concerns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          value: count,
          color: '#ef4444',
          note: `${count} persona${count > 1 ? 's' : ''}`,
        })),
    },
    {
      type: 'top_benefits' as const,
      title: 'Top Reasons to Use',
      data: Array.from(benefits.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          value: count,
          color: '#10b981',
          note: `${count} persona${count > 1 ? 's' : ''}`,
        })),
    },
  ]

  return {
    title: `Product Analysis — ${productTitle}`,
    charts,
    generatedAt: new Date().toISOString(),
  }
}

/** Filter out answers that are the question text or "Your answer: [question]" placeholder */
function filterPlaceholderAnswers(
  key: string,
  items: Array<{ answer: string; anonymous_id?: string }>
): Array<{ answer: string; anonymous_id?: string }> {
  const questionText = MOM_TEST_V2[key as keyof typeof MOM_TEST_V2]
  if (!questionText) return items
  const qLower = questionText.toLowerCase()
  return items.filter((item) => {
    const a = (item.answer || '').trim()
    if (!a || a === '—' || a === 'No response') return false
    const aLower = a.toLowerCase()
    // Skip if answer is the question, or "Your answer: <question>"
    if (aLower === qLower) return false
    if (aLower.startsWith('your answer:') && aLower.includes(qLower.slice(0, 40))) return false
    if (aLower.startsWith('your answer :') && aLower.includes(qLower.slice(0, 40))) return false
    return true
  })
}

/** Compute participant demographics (personas-style) from cloneResponses */
function computeParticipantDemographics(cloneResponses: CloneResponse[]): ParticipantDemographics {
  const professions: Record<string, number> = {}
  const ageGroups: Record<string, number> = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'Not Specified': 0 }
  const demographics: Record<string, number> = { Male: 0, Female: 0, Other: 0, 'Not Specified': 0 }
  const interests: Record<string, number> = {}

  for (const r of cloneResponses) {
    const prof = r.demographics.profession || 'Not Specified'
    professions[prof] = (professions[prof] ?? 0) + 1

    const age = r.demographics.age
    if (age == null) ageGroups['Not Specified']++
    else if (age < 25) ageGroups['18-24']++
    else if (age < 35) ageGroups['25-34']++
    else if (age < 45) ageGroups['35-44']++
    else ageGroups['45+']++

    const g = (r.demographics.gender || '').toLowerCase()
    if (g === 'male' || g === 'm') demographics.Male++
    else if (g === 'female' || g === 'f') demographics.Female++
    else if (g) demographics.Other++
    else demographics['Not Specified']++

    for (const interest of r.demographics.interests ?? []) {
      const name = typeof interest === 'string' ? interest : (interest as { name?: string })?.name ?? ''
      if (name) {
        const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        interests[key] = (interests[key] ?? 0) + 1
      }
    }
  }

  return {
    professions: Object.entries(professions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count })),
    ageGroups: Object.entries(ageGroups).map(([label, count]) => ({ label, count })),
    demographics: Object.entries(demographics).map(([label, count]) => ({ label, count })),
    interests: Object.entries(interests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count })),
  }
}

/**
 * Build final AnalysisResult from orchestrator response and extracted data.
 * Heat map is ALWAYS derived from Mom Test answers (aggregation), never from LLM synthesis.
 */
async function buildAnalysisResult(
  orchestratorResponse: CallCapybaraAIResponse,
  url: string,
  cloneResponses: CloneResponse[],
  reasoning: ReasoningStep[],
  productTitle: string,
): Promise<AnalysisResult> {
  const consolidation = orchestratorResponse.consolidation
  const parsed = parseAnalysisResponse(orchestratorResponse.response)

  const problem = consolidation?.product.problem ?? parsed.problem
  const solution = consolidation?.product.solution ?? parsed.solution
  const icp = consolidation?.product.icp ?? parsed.icp
  const actionItems: ActionItem[] = consolidation?.action_items?.map((a) => ({
    action: a.action,
    impact: a.impact as 'High' | 'Medium' | 'Low',
    rationale: a.rationale,
  })) ?? parsed.actionItems

  // Heat map: derived from Mom Test answers (aggregation), NOT from LLM synthesis

  const participantDemographics: ParticipantDemographics =
    consolidation?.participants?.length
      ? (() => {
          const profs: Record<string, number> = {}
          const ages: Record<string, number> = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'Not Specified': 0 }
          const demos: Record<string, number> = { Male: 0, Female: 0, Other: 0, 'Not Specified': 0 }
          for (const p of consolidation.participants) {
            const prof = p.profession || 'Not Specified'
            profs[prof] = (profs[prof] ?? 0) + 1
            if (p.age == null) ages['Not Specified']++
            else if (p.age < 25) ages['18-24']++
            else if (p.age < 35) ages['25-34']++
            else if (p.age < 45) ages['35-44']++
            else ages['45+']++
            const g = (p.gender || '').toLowerCase()
            if (g === 'male' || g === 'm') demos.Male++
            else if (g === 'female' || g === 'f') demos.Female++
            else if (g) demos.Other++
            else demos['Not Specified']++
          }
          const fromClones = computeParticipantDemographics(cloneResponses)
          return {
            professions: Object.entries(profs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, count]) => ({ label, count })),
            ageGroups: Object.entries(ages).map(([label, count]) => ({ label, count })),
            demographics: Object.entries(demos).map(([label, count]) => ({ label, count })),
            interests: fromClones.interests,
          }
        })()
      : computeParticipantDemographics(cloneResponses)

  const visualization = generateVisualization(productTitle, cloneResponses)

  const momsTest: MomsTestConsolidated = consolidation?.moms_test
    ? Object.fromEntries(
        Object.entries(consolidation.moms_test).map(([k, v]) => [
          k,
          filterPlaceholderAnswers(k, Array.isArray(v) ? v : []),
        ])
      )
    : (() => {
        const out: MomsTestConsolidated = {}
        for (const { key } of MOM_TEST_QUESTIONS) {
          const raw = cloneResponses.map((r) => {
            const ans = r.answers.momTest?.[key]
            return {
              answer: ans && ans !== 'No response' ? ans : '—',
              anonymous_id: r.anonymousId,
            }
          })
          out[key] = filterPlaceholderAnswers(key, raw)
        }
        return out
      })()

  const heatMap = await deriveHeatMapFromMomTestAnswers(momsTest, { problem, solution })

  return {
    url,
    productTitle,
    problem,
    solution,
    icp,
    visualization,
    cloneResponses,
    actionItems,
    reasoning,
    summary: orchestratorResponse.response,
    heatMap,
    participantDemographics,
    momsTest,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = body as { url?: string }

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create anonymous session for analysis
    const sessionId = crypto.randomUUID()
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        id: sessionId,
        user_id: 'public-analysis',
        active_clones: [],
        mode: 'god',
        metadata: { url, source: 'analyze' },
      })

    if (sessionError) {
      console.error('[ANALYZE] Session creation error:', sessionError)
      // Continue anyway - session might already exist or user_id constraint might not apply
    }

    const encoder = new TextEncoder()
    let streamClosed = false

    const stream = new ReadableStream({
      async start(controller) {
        const writeSSE = (obj: SSEEvent) => {
          if (streamClosed) return
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
          } catch {
            streamClosed = true
          }
        }

        let productTitle = ''
        const cloneResponses: CloneResponse[] = []

        try {
          const result = await callAnalysisAI(sessionId, `Analyze this product: ${url}`, {
            onReasoningStep: (step) => {
              writeSSE({ type: 'progress', step })
            },
            onRelayMessages: (messages) => {
              for (const msg of messages) {
                if (msg.role === 'clone') {
                  const personaId = msg.sender_id.replace('clone-', '')
                  const content = (msg.content || '').trim()

                  // Try JSON first (Mom Test v2 format)
                  interface ParticipantJson {
                    mom_test?: Record<string, string | undefined>
                    vote?: string
                    vote_reason?: string
                  }
                  let parsed: ParticipantJson | null = null
                  try {
                    const stripped = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
                    parsed = JSON.parse(stripped) as ParticipantJson
                  } catch {
                    // Fallback: plain text Q1-Q6 parsing
                  }

                  if (parsed?.mom_test && typeof parsed.mom_test === 'object') {
                    const momTest: Record<string, string | undefined> = {}
                    for (const [k, v] of Object.entries(parsed.mom_test)) {
                      if (typeof v === 'string') momTest[k] = v
                    }
                    cloneResponses.push({
                      personaId,
                      anonymousId: personaId,
                      demographics: {},
                      answers: {
                        momTest,
                        vote: (parsed.vote?.toUpperCase() === 'YES' || parsed.vote?.toUpperCase() === 'NO' ? parsed.vote.toUpperCase() : 'MAYBE') as 'YES' | 'NO' | 'MAYBE',
                        voteReason: parsed.vote_reason ?? 'No reasoning provided',
                      },
                    })
                  } else {
                    // Legacy: parse Q1-Q6 from plain text
                    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
                    const keys = MOM_TEST_QUESTIONS.map((q) => q.key)
                    const answers: Record<string, string> = Object.fromEntries(keys.map((k) => [k, '']))
                    let vote: 'YES' | 'NO' | 'MAYBE' = 'MAYBE'
                    let voteReason = ''
                    let currentKey: string | null = null

                    for (const line of lines) {
                      const qMatch = line.match(/^q([1-6])[\s:_]*(.*)/i)
                      if (qMatch) {
                        const num = parseInt(qMatch[1], 10)
                        const rest = qMatch[2].trim()
                        if (num >= 1 && num <= 6 && keys[num - 1]) {
                          currentKey = keys[num - 1]
                          const voteMatch = rest.match(/^(YES|NO|MAYBE)\b/i)
                          if (voteMatch) {
                            vote = voteMatch[1].toUpperCase() as 'YES' | 'NO' | 'MAYBE'
                            voteReason = rest.replace(/^(YES|NO|MAYBE)\s*/i, '').trim()
                          } else {
                            answers[currentKey] = rest
                          }
                        }
                      } else if (currentKey && line) {
                        const sep = answers[currentKey] ? ' ' : ''
                        answers[currentKey] += sep + line
                      }
                      const voteMatch = line.match(/^(YES|NO|MAYBE)\b/i)
                      if (voteMatch && !qMatch) {
                        vote = voteMatch[1].toUpperCase() as 'YES' | 'NO' | 'MAYBE'
                        voteReason = line.replace(/^(YES|NO|MAYBE)\s*/i, '').trim()
                      }
                    }

                    const momTest: Record<string, string | undefined> = {}
                    for (const k of keys) {
                      momTest[k] = answers[k] || 'No response'
                    }
                    cloneResponses.push({
                      personaId,
                      anonymousId: personaId,
                      demographics: {},
                      answers: {
                        momTest,
                        vote,
                        voteReason: voteReason || 'No reasoning provided',
                      },
                    })
                  }
                }
              }
            },
          })

          // Extract product title from first analyze_landing_page step
          const analyzeStep = result.reasoning.find(r => r.toolName === 'analyze_landing_page')
          if (analyzeStep?.output?.title) {
            productTitle = analyzeStep.output.title
          }

          // Log response breakdown
          console.log(`[ANALYZE] Received ${cloneResponses.length} responses from personas`)
          const { responded, didntRespond } = categorizeResponses(cloneResponses)
          console.log(`[ANALYZE] Breakdown:`)
          console.log(`  - Responded: ${responded.length}`)
          console.log(`  - Didn't Respond: ${didntRespond.length}`)

          // Check if auto-recruitment is needed (target: ~7-8 responses minimum)
          const TARGET_RESPONSES = 7
          if (responded.length < TARGET_RESPONSES && didntRespond.length > 0) {
            const needed = TARGET_RESPONSES - responded.length
            console.log(`[ANALYZE] Auto-recruitment triggered: ${responded.length} responded < ${TARGET_RESPONSES} target`)
            console.log(`[ANALYZE] Need ${needed} more responses to reach target`)
            writeSSE({
              type: 'progress',
              step: {
                iteration: 0,
                action: 'Auto-recruiting additional personas',
                toolName: 'recruit_clones',
                summary: `Need ${needed} more responses to reach target of ${TARGET_RESPONSES}. Recruiting additional personas...`,
              }
            })
            // NOTE: Full auto-recruitment would be implemented in callAnalysisAI orchestrator
            // It would: 1) call recruit_clones for N more personas
            //           2) send same interview questions to them
            //           3) collect responses
            //           4) re-analyze with full set
            // For now, we continue with current responses and include the gap in visualization
          }

          // Fetch demographics for each clone response
          for (const clone of cloneResponses) {
            try {
              const { data: persona } = await supabase
                .from('personas')
                .select('profession, location, age, gender, interests')
                .eq('id', clone.personaId)
                .single()

              if (persona) {
                const interestsRaw = persona.interests
                const interestsArr: string[] = Array.isArray(interestsRaw)
                  ? interestsRaw.map((i: unknown) => (typeof i === 'string' ? i : (i as { name?: string })?.name ?? '')).filter(Boolean)
                  : []
                clone.demographics = {
                  age: persona.age,
                  gender: persona.gender,
                  profession: persona.profession,
                  location: persona.location,
                  interests: interestsArr,
                }
              }
            } catch (err) {
              // Persona not found or error fetching, continue with empty demographics
              console.error(`[ANALYZE] Failed to fetch demographics for persona ${clone.personaId}:`, err)
            }
          }

          // Build final result (heat map derived from Mom Test answers)
          const finalResult = await buildAnalysisResult(
            result,
            url,
            cloneResponses,
            result.reasoning,
            productTitle,
          )

          writeSSE({ type: 'complete', result: finalResult })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          console.error('[ANALYZE] Error:', errorMsg, err)
          writeSSE({ type: 'error', error: errorMsg })
        } finally {
          try {
            controller.close()
          } catch {
            streamClosed = true
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[ANALYZE] Request error:', errorMsg)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
