import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './playwright-tests',
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})












