const { chromium } = require('playwright');

async function testMVPFlow() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';

  try {
    console.log('🚀 MVP Flow Test\n');
    console.log('Note: Testing with existing account due to Supabase rate limiting on signups\n');

    // Use an account that's likely already been created
    const testEmail = 'evalcap-test@example.com';
    const testPassword = 'Test123456!';

    // ─────────────────────────────────────────────────────────────
    // 1. TRY LOGIN (or SIGNUP if needed)
    // ─────────────────────────────────────────────────────────────
    console.log('1️⃣ Testing Authentication...');
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });

    // Try to fill login form
    try {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button:has-text("Sign in")');

      // Wait for navigation
      try {
        await page.waitForNavigation({ timeout: 10000 });
        console.log(`   ✓ Login successful. Redirected to: ${page.url()}`);
      } catch (err) {
        console.log('   ℹ Login returned to same page (may need signup)');

        // Try signup instead
        await page.goto(`${baseUrl}/auth/signup`);
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button:has-text("Create account")');

        try {
          await page.waitForNavigation({ timeout: 10000 });
          console.log(`   ✓ Signup successful. Redirected to: ${page.url()}`);
        } catch (signupErr) {
          console.log(`   ⚠ Signup/Login failed: ${signupErr.message}`);
          const errorMsg = await page.locator('[class*="error"]').first().textContent();
          if (errorMsg) console.log(`   Error: ${errorMsg.trim()}`);
        }
      }
    } catch (err) {
      console.log(`   ⚠ Auth failed: ${err.message}`);
    }

    // Check if we're authenticated by looking for dashboard content
    const isAuthenticated = page.url().includes('dashboard') ||
                          page.url().includes('checkin') ||
                          page.url().includes('history');

    if (!isAuthenticated) {
      console.log('\n⚠️ Authentication check: Page still on auth route');
      console.log('Current URL:', page.url());
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DASHBOARD
    // ─────────────────────────────────────────────────────────────
    console.log('\n2️⃣ Testing Dashboard...');
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    const dashboardLoaded = await page.locator('h1, h2').first().isVisible().catch(() => false);
    if (dashboardLoaded) {
      const title = await page.locator('h1, h2').first().textContent();
      console.log(`   ✓ Dashboard loaded: "${title?.trim()}"`);
    } else {
      console.log('   ⚠ Dashboard might not have loaded properly');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. CHECK-IN PAGE
    // ─────────────────────────────────────────────────────────────
    console.log('\n3️⃣ Testing Check-in Page...');
    await page.goto(`${baseUrl}/checkin`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('textarea', { timeout: 5000 });
      console.log('   ✓ Check-in page loaded with textarea');

      // Check if there are prompts available
      const prompts = await page.locator('button:has-text("Use this prompt")').count();
      console.log(`   ✓ Found ${prompts} available prompts`);
    } catch (err) {
      console.log(`   ⚠ Check-in page issue: ${err.message}`);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. HISTORY PAGE
    // ─────────────────────────────────────────────────────────────
    console.log('\n4️⃣ Testing History Page...');
    await page.goto(`${baseUrl}/history`, { waitUntil: 'networkidle' });

    try {
      // Wait for list to load
      const entries = await page.locator('a[href*="/history/"]').count();
      if (entries > 0) {
        console.log(`   ✓ History loaded: Found ${entries} entries`);
      } else {
        console.log('   ℹ History page empty (no entries yet)');
      }
    } catch (err) {
      console.log(`   ⚠ History page issue: ${err.message}`);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. SUMMARY PAGE
    // ─────────────────────────────────────────────────────────────
    console.log('\n5️⃣ Testing Summary Page...');
    await page.goto(`${baseUrl}/summary`, { waitUntil: 'networkidle' });

    try {
      const dateInputs = await page.locator('input[type="date"]').count();
      if (dateInputs >= 2) {
        console.log(`   ✓ Summary page loaded with date inputs`);
      } else {
        console.log('   ⚠ Summary page missing date inputs');
      }
    } catch (err) {
      console.log(`   ⚠ Summary page issue: ${err.message}`);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. SETTINGS PAGE
    // ─────────────────────────────────────────────────────────────
    console.log('\n6️⃣ Testing Settings Page...');
    await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle' });

    try {
      const radioButtons = await page.locator('input[type="radio"]').count();
      if (radioButtons > 0) {
        console.log(`   ✓ Settings page loaded with preferences`);
      } else {
        console.log('   ⚠ Settings page missing radio buttons');
      }

      const errorMsg = await page.locator('[class*="error"]').first().textContent().catch(() => null);
      if (errorMsg && errorMsg.trim()) {
        console.log(`   Error: ${errorMsg.trim()}`);
      }
    } catch (err) {
      console.log(`   ⚠ Settings page issue: ${err.message}`);
    }

    console.log('\n✅ MVP flow test completed!\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  } finally {
    await browser.close();
  }
}

testMVPFlow();
