import { randomBytes } from 'node:crypto';
import { test, expect } from '../../fixtures/base';
import fixtureData from '../../data/fr-08-checkout.json';

/**
 * FR-08 — Step 5 Batch B: the six API-path cases covering R1 and R4.
 *
 * R1 (README line 104): only a logged-in user can check out.
 * R4 (README line 107): the backend must recompute the total; a client-sent `total_amount`
 *                       is not accepted.
 *
 * Expected values come from data/fr-08-checkout.json only, never from observed behaviour.
 *
 * WHY APIRequestContext AND NOT THE UI (architecture §3.1):
 *   - R1 (EP-002/EP-003): the interface never renders a way to omit the Authorization header or to
 *     send a malformed token. Missing-access-control cases are unreachable through the UI.
 *   - R4 (TC-08-001, N08, N09, N10): these isolate the BACKEND half of the contract. Batch A's
 *     TC-08-N03-UI already showed the compound result — "the form lets you type a total AND the
 *     order stores it". These cases prove the second half alone, which is what substantiates the
 *     claim that BUG-08-102 survives any fix to Checkout.jsx. N08 in particular (total_amount
 *     omitted entirely) is NOT expressible through the UI at all, because the client always sends
 *     the field.
 *
 * BROWSER COVERAGE — state this plainly: no test in this file requests the `page` fixture, so NO
 * BROWSER IS LAUNCHED. These 18 executions run once per configured project for matrix uniformity
 * only; three identical backend results are not cross-browser evidence and must never be added to
 * the browser-run count. FR-08's browser coverage is carried entirely by Batch A's 18 UI
 * executions.
 *
 * ORACLE NOTE — why no case asserts a status code:
 * `api_specification.md` §4.3 documents only the REQUEST BODY for POST /api/checkout. It defines no
 * success status, no error contract, and no status code anywhere in the document. README line 104
 * says who may check out, not how a refusal must be signalled. Asserting 401/403/400 would therefore
 * invent an oracle — and would fail a compliant implementation that chose a different code. The
 * status is recorded as an ANNOTATION (evidence) and the assertions state only the outcome the spec
 * states: no order is created, or the persisted total is the cart-derived one.
 *
 * NOTE: several of these are expected to fail. server.js:297-310 inserts `total_amount` straight
 * from the request body with no cart lookup and no recomputation (BUG-08-102, issue #5). Assertions
 * state what the SPEC requires and are NOT relaxed to match.
 *
 * TWO CARTS — do not confuse them (design report §2.1). This file seeds the SERVER cart via
 * POST /api/cart, which is the cart a recomputing backend would have to read. That is a different
 * store from the client-side React cart Batch A drives through the UI; the two are never mixed, and
 * none of Batch A's UI helpers is imported here.
 */

type CaseData = (typeof fixtureData.cases)[number];
type CatalogueProduct = { id: number; name: string; price: number };

const batchB = fixtureData.cases.filter((c) => c.batch === 'B');
if (batchB.length !== 6) {
  throw new Error(`expected 6 batch-B cases in fr-08-checkout.json, found ${batchB.length}`);
}

const caseById = (id: string): CaseData => {
  const found = batchB.find((c) => c.id === id);
  if (!found) throw new Error(`case ${id} missing from fr-08-checkout.json batch B`);
  return found;
};

/**
 * A shipping address unique to one test execution.
 *
 * This is identity infrastructure, not test data, which is why it is generated here rather than
 * frozen in the data file: its whole purpose is to be different every run. It lets each test find
 * exactly the order it caused without ever asserting on a global order count — the count is shared
 * with every other worker and every previous run, so any assertion on it would be meaningless.
 */
const marker = (caseId: string): string =>
  `FR08-B ${caseId} ${Date.now()}-${randomBytes(4).toString('hex')}`;

/**
 * Narrowing accessors for the shared data file.
 *
 * `input` is inferred as a union across every case in `fr-08-checkout.json`, so keys that exist only
 * on Batch B cases type as possibly `undefined`. Throwing rather than casting keeps a missing key
 * loud instead of letting it reach an assertion as `undefined`.
 */
const serverCartOf = (testCase: CaseData): Array<{ name: string; quantity: number }> => {
  const cart = testCase.input.serverCart;
  if (!cart) {
    throw new Error(`case ${testCase.id} declares no input.serverCart in fr-08-checkout.json`);
  }
  return cart;
};

type TotalAmountSpec = { mode: string; value?: number };

const totalAmountSpecOf = (testCase: CaseData): TotalAmountSpec => {
  const spec = testCase.input.totalAmount as TotalAmountSpec | undefined;
  if (!spec) {
    throw new Error(`case ${testCase.id} declares no input.totalAmount in fr-08-checkout.json`);
  }
  return spec;
};

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

/**
 * Catalogue prices, read from an INDEPENDENT source.
 *
 * R4 states a relationship — the persisted total must be what the backend computes from the cart —
 * so the expected value must come from somewhere other than the checkout result being judged.
 * Deriving it from the checkout response would be circular and would pass for any value.
 */
async function catalogue(api: import('@playwright/test').APIRequestContext) {
  const response = await api.get('/api/products');
  expect(response.ok(), 'GET /api/products failed — cannot establish catalogue prices').toBeTruthy();
  return (await response.json()) as CatalogueProduct[];
}

const priceOf = (products: CatalogueProduct[], name: string): number => {
  const product = products.find((p) => p.name === name);
  if (!product) {
    throw new Error(`product "${name}" is not in the catalogue — test data references a product ` +
      `the SUT does not serve. Catalogue: ${products.map((p) => p.name).join(', ')}`);
  }
  return Number(product.price);
};

/** Seeds the SERVER cart (POST /api/cart) — the cart a recomputing backend would read. */
async function seedServerCart(
  api: import('@playwright/test').APIRequestContext,
  token: string,
  testCase: CaseData,
  products: CatalogueProduct[],
): Promise<number> {
  const auth = { Authorization: `Bearer ${token}` };
  let expectedTotal = 0;

  for (const item of serverCartOf(testCase)) {
    const price = priceOf(products, item.name);
    const response = await api.post('/api/cart', {
      headers: auth,
      data: { id: products.find((p) => p.name === item.name)!.id, name: item.name, price, quantity: item.quantity },
    });
    expect(response.ok(), `POST /api/cart failed for "${item.name}" — setup failed`).toBeTruthy();
    expectedTotal += price * item.quantity;
  }

  if (serverCartOf(testCase).length > 0) {
    const cart = await (await api.get('/api/cart', { headers: auth })).json();
    // Setup verification, not an FR-08 assertion: if the precondition did not hold, the case cannot
    // say anything about recomputation, and that must be visible as a setup failure.
    expect(
      (cart as unknown[]).length,
      'server cart was not seeded — setup failed, not an FR-08 result',
    ).toBe(serverCartOf(testCase).length);
  }

  return expectedTotal;
}

/** Builds the checkout body for a case, honouring `omit` (the field is absent, not null). */
function checkoutBody(testCase: CaseData, shippingAddress: string, cartTotal: number) {
  const spec = totalAmountSpecOf(testCase);
  const body: Record<string, unknown> = { shipping_address: shippingAddress };

  if (spec.mode === 'send') {
    body.total_amount = spec.value;
  } else if (spec.mode === 'multiplyCartTotalBy') {
    body.total_amount = cartTotal * (spec.value as number);
  }
  // mode === 'omit' — deliberately leaves total_amount off the body entirely.
  return body;
}

/**
 * Finds the order this test created, by its unique marker.
 *
 * `GET /api/admin/orders` is used purely as a VERIFICATION CHANNEL to search for the marker across
 * all orders, which is required for the R1 cases where the request is unauthenticated and so has no
 * "my orders" to look in. Two things this is deliberately NOT doing: it does not assert on a global
 * order count, and it does not assert anything about that endpoint's own access control. (That
 * endpoint applies only `authenticateToken` with no role check — a real observation, but it belongs
 * to the admin surface, not to FR-08, so it is out of scope here and is not claimed as a finding of
 * this batch.)
 */
async function findOrdersByMarker(
  api: import('@playwright/test').APIRequestContext,
  token: string,
  markerValue: string,
): Promise<Array<{ id: number; total_amount: number | null; shipping_address: string }>> {
  const response = await api.get('/api/admin/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), 'could not read orders to verify the outcome').toBeTruthy();
  const all = (await response.json()) as Array<{
    id: number;
    total_amount: number | null;
    shipping_address: string;
  }>;
  return all.filter((o) => o.shipping_address === markerValue);
}

// --- R4: the backend must recompute the total -------------------------------------------------

for (const id of ['TC-08-001', 'TC-08-N08-API', 'TC-08-N09-API', 'TC-08-N10-API']) {
  const testCase = caseById(id);

  test(`${testCase.id} — ${testCase.title}`, async ({ api, freshUser }) => {
    // freshUser (test-scoped): every case here PERSISTS an order, and a worker-shared account would
    // let one test read another's order from my-orders. A private account plus a unique marker makes
    // "the order this test created" unambiguous without ever counting orders globally.
    annotate(testCase);

    const products = await catalogue(api);
    const expectedTotal = await seedServerCart(api, freshUser.token, testCase, products);
    const shippingAddress = marker(testCase.id);
    const body = checkoutBody(testCase, shippingAddress, expectedTotal);

    test.info().annotations.push({
      type: 'Checkout body',
      description: JSON.stringify(body),
    });

    const checkout = await api.post('/api/checkout', {
      headers: { Authorization: `Bearer ${freshUser.token}` },
      data: body,
    });

    // Evidence, not oracle — api_specification.md documents no status code for this endpoint.
    test.info().annotations.push({
      type: 'Checkout status',
      description: String(checkout.status()),
    });

    const mine = await api.get('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${freshUser.token}` },
    });
    expect(mine.ok(), 'GET /api/orders/my-orders failed — cannot judge persistence').toBeTruthy();
    const orders = (await mine.json()) as Array<{
      total_amount: number | null;
      shipping_address: string;
    }>;
    const created = orders.filter((o) => o.shipping_address === shippingAddress);

    expect
      .soft(created.length, 'the checkout did not create an order for this test')
      .toBe(1);

    expect
      .soft(
        created[0]?.total_amount === null ? null : Number(created[0]?.total_amount),
        `the order stored ${JSON.stringify(body.total_amount ?? null)} instead of the ` +
          `cart-derived ${expectedTotal}; FR-08 line 107 requires the backend to recompute the ` +
          `total itself and to reject the client-sent total_amount`,
      )
      .toBe(expectedTotal);
  });
}

// --- R1: only a logged-in user may check out --------------------------------------------------

for (const id of ['TC-08-EP-002', 'TC-08-EP-003']) {
  const testCase = caseById(id);

  test(`${testCase.id} — ${testCase.title}`, async ({ api, freshUser }) => {
    // The checkout attempt below is UNAUTHENTICATED. freshUser exists only to give the verification
    // step a valid token with which to search for the marker; it is never used on the request under
    // test. No cart is seeded — authenticateToken runs before any cart or order logic, so cart state
    // is irrelevant to this path (HW02 recorded the same reasoning).
    annotate(testCase);

    const shippingAddress = marker(testCase.id);
    const body = checkoutBody(testCase, shippingAddress, 0);

    const headers: Record<string, string> =
      testCase.input.auth === 'invalid'
        ? { Authorization: 'Bearer invalid.token.value' }
        : {};

    test.info().annotations.push(
      { type: 'Auth sent', description: testCase.input.auth === 'invalid' ? 'Bearer invalid.token.value' : 'none' },
      { type: 'Checkout body', description: JSON.stringify(body) },
    );

    const checkout = await api.post('/api/checkout', { headers, data: body });

    // Evidence, not oracle. The spec prescribes NO status code for a refusal, so this is recorded
    // and never asserted — see the oracle note in the file header.
    test.info().annotations.push({
      type: 'Checkout status',
      description: String(checkout.status()),
    });

    const matching = await findOrdersByMarker(api, freshUser.token, shippingAddress);

    expect
      .soft(
        matching.length,
        `an order was created for a checkout with ${
          testCase.input.auth === 'none' ? 'no Authorization header' : 'an invalid JWT'
        }; FR-08 line 104 says only a logged-in user may check out. The spec does not prescribe HOW ` +
          `the request must be refused — only that it must not result in an order`,
      )
      .toBe(0);
  });
}
