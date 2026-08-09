import { test as base, expect } from '@playwright/test';

export const STUDENT_ID = '23127179';

/**
 * Every spec must import { test, expect } from here instead of '@playwright/test'.
 * The `runBy` fixture is auto-applied and stamps each test with "Run by: {StudentID}"
 * plus an ISO timestamp, satisfying HW04 §11's anti-cheat evidence requirement even if
 * the HTML report title/footer is stripped or overridden.
 */
export const test = base.extend<{ runBy: void }>({
  runBy: [
    async ({}, use, testInfo) => {
      testInfo.annotations.push({
        type: 'Run by',
        description: `${STUDENT_ID} @ ${new Date().toISOString()}`,
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect };
