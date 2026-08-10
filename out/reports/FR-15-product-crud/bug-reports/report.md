# FR-15 — Bug reports

Confirmed product defects found by FR-15 automation. **Batch A only** (P2, P3); Batches B and C have
not run.

Both defects were **corroborated outside Playwright** before filing, reproduce identically on all
three projects (or independently of any browser), and come from a spec frozen at `734c6d0` **before
any execution**. No assertion was weakened.

| ID | Title | Severity | Req | Issue |
|---|---|---|---|---|
| `BUG-15-101` | `POST /api/products` performs no input validation | **High** | P2, P3 | [#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8) |
| `BUG-15-102` | `GET /api/products/:id` returns `price` as a string for even ids | **Medium** | P1 (view) | [#9](https://github.com/BuhDuy256/automation-testing-hw04/issues/9) |

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

**Owning test.** None yet — no Batch A case asserts this, and it is **not counted as Batch A
coverage**. A dedicated case belongs in Batch B, where the product read path is already in scope.

---

## Summary

**2 confirmed defects** from Batch A. Severity: **High — 1**, **Medium — 1**.

| Requirement | Status after Batch A |
|---|---|
| P2 — name required, ≤ 255 | ❌ `BUG-15-101` |
| P3 — price required, > 0 | ❌ `BUG-15-101` |
| P1 — view | ❌ `BUG-15-102` *(incidental; no owning case yet)* |
| P1 add/edit/delete, P4, P5, P6 | not yet exercised — Batches B and C |

Only `TC-15-BVA-002` passed, and it matters: a 255-character name is stored in full, so the product
create path works. Everything failing in Batch A fails because nothing checks the input, not because
the operation is broken.
