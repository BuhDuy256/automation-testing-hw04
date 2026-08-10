import { type APIRequestContext } from '@playwright/test';
import { test, expect } from '../../fixtures/base';
import fixtureData from '../../data/fr-15-product-crud.json';
import { adminAuth, loginAsAdmin, productMarker, uniqueNameOfLength } from '../../utils/admin';

/**
 * FR-15 — Step 6 Batch B: the six API-path lifecycle and valid-class cases.
 *
 * P1 (README line 193): an admin can add / view / edit / delete products.
 * P3 (line 196): price is required and must be positive (> 0) — here at its minimum valid value.
 * P4 (line 197): category is required and must be one of the existing list.
 * P5 (line 198): editing one product changes only that product.
 *
 * Expected values come from data/fr-15-product-crud.json only, never from observed behaviour.
 *
 * WHAT THIS BATCH IS FOR. Batch A showed five invalid classes being stored. On its own that is
 * ambiguous — an endpoint that stores everything might simply be broken. These cases establish that
 * the write path WORKS: a valid create round-trips, a valid category persists, a delete removes the
 * row, and an edit touches only its target. That is the difference between recommending a guard
 * clause and recommending a rewrite.
 *
 * BROWSER COVERAGE — no test in this file requests the `page` fixture, so NO BROWSER IS LAUNCHED.
 * These 18 executions are matrix uniformity only and are excluded from the browser-run count, as
 * Batch A's were. FR-15's browser coverage comes entirely from Batch C's two UI cases.
 *
 * ORACLE NOTE — no status code is asserted anywhere. `api_specification.md` §3.3 documents only the
 * request body for the product write endpoints; there is no success status and no error contract in
 * the whole document.
 *
 * GLOBAL STATE — products belong to no user. Every case tags its payload with a unique marker,
 * targets only the rows it created (by the id `POST` returns), and **never asserts on a product
 * count**.
 */

type CaseData = (typeof fixtureData.cases)[number];

const batchB = fixtureData.cases.filter((c) => c.batch === 'B');
if (batchB.length !== 6) {
  throw new Error(`expected 6 batch-B cases in fr-15-product-crud.json, found ${batchB.length}`);
}

const caseById = (id: string): CaseData => {
  const found = batchB.find((c) => c.id === id);
  if (!found) throw new Error(`case ${id} missing from fr-15-product-crud.json batch B`);
  return found;
};

const nameLengthOf = (testCase: CaseData): number => {
  const spec = testCase.input.name as { mode: string; length?: number } | undefined;
  if (!spec || typeof spec.length !== 'number') {
    throw new Error(`case ${testCase.id} declares no input.name.length in fr-15-product-crud.json`);
  }
  return spec.length;
};

/**
 * `price` must be normalised before comparison.
 *
 * `GET /api/products/:id` returns it as a STRING for every even product id (BUG-15-102, issue #9), so
 * a strict `toBe` is representation-blind and can pass on a value that is present. That produced a
 * false pass in Batch A (finding 70); every price comparison in this file goes through here.
 */
const asNumber = (value: unknown): unknown =>
  value === null || value === undefined || value === '' ? value : Number(value);

type Created = { id: number; name: string; marker: string };

/** Creates one product for a case and returns what identifies it. Never asserts on a count. */
async function createProduct(
  api: APIRequestContext,
  auth: Record<string, string>,
  testCase: CaseData,
  overrides: Record<string, unknown> = {},
): Promise<Created> {
  const marker = productMarker(testCase.id);
  const name = uniqueNameOfLength(marker, nameLengthOf(testCase));
  const response = await api.post('/api/products', {
    headers: auth,
    data: {
      name,
      price: testCase.input.price,
      description: marker,
      imageUrl: `https://placehold.co/300?text=${encodeURIComponent(marker)}`,
      category_id: testCase.input.categoryId,
      ...overrides,
    },
  });
  const body = response.ok() ? ((await response.json()) as { id?: number }) : {};
  const id = typeof body.id === 'number' ? body.id : null;
  expect(
    id,
    `POST /api/products did not create a product — setup failed for ${testCase.id}, not an FR-15 result`,
  ).not.toBeNull();
  return { id: id as number, name, marker };
}

const annotate = (testCase: CaseData) => {
  test.info().annotations.push(
    { type: 'Requirement', description: testCase.requirement },
    { type: 'Technique', description: testCase.technique },
    { type: 'Expected source', description: testCase.expectedSource },
    { type: 'Mechanism', description: 'APIRequestContext — no browser is launched' },
  );
  if (testCase.hw02Ref) {
    test.info().annotations.push({ type: 'HW02 case', description: testCase.hw02Ref });
  }
};

// --- P3 valid minimum + P1 view consistency (dual-purpose, owns BUG-15-102) ---------------------

test(`${caseById('TC-15-BVA-006-API').id} — ${caseById('TC-15-BVA-006-API').title}`, async ({ api }) => {
  const testCase = caseById('TC-15-BVA-006-API');
  annotate(testCase);
  const auth = adminAuth(await loginAsAdmin(api));

  // Create products until BOTH id parities are held.
  //
  // WHY PARITY IS USED HERE AND ONLY HERE: BUG-15-102 manifests only on even ids, so a single
  // product landing on an odd id would make the consistency assertion pass vacuously — the exact
  // false pass finding 70 was about. Parity therefore SELECTS the inputs, so the class where the SUT
  // can differ is genuinely exercised. The assertion itself, below, never mentions ids or parity: it
  // says only that the two endpoints must report the same price for the same product. If the SUT's
  // rule changed, the oracle would still be right.
  const held = new Map<number, Created>(); // key: id % 2
  const attempts: number[] = [];
  for (let i = 0; i < 6 && held.size < 2; i += 1) {
    const product = await createProduct(api, auth, testCase);
    attempts.push(product.id);
    if (!held.has(product.id % 2)) held.set(product.id % 2, product);
  }
  test.info().annotations.push({
    type: 'Product ids created',
    description: `${attempts.join(', ')} — parities held: ${[...held.keys()].join(', ')}`,
  });
  expect(
    held.size,
    'could not obtain a product of each id parity — setup failed, not an FR-15 result',
  ).toBe(2);

  const first = held.get(attempts[0] % 2) as Created;

  // --- P3: the minimum valid price persists as sent.
  const detailFirst = await api.get(`/api/products/${first.id}`, { headers: auth });
  expect(detailFirst.ok(), 'GET /api/products/:id failed — cannot judge persistence').toBeTruthy();
  const persistedFirst = (await detailFirst.json()) as Record<string, unknown>;
  expect
    .soft(
      asNumber(persistedFirst.price),
      `the minimum valid price was not persisted as sent; ${testCase.expectedSource}`,
    )
    .toBe(asNumber(testCase.input.price));

  // --- P1 (view): both read endpoints must agree about the same row.
  const list = (await (await api.get('/api/products', { headers: auth })).json()) as Array<
    Record<string, unknown>
  >;
  for (const product of held.values()) {
    const detail = (await (
      await api.get(`/api/products/${product.id}`, { headers: auth })
    ).json()) as Record<string, unknown>;
    const fromList = list.find((row) => row.id === product.id);
    expect(fromList, `product ${product.id} is missing from the product list`).toBeTruthy();

    test.info().annotations.push({
      type: `Price as reported for id ${product.id}`,
      description: `detail=${JSON.stringify(detail.price)} (${typeof detail.price}) · list=${JSON.stringify(
        fromList?.price,
      )} (${typeof fromList?.price})`,
    });

    expect
      .soft(
        detail.price,
        `GET /api/products/${product.id} and GET /api/products disagree about the same product's ` +
          `price — detail returned ${JSON.stringify(detail.price)} (${typeof detail.price}) and the ` +
          `list returned ${JSON.stringify(fromList?.price)} (${typeof fromList?.price}). FR-15 ` +
          `line 193 covers viewing a product; one product cannot have two prices`,
      )
      .toBe(fromList?.price);
  }
});

// --- P4: category must come from the existing list ----------------------------------------------

for (const id of ['TC-15-BVA-007', 'TC-15-BVA-009']) {
  const testCase = caseById(id);

  test(`${testCase.id} — ${testCase.title}`, async ({ api }) => {
    annotate(testCase);
    const auth = adminAuth(await loginAsAdmin(api));

    const marker = productMarker(testCase.id);
    const name = uniqueNameOfLength(marker, nameLengthOf(testCase));
    const response = await api.post('/api/products', {
      headers: auth,
      data: {
        name,
        price: testCase.input.price,
        description: marker,
        imageUrl: `https://placehold.co/300?text=${encodeURIComponent(marker)}`,
        category_id: testCase.input.categoryId,
      },
    });
    test.info().annotations.push({ type: 'POST status', description: String(response.status()) });

    const body = response.ok() ? ((await response.json()) as { id?: number }) : {};
    const createdId = typeof body.id === 'number' ? body.id : null;

    // A refused create is a compliant outcome for the invalid case, and must not be an error here.
    if (createdId === null) {
      expect
        .soft(
          testCase.expected.mustBeCreated,
          `a spec-valid category was refused; ${testCase.expectedSource}`,
        )
        .toBe(false);
      return;
    }

    const persisted = (await (
      await api.get(`/api/products/${createdId}`, { headers: auth })
    ).json()) as Record<string, unknown>;
    expect
      .soft(persisted.description, 'read-back returned a different product than this test created')
      .toBe(marker);

    if (testCase.expected.specClass === 'valid') {
      expect
        .soft(
          Number(persisted.category_id),
          `a spec-valid category id was not persisted as sent; ${testCase.expectedSource}`,
        )
        .toBe(Number(testCase.input.categoryId));
    } else {
      expect
        .soft(
          Number(persisted.category_id),
          `a category id that does not exist ended up stored; ${testCase.expectedSource}. The spec ` +
            `does not prescribe HOW it must be refused — only that this value must not be the ` +
            `stored result`,
        )
        .not.toBe(Number(testCase.input.categoryId));
    }
  });
}

// --- P1: add ------------------------------------------------------------------------------------

test(`${caseById('TC-15-EP-001').id} — ${caseById('TC-15-EP-001').title}`, async ({ api }) => {
  const testCase = caseById('TC-15-EP-001');
  annotate(testCase);
  const auth = adminAuth(await loginAsAdmin(api));

  const product = await createProduct(api, auth, testCase);
  const persisted = (await (
    await api.get(`/api/products/${product.id}`, { headers: auth })
  ).json()) as Record<string, unknown>;

  expect
    .soft(persisted.description, 'read-back returned a different product than this test created')
    .toBe(product.marker);
  expect
    .soft(persisted.name, `name was not persisted as sent; ${testCase.expectedSource}`)
    .toBe(product.name);
  expect
    .soft(asNumber(persisted.price), `price was not persisted as sent; ${testCase.expectedSource}`)
    .toBe(asNumber(testCase.input.price));
  expect
    .soft(
      Number(persisted.category_id),
      `category_id was not persisted as sent; ${testCase.expectedSource}`,
    )
    .toBe(Number(testCase.input.categoryId));
});

// --- P1: delete ---------------------------------------------------------------------------------

test(`${caseById('TC-15-N01-API').id} — ${caseById('TC-15-N01-API').title}`, async ({ api }) => {
  const testCase = caseById('TC-15-N01-API');
  annotate(testCase);
  const auth = adminAuth(await loginAsAdmin(api));

  const product = await createProduct(api, auth, testCase);

  // Precondition: it must be retrievable BEFORE the delete, or "gone afterwards" proves nothing.
  const listBefore = (await (await api.get('/api/products', { headers: auth })).json()) as Array<
    Record<string, unknown>
  >;
  expect(
    listBefore.some((row) => row.id === product.id),
    'the product was not present before the delete — setup failed, not an FR-15 result',
  ).toBeTruthy();

  const deleted = await api.delete(`/api/products/${product.id}`, { headers: auth });
  test.info().annotations.push({ type: 'DELETE status', description: String(deleted.status()) });

  // Judged by this test's own row, never by a product count.
  const listAfter = (await (await api.get('/api/products', { headers: auth })).json()) as Array<
    Record<string, unknown>
  >;
  expect
    .soft(
      listAfter.filter((row) => row.id === product.id),
      `the product is still listed after being deleted; ${testCase.expectedSource}`,
    )
    .toEqual([]);
});

// --- P5: editing one product must not change another --------------------------------------------

test(`${caseById('TC-15-EP-010').id} — ${caseById('TC-15-EP-010').title}`, async ({ api }) => {
  const testCase = caseById('TC-15-EP-010');
  annotate(testCase);
  const auth = adminAuth(await loginAsAdmin(api));

  const target = await createProduct(api, auth, testCase);
  const sibling = await createProduct(api, auth, testCase);

  // The sibling's ORIGINAL values are recorded before the edit, so the oracle is "unchanged from its
  // own recorded original" rather than "equal to some expected constant".
  const siblingBefore = (await (
    await api.get(`/api/products/${sibling.id}`, { headers: auth })
  ).json()) as Record<string, unknown>;

  const edited = await api.put(`/api/products/${target.id}`, {
    headers: auth,
    data: {
      name: `${target.name}-edited`,
      price: testCase.input.editTargetPrice,
      description: target.marker,
      imageUrl: `https://placehold.co/300?text=${encodeURIComponent(target.marker)}`,
      category_id: testCase.input.categoryId,
    },
  });
  test.info().annotations.push({ type: 'PUT status', description: String(edited.status()) });

  const siblingAfter = (await (
    await api.get(`/api/products/${sibling.id}`, { headers: auth })
  ).json()) as Record<string, unknown>;

  expect
    .soft(siblingAfter.description, 'read-back returned a different product than the sibling')
    .toBe(sibling.marker);

  for (const field of ['name', 'category_id']) {
    expect
      .soft(
        siblingAfter[field],
        `editing another product changed the sibling's ${field}; ${testCase.expectedSource}`,
      )
      .toBe(siblingBefore[field]);
  }
  expect
    .soft(
      asNumber(siblingAfter.price),
      `editing another product changed the sibling's price; ${testCase.expectedSource}`,
    )
    .toBe(asNumber(siblingBefore.price));
});
