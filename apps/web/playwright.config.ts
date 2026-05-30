import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, 'e2e/.auth/user.json')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup — runs before the authenticated project
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Unauthenticated tests — public pages only, no credentials needed
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/auth\.setup\.ts/, /golden-path\.spec\.ts/],
    },

    // Authenticated golden-path tests — depends on setup writing auth state
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      testMatch: /golden-path\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1_000,
  },
})
