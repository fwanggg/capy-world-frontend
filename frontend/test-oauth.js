const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('response', res => {
    if (res.status() >= 400 && res.url().includes('localhost')) {
      console.log(`HTTP ERROR: ${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log('\n=== Testing OAuth Flow ===\n');
    await page.goto('http://localhost:3000/waitlist');
    await page.waitForTimeout(2000);
    
    console.log('Page loaded. Looking for Google button...');
    
    // List all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text}"`);
    }
    
    // Check for iframes (Google button is in iframe)
    const iframes = page.frames();
    console.log(`Found ${iframes.length} frames`);
    
    // Try clicking the first button
    if (buttons.length > 0) {
      console.log('\nAttempting to click first button...');
      await buttons[0].click();
      console.log('Clicked');
      
      // Wait and monitor for errors
      console.log('Waiting 10 seconds for OAuth response...');
      await page.waitForTimeout(10000);
    }
    
    console.log('\n=== Results ===');
    if (errors.length > 0) {
      console.log('Errors captured:');
      errors.forEach(e => console.log('  -', e));
    } else {
      console.log('No console errors captured');
    }
    
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
})();
