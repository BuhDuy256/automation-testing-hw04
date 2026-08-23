# HG-FR08-EXT-01 — AI-proposed extension ideas for FR-08

> **NON-CANONICAL AI PROPOSALS.** These five ideas are **not** `origin=HUMAN` cases. They are not in
> `work/registry/test-cases.json`, they have no `FR08-H-###` identifiers, and no
> `humanExtensionRationale` exists for any of them. They become human cases only after the student
> explicitly selects or modifies them at the ACT-EXT-01 gate.

Baseline for the gap analysis: the FR-08 AI suite **after** the recommended deduplication in
`HG-FR08-REV-01-proposal.md` revision 2 — 52 usable cases, with `FR08-AI-024`, `FR08-AI-049`,
`FR08-AI-050`, `FR08-AI-054`, and `FR08-AI-056` removed and `FR08-AI-040` sharpened.

Two of the student's five suggested directions were checked and found already covered; replacements
are proposed in their place and labelled `B′` and `D′`.

---

## A — Stale client total after the cart changes (time-of-check / time-of-use)

- **Risk / gap:** The client learns a total, the cart then changes, and the client checks out with the
  now-stale figure. The authoritative total must follow the *current* cart, not the figure the client
  last saw. Every existing mismatch case forges a total against a cart that never moved.
- **Why the AI suite does not cover it:** `FR08-AI-002`, `FR08-AI-003`, `FR08-AI-010`, and
  `FR08-AI-011` are all static mismatches against an unchanged cart. `FR08-AI-034` changes the cart
  but then submits the *matching* total. No candidate combines a cart mutation with a stale client
  total, so no candidate exercises the ordering relationship between the two.
- **Test idea:** Establish a cart of 100000×2, note the total 200000, add a second line of 50000×1,
  then check out sending the stale `total_amount: 200000` and assert the persisted order total is the
  current cart-derived 250000.
- **Source anchor:** `eshop-sut/README.md` FR-08 ("tổng tiền được tính tự động từ giỏ hàng"; backend
  recalculates and does not accept the client value); `eshop-sut/api_specification.md` §4.2, §4.5.
- **AI recommendation strength:** **Strong.** It is the only proposal that tests *when* the total is
  derived rather than merely *whether* it is derived.

## B′ — Cart-to-total derivation isolation between two users

> Replaces the student's idea B. Idea B as written ("cart contains A, add/change B immediately before
> checkout, verify the order reflects the final cart") is already proved by `FR08-AI-033`
> (multi-line sum after adding both lines) together with proposal A above, so it would be redundant.

- **Risk / gap:** If carts are keyed incorrectly on the server, one user's checkout could derive its
  total from another user's cart — the customer is charged for goods they never selected.
- **Why the AI suite does not cover it:** `FR08-AI-039` proves that user A's checkout does not *clear*
  user B's cart, and `FR08-AI-025` proves the order does not appear in B's *history*. Neither asserts
  which cart the **total** was computed from. Clearing and attribution can both be correct while the
  derivation reads the wrong cart.
- **Test idea:** Give user A a cart worth 200000 and user B a deliberately different cart worth
  350000, check out as A, and assert A's persisted order total is exactly 200000.
- **Source anchor:** `eshop-sut/README.md` FR-08 cart-derived total rule and SEC-02 identity binding;
  `eshop-sut/api_specification.md` §4.1, §4.5.
- **AI recommendation strength:** **Strong.** Distinct failure mode from both existing isolation
  cases, and a high-severity one if it fails.

## C — Recovery of the correct total after a rejected checkout attempt

- **Risk / gap:** A refused checkout could partially consume or corrupt server-side cart state in a
  way that `GET /api/cart` still reports as healthy, so the *next* legitimate checkout charges the
  wrong amount.
- **Why the AI suite does not cover it:** `FR08-AI-037` stops at the cart read-back after an
  unauthenticated attempt. It never performs a subsequent valid checkout, so it cannot detect a
  divergence between what the cart read model reports and what the checkout derivation actually uses.
  That divergence is precisely the risk here.
- **Test idea:** With a cart worth 200000, send one unauthenticated checkout, confirm the refusal,
  then send a valid authenticated checkout and assert the persisted order total is exactly 200000 and
  exactly one order was created.
- **Source anchor:** `eshop-sut/README.md` FR-08 and SEC-02; `eshop-sut/api_specification.md` §4.1,
  §4.4.
- **AI recommendation strength:** **Medium-strong.** The composed sequence is what carries the value;
  each half alone is already covered.

## D′ — Cart line referencing a product that does not exist in the catalogue

> Replaces the student's idea D. Idea D ("successful checkout → cart cleared → rebuild a different
> cart → second valid checkout derives only from the rebuilt cart") is exactly the sharpened purpose
> now proposed for `FR08-AI-040`, so adding it would duplicate a case already in the suite.

- **Risk / gap:** `POST /api/cart` accepts an arbitrary `id`, `name`, and `price` from the client. A
  cart line for a product that does not exist in the catalogue could still be turned into a persisted
  order, creating an order that references nothing sellable.
- **Why the AI suite does not cover it:** `FR08-AI-053` manipulates the **price** of a *real* product
  (id 1) and asks which price the derivation trusts. It says nothing about referential validity of the
  product itself. No candidate submits a cart line for a nonexistent product id.
- **Test idea:** Confirm `GET /api/products/9999` does not resolve, add a cart line
  `{id: 9999, name: "Ghost", price: 100000, quantity: 1}`, check out, and record whether an order is
  created and what its persisted total is — with the exact rejection behavior kept as `SPEC GAP`.
- **Source anchor:** `eshop-sut/api_specification.md` §4.2 (client-supplied cart body), §3.2
  (`GET /api/products/:id`); `eshop-sut/README.md` FR-08.
- **AI recommendation strength:** **Medium.** The failure mode is real and cheap to execute, but no
  authoritative source defines the expected rejection, so the oracle is largely observational.

## E — Independent persistence of two completed orders

- **Risk / gap:** After a second checkout, the first order must remain intact with its own
  server-derived total and its own shipping address. Order records could be overwritten, shared, or
  cross-linked rather than persisted independently.
- **Why the AI suite does not cover it:** `FR08-AI-032` only asserts that the count increments.
  `FR08-AI-040` (as sharpened) only asserts the *second* order's total. No candidate re-reads the
  **first** order after a second checkout, so nothing detects an overwrite of an earlier order.
- **Test idea:** Check out cart A (200000, address A) and record its order id, rebuild cart B
  (50000, address B) and check out, then re-read both orders via `GET /api/orders/:id` and assert each
  still carries its own server-derived total and its own address.
- **Source anchor:** `eshop-sut/README.md` FR-08; `eshop-sut/api_specification.md` §4.4, §4.5.
- **AI recommendation strength:** **Strong.** It is the only idea that verifies an already-created
  order is immutable with respect to later checkout activity.

---

## Summary for the student gate

| Label | Concept | Replaces a covered idea? | AI strength |
|---|---|---|---|
| A | Stale client total after the cart changes | no | strong |
| B′ | Cart-to-total derivation isolation across two users | yes — original B is covered by `FR08-AI-033` + A | strong |
| C | Correct total after a rejected attempt | no (extends `FR08-AI-037`) | medium-strong |
| D′ | Cart line for a nonexistent product | yes — original D duplicates the sharpened `FR08-AI-040` | medium |
| E | Two completed orders persist independently | no | strong |

AI recommendation: select all five (A, B′, C, D′, E), which satisfies the assignment minimum of five
human-added cases without padding.

Nothing here is recorded as a human case. On the student's explicit selection or modification, the
chosen ideas are then materialised with `origin=HUMAN`, sequential `FR08-H-###` identifiers, and the
student's own `humanExtensionRationale`.
