import { expect, type Page, type APIRequestContext } from '@playwright/test';
import { WEB_URL } from './urls';

/**
 * FR-08 checkout UI helpers.
 *
 * WHY THIS FILE EXISTS — the client cart cannot be seeded any other way.
 *
 * The SUT has TWO disconnected carts:
 *   - a SERVER cart (`userCarts[userId]`, in-memory in server.js) written only by POST /api/cart;
 *   - a CLIENT cart (React state in CartContext.jsx) which is what Checkout.jsx actually renders.
 *
 * The web UI never calls POST /api/cart, so seeding the server cart would leave the checkout page
 * empty. The client cart is `useState([])` with NO persistence — no localStorage, no server sync —
 * so it cannot be seeded through storage either.
 *
 * Consequence, and the reason every helper below takes an already-open `page`: the cart must be
 * built by clicking through the UI, and every subsequent step must stay in the SAME page session.
 * A full navigation (`page.goto`, `page.reload`) remounts CartProvider and silently empties the
 * cart — the test would then assert against an empty checkout page and fail for a reason that has
 * nothing to do with the spec. All navigation after seeding therefore goes through in-app links,
 * which react-router handles client-side.
 */

/** A catalogue price read from the API — the INPUT side of R2, never the checkout page's own display. */
export type CatalogueProduct = { id: number; name: string; price: number };

/**
 * Reads catalogue prices from the backend.
 *
 * R2 states a RELATIONSHIP (total = computed from the cart), so the expected total must be derived
 * from prices obtained INDEPENDENTLY of the page under test. Reading them from the checkout page
 * itself would make the assertion circular — it would pass for any total the page chose to show.
 */
export async function fetchCatalogue(api: APIRequestContext): Promise<CatalogueProduct[]> {
  const response = await api.get('/api/products');
  expect(response.ok(), 'GET /api/products failed — cannot establish catalogue prices').toBeTruthy();
  return (await response.json()) as CatalogueProduct[];
}

export function priceOf(catalogue: CatalogueProduct[], name: string): number {
  const product = catalogue.find((p) => p.name === name);
  if (!product) {
    throw new Error(
      `product "${name}" is not in the catalogue — the test data references a product the SUT ` +
        `does not serve. Catalogue: ${catalogue.map((p) => p.name).join(', ')}`,
    );
  }
  return Number(product.price);
}

/**
 * Captures every browser dialog and dismisses it, returning the live array of messages.
 *
 * Checkout.jsx:63 calls alert() when checkout fails, and Cart.jsx:13 calls alert() when an
 * unauthenticated user presses the checkout button. An unhandled dialog blocks the page and every
 * later command, so the handler is registered BEFORE any interaction. Capturing rather than only
 * dismissing means "the app complained" is observable evidence instead of a silent swallow.
 */
export function captureDialogs(page: Page): string[] {
  const messages: string[] = [];
  page.on('dialog', (dialog) => {
    messages.push(dialog.message());
    void dialog.dismiss();
  });
  return messages;
}

/** Opens the storefront. Safe to call only BEFORE the cart is seeded — it is a full page load. */
export async function openStorefront(page: Page): Promise<void> {
  // `domcontentloaded` rather than the default `load`: the SUT is served by a Vite dev server that
  // compiles modules on demand, so `load` waits on work the test does not care about (measured in
  // FR-04 Batch A, where it caused navigation timeouts). The web-first assertion below is the real
  // readiness signal, and it retries by itself.
  await page.goto(WEB_URL, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { level: 2 }).first(),
    'storefront product grid never rendered',
  ).toBeVisible();
}

/**
 * Waits until AuthContext has resolved the seeded token into a real user.
 *
 * seedSession() only puts a token in localStorage; AuthContext then fetches /api/users/me and sets
 * `user` asynchronously. Cart.jsx:12 reads that `user`, and if it is still null when the checkout
 * button is pressed it alerts and redirects to /login. Without this wait the test would race the
 * fetch and fail intermittently — a flaky wait, not a defect.
 */
export async function waitForLoggedIn(page: Page): Promise<void> {
  await expect(
    page.getByRole('link', { name: /^Chào,/ }),
    'AuthContext never resolved the seeded token into a user',
  ).toBeVisible();
}

/**
 * Adds one unit of a product from the storefront grid.
 *
 * SELECTOR NOTE (architecture §3.3 — last-resort, logged deliberately): the product card carries no
 * role, label or test id. The card's <h2> IS a semantic anchor, so the locator anchors on the
 * heading and steps to its parent — `.locator('..')` — to reach the card's button. This is
 * structural and would break if Home.jsx wrapped the heading in another element; it is used because
 * the SUT may not be modified to add a test id, and it is still far more stable than an index-based
 * `getByRole('button').nth(n)`, which would break on any reordering of the grid.
 */
export async function addToCartFromHome(page: Page, productName: string): Promise<void> {
  const card = page
    .getByRole('heading', { level: 2, name: productName, exact: true })
    .locator('..');
  await card.getByRole('button', { name: 'Thêm vào giỏ' }).click();
}

/**
 * Adds a product with an explicit quantity, via the product detail page.
 *
 * Two reasons this cannot go through the storefront grid:
 *   1. The grid's button hardcodes quantity 1.
 *   2. CartContext.addToCart APPENDS a line rather than merging by product, so clicking the grid
 *      button three times produces THREE lines of quantity 1 — not one line of quantity 3, which is
 *      what TC-08-N05-UI is about.
 *
 * SETUP HAZARD, worked around deliberately: ProductDetail.jsx:21-31 ignores the FIRST click
 * (`if (clickCount === 0) { setClickCount(1); return; }`), so the button must be pressed twice to
 * add anything. That is a defect on the add-to-cart path, NOT on checkout — it belongs to the cart
 * feature and is explicitly out of FR-08 scope, so it is worked around here as setup and is NOT
 * asserted on, NOT counted as FR-08 coverage, and NOT filed as an FR-08 defect. The second click is
 * gated on the button's own "Đã thêm" confirmation so the workaround cannot silently under-add.
 */
export async function addToCartFromDetail(
  page: Page,
  productName: string,
  quantity: number,
): Promise<void> {
  await page
    .getByRole('heading', { level: 2, name: productName, exact: true })
    .locator('..')
    .getByRole('link', { name: 'Xem chi tiết' })
    .click();

  await expect(
    page.getByRole('heading', { level: 1, name: productName }),
    'product detail page never rendered',
  ).toBeVisible();

  // Label and input are siblings with no `for`/`id`, so getByLabel cannot associate them; the
  // quantity box is the only number input on this page.
  await page.locator('input[type="number"]').fill(String(quantity));

  const addButton = page.getByRole('button', { name: /Thêm vào giỏ hàng|Đã thêm/ });
  await addButton.click(); // swallowed by the clickCount guard
  await addButton.click(); // the click that actually adds
  await expect(addButton, 'add-to-cart never confirmed — the item may not be in the cart').toHaveText(
    'Đã thêm',
  );
}

/** Navigates to the cart via the header link — client-side routing, so the cart survives. */
export async function goToCart(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Giỏ hàng' }).click();
}

/**
 * Navigates cart → checkout via the in-app button. Requires a resolved session (see
 * waitForLoggedIn), otherwise Cart.jsx alerts and redirects to /login.
 */
export async function goToCheckoutFromCart(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await expect(
    page.getByRole('heading', { name: 'Xác Nhận Đơn Hàng' }),
    'checkout page never rendered — the cart→checkout navigation did not complete',
  ).toBeVisible();
}

/**
 * The checkout page's total field.
 *
 * SELECTOR NOTE (last-resort, logged): Checkout.jsx:92-102 renders <label> as a SIBLING of <input>
 * with no `for`/`id`, so getByLabel cannot reach it. This was verified against Checkout.jsx
 * directly rather than assumed from the profile form — the same defect shape recurs across this
 * SUT, but each occurrence is confirmed independently. XPath from the label text expresses "the
 * input belonging to the total field" and survives another number input being added to the page,
 * which a bare `input[type=number]` would not.
 */
export function totalInput(page: Page) {
  return page.locator(
    "xpath=//label[contains(., 'Tổng tiền thanh toán')]/following-sibling::input",
  );
}

/** The ordered-product list rendered by the checkout page (Checkout.jsx:84-88). */
export function orderedProductItems(page: Page) {
  return page.getByRole('list').first().getByRole('listitem');
}

/**
 * The total the page will actually submit, read from its own summary line (Checkout.jsx:136-139).
 *
 * Read as a NUMBER stripped of `toLocaleString` separators so the comparison is numeric rather than
 * a locale-formatted string match, which would differ per browser locale.
 */
export async function displayedTotal(page: Page): Promise<number> {
  // Scoped to the <span> so the locator cannot also match its wrapping <div>. Note the page's other
  // total string is "Tổng tiền thanh toán (VND):" (the label) — a different phrase, so no clash.
  const summary = page.locator('span').filter({ hasText: /Tổng thanh toán:/ });
  await expect(summary, 'checkout total summary never rendered').toBeVisible();
  const text = (await summary.textContent()) ?? '';
  const digits = text.replace(/[^0-9]/g, '');
  return Number(digits);
}
