const { chromium } = require('playwright');

async function debugSignup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Opening signup page...');
    await page.goto('http://localhost:3000/auth/signup', { waitUntil: 'networkidle' });

    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Get all inputs
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);

    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const id = await inputs[i].getAttribute('id');
      console.log(`  Input ${i}: type=${type}, name=${name}, id=${id}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'signup-page.png' });
    console.log('Screenshot saved to signup-page.png');

    // Get page content
    const content = await page.content();
    if (content.includes('signup') || content.includes('Sign up')) {
      console.log('✓ Page contains signup form');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugSignup();
