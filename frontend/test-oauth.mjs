import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('request', req => {
    if (req.url().includes('/auth') || req.url().includes('google')) {
      console.log(`REQUEST: ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/auth') || res.url().includes('google')) {
      console.log(`RESPONSE: ${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log('\n=== Loading Waitlist Page ===\n');
    await page.goto('http://localhost:3000/waitlist');
    
    // Wait for any iframes to load
    await page.waitForTimeout(3000);
    
    console.log('\nPage frames:');
    page.frames().forEach((frame, i) => {
      console.log(`  Frame ${i}: ${frame.url()}`);
    });
    
    // Check page content
    const content = await page.textContent('body');
    if (content.includes('Join Copybar')) {
      console.log('\n✓ Page loaded correctly');
    }
    
    // Look for any divs with id starting with g_ (Google)
    const googleDivs = await page.locator('[id^="g_"]').count();
    console.log(`Found ${googleDivs} Google elements`);
    
    // Check for the div that typically holds GoogleLogin
    const divs = await page.locator('div[data-testid], div[role="button"]').count();
    console.log(`Found ${divs} interactive divs`);
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: '/tmp/oauth-page.png' });
    console.log('\nScreenshot saved to /tmp/oauth-page.png - check your browser window');
    
    console.log('\nWaiting 20 seconds... manually click the Google button if visible');
    await page.waitForTimeout(20000);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
