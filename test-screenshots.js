const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';

  // Create screenshots directory
  const screenshotDir = 'mvp-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  const pages = [
    { name: 'dashboard', url: '/dashboard' },
    { name: 'checkin', url: '/checkin' },
    { name: 'history', url: '/history' },
    { name: 'summary', url: '/summary' },
    { name: 'settings', url: '/settings' },
  ];

  try {
    for (const p of pages) {
      try {
        console.log(`Capturing ${p.name}...`);
        await page.goto(`${baseUrl}${p.url}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const filename = path.join(screenshotDir, `${p.name}.png`);
        await page.screenshot({ path: filename });
        console.log(`  ✓ Saved to ${filename}`);

        // Also capture console errors
        const errors = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"]');
          return Array.from(errorElements).map(el => el.textContent);
        });

        if (errors.length > 0) {
          console.log(`  Errors found: ${errors.join(', ')}`);
        }
      } catch (err) {
        console.log(`  ✗ Failed: ${err.message}`);
      }
    }

    console.log('\n✓ Screenshots saved to mvp-screenshots/');

  } finally {
    await browser.close();
  }
}

captureScreenshots();
