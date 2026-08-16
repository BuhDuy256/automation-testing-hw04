import { test, expect } from '../../fixtures/base';
import { WEB_URL } from '../../utils/urls';
import { seedSession } from '../../utils/session';
import fixtureData from '../../data/fr-04-profile.json';

/**
 * FR-04 — Step 3 Batch C: the six Equivalence Partitioning cases.
 *
 * Oracle sources, per case, from data/fr-04-profile.json only (plan §2 rule 1):
 *   EP-001  README FR-04 line 64  — the three user-updatable fields
 *   EP-002  HW02 assumption A2 (accepted) — empty `name` is an invalid class
 *   EP-003  HW02 assumption A3 (accepted) — empty `shipping_address` is a valid class
 *   EP-004  README FR-04 line 65  — phone validity, path-agnostic
 *   EP-005  README line 67 + SEC-06 line 283 — `role` is forbidden from the client
 *   EP-006  README line 66 — email is not changeable "qua giao diện"
 *
 * Unlike batches A and B these cases assert different things, so each is its own `test` block
 * reading its own frozen case object. Values stay external; only the assertion logic is here.
 *
 * BROWSER COVERAGE: five of the six are API-path and never request the `page` fixture, so no
 * browser launches for them — they run once per project for matrix uniformity and are NOT
 * cross-browser evidence. Only EP-006's UI half exercises a real browser. HW04 §6's
 * multi-browser requirement is carried by the Step 2 smoke + Batch A.
 *
 * Known defects are NOT accommodated: BUG-04-101 (issue #1) and BUG-04-102 (issue #2) mean some
 * of these are expected to fail. Assertions state what the spec requires.
 */
type FieldRule = { mode: 'equals' | 'notEquals'; value: string };

const caseById = (id: string) => {
  const found = fixtureData.cases.find((c) => c.id === id);
  if (!found) throw new Error(`${id} missing from data/fr-04-profile.json`);
  return found;
};

const batchC = fixtureData.cases.filter((c) => c.batch === 'C');
if (batchC.length !== 6) {
  throw new Error(`expected 6 batch-C cases in fr-04-profile.json, found ${batchC.length}`);
}

/** Shared preamble: annotate provenance so the HTML report carries the oracle for each case. */
function annotate(testCase: (typeof fixtureData.cases)[number]) {
  test.info().annotations.push(
    { type: 'HW02 case', description: testCase.hw02Ref },
    { type: 'Partition', description: String(testCase.partition) },
    { type: 'Expected source', description: testCase.expectedSource },
  );
}

/** Applies an equals/notEquals rule to one persisted field, with a message citing the source. */
function assertField(
  persisted: Record<string, unknown>,
  field: string,
  rule: FieldRule,
  source: string,
) {
  if (rule.mode === 'equals') {
    expect
      .soft(persisted[field], `${field} was not persisted as required by ${source}`)
      .toBe(rule.value);
  } else {
    expect
      .soft(
        persisted[field],
        `${field} ended up persisted as ${JSON.stringify(rule.value)}, which ${source} ` +
          `defines as invalid. The test basis does not prescribe HOW the SUT must avoid ` +
          `storing it — only that this exact value must not be the stored result`,
      )
      .not.toBe(rule.value);
  }
}

// ---------------------------------------------------------------------------------------------
// EP-001 — valid update of all three manageable fields
// ---------------------------------------------------------------------------------------------
const ep001 = caseById('TC-04-EP-001-API');
test(`${ep001.id} — ${ep001.title}`, async ({ api, freshUser }) => {
  annotate(ep001);
  const auth = { Authorization: `Bearer ${freshUser.token}` };

  const updated = await api.put('/api/users/me', {
    headers: auth,
    data: {
      name: ep001.input.name,
      phone: ep001.input.phone,
      shipping_address: ep001.input.shippingAddress,
    },
  });
  expect
    .soft(updated.ok(), `PUT refused a valid update (status ${updated.status()})`)
    .toBeTruthy();

  const persisted = await (await api.get('/api/users/me', { headers: auth })).json();
  for (const [field, rule] of Object.entries(ep001.expected.fields as Record<string, FieldRule>)) {
    assertField(persisted, field, rule, 'README FR-04 line 64');
  }
});

// ---------------------------------------------------------------------------------------------
// EP-002 — empty `name` (invalid class per accepted assumption A2)
// ---------------------------------------------------------------------------------------------
const ep002 = caseById('TC-04-EP-002-API');
test(`${ep002.id} — ${ep002.title}`, async ({ api, freshUser }) => {
  annotate(ep002);
  const auth = { Authorization: `Bearer ${freshUser.token}` };

  // No status assertion: the SUT documents no error-response contract for a rejected update, so
  // requiring a particular code would invent an oracle. A2 is stated as an outcome.
  await api.put('/api/users/me', {
    headers: auth,
    data: {
      name: ep002.input.name,
      phone: ep002.input.phone,
      shipping_address: ep002.input.shippingAddress,
    },
  });

  const persisted = await (await api.get('/api/users/me', { headers: auth })).json();
  assertField(
    persisted,
    'name',
    (ep002.expected.fields as Record<string, FieldRule>).name,
    'accepted assumption A2',
  );
});

// ---------------------------------------------------------------------------------------------
// EP-003 — empty `shipping_address` (valid class per accepted assumption A3)
// ---------------------------------------------------------------------------------------------
const ep003 = caseById('TC-04-EP-003-API');
test(`${ep003.id} — ${ep003.title}`, async ({ api, freshUser }) => {
  annotate(ep003);
  const auth = { Authorization: `Bearer ${freshUser.token}` };

  const updated = await api.put('/api/users/me', {
    headers: auth,
    data: {
      name: ep003.input.name,
      phone: ep003.input.phone,
      shipping_address: ep003.input.shippingAddress,
    },
  });
  expect
    .soft(
      updated.ok(),
      `PUT refused an empty shipping_address, which accepted assumption A3 defines as valid ` +
        `(status ${updated.status()})`,
    )
    .toBeTruthy();

  const persisted = await (await api.get('/api/users/me', { headers: auth })).json();
  assertField(
    persisted,
    'shipping_address',
    (ep003.expected.fields as Record<string, FieldRule>).shipping_address,
    'accepted assumption A3 (accepted, not coerced to null)',
  );
});

// ---------------------------------------------------------------------------------------------
// EP-004 — spec-invalid phone via the API (EP representative)
// NOTE: converges with TC-04-BVA-010-API on the same input and assertion — see the case's
// `convergenceNote` in the data file. Retained for traceability to HW02's frozen case list.
// ---------------------------------------------------------------------------------------------
const ep004 = caseById('TC-04-EP-004-API');
test(`${ep004.id} — ${ep004.title}`, async ({ api, freshUser }) => {
  annotate(ep004);
  test.info().annotations.push({
    type: 'Converges with',
    description: String(ep004.convergesWith),
  });
  const auth = { Authorization: `Bearer ${freshUser.token}` };

  await api.put('/api/users/me', {
    headers: auth,
    data: {
      name: ep004.input.name,
      phone: ep004.input.phone,
      shipping_address: ep004.input.shippingAddress,
    },
  });

  const persisted = await (await api.get('/api/users/me', { headers: auth })).json();
  assertField(
    persisted,
    'phone',
    (ep004.expected.fields as Record<string, FieldRule>).phone,
    'README FR-04 line 65',
  );
});

// ---------------------------------------------------------------------------------------------
// EP-005 — forbidden field: a client-supplied `role` must not take effect
// ---------------------------------------------------------------------------------------------
const ep005 = caseById('TC-04-EP-005-API');
test(`${ep005.id} — ${ep005.title}`, async ({ api, freshUser }) => {
  annotate(ep005);
  const auth = { Authorization: `Bearer ${freshUser.token}` };

  // A newly registered account is role `user`; confirm that starting point so a failure below
  // cannot be blamed on the fixture handing us an already-elevated account.
  const before = await (await api.get('/api/users/me', { headers: auth })).json();
  expect(before.role, 'precondition: a fresh account must start as role "user"').toBe('user');

  await api.put('/api/users/me', {
    headers: auth,
    data: {
      name: ep005.input.name,
      phone: ep005.input.phone,
      shipping_address: ep005.input.shippingAddress,
      role: ep005.input.role,
    },
  });

  const persisted = await (await api.get('/api/users/me', { headers: auth })).json();
  expect
    .soft(
      persisted.role,
      `a client-supplied role="${ep005.input.role}" changed the stored role. README line 67 ` +
        `says a user cannot change their own role, and SEC-06 (line 283) says the profile ` +
        `update API must not allow the client to change it`,
    )
    .toBe(ep005.expected.roleMustRemain);
});

// ---------------------------------------------------------------------------------------------
// EP-006 — immutable field `email`, dual surface
// ---------------------------------------------------------------------------------------------
const ep006 = caseById('TC-04-EP-006-UI-API');
test(`${ep006.id} — ${ep006.title}`, async ({ page, api, freshUser }) => {
  annotate(ep006);
  const auth = { Authorization: `Bearer ${freshUser.token}` };

  // --- Surface 1 (UI): spec line 66 constrains the interface specifically ("qua giao diện"),
  // so assert the field is not editable in the rendered form.
  await seedSession(page, freshUser.token);
  await page.goto(`${WEB_URL}/profile`, { waitUntil: 'domcontentloaded' });

  // getByLabel is unusable on this form: Profile.jsx renders <label> as a SIBLING of <input>
  // with no for/id, aria-label or nesting, so nothing associates them. XPath from the label
  // text expresses "the input belonging to the Email field" and survives field reordering,
  // unlike an index-based locator.
  const emailField = page.locator("xpath=//label[contains(., 'Email')]/following-sibling::input");
  await expect(emailField, 'email field did not render on the profile form').toBeVisible();
  await expect
    .soft(emailField, 'README line 66 says email must not be changeable through the interface')
    .toBeDisabled();
  await expect.soft(emailField).toHaveValue(freshUser.email);

  // --- Surface 2 (API): the underlying immutability guarantee — a forged email is ignored.
  await api.put('/api/users/me', {
    headers: auth,
    data: {
      name: ep006.input.name,
      phone: ep006.input.phone,
      shipping_address: ep006.input.shippingAddress,
      email: ep006.input.forgedEmail,
    },
  });

  const persisted = await (await api.get('/api/users/me', { headers: auth })).json();
  expect
    .soft(
      persisted.email,
      `a forged email in the update payload changed the stored email; README line 66 makes ` +
        `email immutable`,
    )
    .toBe(freshUser.email);
  expect
    .soft(persisted.email, 'the forged email became the stored email')
    .not.toBe(ep006.input.forgedEmail);
});
