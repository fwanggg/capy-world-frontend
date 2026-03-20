/**
 * Mom Test v2 — 6 questions for product-market fit validation.
 * Single source of truth for prompts, orchestrator, API route, heatmap, and UX.
 */

export const MOM_TEST_V2 = {
  q1_validation: 'Walk me through the last time you experienced [X]. What were you doing right before that?',
  q2_alternatives: "How do you currently solve this today? What specific tools or 'hacks' are you using?",
  q3_impact: 'What was the fallout from that? How much time or money did that mistake cost you?',
  q4_search: "Have you looked for other solutions? Why haven't the ones on the market worked for you?",
  q5_commitment: "I'm building a fix for this—would you be willing to [Commitment: Time/Intro/Cash] to see the prototype?",
  q6_expansion: 'Who else do you know that is struggling with this exact workflow?',
} as const

export type MomTestQuestionKey = keyof typeof MOM_TEST_V2

/** Ordered list for UI iteration and heat map rows */
export const MOM_TEST_QUESTIONS: readonly { key: MomTestQuestionKey; label: string }[] = [
  { key: 'q1_validation', label: 'Validation' },
  { key: 'q2_alternatives', label: 'Alternatives' },
  { key: 'q3_impact', label: 'Impact' },
  { key: 'q4_search', label: 'Search' },
  { key: 'q5_commitment', label: 'Commitment' },
  { key: 'q6_expansion', label: 'Expansion' },
] as const
