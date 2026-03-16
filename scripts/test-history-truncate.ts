/**
 * Test interaction_history truncation with large history.
 * Run: npx tsx scripts/test-history-truncate.ts
 */
import 'dotenv/config'
import { buildPersonaPrompt } from '../src/lib/langgraph-orchestrator'

function estimateTokens(str: string): number {
  return Math.ceil(str.length / 4)
}

function makeLargeHistory(targetTokens: number): { posts: any[]; comments: any[] } {
  const posts: any[] = []
  const comments: any[] = []
  const chunk = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20) // ~50 chars * 20 = 1000 chars ≈ 250 tokens
  let total = 0
  for (let i = 0; total < targetTokens * 4; i++) {
    const p = { content: chunk + ` Post ${i}`, score: 100 - i }
    posts.push(p)
    total += JSON.stringify(p).length
  }
  for (let i = 0; total < targetTokens * 4 * 2; i++) {
    const c = {
      content: chunk + ` Comment ${i}`,
      score: 50 - i,
      linked_content: { body: chunk + ` Replied to ${i}` },
      replying_to_ref: `ref_${i}`,
    }
    comments.push(c)
    total += JSON.stringify(c).length
  }
  return { posts, comments }
}

const LARGE = 200000 // target ~200k tokens (would exceed 131072)
const { posts, comments } = makeLargeHistory(LARGE)
const rawHistory = { posts, comments }
const rawTokens = estimateTokens(JSON.stringify(rawHistory))

console.log('Raw history:', { posts: posts.length, comments: comments.length, estTokens: rawTokens })

const prompt = buildPersonaPrompt(rawHistory)
const promptTokens = estimateTokens(prompt)

console.log('After buildPersonaPrompt:', { promptLength: prompt.length, estTokens: promptTokens })
console.log('Under 131072?', promptTokens < 131072 ? 'YES' : 'NO')

if (promptTokens >= 131072) {
  console.error('FAIL: Prompt still exceeds context limit')
  process.exit(1)
}
console.log('PASS: Truncation keeps prompt under limit')
