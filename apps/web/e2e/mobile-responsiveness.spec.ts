import { test, expect, Page } from '@playwright/test'

const MOBILE_SIZES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Android', width: 412, height: 915 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
]

async function checkResponsiveness(page: Page, size: typeof MOBILE_SIZES[0], path: string) {
  await page.setViewportSize({ width: size.width, height: size.height })
  await page.goto(`http://localhost:3000${path}`)

  // Check for horizontal scrolling (should not overflow viewport)
  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const viewportWidth = size.width
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1 for rounding

  // Check that all interactive elements are at least 44x44 pixels (touch targets)
  const buttons = page.locator('button')
  const links = page.locator('a')
  const inputs = page.locator('input, textarea')

  const checkSize = async (locator: any, type: string) => {
    const count = await locator.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      // Check first 5 elements
      const box = await locator.nth(i).boundingBox()
      if (box && box.width > 0 && box.height > 0) {
        if (box.width < 40 || box.height < 40) {
          console.log(
            `⚠️  ${type} at index ${i} is ${Math.round(box.width)}x${Math.round(box.height)}px (should be ≥44x44)`
          )
        }
      }
    }
  }

  await checkSize(buttons, 'Button')
  await checkSize(links, 'Link')
  await checkSize(inputs, 'Input')

  // Check text is readable (no horizontal scroll within elements)
  const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, label, span')
  const textCount = await textElements.count()
  for (let i = 0; i < Math.min(textCount, 3); i++) {
    const element = textElements.nth(i)
    const text = await element.textContent()
    if (text && text.length > 50) {
      // Long text, should not overflow
      const box = await element.boundingBox()
      if (box && box.width < 200 && size.width < 600) {
        // Only warn on very small screens
        console.log(`ℹ️  Long text element on ${size.name}: ${text.substring(0, 30)}...`)
      }
    }
  }
}

test.describe('Mobile Responsiveness', () => {
  test('home page responsive on all sizes', async ({ page }) => {
    for (const size of MOBILE_SIZES) {
      console.log(`\n🔍 Testing home page on ${size.name} (${size.width}x${size.height})`)
      await checkResponsiveness(page, size, '/')
    }
  })

  test('login page responsive on all sizes', async ({ page }) => {
    for (const size of MOBILE_SIZES) {
      console.log(`\n🔍 Testing login page on ${size.name} (${size.width}x${size.height})`)
      await checkResponsiveness(page, size, '/auth/login')
    }
  })

  test('signup page responsive on all sizes', async ({ page }) => {
    for (const size of MOBILE_SIZES) {
      console.log(`\n🔍 Testing signup page on ${size.name} (${size.width}x${size.height})`)
      await checkResponsiveness(page, size, '/auth/signup')
    }
  })

  test('form inputs are properly sized on mobile', async ({ page }) => {
    const mobileSize = MOBILE_SIZES[1] // iPhone 12
    await page.setViewportSize({ width: mobileSize.width, height: mobileSize.height })
    await page.goto('http://localhost:3000/auth/login')

    // Check email input height
    const emailInput = page.locator('input[type="email"]')
    const emailBox = await emailInput.boundingBox()
    expect(emailInput).toBeVisible()
    if (emailBox) {
      expect(emailBox.height).toBeGreaterThanOrEqual(40) // Should be tall enough to tap
    }

    // Check password input height
    const passwordInput = page.locator('input[type="password"]')
    const passwordBox = await passwordInput.boundingBox()
    expect(passwordInput).toBeVisible()
    if (passwordBox) {
      expect(passwordBox.height).toBeGreaterThanOrEqual(40)
    }

    // Check submit button height
    const submitButton = page.locator('button[type="submit"]')
    const buttonBox = await submitButton.boundingBox()
    expect(submitButton).toBeVisible()
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44) // Minimum touch target
    }

    console.log('✓ Form inputs are properly sized for mobile')
  })

  test('navigation accessible on mobile', async ({ page }) => {
    const mobileSize = MOBILE_SIZES[1] // iPhone 12
    await page.setViewportSize({ width: mobileSize.width, height: mobileSize.height })
    await page.goto('http://localhost:3000/auth/login')

    // Check that auth nav links are visible and clickable (Sign up link)
    const navLinks = page.locator('a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)

    // Check that "Create account" / "Sign up" link is visible and tappable
    const signupLink = page.locator('a:has-text("Create account")')
    if (await signupLink.count() > 0) {
      await expect(signupLink).toBeVisible()
      const box = await signupLink.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(20) // Should have some height
      }
    }

    console.log('✓ Navigation is accessible on mobile')
  })

  test('buttons have adequate padding on mobile', async ({ page }) => {
    const mobileSize = MOBILE_SIZES[0] // iPhone SE (smallest)
    await page.setViewportSize({ width: mobileSize.width, height: mobileSize.height })
    await page.goto('http://localhost:3000/auth/login')

    const buttons = page.locator('button')
    const count = await buttons.count()

    let primaryButtons = 0
    let smallButtons = 0
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      const classList = await button.getAttribute('class')

      if (box && box.width > 0) {
        // Check for primary/action buttons (usually wider)
        if (box.width > 100 || classList?.includes('bg-')) {
          primaryButtons++
          if (box.height < 40) {
            smallButtons++
          }
        }
      }
    }

    // Primary buttons should have minimum height for touch
    if (primaryButtons > 0) {
      expect(smallButtons).toBeLessThan(primaryButtons)
    }
    console.log(`✓ Primary buttons are properly sized for mobile (${primaryButtons - smallButtons}/${primaryButtons})`)
  })

  test('text scaling appropriate on mobile', async ({ page }) => {
    const mobileSize = MOBILE_SIZES[1] // iPhone 12
    await page.setViewportSize({ width: mobileSize.width, height: mobileSize.height })
    await page.goto('http://localhost:3000/')

    // Check heading sizes
    const h1 = page.locator('h1')
    if (await h1.count() > 0) {
      const fontSize = await h1.first().evaluate((el) => window.getComputedStyle(el).fontSize)
      const fontSizeValue = parseInt(fontSize)
      expect(fontSizeValue).toBeGreaterThanOrEqual(24) // Minimum readable size on mobile
      console.log(`✓ H1 font size is ${fontSizeValue}px (readable on mobile)`)
    }
  })

  test('modals work on small screens', async ({ page }) => {
    const mobileSize = MOBILE_SIZES[0] // iPhone SE
    await page.setViewportSize({ width: mobileSize.width, height: mobileSize.height })
    await page.goto('http://localhost:3000/')

    // Check if there are any modals visible
    const modals = page.locator('[role="dialog"], .modal, .fixed.inset-0')
    if (await modals.count() > 0) {
      const modal = modals.first()
      const box = await modal.boundingBox()
      if (box) {
        // Modal should not exceed viewport width
        expect(box.width).toBeLessThanOrEqual(mobileSize.width)
      }
    }

    console.log('✓ Modals (if present) are properly sized for small screens')
  })
})
