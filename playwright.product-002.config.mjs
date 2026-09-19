import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'product-002-cross-browser.spec.mjs',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  reporter: [['line'], ['json', { outputFile: 'docs/product-002/review/phase25-playwright-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4323',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  metadata: { task: 'PRODUCT-002 Phase 2.5 cross-browser closeout' },
});
