#!/usr/bin/env npx tsx
/** Run: npm run test:scrape (requires .env for Playwright fallback via browser-pool) */
import 'dotenv/config'
const mod = await import('../src/lib/scrape-url')
const scrapeLandingPage = mod.scrapeLandingPage

async function main() {
  const url = 'https://rika-ai.com/'
  console.log('Fetching', url, '...')
  const start = Date.now()
  const result = await scrapeLandingPage(url)
  console.log('Duration:', Date.now() - start, 'ms')
  console.log('Error:', result.error ?? 'none')
  console.log('Title:', result.title)
  console.log('Description:', result.description?.slice(0, 80) ?? '(empty)')
  console.log('bodyText length:', result.bodyText?.length ?? 0)
  console.log('bodyText preview:\n', result.bodyText?.slice(0, 800) ?? '(empty)')
}

main().catch((e) => {
  console.error('Failed:', e)
  process.exit(1)
})
