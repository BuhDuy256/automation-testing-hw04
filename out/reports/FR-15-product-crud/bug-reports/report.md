# FR-15 — Bug reports

Confirmed product defects found by FR-15 automation. **All three batches have run** — A (P2, P3),
B (P1, P3, P4, P5), C (P6, P5-UI, P1-UI). The combined FR-15 run is still pending.

Every defect below was **corroborated outside Playwright** before filing, reproduces identically on
all three projects, and comes from a spec frozen **before any execution** — Batch A at `734c6d0`,
Batch B at `102c6d1`, Batch C at `2d0f67d`. No assertion was weakened.

| ID | Title | Severity | Req | Issue |
|---|---|---|---|---|
| `BUG-15-101` | `POST /api/products` performs no input validation | **High** | P2, P3 | [#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8) |
| `BUG-15-102` | `GET /api/products/:id` returns `price` as a string for even ids | **Medium** | P1 (view) | [#9](https://github.com/BuhDuy256/automation-testing-hw04/issues/9) |
| `BUG-15-103` | `POST /api/products` never checks `category_id` against existing categories | **Medium** | P4 | [#10](https://github.com/BuhDuy256/automation-testing-hw04/issues/10) |
| `BUG-15-104` | **No access control on any product write endpoint** — anyone can create, modify or delete any product | **Critical** | P6 | [#11](https://github.com/BuhDuy256/automation-testing-hw04/issues/11) |
| `BUG-15-105` | Editing one product in the admin panel overwrites every listed product's displayed name | **Medium** | P5 (UI) | [#12](https://github.com/BuhDuy256/automation-testing-hw04/issues/12) |

---

## BUG-15-101 — `POST /api/products` performs no input validation

| Field | Value |
|---|---|
| **Requirements** | P2 — line 195 (name required, ≤ 255 chars); P3 — line 196 (price required, > 0) |
| **Found by** | `TC-15-EP-002`, `TC-15-EP-003`, `TC-15-BVA-003`, `TC-15-BVA-004`, `TC-15-BVA-005` — **15 failing executions**, 3/3 projects |
| **Severity** | **High** |
| **Evidence strength** | **Direct spec citation** — lines 195 and 196 |
| **HW02 relationship** | Reconfirms `BUG-15-001` (name) and `BUG-15-002` (price) with fresh HW04 evidence |

**Observed.** Every invalid class the spec defines is stored verbatim. Corroborated outside
Playwright, one fresh product per class, read back through `GET /api/products`:

```
name empty       POST 200 -> PERSISTED name=""
name absent      POST 200 -> PERSISTED name=null
name 256 chars   POST 200 -> PERSISTED name="BBBB…" len 256
price -1         POST 200 -> PERSISTED price=-1
price 0          POST 200 -> PERSISTED price=0
```

**Root cause** (code-derived — *not* the oracle). `server.js:167-177` destructures the body and
inserts it. There is no validation, and no middleware on the route at all.

**Two things the passing case and the zero case establish.** `TC-15-BVA-002` (255 characters)
**passes** and is stored in full, so the write path is sound — the fault is that it is *unguarded*,
which is why the fix is a validation step rather than a rewrite. And `price: 0` being stored rules
out the common partial mitigation `if (price) { … }`, which would have rejected `0` while still
accepting `-1`. There is no guard of any kind.

**Suggested fix.** Validate before insert: `name` present, non-empty, ≤ 255 characters; `price`
present and > 0.

### Grouping — one defect, not two, and why that differs from HW02

Applying *"would fixing one fix the other?"*: the fault is the **absence of any validation step in a
single handler**, so one guard added to `POST /api/products` fixes all five failing cases at once.

HW02 split these **by field** (`BUG-15-001` name, `BUG-15-002` price). HW04 groups **by fault**, the
same convention already applied in `BUG-04-102`, where an unvalidated `phone` and an empty `name` on
`PUT /api/users/me` were reported as one missing-validation defect rather than two. Both mappings
describe the same code; this one is consistent with the rest of this submission, and the HW02
correspondence is recorded here so either view can be reconstructed.

---

## BUG-15-102 — `GET /api/products/:id` returns `price` as a string for even ids

| Field | Value |
|---|---|
| **Requirement** | P1 — line 193, *"Xem"* (view) |
| **Severity** | **Medium** |
| **Provenance** | Found while **diagnosing a Batch A test failure**, not by a designed case |
| **Evidence strength** | Internal contradiction — needs no typing convention to be argued |

**Observed.** The detail endpoint stringifies `price` for every **even** product id; the list
endpoint does not. The same product reports two different types depending on which endpoint is
asked:

```
id 34  even: true  | detail "12345"  string | list 12345  number | AGREE: false
id 35  even: false | detail 12345    number | list 12345  number | AGREE: true
```

**Root cause** (code-derived — *not* the oracle), `GET /api/products/:id`:

```js
if (row.id % 2 === 0) row.price = row.price.toString();
```

**Why this stands without arguing about API typing conventions.** Whichever type is "correct", one
product cannot have two. The two endpoints disagree about the same row, and which answer you get
depends on nothing but the id's parity.

**Impact, observed first-hand.** This defect **silently defeated a strict-equality assertion** during
Batch A: `expect(persisted.price).not.toBe(0)` passed on two of three projects because those products
landed on even ids and the stored `0` came back as `"0"`. The value was present; the comparison could
not see it. Any consumer using `===` against a numeric price is exposed to the same failure, and it
will appear to work roughly half the time. That is the strongest argument for its severity: it does
not announce itself.

**Distinctness.** `BUG-15-101` is a missing **write**-path guard; this is a **read**-path
transformation. Adding validation to `POST /api/products` would not change this response, and
deleting the stringification would not validate anything. Different endpoints, different fixes.

**Suggested fix.** Delete the `if (row.id % 2 === 0)` line so the detail endpoint returns the stored
value unmodified.

**Owning test — now assigned.** When filed there was none, and it was explicitly excluded from Batch
A's coverage. **`TC-15-BVA-006-API`** (Batch B, frozen `102c6d1`) now owns it and fails 3/3:

```
Error: GET /api/products/34 and GET /api/products disagree about the same product's price —
detail returned "1" (string) and the list returned 1 (number)
  Expected: 1
  Received: "1"
```

**The case cannot pass by luck.** The defect appears only on **even** ids, so a single product
landing on an odd id would pass vacuously — which is exactly how this defect stayed hidden through
Batch A. The case creates products until it holds **one of each id parity** and asserts agreement
for both; in this run it held id 34 (even) and failed deterministically. **Parity selects inputs
only** — the oracle says the two endpoints must report the same price for the same product and never
mentions ids, parity or `toString()`.

---

## BUG-15-103 — `category_id` is never checked against existing categories

| Field | Value |
|---|---|
| **Requirement** | P4 — `README.md` line 197: category is required and must be **chosen from the existing list** |
| **Found by** | `TC-15-BVA-009` (Batch B) — 3/3 projects, stable across two runs |
| **Severity** | **Medium** |
| **Evidence strength** | **Direct spec citation** — line 197 |
| **HW02 relationship** | Reconfirms `BUG-15-003` with fresh HW04 evidence |

**Observed.** `Expected: not 4` — the nonexistent category was stored. Corroborated outside
Playwright:

```
existing category ids: 1, 2, 3

category_id 4     -> POST 200, PERSISTED category_id = 4
category_id 999   -> POST 200, PERSISTED category_id = 999
category_id -1    -> POST 200, PERSISTED category_id = -1
```

**Root cause** (code-derived — *not* the oracle). `server.js:167-177` inserts `category_id` as
given. The string `categories` does not appear anywhere in the handler, and `products` carries no
enforced foreign key.

**`TC-15-BVA-007` passes** (`category_id: 1`, which exists, is stored correctly), so the field is
written properly — the fault is specifically that nothing verifies the value refers to a real
category.

### Why this is distinct from BUG-15-101

`BUG-15-101` is missing **format/presence** validation — synchronous, local checks on the request
body. This is missing **referential integrity** — confirming a value exists in *another table*,
which requires a lookup or a real foreign-key constraint, not a guard clause.

*"Would fixing one fix the other?"* — **no**. A developer implementing *"name non-empty and ≤ 255,
price > 0"* has no reason to also query the categories table, and the two fixes live in different
parts of the handler. HW02 separated them the same way (`BUG-15-001`/`002` versus `BUG-15-003`).

**Suggested fix.** Verify `category_id` exists in `categories` before insert, and/or declare an
enforced foreign key on `products.category_id`.

---

## BUG-15-104 — no access control on any product write endpoint

| Field | Value |
|---|---|
| **Requirement** | P6 — `README.md` FR-12 lines 177–179: `POST/PUT/DELETE /api/products` require a valid JWT **and** `role = 'admin'` |
| **Found by** | `TC-15-EP-006/007/008/009-API` — **12 failing executions**, 3/3 projects, stable across two runs |
| **Severity** | **Critical** |
| **Evidence strength** | **Direct spec citation** — lines 177–179 |
| **HW02 relationship** | Reconfirms `BUG-15-004`, `005` and `006` with fresh HW04 evidence |

**Observed.** None of the three write routes carries **any** middleware — not an admin check, not
even `authenticateToken`. Corroborated with no browser:

```
non-admin actor role = user

POST   no auth       -> 200 | created id: 102
POST   non-admin JWT -> 200 | created id: 103
PUT    no auth       -> name now: "c-seed-1786363997005-HIJACKED"
DELETE no auth       -> still present: false
```

The non-admin case asserts its actor really is `role: 'user'` before acting, so this is not a fixture
artefact. **`BUG-04-103` self-escalation was deliberately not used** to obtain the actor — depending
on it would require that filed security defect to stay unfixed.

**Root cause** (code-derived — *not* the oracle). `server.js:167`, `:179`, `:191` register the three
handlers with no middleware argument. The middleware exists and is used elsewhere in the same file
(`app.get("/api/cart", authenticateToken, …)`); there is no `requireAdmin` in the codebase at all.

**Impact.** Any anonymous internet user can create, rename, re-price or delete **any** product.
Combined with `BUG-15-101` they can write arbitrary values while doing so. The other FR-15 defects
concern *what* is stored; this one concerns *who* may store it, which is why it is the feature's only
Critical.

### Grouping — one defect across three verbs

*"Would fixing one fix the other?"* The fault is **one access-control policy absent from one
resource**, and the fix is a single admin-guard middleware applied to the three write routes — one
change-set. All four cases are still listed rather than inferred from one, because guarding `POST`
alone would leave `PUT` and `DELETE` open; each verb was tested and failed independently.

HW02 split them **by verb**. HW04 groups **by fault**, as with `BUG-15-101` and `BUG-04-102` — and
deliberately *unlike* `BUG-08-103`/`BUG-08-104`, which were split because their fixes lived in
different components and neither reached the other. Here all three fixes are the same middleware in
the same file.

**Suggested fix.** Add an admin-guard middleware and apply it, with `authenticateToken`, to all three
product write routes. The same audit should cover `/api/categories` and `/api/coupons`, which FR-12
names in the same sentence.

---

## BUG-15-105 — the admin panel overwrites every listed product's displayed name

| Field | Value |
|---|---|
| **Requirement** | P5 — `README.md` line 198, on the **admin UI** surface |
| **Found by** | `TC-15-EP-011-UI` — 3/3 **browsers**, stable across two runs |
| **Severity** | **Medium** |
| **Evidence strength** | **Direct spec citation** — line 198 |
| **HW02 relationship** | Reconfirms `BUG-15-007` — but HW02 could only verify it by evaluating the expression in `node`; this is the first demonstration **in a real browser** |

**Observed.** After editing one product's name in the panel, the sibling product's row can no longer
be found under its own name — it has been redrawn with the edited name.

```
Error: editing one product changed another product's displayed name in the admin panel
Locator: getByRole('row')…filter({ hasText: 'FR15-TC-15-EP-011-UI-…' })
  Expected: 1
  Received: 0
```

**Root cause** (code-derived — *not* the oracle). `frontend-admin/src/App.jsx`,
`handleProductSubmit`:

```js
const fakeMassUpdatedProducts = products.map((p) => ({ ...p, name: productForm.name }));
setProducts(fakeMassUpdatedProducts);
```

The variable name is the SUT's own. Every row in local state receives the edited product's name.

### Independent of TC-15-EP-010, and the evidence proves it

`TC-15-EP-010` — the **backend** half of line 198 — **passed** in Batch B: the sibling's stored
`name`, `price` and `category_id` were byte-identical to their recorded originals. The data is
therefore safe and this is **client state only**. The two surfaces disagree, and that disagreement is
the finding — the same shape as FR-08's two carts.

**This is why the case must not reload.** Any refresh refetches from the correct backend and the
display silently repairs itself. `TC-15-EP-011-UI` asserts on the table exactly as the panel left it,
using the app's own success dialog as its completion signal. A version that reloaded would have
passed while the defect was fully present.

**Impact.** An administrator renaming one product sees every other product appear renamed too, and
may act on that belief. It self-corrects on refresh and never reaches the database, which is why this
is Medium rather than High.

**Suggested fix.** Update only the edited row in local state, or refetch after the `PUT`.

---

## Summary

**5 confirmed defects** across all three batches. Severity: **Critical — 1**, **High — 1**,
**Medium — 3**. Every one is **directly spec-cited**; none rests on an assumption.

| Requirement | Status after all three batches |
|---|---|
| P1 — add / delete | ✅ both work, via API (`EP-001`, `N01-API`) and via the admin UI (`N02-UI`) |
| P1 — view | ❌ `BUG-15-102` |
| P2 — name required, ≤ 255 | ❌ `BUG-15-101` |
| P3 — price required, > 0 | ❌ `BUG-15-101` (the valid minimum itself passes) |
| P4 — category from the existing list | ❌ `BUG-15-103` (a valid category is stored correctly) |
| P5 — edit isolation, **backend** | ✅ the sibling is untouched (`EP-010`) |
| P5 — edit isolation, **admin UI** | ❌ `BUG-15-105` — judged independently of `EP-010` |
| P6 — admin-only write APIs | ❌ `BUG-15-104` — **Critical** |

**Batch B settled the ambiguity Batch A left.** An endpoint that stores everything might simply be
broken — but a valid create round-trips all three fields, a valid category is stored, delete removes
the row, editing one product leaves its sibling byte-identical, and the minimum valid price
persists. **The write path demonstrably works.** Every FR-15 failure so far is therefore an *absent
guard*, not a broken operation, which is what makes each recommended fix a validation step rather
than a rewrite.
