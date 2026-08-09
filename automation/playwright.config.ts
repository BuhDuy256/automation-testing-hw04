import { defineConfig, devices } from '@playwright/test';
import { STUDENT_ID } from './fixtures/base';

// Generated once at config load, so it reflects the moment this run started.
const RUN_STARTED_AT = new Date().toISOString();
const RUN_BY = `${STUDENT_ID} @ ${RUN_STARTED_AT}`;

/**
 * HW04 §6/§11 require the HTML report to *visibly* carry "Run by: {StudentID}" with an ISO
 * timestamp — it is anti-cheat evidence a TA verifies by eye. Three layers are applied
 * (see docs/implementation-plan/automation-architecture.md §3.6):
 *   1. reporter `title`      — PRIMARY; renders in the browser tab and the report header
 *   2. config `metadata`     — Metadata panel + JSON reporter
 *   3. per-test annotation   — fixtures/base.ts, visible on every individual test
 *
 * Layer 1 uses the reporter's `title` option (the reporter resolves
 * `process.env.PLAYWRIGHT_HTML_TITLE || options.title` — both work; the option keeps the value
 * in version control rather than in an env var a run could forget to set).
 *
 * Do NOT verify this with `grep "<title>"` on playwright-report/index.html: that tag is a static
 * shell tag permanently reading "Playwright Test Report". The real value is in report.json inside
 * a base64 zip embedded in that file, applied to document.title at runtime. Verify with
 * `npm run verify:report`, which decodes the payload.
 */
const REPORT_TITLE = `EShop Automation — Run by: ${STUDENT_ID} — ${RUN_STARTED_AT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  metadata: {
    'Run by': RUN_BY,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never', title: REPORT_TITLE }],
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
