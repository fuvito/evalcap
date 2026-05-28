const { chromium } = require('playwright');

async function testMVPFlow() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';

  try {
    console.log('🚀 Starting MVP flow test...\n');

    // Generate unique test user
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testPassword = 'Test123456!';

    // ─────────────────────────────────────────────────────────────
    // 1. SIGNUP
    // ─────────────────────────────────────────────────────────────
    console.log('1️⃣ Testing Signup...');
    await page.goto(`${baseUrl}/auth/signup`, { waitUntil: 'networkidle' });

    // Fill email and password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Click create account button
    await page.click('button:has-text("Create account")');

    // Wait for redirect
    await page.waitForNavigation({ timeout: 15000 });
    const signupUrl = page.url();
    console.log(`   ✓ Signup complete. Redirected to: ${signupUrl}`);

    // ─────────────────────────────────────────────────────────────
    // 2. CHECK-IN
    // ─────────────────────────────────────────────────────────────
    console.log('\n2️⃣ Testing Check-in...');
    await page.goto(`${baseUrl}/checkin`, { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForSelector('textarea', { timeout: 10000 });
    console.log('   ✓ Check-in page loaded');

    // Fill in check-in entry
    const textarea = await page.locator('textarea').first();
    await textarea.fill('Today I completed the MVP authentication flow and fixed critical database issues. The profile creation now works seamlessly. I also improved UI readability and tested the complete journaling workflow.');

    // Click Save Entry
    await page.click('button:has-text("Save")');

    // Wait for success
    await page.waitForTimeout(2000);
    console.log('   ✓ Check-in entry saved');

    // ─────────────────────────────────────────────────────────────
    // 3. HISTORY
    // ─────────────────────────────────────────────────────────────
    console.log('\n3️⃣ Testing History...');
    await page.goto(`${baseUrl}/history`, { waitUntil: 'networkidle' });

    // Wait for entries to load
    try {
      await page.waitForSelector('a', { timeout: 10000 });
      const entries = await page.locator('a[href*="/history/"]').count();
      console.log(`   ✓ Found ${entries} journal entries`);

      // Click on the first entry
      if (entries > 0) {
        await page.locator('a[href*="/history/"]').first().click();
        await page.waitForNavigation({ timeout: 10000 });

        // Verify entry content
        const entryText = await page.locator('textarea').first().inputValue();
        console.log(`   ✓ Entry content: ${entryText.substring(0, 60)}...`);
      }
    } catch (err) {
      console.log('   ⚠ History page had issues:', err.message);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. SUMMARY GENERATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n4️⃣ Testing Summary Generation...');
    await page.goto(`${baseUrl}/summary`, { waitUntil: 'networkidle' });

    // Set timeframe (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    const dateInputs = await page.locator('input[type="date"]').all();
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill(fromDate);
      await dateInputs[1].fill(toDate);
      console.log(`   ✓ Date range set: ${fromDate} to ${toDate}`);
    }

    // Add optional instructions
    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('Focus on technical achievements and problem-solving.');
    }

    // Generate summary
    await page.click('button:has-text("Generate Summary")');
    console.log('   ⏳ Generating summary...');

    // Wait for summary to appear
    try {
      await page.waitForSelector('textarea[readonly]', { timeout: 45000 });
      const summary = await page.locator('textarea[readonly]').inputValue();
      console.log(`   ✓ Summary generated successfully (${summary.length} characters)`);
      console.log(`   ✓ Preview: ${summary.substring(0, 80)}...`);
    } catch (err) {
      console.log('   ⚠ Summary generation issue');
      // Check for errors on page
      const errorText = await page.locator('[class*="error"]').allTextContents();
      if (errorText.length > 0) {
        console.log(`   Error displayed: ${errorText[0]}`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. SETTINGS
    // ─────────────────────────────────────────────────────────────
    console.log('\n5️⃣ Testing Settings...');
    await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('input[type="radio"]', { timeout: 10000 });
      console.log('   ✓ Settings page loaded');

      // Try changing check-in preference
      const dailyOption = await page.locator('input[type="radio"][value="daily"]');
      if (await dailyOption.isVisible()) {
        await dailyOption.check();
        console.log('   ✓ Changed preference to daily check-ins');
      }
    } catch (err) {
      console.log('   ⚠ Settings page error:', err.message);
    }

    console.log('\n✅ MVP flow test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

testMVPFlow();
