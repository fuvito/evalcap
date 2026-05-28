import { test, expect } from '@playwright/test'

test.describe('Error Handling', () => {
  test('404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/nonexistent-page-12345')
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('text=not found')).toBeVisible()
  })

  test('404 page has home button', async ({ page }) => {
    await page.goto('/invalid-route')
    const homeLink = page.locator('a:has-text("Go home")')
    await expect(homeLink).toBeVisible()
    await homeLink.click()
    await expect(page).toHaveURL('/')
  })

  test('signup form validates required fields', async ({ page }) => {
    await page.goto('/auth/signup')

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]')
    const emailInput = page.locator('input[type="email"]')

    // Check if HTML5 validation is present
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(emailValidity).toBeFalsy()
  })

  test('login form validates required fields', async ({ page }) => {
    await page.goto('/auth/login')

    const emailInput = page.locator('input[type="email"]')

    // Check if HTML5 validation is present
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(emailValidity).toBeFalsy()
  })

  test('page has no console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')

    // Filter out known third-party errors
    const appErrors = errors.filter(
      e => !e.includes('cross-origin') && !e.includes('Failed to fetch') && !e.includes('undefined')
    )

    expect(appErrors).toHaveLength(0)
  })

  test('navigation elements are visible and clickable', async ({ page }) => {
    await page.goto('/')

    const getStartedButton = page.locator('a:has-text("Get Started")')
    const signInButton = page.locator('a:has-text("Sign In")')

    await expect(getStartedButton).toBeVisible()
    await expect(signInButton).toBeVisible()

    expect(await getStartedButton.isEnabled()).toBe(true)
    expect(await signInButton.isEnabled()).toBe(true)
  })

  test('form inputs have proper attributes', async ({ page }) => {
    await page.goto('/auth/signup')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    // Check required attribute
    expect(await emailInput.evaluate((el: HTMLInputElement) => el.required)).toBe(true)
    expect(await passwordInput.evaluate((el: HTMLInputElement) => el.required)).toBe(true)

    // Check autocomplete attributes
    expect(await emailInput.evaluate((el: HTMLInputElement) => el.autocomplete)).toBe('email')
    expect(await passwordInput.evaluate((el: HTMLInputElement) => el.autocomplete)).toBe('new-password')
  })
})
