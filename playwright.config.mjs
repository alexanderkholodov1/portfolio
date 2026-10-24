import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', headless: true },
  webServer: { command: 'node tests/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 10000 },
});
