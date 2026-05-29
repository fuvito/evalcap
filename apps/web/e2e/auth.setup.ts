import { test as setup } from '@playwright/test'
import path from 'path'
import fs from 'fs'

export const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  // Write an empty storage state so the authenticated project can still load
  // even when credentials aren't configured (tests will skip themselves)
  const dir = path.dirname(authFile)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  if (!email || !password) {
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  await page.goto('/auth/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await page.context().storageState({ path: authFile })
})
