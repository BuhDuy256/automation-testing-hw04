import { test, expect } from '../../fixtures/base';
import fixtureData from '../../data/fr-04-profile.json';

/**
 * FR-04 — Step 3 Batch B: the API-path phone boundary cases.
 *
 * Oracle: eshop-sut/README.md FR-04 line 65 — "Số điện thoại hợp lệ: bắt đầu bằng số 0, từ
 * 10–11 chữ số." Expected values come from data/fr-04-profile.json only, never from observed
 * behaviour (plan §2 rule 1).
 *
 * WHY APIRequestContext AND NOT THE UI (architecture §3.1):
 * these cases assert what the BACKEND stores. BUG-04-101 (issue #1) shows the client-side regex
 * rejects every leading-`0` value, so for four of these five inputs the backend is simply
 * unreachable through the form — a direct request is the only way to observe its behaviour.
 *
 * WHY THIS IS NOT A RESTATEMENT OF BATCH A:
 * Batch A exercised the frontend regex. Batch A's TC-04-BVA-005-UI did reach the backend (the
 * regex wrongly accepts leading-`1`), but only as a compound result: "UI accepts AND backend
 * stores". TC-04-BVA-010-API isolates the second half. That isolation is the evidence for
 * BUG-04-102's central claim — that the missing backend validation SURVIVES any frontend fix —
 * because this case would still fail with Profile.jsx corrected.
 *
 * ORACLE NOTE — why invalid cases assert `not.toBe` and never a status code:
 * `api_specification.md` §2.2 documents only the request shape for PUT /api/users/me. It defines
 * no validation rule and no error-response contract, and README line 65 says nothing about HOW an
 * invalid value must be refused. Asserting `400`, or `phone === null`, would invent an oracle the
 * spec does not state and could fail a compliant implementation that chose to coerce instead.
 * The frozen expectation is exactly HW02's: the invalid value must not end up stored.
 *
 * NOTE: some of these are expected to fail — BUG-04-102 (issue #2) shows server.js:118-135 has no
 * phone validation at all. Assertions state what the SPEC requires and are NOT relaxed to match.
 *
 * BROWSER COVERAGE — be honest about this: these tests never request the `page` fixture, so no
 * browser is launched. They still execute once per configured project, but three identical
 * backend results are NOT evidence of cross-browser behaviour. HW04 §6's multi-browser
 * requirement is carried by the UI cases (the smoke + Batch A); these ride the same matrix for
 * uniformity only, and the reports must say so rather than inflate the browser-run count.
 */
type PersistenceRule = { mode: 'equals' | 'notEquals'; value: string };

const batchB = fixtureData.cases.filter((c) => c.batch === 'B');
if (batchB.length !== 5) {
  throw new Error(`expected 5 batch-B cases in fr-04-profile.json, found ${batchB.length}`);
}

for (const testCase of batchB) {
  test(`${testCase.id} — ${testCase.title}`, async ({ api, freshUser }) => {
    test.info().annotations.push(
      { type: 'HW02 case', description: testCase.hw02Ref },
      { type: 'Boundary point', description: testCase.boundaryPoint },
      { type: 'Spec class', description: testCase.expected.specClass },
      { type: 'Expected source', description: testCase.expectedSource },
    );

    const auth = { Authorization: `Bearer ${freshUser.token}` };

    // Send name and shipping_address as valid values so `phone` is the only variable under test
    // (HW02 step 2 for this case family).
    const updateResponse = await api.put('/api/users/me', {
      headers: auth,
      data: {
        name: testCase.input.name,
        shipping_address: testCase.input.shippingAddress,
        phone: testCase.input.phone,
      },
    });

    // Recorded as evidence, not asserted for invalid inputs — the spec prescribes no status code
    // for a refusal, so any assertion on it would be invented.
    test.info().annotations.push({
      type: 'PUT status',
      description: String(updateResponse.status()),
    });

    const readBack = await api.get('/api/users/me', { headers: auth });
    expect(readBack.ok(), 'GET /api/users/me failed — cannot judge persistence').toBeTruthy();
    const persisted = await readBack.json();

    // --- Oracle. Soft, so one run reports every way the spec was violated.

    // A spec-valid update must succeed; the spec is silent on the refusal mechanism for invalid
    // input, so no status assertion is made in that direction.
    if (testCase.expected.requestMustSucceed) {
      expect
        .soft(
          updateResponse.ok(),
          `PUT /api/users/me refused spec-valid phone "${testCase.input.phone}" ` +
            `(${testCase.boundaryPoint}); FR-04 line 65 says it is valid ` +
            `(status ${updateResponse.status()})`,
        )
        .toBeTruthy();
    }

    const rule = testCase.expected.persistence as PersistenceRule;
    if (rule.mode === 'equals') {
      expect
        .soft(
          persisted.phone,
          `spec-valid phone "${rule.value}" (${testCase.boundaryPoint}) was not persisted; ` +
            `FR-04 line 65 defines it as valid`,
        )
        .toBe(rule.value);
    } else {
      expect
        .soft(
          persisted.phone,
          `spec-invalid phone "${rule.value}" (${testCase.boundaryPoint}) ended up stored; ` +
            `FR-04 line 65 defines it as invalid. The spec does not prescribe HOW it must be ` +
            `refused — only that this exact value must not be the stored result`,
        )
        .not.toBe(rule.value);
    }

    // The account is private to this test (freshUser), so email is a reliable check that the
    // write landed on the intended row and not a shared/seeded account.
    expect.soft(persisted.email, 'read-back returned a different account').toBe(freshUser.email);
  });
}
