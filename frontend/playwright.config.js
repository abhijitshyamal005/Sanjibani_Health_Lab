import { defineConfig, devices } from '@playwright/test';

const API_PORT = 5055;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // flows share one seeded database
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Uses the locally installed Google Chrome; run `npx playwright install chromium` and drop this to use bundled Chromium.
    channel: process.env.PW_CHANNEL ?? 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome' }, testIgnore: /mobile\.spec\.js/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL ?? 'chrome' }, testMatch: /mobile\.spec\.js/ },
  ],
  webServer: [
    {
      command: 'node scripts/e2e-server.js',
      cwd: '../backend',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { E2E_API_PORT: String(API_PORT), CLIENT_ORIGINS: `http://localhost:${WEB_PORT}`, UPI_ID: 'patholy-test@okhdfcbank', UPI_NAME: 'Patholy Test' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
