import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(`ERROR: ${msg.text()}`);
    }
  });
  
  page.on('response', res => {
    if (res.url().includes('/auth')) {
      logs.push(`${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log('\n=== Full OAuth Flow Test ===\n');
    console.log('Loading waitlist page...');
    await page.goto('http://localhost:3000/waitlist');
    
    await page.waitForTimeout(3000);
    console.log('Page loaded. Monitoring for 15 seconds...');
    console.log('\nTry clicking the Google login button in the browser window.');
    console.log('Watch for errors in the console output below.\n');
    
    await page.waitForTimeout(15000);
    
    console.log('\n=== Results ===');
    if (logs.length > 0) {
      logs.forEach(log => console.log(log));
    } else {
      console.log('No errors detected!');
    }
    
  } finally {
    await browser.close();
  }
})();
