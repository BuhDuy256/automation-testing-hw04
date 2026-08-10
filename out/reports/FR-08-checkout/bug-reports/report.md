# FR-08 — Bug reports

Confirmed product defects found by FR-08 automation. **All three batches have run** — A (R2, R3),
B (R1, R4), C (R5, R1-UI).

Every defect below reproduces **identically on all three projects**, was reached **at an assertion**
(never a timeout), and comes from a spec frozen **before any execution** — Batch A at `9b0ab82`,
Batch B at `286f437`, Batch C at `050a468`. No assertion was weakened to accommodate any of them,
including after `BUG-08-102` was already filed.

| ID | Title | Severity | R | Issue |
|---|---|---|---|---|
| `BUG-08-101` | Checkout renders the order total as a user-editable field | **High** | R2 | [#4](https://github.com/BuhDuy256/automation-testing-hw04/issues/4) |
| `BUG-08-102` | `POST /api/checkout` never recomputes the total and stores whatever the client sends | **Critical** | R4 | [#5](https://github.com/BuhDuy256/automation-testing-hw04/issues/5) |
| `BUG-08-103` | The **server** cart is not cleared after a successful checkout | **Medium** | R5 | [#6](https://github.com/BuhDuy256/automation-testing-hw04/issues/6) |
| `BUG-08-104` | The **client** cart is not cleared — `clearCart` is wired up but never called | **Medium** | R5 | [#7](https://github.com/BuhDuy256/automation-testing-hw04/issues/7) |

---

## BUG-08-101 — the order total is a user-editable form field

| Field | Value |
|---|---|
| **Requirement** | R2 — `README.md` line 105: the total is computed from the cart and **may not be edited directly by the user** |
| **Found by** | `TC-08-N01-UI` — chromium ❌ firefox ❌ webkit ❌ |
| **Severity** | **High** |
| **Evidence strength** | **Direct spec citation** — line 105, no assumption involved |

**Observed.** Cart seeded to a cart-derived total of **6,000,000**. The checkout page's
*"Tổng tiền thanh toán (VND)"* control is an ordinary `<input type="number">`. Typing `1000` changes
the total the page displays and submits.

```
Error: the user changed the checkout total to 1000; FR-08 line 105 says the total is
computed from the cart and may not be edited directly, so it must still be 6000000.
  Expected: 6000000
  Received: 1000
```

Annotations recorded by the test: `Total input present: true`, `Total input editable: true`,
`Direct edit attempted: true`.

**Root cause** (code-derived, for repro clarity — *not* the oracle). `Checkout.jsx:14` holds the
total in `useState(cartTotal)`; lines 93–102 render it as a bound editable input; line 47 submits a
value derived from it. The total is seeded from the cart once, then becomes free-form user input.

**No mechanism was asserted.** Line 105 forbids the *outcome*; it prescribes nothing about how. The
test asserts only that the effective total still equals the cart-derived value, so an implementation
that omits the field, makes it read-only, or ignores its value would all pass.

**Suggested fix.** Derive the displayed total from `cartTotal` and render it as text or a read-only
field; never hold the order total in user-writable state.

---

## BUG-08-102 — the backend stores the client-sent `total_amount` verbatim

| Field | Value |
|---|---|
| **Requirement** | R4 — `README.md` line 107: the backend **must recompute** the total and **must not accept** a client-sent `total_amount` |
| **Found by** | `TC-08-N03-UI` (UI, Batch A) and `TC-08-001` / `N08` / `N09` / `N10` (API, Batch B) — **15 failing executions**, all three projects |
| **Severity** | **Critical** |
| **Evidence strength** | **Direct spec citation** — line 107, no assumption involved |
| **HW02 relationship** | Reconfirms HW02's `BUG-08-001` with **new HW04 evidence gathered through the UI**, not only through crafted API requests |

**Observed.** Cart seeded to a real total of **10,000,000** (two products, chosen so the expected
value is a sum and cannot coincide with any single catalogue price). `1000` typed into the form.
The persisted order total is **1000**.

```
Error: the order stored the total typed into the form (1000) instead of the cart-derived
10000000; FR-08 line 105 forbids the user editing the total and line 107 requires the
backend to recompute it and to reject a client-sent total_amount
  Expected: 10000000
  Received: 1000
```

**Independent corroboration, outside Playwright and with no browser at all:**

```
server cart lines           : 2 | real total = 10000000
checkout sent total_amount  : 1000
checkout response           : {"message":"Checkout successful","orderId":19}
PERSISTED order total_amount: 1000
backend recomputed?         : NO — stored the client value verbatim
```

**Root cause** (code-derived — *not* the oracle). `server.js:297-310` destructures `total_amount`
from the request body and inserts it directly. There is no cart lookup, no recomputation and no
validation — the two things line 107 explicitly requires are both absent.

**Impact.** `total_amount` is the SUT's only financial record for an order and feeds the admin
revenue view. Any authenticated user can set it to any value. Combined with `BUG-08-101`, no tooling
is required — the checkout form itself exposes the field.

### Batch B evidence — the defect is *absent computation*, not weak validation

Batch B (API-path, frozen at `286f437`) reaches this same endpoint through **four independent payload
shapes**. All four fail on all three projects — **12 executions** — and all four are the **same root
cause**: a single server-side recomputation would fix every one of them. Issue #5 was **updated, not
duplicated**.

| Case | `total_amount` sent | Real cart total | Persisted |
|---|---|---|---|
| `TC-08-001` | `1` | 30,000,000 | **1** |
| `TC-08-N09-API` | `1000000000` (×100) | 10,000,000 | **1000000000** |
| `TC-08-N10-API` | `0` | 10,000,000 | **0** |
| `TC-08-N08-API` | **field absent** | 10,000,000 | **null** |

Corroborated outside Playwright, one freshly registered account per case:

```
real cart total = 10000000

omitted      sent: (field absent) -> persisted: null
zero         sent: 0              -> persisted: 0
overstated   sent: 1000000000     -> persisted: 1000000000
forged low   sent: 1              -> persisted: 1
```

Two things this establishes that the Batch A evidence alone could not:

1. **There is no recomputation at all.** `TC-08-N08-API` omits `total_amount` entirely. A backend
   that recomputed from the cart would be unaffected by the field's absence; this one stores
   **NULL**. The server cart was verified non-empty first (2 lines, 10,000,000), so the data needed
   to compute the total was present and simply never read.
2. **There is no falsy guard either.** `TC-08-N10-API` sends `0` and `0` is stored — ruling out
   `if (total_amount) { … }`, which would have rejected `0` while still accepting `1` and
   `1000000000`.

This changes the fix from *"tighten a validation rule"* to *"add a computation that does not exist"*.

**Suggested fix.** Recompute the total server-side from the authoritative cart and ignore any
`total_amount` in the request body.

---

## Root-cause grouping — why these are two defects, not one

Applying the distinctness test — **"would fixing one fix the other?"** — the answer is **no, in both
directions**:

| Fix applied | `BUG-08-101` | `BUG-08-102` |
|---|---|---|
| Make `Checkout.jsx`'s total read-only | ✅ fixed | ❌ **still forgeable** by a direct request — proven by the browser-free corroboration above |
| Make the backend recompute the total | ❌ **still violates line 105** — the user can still edit the displayed total | ✅ fixed |

Different components, different fixes, different blast radii. They are **compounding, not
duplicated**: `BUG-08-101` puts the exploit within reach of an ordinary customer with no tooling,
and `BUG-08-102` is what makes it succeed. Reporting them as one defect would hide that either fix
alone leaves a live violation.

This mirrors the `BUG-04-101` / `BUG-04-102` shape from FR-04 — a frontend fault and an absent
backend guard on the same field — and is separated on the same evidence-based grounds.

---

## R1 is enforced — what the Batch B passes establish

`TC-08-EP-002` (no `Authorization` header) and `TC-08-EP-003` (malformed JWT) **passed on all three
projects**: no order is created in either case. Confirmed independently — status `401`, and zero
orders bearing the test's unique marker.

**No defect is filed against R1.** That is a result, not an absence of one: checkout
**authenticates correctly and then trusts the caller's arithmetic completely**. It makes
`BUG-08-102` a specific, isolated omission rather than evidence of a generally unguarded endpoint —
the auth boundary that exists works.

---

## BUG-08-103 — the server cart is not cleared

| Field | Value |
|---|---|
| **Requirement** | R5 — `README.md` line 108: after a successful checkout, the cart is cleared |
| **Found by** | `TC-08-EP-004` (API, Batch C) — 3/3 projects |
| **Severity** | **Medium** |
| **Evidence strength** | **Direct spec citation** — line 108 |
| **HW02 relationship** | Reconfirms HW02's `BUG-08-002` with fresh HW04 evidence |

**Observed.** `Expected: 0, Received: 1`. Corroborated with no browser:

```
server cart BEFORE checkout: 1 line(s)
checkout response          : {"message":"Checkout successful","orderId":42}
server cart AFTER checkout : 1 line(s)  <- line 108 requires 0
```

The precondition was asserted explicitly — cart non-empty before, and an `orderId` returned — because
line 108 applies only *"sau thanh toán thành công"*.

**Root cause** (code-derived — *not* the oracle). `server.js:297-310` inserts the order and responds;
the handler contains **zero** references to `userCarts`.

**Suggested fix.** Clear `userCarts[userId]` once the order insert succeeds.

---

## BUG-08-104 — the client cart is not cleared (`clearCart` is never called)

| Field | Value |
|---|---|
| **Requirement** | R5 — `README.md` line 108 |
| **Found by** | `TC-08-N07-UI` (UI, Batch C) — 3/3 browsers |
| **Severity** | **Medium** |
| **Evidence strength** | **Direct spec citation** — line 108 |
| **HW02 relationship** | **None — new in HW04.** HW02's FR-08 pass was entirely API-path and never observed this store |

**Observed.** After a completed checkout the customer returns to the cart and the purchased item is
still listed: `getByRole('row')` returns **2** (header + one product row), expected **0**.

**Root cause** (code-derived — *not* the oracle). `clearCart` is defined, exposed and destructured —
but **never called anywhere in the codebase**:

```
context/CartContext.jsx:18   const clearCart = () => { setCart([]); }                          <- defined
context/CartContext.jsx:29   value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}  <- exposed
pages/Checkout.jsx:8         const { cart, cartTotal, clearCart } = useCart();                  <- destructured
```

Three references, **zero call sites**.

**Reproduction note.** This must be reproduced **without reloading the browser**. A reload remounts
`CartProvider` and empties the cart by itself, hiding the defect — which is why the test returns to
the cart through the app's own in-app controls.

**Suggested fix.** Call `clearCart()` in `handleCheckout` once the checkout request resolves.

### Why BUG-08-103 and BUG-08-104 are two defects, not one

| Fix applied | `BUG-08-103` (server) | `BUG-08-104` (client) |
|---|---|---|
| Clear `userCarts[userId]` in the checkout handler | ✅ fixed | ❌ **still shows the items** — the server cannot clear the browser's React state |
| Call `clearCart()` in `Checkout.jsx` | ❌ **still populated** — the UI never writes to the server cart | ✅ fixed |

**No, in both directions.** They were deliberately observed on separate surfaces and judged only
after the run. Merging them — the obvious simplification — would have produced a single
"cart-clearing bug" against which a backend-only fix could ship while the customer still saw items
they had already paid for.

---

## Summary

**4 confirmed defects** across all three batches, every one **directly spec-grounded** — no defect
rests on assumption A-08-1 or A-08-2. Severity: **Critical — 1**, **High — 1**, **Medium — 2**.

| Requirement | Status |
|---|---|
| R1 — login required | ✅ **satisfied on both surfaces** (`EP-002`, `EP-003`, `N11-UI`) |
| R2 — total not user-editable | ❌ `BUG-08-101` |
| R3 — full product list displayed | ✅ satisfied |
| R4 — backend recomputes the total | ❌ `BUG-08-102` |
| R5 — cart cleared | ❌ `BUG-08-103` (server) **and** `BUG-08-104` (client) |

**No new root cause appeared in Batch B.** Its 12 failures all collapse into `BUG-08-102`; applying
*"would fixing one fix the other?"* gives **yes in every direction**, so issue #5 was updated with the
widened evidence rather than duplicated. **Batch C produced two**, by the same test applied to two
different stores.

R1 being fully satisfied is what makes the rest precise: checkout **authenticates correctly**, then
fails to recompute the total, exposes it for editing, and clears neither cart.

The four passing cases constrain the diagnosis and are not filler: `TC-08-N02-UI` shows the total is
computed correctly from the cart *before* the user touches it, so the derivation logic is sound and
the fault is specifically that the value is left writable. `TC-08-N04/N05/N06-UI` show the
ordered-product list renders correctly, so **R3 is met** — the checkout page is not broadly wrong,
the total handling specifically is.
