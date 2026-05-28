const { chromium } = require('playwright');

async function captureCheckin() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Capturing checkin page...');
    await page.goto('http://localhost:3000/checkin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'checkin-page-current.png' });
    console.log('✓ Saved to checkin-page-current.png');

    // Also get details about visible elements
    const prompts = await page.locator('label').allTextContents();
    console.log('Prompts found:', prompts.length);
    if (prompts.length > 0) {
      console.log('First prompt:', prompts[0].substring(0, 50));
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

captureCheckin();
