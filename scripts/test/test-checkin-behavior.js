const { chromium } = require('playwright');

async function testCheckinBehavior() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up dialog handler to log dialogs
  let dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push({
      type: dialog.type(),
      message: dialog.message()
    });
    console.log(`\n⚠️ Dialog appeared: ${dialog.message()}`);
    await dialog.dismiss();
  });

  try {
    console.log('🧪 Testing Checkin Page Behavior\n');
    console.log('═'.repeat(50));

    // Step 1: Navigate to checkin
    console.log('\n1️⃣ Loading checkin page...');
    await page.goto('http://localhost:3000/checkin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if we're on login or checkin
    const title = await page.locator('h1').first().textContent();
    console.log(`   Page title: "${title}"`);

    if (title?.includes('Welcome back')) {
      console.log('   ⚠️ User not authenticated - would need login credentials to test');
      console.log('   Skipping functional tests...\n');
      return;
    }

    // Get initial prompts
    const labels = await page.locator('label').filter({ has: page.locator('..').filter({ has: page.locator('textarea') }) }).all();
    console.log(`   Found ${labels.length} prompts`);

    const initialPrompts = [];
    for (let label of labels) {
      const text = await label.textContent();
      initialPrompts.push(text);
      console.log(`   - "${text.substring(0, 50)}..."`);
    }

    // Step 2: Add some answers
    console.log('\n2️⃣ Adding test answers...');
    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('Test answer 1');
      console.log('   ✓ Added answer to first field');
    }

    // Step 3: Reload page
    console.log('\n3️⃣ Reloading page...');
    dialogs = [];
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log(`   Dialogs during reload: ${dialogs.length}`);

    // Check if prompts are still the same
    const reloadedLabels = await page.locator('label').filter({ has: page.locator('..').filter({ has: page.locator('textarea') }) }).all();
    console.log(`   Found ${reloadedLabels.length} prompts after reload`);

    const reloadedPrompts = [];
    for (let label of reloadedLabels) {
      const text = await label.textContent();
      reloadedPrompts.push(text);
    }

    const promptsMatch = JSON.stringify(initialPrompts) === JSON.stringify(reloadedPrompts);
    console.log(`   Prompts match: ${promptsMatch ? '✓ YES' : '✗ NO'}`);

    // Check if answers persisted (they shouldn't based on current code)
    const firstTextarea = await page.locator('textarea').first().inputValue();
    console.log(`   First answer after reload: "${firstTextarea || '(empty)'}"`);

    // Step 4: Try switching check-in type
    console.log('\n4️⃣ Testing check-in type switch...');
    dialogs = [];
    const dailyButton = await page.locator('button:has-text("daily")').first();
    if (await dailyButton.isVisible()) {
      await dailyButton.click();
      await page.waitForTimeout(500);
      console.log(`   Dialogs shown: ${dialogs.length}`);
      if (dialogs.length > 0) {
        console.log(`   ✓ Warning shown: "${dialogs[0].message}"`);
      }
    }

    // Step 5: Try refresh prompts
    console.log('\n5️⃣ Testing refresh prompts button...');
    dialogs = [];

    // First, add an answer again
    const textareas2 = await page.locator('textarea').all();
    if (textareas2.length > 0) {
      await textareas2[0].fill('Test answer');
      console.log('   Added test answer');
    }

    const refreshBtn = await page.locator('button:has-text("Refresh")').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
      console.log(`   Dialogs shown: ${dialogs.length}`);
      if (dialogs.length > 0) {
        console.log(`   ✓ Warning shown: "${dialogs[0].message}"`);
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Testing complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

testCheckinBehavior();
