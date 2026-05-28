const { chromium } = require('playwright');

async function debugSignup() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Opening signup page...');
    await page.goto('http://localhost:3000/auth/signup', { waitUntil: 'networkidle' });

    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testPassword = 'Test123456!';

    console.log(`\nFilling form with:`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);

    // Fill form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    console.log('\n✓ Form filled');
    console.log('Clicking Create account button...');

    // Click button and take screenshots
    await page.click('button:has-text("Create account")');

    // Wait a bit and take screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'after-signup-click.png' });

    console.log('\n✓ Screenshot saved: after-signup-click.png');

    // Check for error messages
    const errors = await page.locator('[class*="error"], [role="alert"]').allTextContents();
    if (errors.length > 0) {
      console.log('\n⚠️ Error messages found:');
      errors.forEach(e => console.log(`  - ${e}`));
    }

    // Check current URL
    console.log(`\nCurrent URL: ${page.url()}`);

    // Check for any loading/spinner elements
    const spinners = await page.locator('[class*="spinner"], [class*="loading"]').count();
    console.log(`Loading indicators visible: ${spinners}`);

    // Wait for navigation
    console.log('\nWaiting for navigation...');
    try {
      await page.waitForNavigation({ timeout: 10000 }).catch(() => null);
      console.log(`✓ Navigation detected. New URL: ${page.url()}`);
    } catch (err) {
      console.log(`✗ No navigation within 10 seconds`);
    }

    // Take final screenshot
    await page.screenshot({ path: 'final-state.png' });
    console.log('✓ Final screenshot saved: final-state.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugSignup();
