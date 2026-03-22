export interface ScrapedPage {
  url: string
  title: string
  description: string
  bodyText: string // stripped HTML, max 8000 chars
  scrapedAt: string
  error?: string
}

const MIN_BODY_CHARS = 400 // If fetch yields less, likely a JS-rendered SPA — try Playwright

async function scrapeWithPlaywright(url: string): Promise<{ title: string; bodyText: string } | null> {
  try {
    const { createPage } = await import('./browser-pool')
    const page = await createPage()
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await new Promise((r) => setTimeout(r, 2000)) // Allow JS to render
      const title = await page.title()
      const bodyText = await page.evaluate(() => {
        const body = document.body
        if (!body) return ''
        const text = body.innerText || body.textContent || ''
        return text.replace(/\s+/g, ' ').trim().slice(0, 8000)
      })
      return { title, bodyText }
    } finally {
      await page.close().catch(() => {})
    }
  } catch (err) {
    if (process.env.DEBUG_SCRAPE) {
      console.error('[scrape-url] Playwright fallback failed:', err)
    }
    return null
  }
}

export async function scrapeLandingPage(url: string): Promise<ScrapedPage> {
  const timestamp = new Date().toISOString()

  try {
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        url,
        title: '',
        description: '',
        bodyText: '',
        scrapedAt: timestamp,
        error: 'URL must start with http:// or https://',
      }
    }

    // Fetch the page with timeout — use browser-like headers to avoid Cloudflare/bot blocking
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      return {
        url,
        title: '',
        description: '',
        bodyText: '',
        scrapedAt: timestamp,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    let title = titleMatch?.[1] ? titleMatch[1].trim() : ''

    // Extract meta description
    const descriptionMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
    )
    const description = descriptionMatch?.[1] ? descriptionMatch[1].trim() : ''

    // Strip all HTML tags and collapse whitespace
    let bodyText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim()
      .slice(0, 8000)

    // SPA fallback: if body is minimal, likely JS-rendered — try Playwright
    if (bodyText.length < MIN_BODY_CHARS) {
      const rendered = await scrapeWithPlaywright(url)
      if (rendered && rendered.bodyText.length > bodyText.length) {
        title = rendered.title || title
        bodyText = rendered.bodyText
      }
    }

    return {
      url,
      title,
      description,
      bodyText,
      scrapedAt: timestamp,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      url,
      title: '',
      description: '',
      bodyText: '',
      scrapedAt: timestamp,
      error: `Failed to fetch: ${errorMsg}`,
    }
  }
}
