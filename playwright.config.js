import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'visual-preview.test.js',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
