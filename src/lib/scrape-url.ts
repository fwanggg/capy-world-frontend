export interface ScrapedPage {
  url: string
  title: string
  description: string
  bodyText: string // stripped HTML, max 8000 chars
  scrapedAt: string
  error?: string
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

    // Fetch the page with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'CapybaraBot/1.0',
        },
        signal: controller.signal,
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
    const title = titleMatch?.[1] ? titleMatch[1].trim() : ''

    // Extract meta description
    const descriptionMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
    )
    const description = descriptionMatch?.[1] ? descriptionMatch[1].trim() : ''

    // Strip all HTML tags and collapse whitespace
    const bodyText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim()
      .slice(0, 8000)

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
