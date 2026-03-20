import { supabase } from '@/lib/supabase'
import { callAnalysisAI } from '@/lib/langgraph-orchestrator'
import type { AnalysisResult, CloneResponse, ActionItem } from '@/types/analysis'
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
 * Categorize responses based on experience level
 */
function categorizeResponses(
  responses: Array<{
    personaId: string
    demographics: { age?: number; gender?: string; profession?: string; location?: string }
    answers: {
      q1: string
      q2: string
      q3: string
      vote: 'YES' | 'NO' | 'MAYBE'
      voteReason: string
    }
  }>
): {
  experienced: typeof responses
  noExperience: typeof responses
  noResponse: typeof responses
} {
  const experienced = []
  const noExperience = []
  const noResponse = []

  for (const response of responses) {
    // Check if they responded
    if (!response.answers.q1 || response.answers.q1 === 'No response') {
      noResponse.push(response)
      continue
    }

    // Check if they have experience with the problem
    const q1Lower = response.answers.q1.toLowerCase()
    const noExperienceKeywords = [
      "don't have", "never", "no experience", "not applicable", "n/a",
      "not relevant", "doesn't apply", "can't comment", "not experienced"
    ]

    const hasNoExperienceIndication = noExperienceKeywords.some(keyword => q1Lower.includes(keyword))

    if (hasNoExperienceIndication) {
      noExperience.push(response)
    } else {
      experienced.push(response)
    }
  }

  return { experienced, noExperience, noResponse }
}

/**
 * Generate professional visualizations based on clone responses
 */
function generateVisualization(
  productTitle: string,
  cloneResponses: Array<{
    personaId: string
    demographics: { age?: number; gender?: string; profession?: string; location?: string }
    answers: {
      q1: string
      q2: string
      q3: string
      vote: 'YES' | 'NO' | 'MAYBE'
      voteReason: string
    }
  }>
) {
  // Categorize responses by experience level
  const { experienced, noExperience, noResponse } = categorizeResponses(cloneResponses)

  // Parse votes from EXPERIENCED responses only
  const votes = { YES: 0, NO: 0, MAYBE: 0 }
  const concerns = new Map<string, number>()
  const benefits = new Map<string, number>()
  const individualVotes = []

  for (const response of experienced) {
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

  // Create visualization charts
  const charts = [
    {
      type: 'pie' as const,
      title: `Response Breakdown (${cloneResponses.length} total interviewed)`,
      innerRadius: 0.5,
      data: [
        { name: `With Experience (${experienced.length})`, value: experienced.length, color: '#10b981' },
        { name: `No Experience (${noExperience.length})`, value: noExperience.length, color: '#94a3b8' },
        { name: `No Response (${noResponse.length})`, value: noResponse.length, color: '#cbd5e1' },
      ],
    },
    {
      type: 'pie' as const,
      title: `Would You Use ${productTitle}? (${experienced.length} with experience)`,
      innerRadius: 0.5,
      data: [
        { name: 'YES', value: votes.YES, color: '#10b981' },
        { name: 'NO', value: votes.NO, color: '#ef4444' },
        { name: 'MAYBE', value: votes.MAYBE, color: '#f59e0b' },
      ],
    },
    {
      type: 'horizontal_bar' as const,
      title: `Individual Votes (${experienced.length} personas with experience)`,
      data: [
        ...individualVotes,
        ...(noExperience.length > 0 ? [{
          name: `${noExperience.length} No Experience`,
          label: 'EXCLUDED',
          color: '#94a3b8',
          note: 'Not counted in vote — they don\'t have experience with this problem',
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

/**
 * Build final AnalysisResult from orchestrator response and extracted data
 */
function buildAnalysisResult(
  orchestratorResponse: any,
  url: string,
  cloneResponses: CloneResponse[],
  reasoning: ReasoningStep[],
  productTitle: string,
): AnalysisResult {
  const parsed = parseAnalysisResponse(orchestratorResponse.response)

  // Generate professional visualization from actual responses
  const visualization = generateVisualization(productTitle, cloneResponses as any)

  return {
    url,
    productTitle,
    problem: parsed.problem,
    solution: parsed.solution,
    icp: parsed.icp,
    visualization,
    cloneResponses,
    actionItems: parsed.actionItems,
    reasoning,
    summary: orchestratorResponse.response,
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
        const writeSSE = (obj: any) => {
          if (streamClosed) return
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
          } catch {
            streamClosed = true
          }
        }

        let productTitle = ''
        let cloneResponses: CloneResponse[] = []
        let allReasoning: ReasoningStep[] = []

        try {
          const result = await callAnalysisAI(sessionId, `Analyze this product: ${url}`, {
            onReasoningStep: (step) => {
              writeSSE({ type: 'progress', step })
            },
            onRelayMessages: (messages) => {
              // Parse clone responses for later extraction
              for (const msg of messages) {
                if (msg.role === 'clone') {
                  // Extract persona ID from sender_id (format: clone-{id})
                  const personaId = msg.sender_id.replace('clone-', '')

                  // Parse Q1-Q4 from response text
                  const content = msg.content || ''
                  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)

                  // Extract individual question answers
                  let q1 = '', q2 = '', q3 = '', vote = 'MAYBE', voteReason = ''
                  let currentQuestion = ''

                  for (const line of lines) {
                    if (line.toLowerCase().startsWith('q1:') || line.match(/^q1[\s:]/i)) {
                      currentQuestion = 'q1'
                      q1 = line.replace(/^q1[\s:]*/i, '').trim()
                    } else if (line.toLowerCase().startsWith('q2:') || line.match(/^q2[\s:]/i)) {
                      currentQuestion = 'q2'
                      q2 = line.replace(/^q2[\s:]*/i, '').trim()
                    } else if (line.toLowerCase().startsWith('q3:') || line.match(/^q3[\s:]/i)) {
                      currentQuestion = 'q3'
                      q3 = line.replace(/^q3[\s:]*/i, '').trim()
                    } else if (line.toLowerCase().startsWith('q4:') || line.match(/^q4[\s:]/i)) {
                      currentQuestion = 'q4'
                      const q4Text = line.replace(/^q4[\s:]*/i, '').trim()
                      // First line of Q4 should be YES/NO/MAYBE
                      const voteMatch = q4Text.match(/^(YES|NO|MAYBE)/i)
                      if (voteMatch) {
                        vote = voteMatch[1].toUpperCase() as 'YES' | 'NO' | 'MAYBE'
                        voteReason = q4Text.replace(/^(YES|NO|MAYBE)\s*/i, '').trim()
                      } else {
                        voteReason = q4Text
                      }
                    } else if (currentQuestion && line) {
                      // Append multi-line answers
                      const sep = (currentQuestion === 'q1' && q1) || (currentQuestion === 'q2' && q2) || (currentQuestion === 'q3' && q3) ? ' ' : ''
                      if (currentQuestion === 'q1') q1 += sep + line
                      else if (currentQuestion === 'q2') q2 += sep + line
                      else if (currentQuestion === 'q3') q3 += sep + line
                      else if (currentQuestion === 'q4') voteReason += sep + line
                    }

                    // Detect YES/NO/MAYBE at start of line for Q4 without label
                    const voteMatch = line.match(/^(YES|NO|MAYBE)\b/i)
                    if (voteMatch && currentQuestion !== 'q4') {
                      vote = voteMatch[1].toUpperCase() as 'YES' | 'NO' | 'MAYBE'
                      voteReason = line.replace(/^(YES|NO|MAYBE)\s*/i, '').trim()
                      currentQuestion = 'q4'
                    }
                  }

                  cloneResponses.push({
                    personaId,
                    anonymousId: personaId,
                    demographics: {},
                    answers: {
                      q1: q1 || 'No response',
                      q2: q2 || 'No response',
                      q3: q3 || 'No response',
                      vote: vote as 'YES' | 'NO' | 'MAYBE',
                      voteReason: voteReason || 'No reasoning provided',
                    },
                  })
                }
              }
            },
          })

          // Extract product title from first analyze_landing_page step
          const analyzeStep = result.reasoning.find(r => r.toolName === 'analyze_landing_page')
          if (analyzeStep?.output?.title) {
            productTitle = analyzeStep.output.title
          }

          allReasoning = result.reasoning

          // Log response breakdown
          console.log(`[ANALYZE] Received ${cloneResponses.length} responses from personas`)
          const { experienced, noExperience, noResponse } = categorizeResponses(cloneResponses)
          console.log(`[ANALYZE] Breakdown:`)
          console.log(`  - With Experience: ${experienced.length}`)
          console.log(`  - No Experience: ${noExperience.length}`)
          console.log(`  - No Response: ${noResponse.length}`)

          // Fetch demographics for each clone response
          for (const clone of cloneResponses) {
            try {
              const { data: persona } = await supabase
                .from('personas')
                .select('profession, location, age, gender')
                .eq('id', clone.personaId)
                .single()

              if (persona) {
                clone.demographics = {
                  age: persona.age,
                  gender: persona.gender,
                  profession: persona.profession,
                  location: persona.location,
                }
              }
            } catch (err) {
              // Persona not found or error fetching, continue with empty demographics
              console.error(`[ANALYZE] Failed to fetch demographics for persona ${clone.personaId}:`, err)
            }
          }

          // Build final result
          const finalResult = buildAnalysisResult(
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
