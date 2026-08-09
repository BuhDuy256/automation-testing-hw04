import { defineConfig, devices } from '@playwright/test';
import { STUDENT_ID } from './fixtures/base';

const RUN_BY = `${STUDENT_ID} @ ${new Date().toISOString()}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Shown in the HTML report's Metadata panel and serialized into the JSON reporter —
  // satisfies HW04 §6/§11's "Run by: {StudentID}" + ISO-timestamp requirement at the
  // report level. fixtures/base.ts stamps the same info per-test as a second layer.
  metadata: {
    'Run by': RUN_BY,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
