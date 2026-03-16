/**
 * Test callClone with a persona that has large interaction_history.
 * Run: npx tsx scripts/test-clone-large-history.ts [persona_id]
 * Default persona_id: 10 (from the error log)
 */
import 'dotenv/config'
import { callClone } from '../src/lib/langgraph-orchestrator'

const personaId = process.argv[2] || '10'
const sessionId = `test_${Date.now()}`

console.log('Calling clone', personaId, 'with session', sessionId)
console.log('This will invoke DeepSeek with truncated interaction_history...\n')

callClone(personaId, sessionId, 'What do you think about startup culture?', null)
  .then((response) => {
    console.log('\n--- Response ---')
    console.log(response)
    console.log('\nSUCCESS: Clone responded without context overflow')
  })
  .catch((err) => {
    console.error('\nFAILED:', err.message)
    if (err.message?.includes('maximum context length')) {
      console.error('Context overflow - truncation may not be working')
    }
    process.exit(1)
  })
