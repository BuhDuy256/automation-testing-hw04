# FR-08 — Automation Report (Checkout)

> **Status:** Step 5.2 — Batch A **executed**. 12 passed / 6 failed over 18 executions; 2 confirmed
> defects (issues #4, #5). Design §1–§6, review §7, gates §8, prediction §9, results §10.
> Batches B and C are not started.
>
> | Field | Value |
> |---|---|
> | Student | Nguyen Bao Duy — 23127179 — 23KTPM2 |
> | Feature | FR-08 Checkout (Pool B) |
> | SUT surface | `frontend-web` + backend API |
> | Method | `test-automation-design` skill — Phase 1 (§1–§6), then Phases 2–4 for Batch A (§7–§9) |
> | Batch A freeze | see the freeze commit in the ledger; recorded **before** any run |

---

## 1. Test basis — R1–R5

Quoted from `eshop-sut/README.md` FR-08, lines 104–108. These five lines are the **entire** test
basis for this feature; every case below traces to one of them.

| Ref | Line | Requirement (original) | Working translation |
|---|---|---|---|
| **R1** | 104 | *Chỉ người dùng **đã đăng nhập** mới tiến hành thanh toán được.* | Only a logged-in user can check out |
| **R2** | 105 | ***Tổng tiền thanh toán** được tính tự động từ giỏ hàng và không cho phép người dùng chỉnh sửa trực tiếp.* | The total is computed automatically from the cart and the user may not edit it directly |
| **R3** | 106 | *Giao diện hiển thị đầy đủ danh sách sản phẩm đặt mua.* | The interface displays the full list of ordered products |
| **R4** | 107 | *Backend phải tự tính lại tổng tiền; không chấp nhận giá trị `total_amount` do client gửi lên.* | The backend must recompute the total; a client-sent `total_amount` is not accepted |
| **R5** | 108 | *Sau thanh toán thành công, giỏ hàng được xóa.* | After a successful checkout, the cart is cleared |

### 1.1 Explicitly out of scope

The checkout page renders controls belonging to other features. None of them is asserted, and none
counts toward FR-08 coverage:

| Excluded | Why | Where it appears |
|---|---|---|
| **FR-07** — cart quantity / stock rules | Different feature, different pool | `Cart.jsx`, quantity control |
| **FR-09** — coupon codes | Different feature; the coupon panel is *on* the checkout page but its 5 conditions (C1–C5) are FR-09's basis, not FR-08's | `Checkout.jsx` coupon section |
| **FR-10** — order status / state machine | Different feature | `PUT /api/orders/:id/cancel` |
| Shipping-address validation | FR-08 states **no** rule about shipping address; asserting one would invent an oracle | `shipping_address` field |

**Setup is not coverage.** Logging in (FR-02) and adding items to the cart (FR-07) are
*preconditions* for nearly every case below. They are performed as setup and are **never counted as
FR-08 coverage**, nor asserted beyond the minimum needed to establish the precondition.

### 1.2 Accepted assumptions introduced here

Per the skill's evidence-strength rule, a case resting on an assumption is weaker than one citing a
line directly, and must say so.

| ID | Confidence | Statement |
|---|---|---|
| **A-08-1** | **MED** | R3's *"đầy đủ"* (full/complete) is read as requiring each ordered product's **identity** to be visible. Whether the **quantity** and **line amount** must also be shown is an inference from "full", not a quoted requirement. `TC-08-N05-UI` rests on this. |
| **A-08-2** | **MED** | R3 applied to an **empty** cart means the displayed list is empty — i.e. the page must not fabricate line items. The spec does not discuss checkout with an empty cart at all. `TC-08-N06-UI` rests on this. |

---

## 2. Two findings from reading the SUT that change the design

Reading the implementation is legitimate for **locating** behaviour and choosing a mechanism, never
for deriving an oracle (skill, Authoritative Inputs). Two facts materially affect Phase 1.

### 2.1 There are two carts, and they are disconnected

| Cart | Where | Written by | Read by |
|---|---|---|---|
| **Server cart** | `userCarts[userId]`, an in-memory object in `backend/server.js` | `POST /api/cart` | `GET /api/cart` |
| **Client cart** | React state in `CartContext.jsx` (`useState([])`) | `addToCart` in the UI | `Checkout.jsx` via `useCart()` |

The UI **never calls** `POST /api/cart`, and `POST /api/checkout` reads **neither** cart — it
inserts the client-supplied `total_amount` directly.

Two consequences for design:

1. **R5 has two genuinely different observations**, not one. HW02's `TC-08-EP-004` checks the
   *server* cart. A UI checkout can only affect the *client* cart. These are different stores with
   different code paths, so `TC-08-N07-UI` is **not** a duplicate of `TC-08-EP-004` — and if they
   disagree, that disagreement is itself a finding.
2. **The client cart cannot be seeded through the API or through storage.** It is React state with
   **no persistence** — no `localStorage`, no server sync. So any UI case must add its items
   *through the UI* and complete its assertions **within one page session**; a `page.reload()`
   destroys the cart and would silently invalidate the test. This is a hard constraint on every
   Batch A / Batch C UI case and is recorded here so it is not rediscovered as a "flaky test".

### 2.2 `page.route()` interception is **not** needed for FR-08 — correcting a Step 1 assumption

`automation-architecture.md` §3.1 used FR-08's forged `total_amount` as its worked example of a case
requiring request interception, reasoning that *"the client computes the total; there is no field to
type a forged value into."*

**That premise is false for this SUT.** `Checkout.jsx:14` holds the total in editable state
(`editableTotal`) and lines 93–102 render it as a plain `<input type="number">` bound to
`setEditableTotal`. The application hands the user an ordinary form field for the order total.

So the forged-total case is reachable **through the UI**, by an ordinary user, with no tooling. That
changes the mechanism map (`TC-08-N03-UI` is a UI case, not an interception case) and it changes the
*claim* a defect here would support: not "an attacker crafting requests can forge the total" but
"any customer can type a different number into the form". Interception is used **nowhere** in FR-08.

The architecture decision itself (§3.1's *policy*) stands; only its illustrative example was wrong.
Recorded rather than quietly corrected, per the same discipline applied to the report-stamp grep
error in Step 1.

---

## 3. HW02 inheritance and the coverage gap

Four FR-08 cases were frozen in HW02 and are reused unchanged:

| HW02 case | R | What it covers |
|---|---|---|
| `TC-08-001` | R4 | Forged low `total_amount` overrides the real cart total |
| `TC-08-EP-002` | R1 | Checkout with no `Authorization` header |
| `TC-08-EP-003` | R1 | Checkout with an invalid/expired JWT |
| `TC-08-EP-004` | R5 | Server cart cleared after successful checkout |

**HW02 coverage by requirement: R1 = 2, R2 = 0, R3 = 0, R4 = 1, R5 = 1.**

R2 and R3 have **zero** HW02 coverage — both are UI-surface rules, and HW02's FR-08 work was
entirely API-path. They are therefore the design priority here, and receive the largest share of new
cases (6 of 11).

HW02 also **declared** three `total_amount` invalid classes as deliberately out of scope for its
pass (`< 0`, `= 0`, very large), leaving a follow-up decision to the sibling BVA report. Three of
the new R4 cases fill exactly that declared gap rather than inventing new ground.

---

## 4. FR-08 case set — 15 cases (4 reused + 11 new)

Minimum is 12. `N` in an ID means **new in HW04**, so provenance is visible at a glance.

| # | ID | Source | R | Mechanism | Input / precondition | Expected outcome | `expectedSource` | Reason for mechanism | Batch |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `TC-08-N01-UI` | new | **R2** | UI | Logged in; cart seeded via UI to a known total *X* | The user cannot cause the submitted total to differ from *X*. **No assertion on *how*** (readonly / disabled / absent) — only the outcome | spec — README 105 | R2 is a statement about the **interface**; only the UI can show whether the field is user-editable | **A** |
| 2 | `TC-08-N02-UI` | new | **R2** | UI | Cart seeded via UI with 2 distinct products × distinct quantities | Displayed total equals Σ(price × quantity) computed from cart contents | spec — README 105 (*"tính tự động từ giỏ hàng"*) | The "computed from cart" half of R2 is only observable where the cart is rendered | **A** |
| 3 | `TC-08-N03-UI` | new | **R2** (→R4) | UI | Cart seeded to known total *X*; user edits the total field to a different value *Y ≠ X*; confirms checkout | The persisted order total equals *X*, not *Y* | spec — README 105 + 107 | Uses the editable field the app itself provides (§2.2) — **no interception needed** | **A** |
| 4 | `TC-08-N04-UI` | new | **R3** | UI | Cart seeded via UI with 3 distinct products | All 3 product identities appear in the checkout list | spec — README 106 | R3 is explicitly a rule about *giao diện* (the interface) | **A** |
| 5 | `TC-08-N05-UI` | new | **R3** | UI | Cart seeded with 1 product, quantity 3 | Quantity and line amount for that product are displayed | **assumption A-08-1** (MED) | As above | **A** |
| 6 | `TC-08-N06-UI` | new | **R3** | UI | Empty cart; navigate to checkout | No product line items are displayed (the page fabricates none) | **assumption A-08-2** (MED) | As above; min boundary of the list-size domain | **A** |
| 7 | `TC-08-001` | **HW02** | **R4** | API | Authenticated; cart seeded to real total *X*; `POST /api/checkout` with `total_amount: 1` | Persisted order total equals *X*; the forged `1` has no effect | spec — README 107 | Forged payload; isolates the **backend** contract from the UI's editability | **B** |
| 8 | `TC-08-EP-002` | **HW02** | **R1** | API | `POST /api/checkout` with **no** `Authorization` header | Rejected before any order is created; no new order persisted. **No status code asserted** | spec — README 104, reframed per HW02 assumption A6 | The UI never renders a way to omit the auth header | **B** |
| 9 | `TC-08-EP-003` | **HW02** | **R1** | API | `POST /api/checkout` with `Authorization: Bearer invalid.token.value` | Same as #8 — no order persisted | spec — README 104, per A6 | The UI never renders a way to send a malformed token | **B** |
| 10 | `TC-08-N08-API` | new | **R4** | API | Authenticated; cart seeded to real total *X*; `total_amount` **omitted entirely** from the body | Persisted order total equals *X* — the backend computes it itself | spec — README 107 (*"phải tự tính lại"*) | **Not expressible in the UI** — the client always sends the field | **B** |
| 11 | `TC-08-N09-API` | new | **R4** | API | Cart seeded to real total *X*; `total_amount` = *X* × 100 (overstated) | Persisted order total equals *X* | spec — README 107 | Fills an HW02-declared gap (*very large* class); isolates the backend half | **B** |
| 12 | `TC-08-N10-API` | new | **R4** | API | Cart seeded to real total *X*; `total_amount: 0` | Persisted order total equals *X* | spec — README 107 | Fills an HW02-declared gap (*= 0* class) | **B** |
| 13 | `TC-08-EP-004` | **HW02** | **R5** | API | Authenticated; 1 item added via `POST /api/cart`; successful `POST /api/checkout` | `GET /api/cart` returns empty for that user | spec — README 108 | Observes the **server** cart, which the UI never writes to (§2.1) | **C** |
| 14 | `TC-08-N07-UI` | new | **R5** | UI | Cart seeded via UI; checkout completed through the UI to its success state | The **client** cart is empty afterwards | spec — README 108 | Observes the **client** cart — a different store with a different code path (§2.1) | **C** |
| 15 | `TC-08-N11-UI` | new | **R1** | UI | **No session**; navigate directly to `/checkout` (the route is unguarded); seed cart; attempt to confirm | Checkout does not succeed — the success state is never reached and no order is created | spec — README 104 | R1's user-facing half; the API cases cover the header-level half | **C** |

### 4.1 Coverage by requirement

| Ref | HW02 | New | **Total** | Cases |
|---|---|---|---|---|
| **R1** — login required | 2 | 1 | **3** | `EP-002`, `EP-003`, `N11-UI` |
| **R2** — total auto-computed, not user-editable | **0** | **3** | **3** | `N01-UI`, `N02-UI`, `N03-UI` |
| **R3** — full product list displayed | **0** | **3** | **3** | `N04-UI`, `N05-UI`, `N06-UI` |
| **R4** — backend recomputes total | 1 | 3 | **4** | `TC-08-001`, `N08-API`, `N09-API`, `N10-API` |
| **R5** — cart cleared | 1 | 1 | **2** | `EP-004`, `N07-UI` |
| | **4** | **11** | **15** | ✅ ≥12, ✅ ≥8 new |

Every requirement has at least two independent cases. The two that had **zero** HW02 coverage now
have three each, as the plan requires.

### 4.2 Convergence and near-duplication, declared

Per skill Phase 1.4 — kept, but declared, so no reader counts them as independent evidence.

| Cases | Relationship | Why both are kept |
|---|---|---|
| `TC-08-001`, `N09-API`, `N10-API` | **Converge on one expected root cause** — all three send a `total_amount` the backend is required to ignore. Same mechanism, same assertion shape; only the invalid sub-class differs (understated / overstated / zero) | Together they establish the rule is unenforced across the **whole** invalid domain rather than at one value — the same argument that justified the FR-04 API boundary batch. Individually they are *not* independent evidence |
| `N03-UI` vs `TC-08-001` | **Same rule, different surface and different claim.** `TC-08-001` forges at the API; `N03-UI` uses the form field the app itself provides | The severity claims differ materially: "a crafted request forges the total" vs "**any customer can type a different number**". Not a duplicate |
| `N07-UI` vs `TC-08-EP-004` | **Same rule, two different data stores** (§2.1) | Different code paths; disagreement between them would itself be a finding |
| `N11-UI` vs `EP-002`/`EP-003` | Same rule, different surface | The API pair tests the header contract; `N11-UI` tests whether a user can reach a completed checkout without logging in |

### 4.3 Cases that cannot be automated

**None.** All 15 are automatable through the UI or `APIRequestContext`. Request interception is not
required by any of them (§2.2).

Two design constraints carry into every batch rather than blocking any case:

- **UI cases must seed and assert within one page session** — the client cart is unpersisted React
  state (§2.1). No `page.reload()` between seeding and assertion.
- **`Checkout.jsx:63` calls `alert()` on a failed checkout.** A blocking dialog must be handled by a
  registered dialog handler, as FR-04's profile cases already do. Relevant to `N11-UI` in
  particular, where a failure path is the expected route.

---

## 5. Batch plan

| Batch | Surface | Cases | Requirements | Rationale |
|---|---|---|---|---|
| **A** | UI | 6 — `N01`…`N06` | **R2, R3** | The zero-coverage gap, tackled first and as one coherent unit: everything the checkout **page** must render and must not let the user change |
| **B** | API | 6 — `TC-08-001`, `EP-002`, `EP-003`, `N08`, `N09`, `N10` | **R1, R4** | The backend contract — auth enforcement and total recomputation. All payload/header shapes the UI cannot express |
| **C** | UI + API | 3 — `EP-004`, `N07`, `N11` | **R5, R1** | Postconditions and the UI auth path. Deliberately cross-surface: R5's two cart stores must be observed on **both** surfaces to be meaningful (§2.1) |

Batches A and B sit at the skill's stated 4–6 range. **Batch C is 3, below the range** — an
intentional deviation: it is the residual, and its cases are paired by *surface contrast* rather
than by shared surface, which is the whole point of running them together. Under-sizing does not
harm reviewability; over-sizing does.

Three batches → **3 freeze commits**, which with FR-15's 3 clears the §12 floor of 8 (currently 4).

### 5.1 Anticipated risk areas — *not* the formal prediction

Formal pass/fail predictions belong to each batch's **pre-freeze review** (skill Phase 4.4), where
they are recorded before that batch runs. Noting here only where the design expects to find
something, so the batch order is understood:

- **R4 has a confirmed HW02 defect** (`BUG-08-001`, Critical) and **R5 has one** (`BUG-08-002`,
  Medium). Both were filed in HW02 against this same SUT; HW04 re-tests them through automation.
- **R2 is the newly-covered area most likely to yield a finding**, given §2.2.
- **R3 is the newly-covered area most likely to pass** — `Checkout.jsx:85` does map over the cart.
  A passing R3 would be useful, not filler: it distinguishes "the checkout page is broadly wrong"
  from "the total handling specifically is wrong".

No assertion will be written to match any of this. Expected values come from §1's table only.

---

## 6. What Step 5.1 deliberately did not produce

- **No `.spec.ts`** — Phase 2 (data) and Phase 3 (generation) belong to the Batch A freeze.
- **No data file.** A design-stage `fr-08-checkout.json` would be a half-frozen artefact: present in
  the tree but not yet reviewed under Phase 4, and easy to mistake for frozen. It is created **in**
  the Batch A freeze commit, where the review findings that shape it are recorded alongside it.
- **No run.** Nothing in FR-08 has been executed.

---

---

# Step 5.2 — Batch A (R2 + R3), frozen, not yet run

Six UI cases, `TC-08-N01-UI` … `TC-08-N06-UI`. Files: `automation/data/fr-08-checkout.json`,
`automation/utils/checkout.ts`, `automation/tests/fr-08-checkout/checkout-page.spec.ts`.

## 7. Human review of the AI-generated specs — findings and fixes

Reviewed **before** the freeze commit and before any run.

| # | Finding | Why it was missed | Fix |
|---|---|---|---|
| 24 | **Hardcoding the expected total would have made the oracle depend on SUT seed data.** The obvious generated form puts `"expectedTotal": 10000000` in the data file. R2 does not state a number — it states a **relationship** (*total = computed from the cart*). A literal would silently become wrong the moment the catalogue changed, and it would encode the SUT's fixture data as if it were the spec. | Model bias toward a concrete, comparable literal; a number in a data file *looks* like externalized data even when it is an invented expectation. | Expected totals are computed at runtime as Σ(catalogue price × quantity), with prices read from **`GET /api/products`** — a source independent of the page under test. The data file carries the **rule** (`"sumOfLineAmounts"`), not a value. |
| 25 | **Asserting the total field is `disabled`/`readonly` would invent a mechanism.** The natural assertion for "the user may not edit it" is `toBeDisabled()`. Line 105 forbids the *outcome* (a user-set total taking effect); it prescribes **no** mechanism — omitting the field, ignoring its value, or making it read-only would all comply. | The recurring failure mode from the skill's table, entry 1 — "invalid" and "not allowed" read like "must be blocked *this way*". Third feature in a row it has appeared. | No assertion on the mechanism. `TC-08-N01-UI` attempts the edit and asserts the **effective total is still the cart-derived value**; whether the field was editable is recorded as an **annotation** (evidence, not oracle). |
| 26 | **`fill()` on a non-editable field would error instead of asserting.** If the app *had* correctly made the total read-only, `fill()` throws — the test would report a Playwright error, not a pass, so a compliant implementation would fail the test. | The generated happy path assumed the field is editable, because in this SUT it is. Writing a test that only works against the buggy behaviour is a subtle form of encoding observed behaviour as expectation. | Guarded with `isEditable()`; the edit is attempted only if possible, and the same outcome assertion runs either way. The case now passes against a compliant implementation and fails against this one. |
| 27 | **Circular assertion risk on R2.** Reading the product prices from the checkout page and then asserting the checkout total against them would pass for *any* total the page chose to display. | The cart and the total render on the same page, so the nearest source of prices is the wrong one. | Prices come from the catalogue API; the page supplies only the value under test. |
| 28 | **`getByLabel` is unusable for the total field — verified, not assumed.** `Checkout.jsx:92-102` renders `<label>` as a **sibling** of `<input>` with no `for`/`id`. | Environment characteristic. It is the same shape as the FR-04 profile form, but the plan explicitly forbids inheriting FR-04's conclusions, so it was re-confirmed against `Checkout.jsx` directly. | XPath from the label text — `//label[contains(., 'Tổng tiền thanh toán')]/following-sibling::input` — expressing *"the input belonging to the total field"*. Logged as a deliberate last-resort selector (architecture §3.3) with its fragility named. A bare `input[type=number]` was rejected: it is unique **today** only because the coupon input is `type=text`. |
| 29 | **A full navigation destroys the cart, and the obvious `page.goto('/checkout')` does exactly that.** The client cart is `useState([])` with no persistence, so any `goto`/`reload` remounts `CartProvider` and empties it. The test would then assert against an empty checkout page and fail for a reason unrelated to the spec. | The natural way to reach a page is to navigate to its URL; nothing about the URL suggests the state is in memory. | All post-seed navigation goes through **in-app links** (react-router, client-side). `page.goto` appears exactly once after seeding — in `TC-08-N06-UI`, whose cart is *deliberately empty*, where it is the only way to reach the route and is therefore safe. `page.reload` is used nowhere. |
| 30 | **The seeded session resolves asynchronously, and `Cart.jsx` races it.** `seedSession` only writes a token; `AuthContext` then fetches `/api/users/me` and sets `user`. `Cart.jsx:12` reads that `user` and, if it is still `null`, alerts and redirects to `/login`. | A flaky wait: it would pass whenever the fetch happened to win the race. | `waitForLoggedIn()` waits for the header's *"Chào, …"* link — a real readiness signal for the state the next click depends on — before any cart interaction. |
| 31 | **Seeding via the product-detail page silently under-adds.** `ProductDetail.jsx:21-31` ignores the **first** click (`if (clickCount === 0) { … return; }`), so a single click adds nothing and the cart would be empty with no error. | A deliberate SUT defect on the **add-to-cart** path, invisible without reading the handler. | Clicked twice, then gated on the button's own `"Đã thêm"` confirmation so the workaround cannot silently fail. Recorded as a **setup-path** observation: it belongs to the cart feature, is **out of FR-08 scope**, is not asserted on, and is **not** filed as an FR-08 defect. |
| 32 | **Clicking the grid button *N* times does not create a line of quantity *N*.** `CartContext.addToCart` **appends** a line rather than merging by product, so three clicks yield three lines of quantity 1 — not the single quantity-3 line `TC-08-N05-UI` is about. | Reasonable assumption about cart semantics that this implementation does not hold. | `TC-08-N05-UI` seeds through the detail page's quantity input (`seedVia: "productDetail"`); the distinction is recorded in the data file's `schemaNote`. |
| 33 | **A heterogeneous `expected` shape typed `lineItemCount` as `number \| undefined`.** The cases assert different things, so three `toHaveCount(testCase.expected.lineItemCount)` calls did not typecheck. The tempting fixes — `!` or a cast — would let a data-file edit that drops the key reach `toHaveCount(undefined)`: a silent, meaningless assertion. | Consequence of one data file serving cases with different assertion targets. | Added `expectedLineItemCount()` / `soleProduct()` accessors that **throw** when the key is absent — same spirit as the batch-size guard. Caught by `npx tsc --noEmit` **before** the freeze. |
| 34 | **A careless bulk edit introduced infinite recursion.** Applying finding 33's accessor with a regex rewrote the helper's **own body** into `const product = soleProduct(testCase)` instead of the call site. **Typecheck still passed** — unbounded recursion is a runtime fault, not a type error. | Editing error, not a reasoning error. Notable because the gate that caught finding 33 could not catch this: `tsc` proves types, not termination. | Both sites corrected by hand and verified by reading the helper back. Reinforces that a static gate certifies only what it observes — the same lesson as the report-stamp grep in Step 1. |
| 35 | **Cart-seeding failure would have been reported as an FR-08 violation.** If a click silently failed, the checkout page would show fewer products and `TC-08-N04-UI` would fail its count assertion — indistinguishable from the SUT genuinely omitting a product. | The generated code trusted its own setup. | A cart-page row-count check runs **between** seeding and checkout, with a message naming it a **setup** failure. A setup problem now fails separately from the FR-08 claim. |
| 36 | **Fixture scope had to be re-derived, not inherited.** FR-04 concluded "use `freshUser` wherever state is asserted". Applying that here blindly would cost six registrations for a batch where five cases mutate **nothing** server-side — the client cart is per-browser-context and Playwright already isolates it per test. | The plan's own risk: carrying a per-feature conclusion across features. | Scope derived per case from what it writes. `TC-08-N03-UI` **persists an order** → test-scoped `freshUser`, so *"the order this test created"* is unambiguous in `my-orders`. The five render-only cases → worker-scoped `isolatedUser`. Reasoning recorded in the spec. |
| 37 | **Locale formatting would break a string comparison of the total.** The page renders `toLocaleString()`, whose separators vary by browser/locale, so `toContain('10.000.000')` could pass on one project and fail on another — a false cross-browser difference. | Not visible without considering all three projects. | Totals are stripped to digits and compared **numerically**. |

### 7.1 Post-freeze, pre-run corrections

Two test-quality defects found **after** the freeze commit but **before** first execution. Both are
corrected here rather than after a run, so no result influenced them — and neither touches an
expected value.

| # | Finding | Why it was missed | Fix |
|---|---|---|---|
| 38 | **The spec required the defect to be present in order to run.** `TC-08-N01-UI` and `TC-08-N03-UI` called `totalInput(page).isEditable()` directly. Playwright's `isEditable()` **waits for the element**, so against a compliant implementation that simply **omits** the editable total field — the most obvious way to satisfy R2 — the locator would time out and the case would be reported as a **harness error rather than a pass**. Finding 26 fixed the `fill()` half of this and stopped one step short: guarding the *typing* while still requiring the *field*. | Anchoring on the SUT in front of us. The spec comments already stated that omitting the field would comply, but the code was still written against the only layout actually observed. A test that cannot pass against a correct implementation is measuring the implementation, not the requirement. | Added `attemptDirectTotalEdit()`, which probes presence with **`count()`** first, attempts the edit only when a field exists *and* accepts input, and returns `{present, editable, attempted}`. Both cases now assert the same outcome on every path — `N01`: the displayed effective total is still cart-derived; `N03`: the persisted order total is still cart-derived after checkout. The three observations are recorded as **annotations** (evidence). Still **no** assertion on `disabled`, `readonly`, or any prevention mechanism. |
| 39 | **`TC-08-N05-UI`'s quantity assertion could pass without the quantity being rendered at all.** `expect(line).toContain('3')` is a substring test against the whole line — and the seeded product is *"Tai nghe AirPods Pro **2**"*, whose name already contains a digit. Verified: with a quantity of `2`, the old assertion passes on the product name alone, so the case would have reported success while proving nothing. | The generated assertion matched the *shape* of the requirement ("the quantity is visible") without considering that a substring match cannot distinguish where the digit came from. The specific data — a product name ending in a numeral — is what turns a weak assertion into a false pass. | The product name is stripped from the line first, then the quantity must match as a **standalone numeric token**, with lookarounds excluding digits and thousands separators so a digit inside a formatted line amount (`18.000.000`) cannot satisfy it either. No rendering format is asserted — `x 3`, `3 ×` and `Qty: 3` all pass — because **A-08-1** infers only that the quantity is *visible*. |

**Finding 39's fix was proven to fail for the right reason** before being trusted, per the skill's
Phase 5.4 rule:

```
line     : "Tai nghe AirPods Pro 2 x 3 — 18.000.000 ₫"
stripped : "  x 3 — 18.000.000 ₫"
quantity 3 matches as a standalone token   -> true    (correct pass)
OLD toContain("2") satisfied by the name   -> true    (the false pass being removed)
NEW check with quantity 2                  -> false   (no longer fooled by the name)
NEW check on a line with no quantity       -> fails   (correctly)
```

**No oracle was weakened by either fix.** Finding 38 makes `N01`/`N03` *stricter* in the sense that
matters — they now hold a compliant implementation to the same outcome instead of erroring on it —
and finding 39 makes `N05` strictly harder to pass. Expected values are unchanged, and the
§9 prediction stands.

**Scope checks performed:** no assertion touches coupon behaviour (FR-09) despite the coupon panel
being on the checkout page; none touches cart quantity/stock rules (FR-07) or order status (FR-10);
login and add-to-cart appear only as setup. No case asserts that the UI clears the cart — R5 is
**Batch C's** subject and is not claimed here.

**Browser coverage:** all six cases drive a real browser, so Batch A contributes **18 genuine
browser executions** (6 × 3). Nothing in this batch is API-path, so there is no inflation risk here.

## 8. Static gates — all passed before first execution

*(Wording corrected: the §7 gates ran before the freeze commit `9b0ab82`, but findings 38–39 in §7.1
were found **after** that commit and **before** any run, so the gates were re-run then too. "Before
first execution" is the property that actually matters and is the one that holds for every row
below — nothing in this table was observed after a test had run.)*

| Gate | Result |
|---|---|
| `fr-08-checkout.json` parses; Batch A case count | **6**; all carry `expectedSource`; all `status: frozen` |
| Assumption-grounded cases flagged | `TC-08-N05-UI` (A-08-1), `TC-08-N06-UI` (A-08-2), both **MED** |
| `npx tsc --noEmit` | exit **0** |
| `npx playwright test tests/fr-08-checkout --list` | **18 tests in 1 file** (6 × 3 projects) |
| Seeded `test@eshop.com` referenced anywhere in `tests/` | **0** |
| Inline test-data literals in the spec | **0** |
| Mechanism-asserting oracle (`toBeDisabled` / `readonly` / status-for-invalid) | **0** (only the comment explaining its absence) |
| Cases that error rather than pass against a compliant implementation | **0** (after finding 38) |
| `page.route` / `page.reload` used | **0** (only the comment explaining why not) |
| FR-04 deliverables modified | **none** |
| FR-08 executed before freeze | **never** — no `fr-08` entry in `test-results/` |

## 9. Pre-run prediction, recorded before the freeze

Derived by reading `Checkout.jsx`, `CartContext.jsx` and `server.js` — legitimate for **predicting**,
never as the oracle. Every expected value still comes from §1's table via the data file.

| Case | R | Prediction | Reasoning | Confidence |
|---|---|---|---|---|
| `TC-08-N01-UI` | R2 | **FAIL** | `Checkout.jsx:14` holds the total in `editableTotal` state and lines 93–102 render it as a plain `<input type="number">` with an `onChange` that sets it. The user's edit takes effect immediately in the summary line | **High** — directly readable from the markup |
| `TC-08-N02-UI` | R2 | **PASS** | `useState(cartTotal)` initialises from `CartContext.cartTotal`, which is `reduce((t,i) => t + i.price*i.quantity, 0)` — exactly the spec's rule | **High** |
| `TC-08-N03-UI` | R2→R4 | **FAIL** | `server.js:297` destructures `total_amount` from the body and inserts it directly; there is no recomputation and the handler never reads either cart. The forged value persists | **High** — this is HW02's `BUG-08-001` reproduced through the UI |
| `TC-08-N04-UI` | R3 | **PASS** | `Checkout.jsx:85` maps over the whole cart array and renders one `<li>` per entry | **High** |
| `TC-08-N05-UI` | R3 | **PASS** | Line 86 renders `{item.name} x {item.quantity} — {price*quantity} ₫`, so quantity and line amount are both present | **Medium** — the *observation* is high-confidence, but the **oracle rests on A-08-1 (MED)**. If a reviewer rejects the inference that "đầy đủ" mandates quantity display, this case has no test basis and should be withdrawn rather than counted |
| `TC-08-N06-UI` | R3 | **PASS** | An empty `cart` array maps to zero `<li>` elements | **Medium** — observation high-confidence, but the **oracle rests on A-08-2 (MED)**; the spec does not discuss empty-cart checkout |

**Expected tally: 4 pass / 2 fail per project → 12 pass / 6 fail over 18 executions.**

Both predicted failures are expected to be **R2/R4 defects**, and `TC-08-N03-UI` is expected to
reproduce HW02's `BUG-08-001` — through the **UI**, which strengthens that defect's severity claim
from *"a crafted request can forge the total"* to *"any customer can type a different number"*.
`TC-08-N01-UI` may be a **distinct** root cause from `TC-08-N03-UI` (a frontend affordance versus an
absent backend guard, exactly the `BUG-04-101`/`BUG-04-102` shape). That call is made through the
real-defect gate **after** the run, not now.

**No assertion has been relaxed** for any known defect.

---

# 10. Batch A — execution results

```bash
cd automation && npx playwright test tests/fr-08-checkout
```

No retries. Spec frozen at `9b0ab82`; §7.1's corrections were made before the first run. Report:
`../html-report/batch-a.html`.

## 10.1 Results

| Case | R | chromium | firefox | webkit | Verdict |
|---|---|---|---|---|---|
| `TC-08-N01-UI` | R2 | ❌ | ❌ | ❌ | FAIL → **`BUG-08-101`** |
| `TC-08-N02-UI` | R2 | ✅ | ✅ | ✅ | PASS |
| `TC-08-N03-UI` | R2→R4 | ❌ | ❌ | ❌ | FAIL → **`BUG-08-102`** |
| `TC-08-N04-UI` | R3 | ✅ | ✅ | ✅ | PASS |
| `TC-08-N05-UI` | R3 | ✅ | ✅ | ✅ | PASS *(oracle A-08-1, MED)* |
| `TC-08-N06-UI` | R3 | ✅ | ✅ | ✅ | PASS *(oracle A-08-2, MED)* |

**12 passed / 6 failed** over 18 executions. All six failures are **assertion** failures, identical
on every browser.

## 10.2 Prediction vs actual

| Case | Predicted | Actual | Match |
|---|---|---|---|
| `TC-08-N01-UI` | FAIL | FAIL | ✅ |
| `TC-08-N02-UI` | PASS | PASS | ✅ |
| `TC-08-N03-UI` | FAIL | FAIL | ✅ |
| `TC-08-N04-UI` | PASS | PASS | ✅ |
| `TC-08-N05-UI` | PASS | PASS | ✅ |
| `TC-08-N06-UI` | PASS | PASS | ✅ |

**6/6 correct**, and the tally matched the predicted **12 pass / 6 fail** exactly — *once the
harness noise was removed*. The first run did **not** match, and that story is §10.3.

## 10.3 The real-defect gate, applied four times

Run 1 produced **10** failures, not 6. Sorting them by the gate's question — *did it fail at an
assertion?* — separated them cleanly:

| Run | Config | Result | Assertion failures | Test-side failures |
|---|---|---|---|---|
| 1 | as frozen | 8 passed / 10 failed | **6** (N01×3, N03×3) | **4** timeouts — N02/ff, N04/ff, N04/wk, N05/ff |
| 2 | `test.slow()` | 11 / 7 | 6 | 1 — N04/ff (still timing out at 90 s) |
| 3 | + deterministic navigation | 12 / 6 | 5 | 1 — N01/ff (new retry predicate) |
| 4 | unchanged | **12 / 6** | **6** | **0** |
| 5 | unchanged | 11 / 7 | 6 | 1 — N05/ff (**driver crash in teardown**) |
| 6 | unchanged | **12 / 6** | **6** | **0** |

**The six assertion failures were identical in all six runs.** Nothing that changed between runs
touched a product result — which is the point of separating the two categories rather than reporting
a pass rate.

**Correction 1 — the batch is genuinely slower than FR-04's.** Every case here is UI-path and
performs a storefront load, a click per seeded product and two client-side route changes; three run
concurrently against a single Vite dev server. Measured, not assumed: `TC-08-N04-UI` passes on
firefox in **4.1 s in isolation** and exceeded **30 s** in the batch. FR-04's batches never hit this
because 10 of their 16 cases were API-path and finished in milliseconds — only a third of that
matrix was browser-heavy, where **all 18** executions here are. Fixed with `test.slow()` scoped to
this file, leaving the globally proven `workers: 3` and the 30 s default untouched.

**Correction 2 — a swallowed navigation click, diagnosed from the failure snapshot.** Raising the
budget was not enough: `TC-08-N04-UI` still exceeded **90 s** on firefox, which is far beyond what
contention explains for a 4.1 s test. The timeout's page snapshot showed the cause — the app was
still on the **storefront**, with the last product button holding focus. A click issued while React
was re-rendering from the preceding `addToCart` had been swallowed, so the retrying row-count
assertion polled a page with no rows until the budget expired. Fixed by retrying the navigation
click until the route actually changes (`expect.toPass` on `toHaveURL`), and by bounding the
post-seed cart assertion to 15 s so a genuine seeding shortfall fails **fast, as a setup failure**,
instead of surfacing as a causeless timeout.

> **Worth stating plainly.** Had run 1 been taken at face value, `TC-08-N02-UI`, `TC-08-N04-UI` and
> `TC-08-N05-UI` would have been written up as browser-specific FR-08 defects that do not exist —
> three fabricated bugs. Every one of those failures was a timeout that never reached an assertion.

**Neither correction changed an expected value.** Both are committed separately
(`fix: FR-08 Batch A post-run corrections`, and `… (2) — deterministic navigation`) with the
reasoning above, and `git diff` against the freeze shows no change to any assertion or oracle.

### Residual environment flake, recorded rather than hidden

Firefox in this environment shows intermittent Playwright **driver** instability unrelated to the
SUT. Run 5's extra failure was:

```
browserContext.close: Protocol error (Browser.removeBrowserContext):
can't access property "_maybeDontRestoreTabs", this._windows[aWindow.__SSi] is undefined
```

That is a crash in **context teardown**, after the test body completed — it cannot be evidence about
the spec. Runs 4 and 6 were clean at 12/6; runs 3 and 5 each carried one such firefox failure. This
is reported instead of re-running until a clean pair appeared, because the honest characterisation
is "stable product result, occasionally noisy harness on one browser", not "clean".

## 10.4 Real-defect classification

Both defects were reached **at an assertion**, reproduce on **all three browsers**, and were
**corroborated independently**. Grouped by root cause using *"would fixing one fix the other?"*:

| Defect | Cases | Executions | R | Severity | Issue |
|---|---|---|---|---|---|
| `BUG-08-101` — the order total is a user-editable form field | `N01-UI` | 3 | R2 | **High** | [#4](https://github.com/BuhDuy256/automation-testing-hw04/issues/4) |
| `BUG-08-102` — backend stores the client-sent `total_amount` verbatim | `N03-UI` | 3 | R4 | **Critical** | [#5](https://github.com/BuhDuy256/automation-testing-hw04/issues/5) |

**They are distinct, and the evidence decided it — not the prediction.** §9 flagged this as an open
question. The answer came from the corroboration run, which reproduced `BUG-08-102` **with no
browser at all**: the backend defect therefore survives any frontend fix. Conversely, a backend that
recomputed the total would still leave the user editing the displayed one, violating line 105. Full
matrix in `../bug-reports/report.md`.

**`BUG-08-102` is HW04's own evidence for HW02's `BUG-08-001`, not a citation of it.** HW02 reached
the endpoint with a crafted request; `TC-08-N03-UI` reaches it **through the checkout form**, which
changes the severity argument from *"an attacker who can craft requests"* to *"any customer who can
type"*. That is why architecture §3.1's interception example was wrong (§2.2) and why this case is
UI-path.

**No assertion was weakened**, and no `.spec.ts` change altered an expectation.

## 10.5 Browser coverage — all 18 count

| Surface | Cases | Executions | Counts as browser coverage? |
|---|---|---|---|
| **UI-path** | **6 — all of them** | **18** | ✅ **yes, all of it** |
| API-path | 0 | 0 | — |

Every case requests Playwright's `page` fixture, so all 18 executions launch a real browser. Unlike
FR-04 — where 30 of 48 executions were API-path and had to be excluded — **nothing is deducted
here**. That follows from what R2 and R3 are: both are rules about the interface, so neither can be
tested any other way. FR-08's API-path cases are Batch B's, and will be counted separately.

## 10.6 Evidence-strength caveat — the two assumption-backed passes

`TC-08-N05-UI` and `TC-08-N06-UI` both **passed**, but they are **not equally grounded** with the
other four and must not be presented as if they were:

| Case | Oracle | Confidence | If the assumption is rejected |
|---|---|---|---|
| `TC-08-N05-UI` | **A-08-1** — "đầy đủ" implies quantity and line amount are visible | **MED** | The case has no test basis and should be **withdrawn**, not counted. R3 coverage drops from 3 to 2 |
| `TC-08-N06-UI` | **A-08-2** — R3 applied to an empty cart means no lines are shown | **MED** | Same — withdraw rather than count |

Both are **inferences** from line 106's wording, not quoted requirements. Neither produced a defect,
so nothing is *filed* on assumption-grade evidence — the caveat affects only the coverage claim.
The four spec-cited cases (`N01`–`N04`) and both filed defects rest on **direct citations** of lines
105 / 106 / 107.

## 10.7 What the passes establish

`N02` passing matters for the diagnosis: the total **is** computed correctly from the cart before the
user touches it, so the derivation logic is sound and the fault is precisely that the value is left
writable — which is why the suggested fix is to make it read-only, not to rewrite the calculation.

`N04`/`N05`/`N06` passing means **R3 is met**: the checkout page renders the ordered-product list
correctly, including per-line quantity and amount, and fabricates nothing for an empty cart. The
checkout page is not broadly wrong; its total handling specifically is.

---

# Step 5.3 — Batch B (R1 + R4), frozen, not yet run

Six API-path cases: `TC-08-001`, `TC-08-EP-002`, `TC-08-EP-003` (HW02) and `TC-08-N08-API`,
`TC-08-N09-API`, `TC-08-N10-API` (new). File: `automation/tests/fr-08-checkout/checkout-api.spec.ts`.
Batch A's six cases in `fr-08-checkout.json` are **byte-identical** to their frozen state
(`git diff 9b0ab82` shows zero deleted lines).

## 11. Human review of the AI-generated Batch B specs

Reviewed **before** the freeze commit and before any run.

| # | Finding | Why it was missed | Fix |
|---|---|---|---|
| 40 | **Appending Batch B broke Batch A's *already-frozen* spec — at the type level.** `input` is inferred as a union across every case in the shared data file. The moment Batch B introduced cases carrying `serverCart` instead of `products`, `testCase.input.products` typed as `possibly undefined` and `checkout-page.spec.ts` — frozen at `9b0ab82`, already run, already the basis of two filed defects — **stopped compiling**. Five call sites. | A cross-batch coupling that is invisible while only one batch exists. The data file is shared by design (one oracle source per feature), and that sharing has a cost nobody pays until the second batch lands. **This is the third distinct failure mode caused by appending to a shared data file** — after the two missing-comma incidents in FR-04. | Added a `seededProducts()` narrowing accessor to Batch A and `serverCartOf()` / `totalAmountSpecOf()` to Batch B, all of which **throw** on a missing key rather than casting it away. **No assertion, expected value or oracle in Batch A was touched** — the change is purely type narrowing, and `git diff` against the freeze confirms no expectation moved. |
| 41 | **A status-code oracle was the obvious generation, and there is no source for one anywhere.** For `EP-002`/`EP-003` the natural assertion is `expect(status).toBe(401)`; the middleware really does return 401/403. But `api_specification.md` documents **no status code at all** — not for checkout, not for any endpoint in the file — and README line 104 says *who* may check out, not how a refusal is signalled. Asserting the observed code would be deriving the oracle from the implementation. | The recurring failure mode, entry 1 of the skill's table — **fourth batch running**. It is especially seductive here because the implementation's codes are conventional and *look* like a contract. | No status assertion anywhere in the file. Status is pushed as an **annotation** (`Checkout status`), so the report shows it as evidence while the assertion states only the outcome line 104 implies: **no order is created**. Same reframing HW02 recorded as assumption A6. |
| 42 | **"No order was created" invited a global-count assertion.** The obvious check for `EP-002`/`EP-003` is to count orders before and after. That is meaningless here: three projects run in parallel, and every previous run's orders persist, so the count is shared with workers and history alike. | The generated form reached for the simplest observable. Nothing about a count *looks* wrong until concurrency is considered. | Each test stamps a **unique `shipping_address` marker** (`FR08-B <case> <ts>-<rand>`) and asserts that **zero orders carry that marker**. Identity, not arithmetic — and it stays correct under any amount of parallelism. |
| 43 | **The unauthenticated cases have no "my orders" to look in**, because the request under test has no user. | Structural consequence of testing an auth boundary: the very thing being denied is the identity you would search with. | `GET /api/admin/orders` is used purely as a **verification channel** to search all orders for the marker, with a separate valid token that is never used on the request under test. Recorded explicitly as instrumentation, not coverage. |
| 44 | **That verification channel is itself unguarded — and it must not be reported as an FR-08 finding.** `GET /api/admin/orders` applies only `authenticateToken` with **no role check**, so any authenticated user can list every order. | Noticed while choosing the channel. It is a genuine observation, and the temptation is to bank it as a third FR-08 defect. | Documented in the spec and here as **out of scope**: it belongs to the admin surface, not to FR-08's R1–R5, and no assertion in this batch touches it. Logged the same way as the `ProductDetail` click-count defect in Batch A — noted, attributed to the right feature, not claimed. |
| 45 | **`omit` must mean absent, not `undefined`.** `TC-08-N08-API` requires `total_amount` to be **missing from the body**. Building the object with `total_amount: undefined` would serialise it away in JSON — accidentally correct — but `total_amount: null` would not, and the two test different things. | The distinction between "key absent" and "key present and empty" is easy to lose when a payload is assembled from a data-driven mode flag. | `checkoutBody()` adds the key **only** for `send` / `multiplyCartTotalBy`; for `omit` it never assigns it. The body actually sent is annotated on every case so the report shows exactly what was transmitted. |
| 46 | **The two carts could have been confused, and it would have made the R4 cases meaningless.** Batch A drives the **client** React cart; a recomputing backend could only ever read the **server** cart. Seeding the wrong one would leave the server cart empty, so the "cart-derived total" would be 0 and the cases would prove nothing. | Both are called "the cart", and Batch A's helpers were right there to reuse. | Batch B seeds via `POST /api/cart` only, imports **none** of Batch A's UI helpers (verified: zero references to `utils/checkout`), and asserts the server cart actually holds the seeded lines before proceeding — as a **setup** check with its own message. |
| 47 | **`TC-08-N10-API` needed a reason beyond "zero is a boundary".** Three R4 cases already converge on the same expected root cause; a fourth risks being ceremony. | Boundary values are easy to add without asking what they discriminate. | Kept, with the discriminating power recorded in the data file: **zero is the value at which a naive falsy guard (`if (total_amount)`) behaves differently from real validation**, so this case separates "no validation at all" from "a guard that happens to reject falsy values". The convergence of `TC-08-001` / `N09` / `N10` is declared, as in §4.2. |
| 48 | **Fixture scope re-derived again, and the answer differs from Batch A's.** Batch A used worker-scoped `isolatedUser` for its five render-only cases. Every Batch B R4 case **persists an order**. | The correct scope is a property of what a case writes, not of a feature. | All Batch B tests use test-scoped **`freshUser`**, so `my-orders` contains only this test's orders — which, with the marker, makes "the order this test created" unambiguous without any count. |
| 49 | **Browser-coverage inflation risk is at its highest here.** Batch B produces 18 executions across three "browser" projects while launching **no browser at all**. Added to Batch A's 18 it would read as 36. | Nothing in a green project matrix signals that a browser was never involved. | Stated in the spec header, in `html-report/README.md`, and in §12 below: these 18 are **matrix uniformity only** and are **excluded** from the browser-run count. FR-08's browser evidence remains Batch A's 18. |
| 50 | **`BUG-08-102`'s assertions must not soften now that it is filed.** Four of these six cases are expected to fail against a defect already reported as Critical. | The pull toward "we know about that one" is strongest after an issue exists. | Every R4 case asserts the full cart-derived total, unchanged. No tolerance, no skip, no `expect.soft` downgrade of the claim itself. |

## 12. Static gates — all passed before the freeze

| Gate | Result |
|---|---|
| `fr-08-checkout.json` parses | **12 cases** — Batch A 6, Batch B 6 |
| Batch A **data entries** preserved | ✅ `git diff 9b0ab82 -- automation/data/fr-08-checkout.json` shows **zero** deleted lines — Batch B was appended, nothing was rewritten |
| Batch A **spec** changed? | ⚠️ **Yes — type narrowing only.** Five call sites moved to a throwing `seededProducts()` accessor after the shared data union widened (finding 40). **No oracle, expected value or assertion changed** — see the note below |
| Batch B cases carry `expectedSource` / `status: frozen` / `mechanism` | **6 / 6 / 6** |
| Batch B requirement split | **R4 = 4, R1 = 2** |
| `npx tsc --noEmit` | exit **0** (both spec files) |
| `npx playwright test tests/fr-08-checkout/checkout-api.spec.ts --list` | **18 tests in 1 file** (6 × 3 projects) |
| `page` fixture requested in Batch B | **none** — both tests destructure `{ api, freshUser }`; the only occurrence of the word is the comment explaining its absence |
| Batch A UI helpers imported by Batch B | **0** references to `utils/checkout` or `utils/session` |
| Seeded `test@eshop.com` anywhere in `tests/` | **0** |
| Status-code assertions | **0** |
| Global order-count assertions | **0** |
| Inline data literals | **0** |
| Batch B executed before freeze | **never** — 0 `checkout-api` entries in `test-results/` |

**Precisely what "preserved" means here**, since the distinction matters for the freeze discipline:

| Artefact | Changed by the Batch B freeze? | Detail |
|---|---|---|
| Batch A **data entries** in `fr-08-checkout.json` | **No** | Batch B was appended after `TC-08-N06-UI`; no existing entry was edited, reordered or removed |
| Batch A **spec** `checkout-page.spec.ts` | **Yes, mechanically** | Five reads of `testCase.input.products` moved to a throwing `seededProducts()` accessor, because appending Batch B widened the shared file's inferred union and the frozen spec stopped compiling (finding 40) |
| Batch A **oracles, expected values, assertions** | **No** | Nothing in `expected`, no `expectedSource`, and no `expect(...)` call was altered. The change is type narrowing that throws on a missing key — strictly louder than the code it replaced, never more permissive |

Batch A's **results are therefore still valid as reported**: the 12/6 outcome and both filed defects
came from assertions this change did not touch. Claiming the Batch A spec was "unchanged" would have
been false, so it is stated as what it is — an unavoidable mechanical edit to an already-frozen file,
forced by a shared data file, with its blast radius measured rather than asserted.

## 13. Pre-run prediction, recorded before the freeze

Derived by reading `server.js` — legitimate for **predicting**, never as the oracle.

| Case | R | Prediction | Reasoning | Confidence |
|---|---|---|---|---|
| `TC-08-001` | R4 | **FAIL** | `server.js:297-310` inserts `total_amount` from the body with no cart lookup; the forged `1` persists instead of 30,000,000 | **High** |
| `TC-08-EP-002` | R1 | **PASS** | `authenticateToken` returns before the handler when no token is present, so no order can be created | **High** |
| `TC-08-EP-003` | R1 | **PASS** | `jwt.verify` fails on a malformed token and the middleware returns before the handler | **High** |
| `TC-08-N08-API` | R4 | **FAIL** | With `total_amount` absent, the destructured value is `undefined` and SQLite stores **NULL** — the backend never computes anything | **High** |
| `TC-08-N09-API` | R4 | **FAIL** | Overstated value persists verbatim; same absent guard | **High** |
| `TC-08-N10-API` | R4 | **FAIL** | `0` persists verbatim. **This is the case that discriminates**: were there a falsy guard, `0` would be rejected while the other three passed through | **Medium** — the outcome is high-confidence, but its *diagnostic* value depends on which failure shape appears |

**Expected tally: 2 pass / 4 fail per project → 6 pass / 12 fail over 18 executions.**

All four predicted failures should map to the **existing** `BUG-08-102` (issue #5) rather than a new
root cause — they are the same absent guard reached through four different payload shapes. If any
of them fails differently, that goes through the real-defect gate after the run.

The two predicted passes matter: together they would show the **auth boundary is enforced** while
the total is not, which sharpens `BUG-08-102` from "checkout is broken" to "checkout authenticates
correctly and then trusts the caller's arithmetic".

**No assertion has been relaxed** for the already-filed `BUG-08-102`.

## > NEXT — run Batch B

`cd automation && npx playwright test tests/fr-08-checkout/checkout-api.spec.ts`. The spec is frozen
at the commit below, **before** any execution.
