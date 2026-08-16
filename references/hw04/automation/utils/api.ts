import { type APIRequestContext } from '@playwright/test';
import { randomBytes } from 'node:crypto';

export type IsolatedUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  token: string;
};

/** Password used for every generated user. Meets no particular rule — the SUT enforces none. */
export const TEST_PASSWORD = 'Hw04Test!234';

/**
 * Registers a brand-new user and logs it in, returning its id + JWT.
 *
 * Why a fresh user rather than the seeded `test@eshop.com`: the suite runs 3 browser projects
 * in parallel against ONE shared SQLite database, so any two workers touching the same row
 * would race. It also removes the dependency on `backend/database.js` re-seeding on every
 * backend restart.
 *
 * Uniqueness is our responsibility: `users.email` has NO UNIQUE constraint in the SUT schema,
 * and `POST /api/login` resolves an email with `db.get` (first match wins). A collision would
 * therefore hand two workers the same account and break isolation *silently*, so the local
 * part combines a caller label, a timestamp and 4 random bytes.
 */
export async function registerAndLogin(
  api: APIRequestContext,
  label: string,
): Promise<IsolatedUser> {
  const email = `hw04-${label}-${Date.now()}-${randomBytes(4).toString('hex')}@eshop.test`;
  const name = `HW04 ${label}`;

  const registered = await api.post('/api/register', {
    data: { name, email, password: TEST_PASSWORD },
  });
  if (!registered.ok()) {
    throw new Error(
      `register failed for ${email}: ${registered.status()} ${await registered.text()}`,
    );
  }

  const loggedIn = await api.post('/api/login', {
    data: { email, password: TEST_PASSWORD },
  });
  if (!loggedIn.ok()) {
    throw new Error(`login failed for ${email}: ${loggedIn.status()} ${await loggedIn.text()}`);
  }

  const body = await loggedIn.json();
  if (!body.token || !body.user?.id) {
    throw new Error(`login response missing token/user for ${email}: ${JSON.stringify(body)}`);
  }

  return { id: body.user.id, name, email, password: TEST_PASSWORD, token: body.token };
}
