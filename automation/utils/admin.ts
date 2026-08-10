import { randomBytes } from 'node:crypto';
import { expect, type APIRequestContext } from '@playwright/test';

/**
 * Admin authentication for FR-15.
 *
 * WHY THE SEEDED ADMIN ACCOUNT IS USED — a deliberate, reasoned exception to architecture §3.2's
 * "never depend on seeded data" rule, recorded in the FR-15 design report §5 risk 3:
 *
 *   `POST /api/register` inserts a user with NO role column set, so it always produces `role: 'user'`.
 *   There is no API that creates an admin. The only alternative would be to register a fresh user and
 *   self-escalate it via BUG-04-103 (issue #3) — which would make this entire suite depend on a filed
 *   security defect REMAINING UNFIXED. That is a far worse dependency than using the credential the
 *   SUT ships with.
 *
 * The account is used as a CREDENTIAL ONLY. Nothing is asserted about it, and nothing mutates it.
 * Every product these tests create is still uniquely marked and owned by the test that made it, so
 * the isolation property that matters here — "assert only on rows this test created" — is unaffected.
 */
const ADMIN_EMAIL = 'admin@eshop.com';
const ADMIN_PASSWORD = 'Admin123!';

/**
 * Module-scoped memoisation. Playwright runs each worker in its own process, so this yields exactly
 * one admin login per worker rather than one per test, without adding a fixture to the shared
 * `fixtures/base.ts` (which FR-04 and FR-08 specs both depend on).
 */
let cachedAdminToken: Promise<string> | null = null;

export function loginAsAdmin(api: APIRequestContext): Promise<string> {
  if (!cachedAdminToken) {
    cachedAdminToken = (async () => {
      const response = await api.post('/api/login', {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      expect(response.ok(), 'admin login failed — FR-15 cannot run without an admin token').toBeTruthy();
      const body = (await response.json()) as { token?: string; user?: { role?: string } };
      expect(
        body.user?.role,
        'the seeded admin account is no longer an admin — setup failure, not an FR-15 result',
      ).toBe('admin');
      expect(body.token, 'admin login returned no token').toBeTruthy();
      return body.token as string;
    })();
  }
  return cachedAdminToken;
}

export const adminAuth = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * A token unique to one test execution.
 *
 * Products are GLOBAL state (design report §5 risk 1): they belong to no user and are shared across
 * workers, projects and every previous run. This marker is what lets a test recognise its own row
 * without ever counting products — a count assertion would be broken by any parallel worker.
 *
 * It is generated here rather than frozen in the data file because its whole purpose is to differ
 * every run; it is identity infrastructure, not test data.
 */
export const productMarker = (caseId: string): string =>
  `FR15-${caseId}-${Date.now()}-${randomBytes(4).toString('hex')}`;

/**
 * Builds a name of EXACTLY `length` characters that still begins with the unique marker.
 *
 * Both properties are required at once and they pull against each other: the length boundary is the
 * thing under test, while global uniqueness is what keeps parallel runs from colliding. Padding a
 * marker out to the exact length satisfies both — the boundary is exact to the character, and no two
 * executions ever produce the same name.
 */
export function uniqueNameOfLength(marker: string, length: number): string {
  if (marker.length >= length) return marker.slice(0, length);
  return (marker + '-' + 'A'.repeat(length)).slice(0, length);
}
