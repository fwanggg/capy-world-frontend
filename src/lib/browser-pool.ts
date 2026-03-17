/**
 * Singleton browser pool for Playwright.
 * Shares one Chromium browser process across all form submissions to minimize memory usage.
 * Each submission gets its own page (lightweight context).
 */

import { chromium, Browser, Page } from 'playwright'
import { log } from './logging'

let browserInstance: Browser | null = null
let initPromise: Promise<Browser> | null = null

/**
 * Get or launch the Chromium browser.
 * Auto-relaunches if browser crashes.
 */
export async function getBrowser(): Promise<Browser> {
  // Return existing browser if healthy
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance
  }

  if (browserInstance && !browserInstance.isConnected()) {
    log.warn('browser_pool.browser_crashed', 'Browser disconnected, relaunching', {
      sourceFile: 'browser-pool.ts',
      sourceLine: 19,
    })
    browserInstance = null
    initPromise = null
  }

  // Prevent concurrent launches - reuse initPromise if one is in flight
  if (initPromise) {
    return initPromise
  }

  // Create initialization promise to prevent race conditions
  initPromise = (async () => {
    log.info('browser_pool.launching', 'Launching Chromium browser', {
      sourceFile: 'browser-pool.ts',
      sourceLine: 34,
    })

    try {
      browserInstance = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage', // Reduce memory usage
        ],
      })

      log.info('browser_pool.launched', 'Browser launched successfully', {
        sourceFile: 'browser-pool.ts',
        sourceLine: 47,
      })

      return browserInstance
    } catch (err) {
      initPromise = null
      throw err
    }
  })()

  return initPromise
}

/**
 * Create a new page (context) in the browser.
 * Caller must close the page when done.
 */
export async function createPage(): Promise<Page> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  // Hide automation indicators
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    })
  })

  return page
}

/**
 * Close the shared browser (for graceful shutdown).
 * Called on process exit or explicit cleanup.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close()
      log.info('browser_pool.closed', 'Browser closed', {
        sourceFile: 'browser-pool.ts',
        sourceLine: 89,
      })
    } catch (err) {
      log.error('browser_pool.close_error', `Error closing browser: ${err}`, {
        sourceFile: 'browser-pool.ts',
        sourceLine: 93,
        metadata: { error: String(err) },
      })
    } finally {
      browserInstance = null
    }
  }
}

// Graceful shutdown on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    closeBrowser().catch(() => {})
  })
}
