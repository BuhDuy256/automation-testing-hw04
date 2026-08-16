import { type Page } from '@playwright/test';

/**
 * Puts a logged-in session in place before the app boots, by seeding the same localStorage key
 * the app itself uses (`AuthContext.jsx:8` reads `localStorage.getItem("token")` on mount, then
 * fetches `/api/users/me` and populates `user` from the real response).
 *
 * Why not drive the login form: signing in is *setup* for an FR-04 test, not its subject.
 * `Login.jsx` inputs carry no `type`/`name`/`id`, so a form-driven login would couple every
 * FR-04 test to FR-02's markup and make an unrelated regression look like an FR-04 failure.
 * Seeding is faithful — the app still performs its own authenticated fetch.
 *
 * Uses `addInitScript` so the value exists before any page script runs, on every navigation.
 */
export async function seedSession(page: Page, token: string): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem('token', value);
  }, token);
}
