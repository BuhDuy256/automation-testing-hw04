# FR-08 — Automation Report (Checkout)

> **Status:** Step 5.1 complete — **case design only**. No automation script exists yet, nothing has
> been run, and no data file is frozen. Batch A freeze is the next action.
>
> | Field | Value |
> |---|---|
> | Student | Nguyen Bao Duy — 23127179 — 23KTPM2 |
> | Feature | FR-08 Checkout (Pool B) |
> | SUT surface | `frontend-web` + backend API |
> | Method | `test-automation-design` skill, **Phase 1 only** (select cases, map mechanisms, flag convergence, size batches) |

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

## > NEXT — Batch A freeze

Apply skill Phases 2–4 to the six R2/R3 UI cases: externalize their data with `expectedSource` per
case, generate the batch, review it against the 8 recurring failure modes, run the static gates,
record the pre-run prediction — **then** commit as `freeze: FR-08 specs batch A`, before any run.
