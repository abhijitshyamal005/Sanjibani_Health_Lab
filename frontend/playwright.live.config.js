import { defineConfig, devices } from '@playwright/test';

// Smoke tests against a deployed site (no local servers started).
export default defineConfig({
  testDir: './e2e-live',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.LIVE_URL ?? 'https://patholy.dpdns.org',
    trace: 'retain-on-failure',
    channel: process.env.PW_CHANNEL ?? 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL ?? 'chrome' } },
  ],
});
