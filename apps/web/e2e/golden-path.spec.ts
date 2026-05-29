import { test, expect } from '@playwright/test'

// Mocked responses — avoids Anthropic API costs in tests
const MOCK_PROMPTS = [
  'What did you accomplish since your last check-in?',
  'What are you currently working on?',
  'Any blockers or upcoming priorities to note?',
]

const MOCK_SUMMARY = [
  'Performance Review Summary',
  '',
  'Key Accomplishments:',
  '- Shipped the new onboarding flow, reducing time-to-first-entry by 60%.',
  '- Coordinated launch metrics with PM and secured sign-off for production.',
].join('\n')

test.describe('Golden path (authenticated)', () => {
  // Skip the entire suite when test credentials are not configured
  test.skip(!process.env.E2E_TEST_EMAIL, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests')

  test.beforeEach(async ({ page }) => {
    // Intercept AI routes — real DB operations remain untouched
    await page.route('/api/prompts', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ prompts: MOCK_PROMPTS }),
      })
    )
    await page.route('/api/summary', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ summary: MOCK_SUMMARY }),
      })
    )
  })

  // ── Dashboard ────────────────────────────────────────────────────────────

  test('dashboard loads with stats and streak', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Check-ins')).toBeVisible()
    await expect(page.getByText('Week Streak')).toBeVisible()
    await expect(page.getByText('Summaries Saved')).toBeVisible()
  })

  // ── Check-in ─────────────────────────────────────────────────────────────

  test('can complete a check-in and return to dashboard', async ({ page }) => {
    await page.goto('/checkin')
    await expect(page.getByRole('heading', { name: 'New Check-in' })).toBeVisible()

    // Daily / Weekly toggle visible
    await expect(page.getByRole('button', { name: 'daily' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'weekly' })).toBeVisible()

    // Mocked prompts render as textareas
    const textareas = page.getByPlaceholder('Write your response here...')
    await expect(textareas).toHaveCount(3, { timeout: 8_000 })

    // Fill at least one response so Save is enabled
    await textareas.first().fill('Delivered the end-to-end onboarding flow. Metrics look great.')

    const saveBtn = page.getByRole('button', { name: 'Save Check-in' })
    await expect(saveBtn).toBeEnabled()
    await saveBtn.click()

    // Redirects to dashboard after save
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
  })

  // ── History ───────────────────────────────────────────────────────────────

  test('history page shows entries and search filters work', async ({ page }) => {
    await page.goto('/history')
    await expect(page.getByRole('heading', { name: 'All Check-ins' })).toBeVisible()

    const searchInput = page.getByPlaceholder('Search entries...')
    await expect(searchInput).toBeVisible()

    const fromDate = page.locator('input[type="date"]').first()
    const toDate = page.locator('input[type="date"]').last()
    await expect(fromDate).toBeVisible()
    await expect(toDate).toBeVisible()

    // Check if entries exist before testing filtering
    const entries = page.locator('.space-y-2 > div')
    const count = await entries.count()

    if (count > 0) {
      // Search query with no match → shows empty state
      await searchInput.fill('zzz_definitely_no_match_xyz')
      await expect(page.getByText('No entries match')).toBeVisible()

      // Clear restores the list
      await page.getByRole('button', { name: 'Clear' }).click()
      await expect(searchInput).toHaveValue('')
      await expect(entries.first()).toBeVisible()

      // Date range filter
      await fromDate.fill('2099-01-01')
      await expect(page.getByText('No entries match')).toBeVisible()
      await page.getByRole('button', { name: 'Clear' }).click()
    }
  })

  // ── Summary ───────────────────────────────────────────────────────────────

  test('can generate and copy a summary', async ({ page }) => {
    await page.goto('/summary')
    await expect(page.getByRole('heading', { name: 'Generate Summary' })).toBeVisible()

    // Fill date range
    const dates = page.locator('input[type="date"]')
    await dates.first().fill('2026-01-01')
    await dates.last().fill('2026-12-31')

    await page.getByRole('button', { name: 'Generate Summary' }).click()

    // Mocked summary appears in the textarea
    await expect(page.getByText('Performance Review Summary')).toBeVisible({ timeout: 8_000 })

    // Copy button is present
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible()

    // Regenerate link is present
    await expect(page.getByRole('button', { name: /regenerate/i })).toBeVisible()
  })

  // ── Profile ───────────────────────────────────────────────────────────────

  test('profile page is editable', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    const editBtn = page.getByRole('button', { name: 'Edit' })
    await expect(editBtn).toBeVisible()

    await editBtn.click()
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()

    // Cancel returns to view mode
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(editBtn).toBeVisible()
  })

  // ── Settings ──────────────────────────────────────────────────────────────

  test('settings page loads and theme toggle works', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByText('Theme')).toBeVisible()
    await expect(page.getByText('Default Check-in Type')).toBeVisible()

    // Switch to dark mode
    await page.getByRole('button', { name: 'Dark' }).click()
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/, { timeout: 2_000 })

    // Switch back to system
    await page.getByRole('button', { name: 'System' }).click()
  })

  // ── Nav ───────────────────────────────────────────────────────────────────

  test('mobile nav opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')

    const hamburger = page.getByLabel('Toggle menu')
    await expect(hamburger).toBeVisible()

    await hamburger.click()
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Goals' })).toBeVisible()

    // Click a nav item — menu closes and navigates
    await page.getByRole('link', { name: 'History' }).click()
    await expect(page).toHaveURL('/history')
  })
})
