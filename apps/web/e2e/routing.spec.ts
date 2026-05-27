import { test, expect } from '@playwright/test'

test.describe('Routing', () => {
  test('home page accessible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('EvalCap')
    await expect(page.locator('a:has-text("Get Started")')).toBeVisible()
  })

  test('signup page accessible', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('h1')).toContainText('Create account')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('login page accessible', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h1')).toContainText('Welcome back')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('dashboard page exists', async ({ page }) => {
    const response = await page.goto('/dashboard')
    expect(response?.status()).not.toBe(404)
  })

  test('checkin page exists', async ({ page }) => {
    const response = await page.goto('/checkin')
    expect(response?.status()).not.toBe(404)
  })

  test('history page exists', async ({ page }) => {
    const response = await page.goto('/history')
    expect(response?.status()).not.toBe(404)
  })

  test('summary page exists', async ({ page }) => {
    const response = await page.goto('/summary')
    expect(response?.status()).not.toBe(404)
  })

  test('404 page for invalid route', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-xyz123')
    expect(response?.status()).toBe(404)
    // Just check that page contains error messaging
    const content = await page.content()
    expect(content).toMatch(/404|not found/i)
  })

  test('signup button navigates to signup page', async ({ page }) => {
    await page.goto('/')
    await page.click('a:has-text("Get Started")')
    await expect(page).toHaveURL('/auth/signup')
  })

  test('signin button navigates to login page', async ({ page }) => {
    await page.goto('/')
    await page.click('a:has-text("Sign In")')
    await expect(page).toHaveURL('/auth/login')
  })

  test('signup has link to login', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.click('text=Sign in')
    await expect(page).toHaveURL('/auth/login')
  })

  test('login has link to signup', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/auth/signup')
  })
})
