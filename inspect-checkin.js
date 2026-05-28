const { chromium } = require('playwright');

async function inspectCheckin() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Loading checkin page...');
    await page.goto('http://localhost:3000/checkin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get all labels (prompts)
    const labels = await page.locator('label').all();
    console.log(`\nFound ${labels.length} labels\n`);

    for (let i = 0; i < Math.min(labels.length, 3); i++) {
      const label = labels[i];
      const text = await label.textContent();

      // Get computed styles
      const styles = await label.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          className: el.className,
          text: el.textContent.substring(0, 50)
        };
      });

      console.log(`Label ${i + 1}:`);
      console.log(`  Text: "${styles.text}..."`);
      console.log(`  Color (computed): ${styles.color}`);
      console.log(`  Background (computed): ${styles.backgroundColor}`);
      console.log(`  Font Size: ${styles.fontSize}`);
      console.log(`  Font Weight: ${styles.fontWeight}`);
      console.log(`  Classes: ${styles.className}`);
      console.log('');
    }

    // Take screenshot
    await page.screenshot({ path: 'checkin-inspection.png', fullPage: true });
    console.log('Screenshot saved: checkin-inspection.png');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

inspectCheckin();
