import { randomBytes } from 'node:crypto';
import { test, expect } from '../../fixtures/base';
import { seedSession } from '../../utils/session';
import { WEB_URL } from '../../utils/urls';
import fixtureData from '../../data/fr-08-checkout.json';
import {
  addToCartFromHome,
  captureDialogs,
  goToCart,
  goToCheckoutFromCart,
  openStorefront,
  waitForLoggedIn,
} from '../../utils/checkout';

/**
 * FR-08 — Step 5 Batch C: cart-clearing (R5) and the interface half of access control (R1).
 *
 * R5 (README line 108): after a successful checkout, the cart is cleared.
 * R1 (README line 104): only a logged-in user can check out.
 *
 * Expected values come from data/fr-08-checkout.json only, never from observed behaviour.
 *
 * WHY THIS BATCH IS DELIBERATELY CROSS-SURFACE:
 * the SUT keeps TWO DISCONNECTED CARTS (design report §2.1) — a server cart in `userCarts[userId]`
 * written only by POST /api/cart, and an unpersisted client React cart that is what the customer
 * actually sees. Line 108 says "the cart is cleared" without naming a store, so each is a separate
 * observation of the same rule:
 *   - TC-08-EP-004  observes the SERVER cart, over the API.
 *   - TC-08-N07-UI  observes the CLIENT cart, through the interface.
 * THEY ARE JUDGED SEPARATELY. Whether they share a root cause is decided AFTER the run from
 * evidence — merging them now would presuppose the answer, and if the two disagree that
 * disagreement is itself the finding.
 *
 * ORACLE NOTE — no mechanism is ever asserted. Line 104 does not say how an anonymous checkout must
 * be refused (no redirect target, no status code, no dialog text), and line 108 does not say how the
 * cart must be emptied. Every assertion below states an outcome; the mechanism the app happened to
 * use is recorded as an annotation.
 *
 * BROWSER COVERAGE: TC-08-N07-UI and TC-08-N11-UI request `page` and are genuine browser runs
 * (2 cases × 3 = 6). TC-08-EP-004 is API-path, launches NO browser, and its 3 executions are matrix
 * uniformity only — they are excluded from the browser-run count, exactly as Batch B's 18 are.
 */

type CaseData = (typeof fixtureData.cases)[number];
type CatalogueProduct = { id: number; name: string; price: number };

const batchC = fixtureData.cases.filter((c) => c.batch === 'C');
if (batchC.length !== 3) {
  throw new Error(`expected 3 batch-C cases in fr-08-checkout.json, found ${batchC.length}`);
}

const caseById = (id: string): CaseData => {
  const found = batchC.find((c) => c.id === id);
  if (!found) throw new Error(`case ${id} missing from fr-08-checkout.json batch C`);
  return found;
};

const seededProducts = (testCase: CaseData): Array<{ name: string; quantity: number }> => {
  const products = testCase.input.products;
  if (!products) {
    throw new Error(`case ${testCase.id} declares no input.products in fr-08-checkout.json`);
  }
  return products;
};

const serverCartOf = (testCase: CaseData): Array<{ name: string; quantity: number }> => {
  const cart = testCase.input.serverCart;
  if (!cart) {
    throw new Error(`case ${testCase.id} declares no input.serverCart in fr-08-checkout.json`);
  }
  return cart;
};

const expectedNumber = (testCase: CaseData, key: string): number => {
  const value = (testCase.expected as Record<string, unknown>)[key];
  if (typeof value !== 'number') {
    throw new Error(`case ${testCase.id} is missing expected.${key} in fr-08-checkout.json`);
  }
  return value;
};

const annotate = (testCase: CaseData) => {
  test.info().annotations.push(
    { type: 'Requirement', description: testCase.requirement },
    { type: 'Technique', description: testCase.technique },
    { type: 'Expected source', description: testCase.expectedSource },
    { type: 'Cart store observed', description: testCase.mechanism === 'UI' ? 'client (React state)' : 'server (userCarts)' },
  );
  if (testCase.hw02Ref) {
    test.info().annotations.push({ type: 'HW02 case', description: testCase.hw02Ref });
  }
};

// --- R5, server cart (API) ---------------------------------------------------------------------

test(`${caseById('TC-08-EP-004').id} — ${caseById('TC-08-EP-004').title}`, async ({
  api,
  freshUser,
}) => {
  // freshUser (test-scoped): this case persists an order and asserts on its own cart, so a
  // worker-shared account could see another test's cart lines. No browser is requested.
  const testCase = caseById('TC-08-EP-004');
  annotate(testCase);

  const auth = { Authorization: `Bearer ${freshUser.token}` };
  const productsResponse = await api.get('/api/products');
  expect(productsResponse.ok(), 'GET /api/products failed — cannot seed the cart').toBeTruthy();
  const catalogue = (await productsResponse.json()) as CatalogueProduct[];

  let cartTotal = 0;
  for (const item of serverCartOf(testCase)) {
    const product = catalogue.find((p) => p.name === item.name);
    if (!product) throw new Error(`product "${item.name}" is not in the catalogue`);
    const added = await api.post('/api/cart', {
      headers: auth,
      data: { id: product.id, name: product.name, price: product.price, quantity: item.quantity },
    });
    expect(added.ok(), `POST /api/cart failed for "${item.name}" — setup failed`).toBeTruthy();
    cartTotal += Number(product.price) * item.quantity;
  }

  // Precondition: the cart must be non-empty BEFORE checkout, or "the cart is empty afterwards"
  // would be trivially true and would prove nothing. A failure here is setup, not an FR-08 result.
  const before = await (await api.get('/api/cart', { headers: auth })).json();
  expect(
    (before as unknown[]).length,
    'server cart was not seeded — setup failed, not an FR-08 result',
  ).toBe(serverCartOf(testCase).length);

  // A valid total is sent so this case tests ONLY the cart-clearing postcondition. Whether the
  // backend recomputes it is R4's subject and is already covered by Batch B; nothing here asserts
  // on the persisted total.
  const checkout = await api.post('/api/checkout', {
    headers: auth,
    data: { total_amount: cartTotal, shipping_address: `FR08-C EP-004 ${randomBytes(4).toString('hex')}` },
  });
  test.info().annotations.push({ type: 'Checkout status', description: String(checkout.status()) });

  // The postcondition only applies "sau thanh toán thành công" — after a SUCCESSFUL checkout — so
  // the success must be established before the cart is judged.
  const body = (await checkout.json()) as { orderId?: number };
  expect
    .soft(body.orderId, 'checkout did not report a created order — the R5 precondition does not hold')
    .toBeDefined();

  const after = await (await api.get('/api/cart', { headers: auth })).json();
  expect
    .soft(
      (after as unknown[]).length,
      `the server cart still holds items after a successful checkout; FR-08 line 108 requires the ` +
        `cart to be cleared. Judged independently of the client cart (TC-08-N07-UI)`,
    )
    .toBe(expectedNumber(testCase, 'serverCartLinesAfterCheckout'));
});

// --- R5, client cart (UI) ----------------------------------------------------------------------

test(`${caseById('TC-08-N07-UI').id} — ${caseById('TC-08-N07-UI').title}`, async ({
  page,
  freshUser,
}) => {
  test.slow(); // UI-path: same measured contention budget as Batch A (report §10.3).
  const testCase = caseById('TC-08-N07-UI');
  annotate(testCase);
  const dialogs = captureDialogs(page); // Checkout.jsx:63 alerts on a failed checkout.

  await seedSession(page, freshUser.token);
  await openStorefront(page);
  await waitForLoggedIn(page);

  for (const item of seededProducts(testCase)) {
    await addToCartFromHome(page, item.name);
  }

  await goToCart(page);
  await expect(
    page.getByRole('row'),
    'cart did not contain the seeded product — setup failed, not an FR-08 result',
  ).toHaveCount(seededProducts(testCase).length + 1, { timeout: 15_000 }); // +1 header row

  await goToCheckoutFromCart(page);
  await page.getByRole('button', { name: 'Xác Nhận Thanh Toán' }).click();

  // R5 applies only after a SUCCESSFUL checkout, so the success state is the precondition for the
  // assertion that follows — not the thing under test.
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thành công!' }),
    `checkout did not complete, so the R5 postcondition does not apply. Dialogs: ${JSON.stringify(dialogs)}`,
  ).toBeVisible();

  // Back to the cart WITHOUT a page load: the success screen's control is an in-app button
  // (Checkout.jsx:73 navigate('/')), and the header link is client-side too. A page.reload() or
  // page.goto() here would remount CartProvider and empty the cart by itself — manufacturing a pass
  // for a defect that may well exist. This is the single most important mechanic in this case.
  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await goToCart(page);

  await expect
    .soft(
      page.getByRole('row'),
      `the cart the customer sees still holds items after a successful checkout; FR-08 line 108 ` +
        `requires the cart to be cleared. Judged independently of the server cart (TC-08-EP-004)`,
    )
    .toHaveCount(expectedNumber(testCase, 'cartRowsAfterCheckout'), { timeout: 10_000 });
});

// --- R1, interface half (UI) -------------------------------------------------------------------

test(`${caseById('TC-08-N11-UI').id} — ${caseById('TC-08-N11-UI').title}`, async ({ page }) => {
  test.slow();
  const testCase = caseById('TC-08-N11-UI');
  annotate(testCase);
  const dialogs = captureDialogs(page);

  // No session is seeded and no user fixture is requested — this test is anonymous by construction.
  await openStorefront(page);
  for (const item of seededProducts(testCase)) {
    await addToCartFromHome(page, item.name);
  }
  await goToCart(page);

  // --- Observation 1: the in-app route into checkout is not open to an anonymous user.
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  // The settle check must admit EVERY outcome, including the violating one. An earlier version
  // waited only for the cart or a login heading; had the app wrongly admitted an anonymous user, the
  // checkout heading would have matched neither and this would have timed out BEFORE the oracle
  // below could fire — reporting "the app did not settle" instead of the violation. Same defect
  // class as finding 60.
  await expect(
    page.getByRole('heading', { name: /Giỏ Hàng|Đăng|Xác Nhận Đơn Hàng/ }).first(),
    'the app did not settle after the checkout attempt',
  ).toBeVisible();

  test.info().annotations.push(
    { type: 'URL after anonymous checkout attempt', description: page.url() },
    { type: 'Dialogs shown', description: JSON.stringify(dialogs) },
  );

  // Outcome, not mechanism: the spec does not say WHERE an anonymous user must be sent, only that
  // they may not check out. No assertion names /login, the alert text, or a status code.
  expect
    .soft(
      page.url(),
      `an anonymous user reached the checkout page from the cart; FR-08 line 104 says only a ` +
        `logged-in user may check out`,
    )
    .not.toContain('/checkout');

  // --- Observation 2: even reached directly, checkout cannot be completed anonymously.
  // page.goto is deliberate and safe HERE ONLY: the client cart is irrelevant to this half of the
  // claim, which is about authentication. It is the only way to reach the route, because the in-app
  // path was just shown to be closed. Recorded so it is not mistaken for the Batch A mistake.
  const checkoutResponses: number[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/checkout')) checkoutResponses.push(response.status());
  });

  await page.goto(`${WEB_URL}/checkout`, { waitUntil: 'domcontentloaded' });

  // Requiring the checkout form to render would again require the defect to be present: an
  // implementation that guarded the /checkout route for anonymous users would be MORE compliant with
  // line 104, yet would fail this case as a harness error. Presence is probed instead, and the
  // oracle below holds either way — vacuously if the form is unreachable, substantively if it is.
  const confirmButton = page.getByRole('button', { name: 'Xác Nhận Thanh Toán' });
  const formReachable = (await confirmButton.count()) > 0;
  test.info().annotations.push({
    type: 'Checkout form reachable anonymously',
    description: String(formReachable),
  });
  // CAPTURE-THEN-ASSERT (pre-run correction, finding 60). The readiness signal must not be the
  // checkout button remaining visible: Checkout.jsx:68-76 REPLACES the entire form with the success
  // screen when `success` becomes true, so if an anonymous checkout wrongly SUCCEEDED — precisely
  // the defect this case exists to catch — the button would vanish, that assertion would time out,
  // and the test would report "the checkout button never settled" instead of the actual violation.
  // A test must not depend on the correct outcome in order to reach its own oracle.
  //
  // So the request is captured as an OPTIONAL value instead. Absent (client-side block) and present
  // (server refusal) are both legitimate compliant shapes, and neither is asserted as a mechanism.
  if (formReachable) {
    const checkoutResponse = page
      .waitForResponse((response) => response.url().includes('/api/checkout'), { timeout: 10_000 })
      .catch(() => null);

    await confirmButton.click();
    const captured = await checkoutResponse;

    test.info().annotations.push({
      type: 'Checkout request observed',
      description: captured ? `yes — status ${captured.status()}` : 'no request was issued',
    });
  }

  test.info().annotations.push(
    { type: 'Checkout response statuses', description: JSON.stringify(checkoutResponses) },
    { type: 'Dialogs shown (direct attempt)', description: JSON.stringify(dialogs) },
  );

  // "No order was created" cannot be checked by marker here: Checkout.jsx sends only
  // {items, total_amount, coupon_id} and never shipping_address, so a UI-created order carries no
  // identifying token. The app's own completion signal is therefore the observable — and asserting a
  // global order count would be meaningless under parallel execution.
  await expect
    .soft(
      page.getByRole('heading', { name: 'Thanh toán thành công!' }),
      `an anonymous user reached a completed checkout; FR-08 line 104 says only a logged-in user ` +
        `may check out. Dialogs: ${JSON.stringify(dialogs)}`,
    )
    .toHaveCount(0);

  // Corroborating outcome on a different channel: no checkout request may have succeeded. This
  // states "not successful" rather than naming a specific refusal code, which the spec does not give.
  expect
    .soft(
      checkoutResponses.filter((status) => status >= 200 && status < 300),
      `an anonymous checkout request succeeded; FR-08 line 104 forbids it. Observed statuses: ` +
        `${JSON.stringify(checkoutResponses)}`,
    )
    .toEqual([]);
});
