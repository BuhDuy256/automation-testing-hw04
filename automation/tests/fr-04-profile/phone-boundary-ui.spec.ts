import { test, expect } from '../../fixtures/base';
import { WEB_URL } from '../../utils/urls';
import { seedSession } from '../../utils/session';
import fixtureData from '../../data/fr-04-profile.json';

/**
 * FR-04 — Step 3 Batch A: the remaining UI-path phone boundary cases.
 *
 * Oracle: eshop-sut/README.md FR-04 line 65 — "Số điện thoại hợp lệ: bắt đầu bằng số 0, từ
 * 10–11 chữ số." Expected values come from data/fr-04-profile.json only, never from observed
 * behaviour (plan §2 rule 1).
 *
 * Completes the 5-point boundary set through the real browser form; the min point
 * (TC-04-BVA-002-UI, 10 digits) is already covered by phone-boundary.spec.ts.
 *
 * NOTE: some of these are expected to fail. BUG-04-101 (issue #1) shows Profile.jsx:43 uses
 * /^[1-9][0-9]{8,9}$/, whose leading [1-9] inverts the spec. Assertions here state what the
 * SPEC requires and are deliberately NOT relaxed to match that defect.
 */
const REJECTION_ALERT = /không hợp lệ/i;

type PersistenceRule = { mode: 'equals' | 'notEquals'; value: string };

const batchA = fixtureData.cases.filter((c) => c.batch === 'A');
if (batchA.length !== 4) {
  throw new Error(`expected 4 batch-A cases in fr-04-profile.json, found ${batchA.length}`);
}

for (const testCase of batchA) {
  test(`${testCase.id} — ${testCase.title}`, async ({ page, api, freshUser }) => {
    test.info().annotations.push(
      { type: 'HW02 case', description: testCase.hw02Ref },
      { type: 'Boundary point', description: testCase.boundaryPoint },
      { type: 'Spec class', description: testCase.expected.specClass },
      { type: 'Expected source', description: testCase.expectedSource },
    );

    // Profile.jsx reports validation failures through window.alert, which blocks the page until
    // handled. Collect every dialog so the message becomes assertable evidence.
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await seedSession(page, freshUser.token);
    await page.goto(`${WEB_URL}/profile`);

    // Preconditions — hard: if the form never rendered, the case did not run.
    const phoneField = page.getByPlaceholder('VD: 0912345678');
    await expect(phoneField, 'profile form did not render for the seeded session').toBeVisible();

    await page.getByPlaceholder('Nhập địa chỉ của bạn').fill(testCase.input.shippingAddress);
    await phoneField.fill(testCase.input.phone);
    await expect(phoneField).toHaveValue(testCase.input.phone);

    // The form only issues PUT /api/users/me once its client-side check passes, so a rejected
    // input produces no request at all. Capture it as a value (null on timeout) and assert on
    // that value, so "no request was made" is a readable failure rather than an opaque timeout.
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
      headers: { Authorization: `Bearer ${freshUser.token}` },
    });
    expect(readBack.ok(), 'GET /api/users/me failed — cannot judge persistence').toBeTruthy();
    const persisted = await readBack.json();

    // --- Oracle. Soft, so one run reports every way the spec was violated.

    // Pattern 1 — UI state.
    const rejections = dialogs.filter((m) => REJECTION_ALERT.test(m));
    if (testCase.expected.rejectedByUi) {
      expect
        .soft(
          rejections,
          `spec-invalid phone "${testCase.input.phone}" (${testCase.boundaryPoint}) was NOT ` +
            `rejected by the form; FR-04 line 65 says it is invalid`,
        )
        .not.toEqual([]);
    } else {
      expect
        .soft(
          rejections,
          `spec-valid phone "${testCase.input.phone}" (${testCase.boundaryPoint}) was rejected ` +
            `by the form; FR-04 line 65 says it is valid`,
        )
        .toEqual([]);
    }

    // Pattern 2 — network response.
    if (testCase.expected.putRequestIssued) {
      expect
        .soft(putResponse, 'no PUT /api/users/me was issued — the update never reached the backend')
        .not.toBeNull();
      expect.soft(putResponse?.status()).toBe(testCase.expected.putStatus);
    } else {
      expect
        .soft(
          putResponse,
          `PUT /api/users/me was issued for spec-invalid phone "${testCase.input.phone}" — an ` +
            `invalid value reached the backend`,
        )
        .toBeNull();
    }

    // Pattern 3 — persisted round-trip.
    const rule = testCase.expected.persistence as PersistenceRule;
    if (rule.mode === 'equals') {
      expect
        .soft(persisted.phone, 'spec-valid phone was not persisted')
        .toBe(rule.value);
    } else {
      expect
        .soft(
          persisted.phone,
          `spec-invalid phone "${rule.value}" ended up stored; FR-04 line 65 defines it as invalid`,
        )
        .not.toBe(rule.value);
    }
  });
}
