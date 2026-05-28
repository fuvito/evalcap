const { chromium } = require('playwright');

async function captureProfile() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Capturing profile page...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'profile-page-fixed.png' });
    console.log('✓ Saved to profile-page-fixed.png');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

captureProfile();
