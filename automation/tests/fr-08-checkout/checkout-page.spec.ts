import { test, expect } from '../../fixtures/base';
import { seedSession } from '../../utils/session';
import { WEB_URL } from '../../utils/urls';
import fixtureData from '../../data/fr-08-checkout.json';
import {
  addToCartFromDetail,
  addToCartFromHome,
  attemptDirectTotalEdit,
  captureDialogs,
  displayedTotal,
  fetchCatalogue,
  goToCart,
  goToCheckoutFromCart,
  openStorefront,
  orderedProductItems,
  priceOf,
  waitForLoggedIn,
  type CatalogueProduct,
  type TotalEditAttempt,
} from '../../utils/checkout';

/**
 * FR-08 — Step 5 Batch A: the six UI cases covering R2 and R3.
 *
 * R2 (README line 105): the total is computed automatically from the cart and the user may not
 *                       edit it directly.
 * R3 (README line 106): the interface displays the full list of ordered products.
 *
 * These two requirements had ZERO coverage in HW02, whose FR-08 work was entirely API-path. Both
 * are statements about the INTERFACE, so every case here drives a real browser — this batch is
 * genuine multi-browser evidence (6 cases × 3 projects = 18 browser executions).
 *
 * Expected values come from data/fr-08-checkout.json only, never from observed behaviour.
 *
 * ORACLE NOTE — why no assertion says "the field is readonly/disabled":
 * line 105 forbids the user editing the total; it does NOT prescribe HOW the app must prevent it.
 * Asserting `toBeDisabled()` would invent a mechanism and could fail an implementation that
 * legitimately omitted the field or ignored its value. Every case here asserts the OUTCOME — the
 * effective total still equals the cart-derived total — which is exactly what the spec states.
 *
 * ORACLE NOTE — why totals are computed, not hardcoded:
 * R2 states a relationship. The expected total is Σ(catalogue price × quantity), with prices read
 * from GET /api/products — a source independent of the page under test. Comparing the checkout
 * page against its own numbers would be circular, and hardcoding the seed prices would tie the
 * oracle to the SUT's fixture data rather than to the spec.
 *
 * SCOPE: no case here asserts coupon behaviour (FR-09), cart quantity/stock rules (FR-07) or order
 * status (FR-10), even though the checkout page renders a coupon panel. Logging in and adding to
 * the cart are SETUP and are never counted as FR-08 coverage.
 *
 * SESSION CONSTRAINT: the client cart is unpersisted React state, so each test seeds and asserts
 * inside ONE page session and navigates only through in-app links. See utils/checkout.ts.
 */

type CaseData = (typeof fixtureData.cases)[number];

const batchA = fixtureData.cases.filter((c) => c.batch === 'A');
if (batchA.length !== 6) {
  throw new Error(`expected 6 batch-A cases in fr-08-checkout.json, found ${batchA.length}`);
}

const caseById = (id: string): CaseData => {
  const found = batchA.find((c) => c.id === id);
  if (!found) throw new Error(`case ${id} missing from fr-08-checkout.json batch A`);
  return found;
};

/** Σ(catalogue price × quantity) — the spec's own rule for what the total must be. */
const expectedTotalFor = (testCase: CaseData, catalogue: CatalogueProduct[]): number =>
  testCase.input.products.reduce(
    (sum, item) => sum + priceOf(catalogue, item.name) * item.quantity,
    0,
  );

/**
 * Reads a required expected line-item count from the frozen data.
 *
 * The cases in this batch assert different things, so `expected` is a heterogeneous shape and
 * `lineItemCount` types as `number | undefined`. Casting the `undefined` away would let a data-file
 * edit that drops the key reach `toHaveCount(undefined)` — a silent, meaningless assertion. Throwing
 * makes the data defect loud, in the same spirit as the batch-size guard above.
 */
const expectedLineItemCount = (testCase: CaseData): number => {
  const value = (testCase.expected as { lineItemCount?: number }).lineItemCount;
  if (typeof value !== 'number') {
    throw new Error(`case ${testCase.id} is missing expected.lineItemCount in fr-08-checkout.json`);
  }
  return value;
};

/** Reads the single product a case seeds, failing loudly rather than yielding `undefined`. */
const soleProduct = (testCase: CaseData): { name: string; quantity: number } => {
  const product = testCase.input.products[0];
  if (!product) {
    throw new Error(`case ${testCase.id} declares no seed product in fr-08-checkout.json`);
  }
  return product;
};

/**
 * Records what the page offered when a direct total edit was attempted.
 *
 * Evidence only — none of these is asserted. A compliant implementation may omit the field, render
 * it read-only, or ignore the typed value; the report needs to show which of those happened, while
 * the oracle stays fixed on the outcome (the effective total is still cart-derived).
 */
const annotateTotalEditAttempt = (attempt: TotalEditAttempt) => {
  test.info().annotations.push(
    { type: 'Total input present', description: String(attempt.present) },
    {
      type: 'Total input editable',
      description: attempt.present ? String(attempt.editable) : 'n/a — field absent',
    },
    { type: 'Direct edit attempted', description: String(attempt.attempted) },
  );
};

const annotate = (testCase: CaseData) => {
  test.info().annotations.push(
    { type: 'Requirement', description: testCase.requirement },
    { type: 'Technique', description: testCase.technique },
    { type: 'Expected source', description: testCase.expectedSource },
    { type: 'Evidence strength', description: testCase.evidenceStrength },
  );
};

/** Seeds the client cart through the UI and lands on a rendered checkout page. */
async function seedCartAndOpenCheckout(
  page: import('@playwright/test').Page,
  testCase: CaseData,
): Promise<void> {
  await openStorefront(page);
  await waitForLoggedIn(page);

  for (const item of testCase.input.products) {
    if (testCase.seedVia === 'productDetail') {
      await addToCartFromDetail(page, item.name, item.quantity);
    } else {
      await addToCartFromHome(page, item.name);
    }
  }

  await goToCart(page);
  // Confirms the seed actually landed before the checkout assertions depend on it — a failure here
  // is a setup failure and is reported as such, not as an FR-08 violation.
  await expect(
    page.getByRole('row'),
    'cart did not contain the seeded products — setup failed, not an FR-08 result',
  ).toHaveCount(testCase.input.products.length + 1); // +1 for the header row

  await goToCheckoutFromCart(page);
}

// --- R2 -------------------------------------------------------------------------------------

test(`${caseById('TC-08-N01-UI').id} — ${caseById('TC-08-N01-UI').title}`, async ({
  page,
  api,
  isolatedUser,
}) => {
  const testCase = caseById('TC-08-N01-UI');
  annotate(testCase);
  captureDialogs(page);

  const catalogue = await fetchCatalogue(api);
  const expectedTotal = expectedTotalFor(testCase, catalogue);

  await seedSession(page, isolatedUser.token);
  await seedCartAndOpenCheckout(page, testCase);

  // How the page resists the edit is EVIDENCE, not the oracle. All three observations are annotated
  // so the report shows what the app offered, without the test claiming the spec prescribes any
  // particular prevention mechanism. Absence of the field is COMPLIANT, not a harness error.
  const attempt = await attemptDirectTotalEdit(page, testCase.input.attemptToSetTotalTo!);
  annotateTotalEditAttempt(attempt);

  const shown = await displayedTotal(page);
  expect
    .soft(
      shown,
      `the user changed the checkout total to ${testCase.input.attemptToSetTotalTo}; FR-08 line 105 ` +
        `says the total is computed from the cart and may not be edited directly, so it must still ` +
        `be ${expectedTotal}. The spec does not prescribe HOW editing must be prevented — only that ` +
        `the user's edit must not take effect`,
    )
    .toBe(expectedTotal);
});

test(`${caseById('TC-08-N02-UI').id} — ${caseById('TC-08-N02-UI').title}`, async ({
  page,
  api,
  isolatedUser,
}) => {
  const testCase = caseById('TC-08-N02-UI');
  annotate(testCase);
  captureDialogs(page);

  const catalogue = await fetchCatalogue(api);
  const expectedTotal = expectedTotalFor(testCase, catalogue);

  await seedSession(page, isolatedUser.token);
  await seedCartAndOpenCheckout(page, testCase);

  const shown = await displayedTotal(page);
  expect
    .soft(
      shown,
      `checkout total does not equal the sum of the cart's line amounts; FR-08 line 105 requires ` +
        `the total to be computed automatically from the cart (expected ${expectedTotal} from ` +
        `catalogue prices)`,
    )
    .toBe(expectedTotal);
});

test(`${caseById('TC-08-N03-UI').id} — ${caseById('TC-08-N03-UI').title}`, async ({
  page,
  api,
  freshUser,
}) => {
  // freshUser (test-scoped), NOT isolatedUser: this is the only Batch A case that PERSISTS an
  // order. A private account makes "the order this test created" unambiguous — with a worker-shared
  // account, my-orders could return another test's order and the assertion would judge the wrong
  // row. The five render-only cases in this batch mutate nothing server-side and use the cheaper
  // worker-scoped fixture; scope is derived per case from what each case actually writes.
  const testCase = caseById('TC-08-N03-UI');
  annotate(testCase);
  const dialogs = captureDialogs(page);

  const catalogue = await fetchCatalogue(api);
  const expectedTotal = expectedTotalFor(testCase, catalogue);

  await seedSession(page, freshUser.token);
  await seedCartAndOpenCheckout(page, testCase);

  const attempt = await attemptDirectTotalEdit(page, testCase.input.attemptToSetTotalTo!);
  annotateTotalEditAttempt(attempt);

  await page.getByRole('button', { name: 'Xác Nhận Thanh Toán' }).click();
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thành công!' }),
    `checkout did not complete — cannot judge the persisted total. Dialogs: ${JSON.stringify(dialogs)}`,
  ).toBeVisible();

  const auth = { Authorization: `Bearer ${freshUser.token}` };
  const ordersResponse = await api.get('/api/orders/my-orders', { headers: auth });
  expect(ordersResponse.ok(), 'GET /api/orders/my-orders failed — cannot judge persistence').toBeTruthy();
  const orders = (await ordersResponse.json()) as Array<{ total_amount: number }>;

  expect
    .soft(orders.length, 'checkout reported success but no order was persisted')
    .toBeGreaterThan(0);

  expect
    .soft(
      Number(orders[0]?.total_amount),
      `the order stored the total typed into the form ` +
        `(${testCase.input.attemptToSetTotalTo}) instead of the cart-derived ${expectedTotal}; ` +
        `FR-08 line 105 forbids the user editing the total and line 107 requires the backend to ` +
        `recompute it and to reject a client-sent total_amount`,
    )
    .toBe(expectedTotal);
});

// --- R3 -------------------------------------------------------------------------------------

test(`${caseById('TC-08-N04-UI').id} — ${caseById('TC-08-N04-UI').title}`, async ({
  page,
  api,
  isolatedUser,
}) => {
  const testCase = caseById('TC-08-N04-UI');
  annotate(testCase);
  captureDialogs(page);
  await fetchCatalogue(api); // fails fast and readably if the catalogue does not serve the seeds

  await seedSession(page, isolatedUser.token);
  await seedCartAndOpenCheckout(page, testCase);

  const items = orderedProductItems(page);
  await expect
    .soft(
      items,
      `checkout does not list every ordered product; FR-08 line 106 requires the full list of ` +
        `ordered products to be displayed`,
    )
    .toHaveCount(expectedLineItemCount(testCase));

  for (const item of testCase.input.products) {
    await expect
      .soft(
        items.filter({ hasText: item.name }),
        `ordered product "${item.name}" is missing from the checkout list; FR-08 line 106 requires ` +
          `the full list of ordered products`,
      )
      .toHaveCount(1);
  }
});

test(`${caseById('TC-08-N05-UI').id} — ${caseById('TC-08-N05-UI').title}`, async ({
  page,
  api,
  isolatedUser,
}) => {
  const testCase = caseById('TC-08-N05-UI');
  annotate(testCase);
  captureDialogs(page);

  const catalogue = await fetchCatalogue(api);
  const product = soleProduct(testCase);
  const lineAmount = priceOf(catalogue, product.name) * product.quantity;

  await seedSession(page, isolatedUser.token);
  await seedCartAndOpenCheckout(page, testCase);

  const items = orderedProductItems(page);
  await expect
    .soft(items, 'checkout did not render exactly one ordered-product line')
    .toHaveCount(expectedLineItemCount(testCase));

  const line = (await items.first().textContent()) ?? '';
  const digitsOnly = line.replace(/[^0-9]/g, '');

  // The product name is stripped first because it CONTAINS a digit ("Tai nghe AirPods Pro 2"), which
  // is exactly how a substring check gives a false pass: `toContain('2')` would have been satisfied
  // by the name alone, never testing whether the quantity was rendered at all.
  //
  // What remains is then required to carry the quantity as a STANDALONE numeric token. The
  // lookarounds exclude neighbours that are digits or thousands separators, so a digit sitting
  // inside a formatted line amount ("18.000.000") cannot satisfy it either. No rendering format is
  // asserted — "x 3", "3 ×" and "Qty: 3" all pass — because A-08-1 infers only that the quantity is
  // VISIBLE, and the spec prescribes no layout.
  const lineWithoutProductName = line.split(product.name).join(' ');
  const standaloneQuantity = new RegExp(`(?<![\\d.,])${product.quantity}(?![\\d.,])`);

  expect
    .soft(
      lineWithoutProductName,
      `the ordered-product line does not show the quantity (${product.quantity}) as a distinct ` +
        `number. Per assumption A-08-1 (MED confidence), README FR-08 line 106's "đầy đủ" is read ` +
        `as requiring the quantity to be visible — this is an INFERENCE, not a quoted requirement. ` +
        `Full line as rendered: "${line}"`,
    )
    .toMatch(standaloneQuantity);

  expect
    .soft(
      digitsOnly,
      `the ordered-product line does not show the line amount (${lineAmount}). Per assumption ` +
        `A-08-1 (MED confidence) — an inference from line 106's "đầy đủ", not a quoted requirement`,
    )
    .toContain(String(lineAmount));
});

test(`${caseById('TC-08-N06-UI').id} — ${caseById('TC-08-N06-UI').title}`, async ({
  page,
  isolatedUser,
}) => {
  const testCase = caseById('TC-08-N06-UI');
  annotate(testCase);
  captureDialogs(page);

  await seedSession(page, isolatedUser.token);

  // The ONLY case in this batch that navigates directly to /checkout. Cart.jsx renders no checkout
  // button for an empty cart, so the in-app route is unreachable — and because there is no cart
  // state to preserve, a full navigation is safe here. Everywhere else it would destroy the cart.
  await page.goto(`${WEB_URL}/checkout`, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: 'Xác Nhận Đơn Hàng' }),
    'checkout page never rendered',
  ).toBeVisible();

  await expect
    .soft(
      orderedProductItems(page),
      `checkout displayed ordered-product lines for an empty cart. Per assumption A-08-2 (MED ` +
        `confidence), README FR-08 line 106 applied to the empty case means no lines are shown; ` +
        `the spec does not discuss an empty-cart checkout at all`,
    )
    .toHaveCount(expectedLineItemCount(testCase));
});
