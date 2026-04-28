import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for HRMS Web UAT.
 *
 * Requires backend on http://localhost:3000 and frontend on http://localhost:4200.
 * Run `npm run seed:uat` (from HRMS-API_v1) before the first test run to create UAT users.
 */
export default defineConfig({
  testDir: './tests/e2e/specs',
  outputDir: './tests/e2e/test-results',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/e2e/html-report', open: 'never' }],
    ['json', { outputFile: 'tests/e2e/test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4200',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
