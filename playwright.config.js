const { defineConfig, devices } = require('@playwright/test');

const ENV = process.env.ENV || 'demo';
require('dotenv').config({ path: `.env.${ENV}`, quiet: true });

if (!process.env.BASE_URL) {
  throw new Error(`BASE_URL is not set. Create .env.${ENV} or set it in CI secrets.`);
}
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});