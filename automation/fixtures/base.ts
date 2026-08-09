import {
  test as base,
  expect,
  request as apiRequest,
  type APIRequestContext,
} from '@playwright/test';
import { API_URL } from '../utils/urls';
import { registerAndLogin, type IsolatedUser } from '../utils/api';

export const STUDENT_ID = '23127179';

export type WorkerFixtures = {
  /** API context bound to the backend, one per worker. */
  api: APIRequestContext;
  /** A user owned exclusively by this worker — never the seeded `test@eshop.com`. */
  isolatedUser: IsolatedUser;
};

/**
 * Every spec must import { test, expect } from here instead of '@playwright/test'.
 *
 * Two things are provided:
 *
 * 1. `runBy` (auto) — stamps each test with "Run by: {StudentID}" + an ISO timestamp, so the
 *    HW04 §11 anti-cheat evidence survives even if the HTML report title is overridden.
 *
 * 2. `isolatedUser` (worker-scoped) — a freshly registered account per worker. The suite runs
 *    3 browser projects in parallel against ONE shared SQLite database; without this, two
 *    workers mutating the same profile row would produce phantom failures that look like
 *    product defects. Worker scope (not test scope) keeps it to one registration per worker
 *    while still guaranteeing no cross-worker sharing, because a worker runs its tests
 *    serially.
 *
 *    Caveat, by design: tests *within* one worker share the account, so a test that needs a
 *    pristine profile must not assume defaults left by an earlier test — call
 *    `registerAndLogin(api, 'label')` directly for a private account instead.
 */
export const test = base.extend<{ runBy: void }, WorkerFixtures>({
  api: [
    async ({}, use) => {
      const context = await apiRequest.newContext({ baseURL: API_URL });
      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  isolatedUser: [
    async ({ api }, use, workerInfo) => {
      const user = await registerAndLogin(api, `w${workerInfo.workerIndex}`);
      await use(user);
    },
    { scope: 'worker' },
  ],

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
export type { IsolatedUser };
