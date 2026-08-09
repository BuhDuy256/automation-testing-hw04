import { test, expect } from '../../fixtures/base';
import { WEB_URL } from '../../utils/urls';
import { seedSession } from '../../utils/session';
import fixtureData from '../../data/fr-04-profile.json';

/**
 * FR-04 — phone validation, UI path.
 *
 * Oracle: eshop-sut/README.md FR-04 line 65 — "Số điện thoại hợp lệ: bắt đầu bằng số 0, từ
 * 10–11 chữ số." Expected values come from that line only, via data/fr-04-profile.json.
 * They are NOT derived from what the SUT does (plan §2 rule 1).
 *
 * Step 2 vertical smoke: one case exercising every HW04 §6 requirement at once —
 * external data, 3 assertion patterns, 3 browsers, Run-by-stamped report.
 */
const testCase = fixtureData.cases.find((c) => c.id === 'TC-04-BVA-002-UI');
if (!testCase) throw new Error('TC-04-BVA-002-UI missing from data/fr-04-profile.json');

const REJECTION_ALERT = /không hợp lệ/i;

test(`${testCase.id} — ${testCase.title}`, async ({ page, api, isolatedUser }) => {
  test.info().annotations.push(
    { type: 'HW02 case', description: testCase.hw02Ref },
    { type: 'Oracle', description: fixtureData.oracle.source },
    { type: 'Expected source', description: testCase.expectedSource },
  );

  // `Profile.jsx` reports validation failures through window.alert, which blocks the page
  // until handled. Collect every dialog so the messages become assertable evidence.
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await seedSession(page, isolatedUser.token);
  // See phone-boundary-ui.spec.ts for the rationale: 'load' waits on every Vite dev-server
  // subresource and timed out under parallel load. Same latent flake, fixed here too so the
  // combined FR-04 run is not exposed to a known cause.
  await page.goto(`${WEB_URL}/profile`, { waitUntil: 'domcontentloaded' });

  // Preconditions — hard assertions: if these fail the case never ran, so failing fast is right.
  const phoneField = page.getByPlaceholder('VD: 0912345678');
  await expect(phoneField, 'profile form did not render for the seeded session').toBeVisible();

  // Fill both editable fields the case specifies, so `phone` is the only spec-relevant variable
  // under test and the submitted payload is otherwise valid.
  await page.getByPlaceholder('Nhập địa chỉ của bạn').fill(testCase.input.shippingAddress);
  await phoneField.fill(testCase.input.phone);
  await expect(phoneField).toHaveValue(testCase.input.phone);

  // The form only issues PUT /api/users/me when its client-side check passes, so a rejected
  // input produces no response at all. Capture it as a value (null on timeout) and assert on
  // that value — this records "no request was made" as a failure rather than hiding it.
  const putResponse = await Promise.all([
    page
      .waitForResponse(
        (r) => r.url().includes('/api/users/me') && r.request().method() === 'PUT',
        { timeout: 5000 },
      )
      .catch(() => null),
    page.getByRole('button', { name: 'Cập nhật' }).click(),
  ]).then(([response]) => response);

  // Persisted state, read independently of the browser.
  const readBack = await api.get('/api/users/me', {
    headers: { Authorization: `Bearer ${isolatedUser.token}` },
  });
  expect(readBack.ok(), 'GET /api/users/me failed — cannot judge persistence').toBeTruthy();
  const persisted = await readBack.json();

  // --- The oracle. Soft so one run reports every way the spec was violated, not just the
  // --- first. A failure here means the SUT contradicts FR-04 line 65 — it does NOT mean the
  // --- expectation should be relaxed.

  // Pattern 1 — UI state.
  expect
    .soft(
      dialogs.filter((m) => REJECTION_ALERT.test(m)),
      `spec-valid phone "${testCase.input.phone}" (10 digits, leading 0) was rejected by the ` +
        `client-side check; FR-04 line 65 says it is valid`,
    )
    .toEqual([]);

  // Pattern 2 — network response.
  expect
    .soft(putResponse, 'no PUT /api/users/me was issued — the update never reached the backend')
    .not.toBeNull();
  expect.soft(putResponse?.status()).toBe(testCase.expected.putStatus);

  // Pattern 3 — persisted round-trip.
  expect
    .soft(persisted.phone, 'phone was not persisted as the spec-valid value')
    .toBe(testCase.expected.persistedPhone);
});
