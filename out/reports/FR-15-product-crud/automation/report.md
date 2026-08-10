# FR-15 — Automation Report (Product Management CRUD)

> **Status:** Step 6.3 — Batch A **executed** (18 executions, 3 passed / 15 failed, 2 defects:
> issues #8 and #9); **Batch B frozen, not yet run**. Selection and design §1–§6; Batch A §7–§11;
> Batch B sizing §12 and freeze §13. Batch C is not started.
>
> | Field | Value |
> |---|---|
> | Student | Nguyen Bao Duy — 23127179 — 23KTPM2 |
> | Feature | FR-15 Product Management CRUD (Pool C, **admin**) |
> | SUT surface | `frontend-admin` (a different app from FR-04/FR-08) + backend API |
> | Method | `test-automation-design` skill — Phase 1 (§1–§6), then Phases 2–4 for Batch A (§7–§9) |

---

## 1. Test basis

**FR-15**, `eshop-sut/README.md` lines 191–198:

| Ref | Line | Requirement (original) | Working translation |
|---|---|---|---|
| **P1** | 193 | *Admin có thể Thêm / Xem / Sửa / Xóa sản phẩm.* | Admin can add / view / edit / delete products |
| **P2** | 195 | *Tên sản phẩm: bắt buộc, tối đa 255 ký tự.* | Product name: required, at most 255 characters |
| **P3** | 196 | *Giá: bắt buộc, phải là số **dương** (> 0).* | Price: required, must be a positive number (> 0) |
| **P4** | 197 | *Danh mục: bắt buộc, phải chọn từ danh sách có sẵn.* | Category: required, must be chosen from the existing list |
| **P5** | 198 | *Khi Sửa một sản phẩm, chỉ sản phẩm đó bị thay đổi — các sản phẩm khác giữ nguyên.* | When editing a product, only that product changes — the others stay as they were |

**FR-12**, lines 176–179, supplies the access-control rule these cases test:

| Ref | Line | Requirement |
|---|---|---|
| **P6** | 177–179 | The admin area is only for accounts with `role = 'admin'`, and **all** data-affecting APIs — explicitly including `POST/PUT/DELETE /api/products` — require **both** a valid JWT **and** `role = 'admin'` in that token |

### 1.1 No status codes are documented

`api_specification.md` §3.3 documents the **request body** for `POST` / `PUT` / `DELETE
/api/products` and nothing else — no success status, no error contract, no status code anywhere in
the document. As in FR-04 and FR-08, this means **invalid-input cases assert an outcome only**
(*"must not be persisted as this value"*), never a status code. Asserting `400` or `403` would
invent an oracle the test basis does not provide.

---

## 2. HW02 inventory and what is selected

HW02 froze **20** FR-15 cases (11 EP + 9 BVA) — a surplus against the minimum of 12, so unlike FR-08
**no large design effort is required**. **16 are selected**, 4 are excluded with reasons, and **2 new
cases** close a genuine hole in the requirement areas (§2.2).

### 2.1 Excluded HW02 cases, with reasons

| HW02 case | Reason for exclusion |
|---|---|
| `TC-15-EP-004` — `price` negative | **Converges with `TC-15-BVA-004`** (`price = -1`): same input class, same mechanism, same assertion. The BVA case is kept because it sits on the boundary set alongside `0` and `1`, where the negative value earns its place as part of a triple |
| `TC-15-EP-005` — `category_id` nonexistent | **Converges with `TC-15-BVA-009`** (`category_id = 4`): same class, same assertion. The BVA form is kept for the same reason |
| `TC-15-BVA-001` — `name` = 1 character | **Selection tradeoff, not a judgement that the case is worthless.** HW02 designed it deliberately as the **lower valid boundary** of the name-length set, and it is a legitimate boundary. It is omitted because the selected 18 already cover P2 from both directions — `EP-002` (empty) and `EP-003` (omitted) for *required*, `BVA-002` (255) for the valid maximum and `BVA-003` (256) for the first invalid length — which is strong enough for this pass. Reinstate it if the name constraint later needs the full boundary set |
| `TC-15-BVA-008` — `category_id` = 3 | **Selection tradeoff.** HW02 designed it as the **last valid member** of the seeded category enum `{1, 2, 3}`, which is a real boundary on that enum. It is omitted because P4's actual requirement is *"must be chosen from the existing list"* — an existing-versus-nonexistent distinction that `BVA-007` (exists) and `BVA-009` (does not exist) already cover. Enumerating every valid category id is not what FR-15 is about, and the category list is FR-14's subject. Reinstate it if enum completeness becomes the focus |

**None of the four is dropped because it is hard to automate**, and none reduces coverage of any
requirement area — P1–P6 all retain at least two cases without them.

The two kinds of exclusion above are **not** equivalent, and are stated separately on purpose:
`EP-004` and `EP-005` are genuine **convergence** — same input class, same mechanism, same
assertion as their BVA twins, so keeping both would double-count one piece of evidence.
`BVA-001` and `BVA-008` are **selection tradeoffs** — each is a legitimate boundary HW02 designed
on purpose, dropped to keep the selected set at 18 while P1–P6 stay covered. Calling the second
pair "redundant" would misrepresent HW02's design; they are omissions this pass accepts, and
either can be reinstated without disturbing the batch structure.

### 2.2 Two new cases, and why they are needed

HW02's FR-15 set has a real hole against the requirement areas: it contains **no positive
delete case at all**. `TC-15-EP-009` covers `DELETE` *without* authorisation (must be refused), but
nothing covers *"Admin có thể … Xóa sản phẩm"* succeeding — half of P1 is untested.

| New case | Closes | Grounding |
|---|---|---|
| `TC-15-N01-API` | P1 — **delete** succeeds for an admin | README line 193, quoted directly |
| `TC-15-N02-UI` | P1 — **add** through the admin interface | README line 193 + HW04 §4/§5's UI-first mandate |

`TC-15-N02-UI` also addresses a coverage-shape problem: **19 of HW02's 20 FR-15 cases are API-path**,
because the defects they target are backend validation gaps. Automating only those would leave the
admin *interface* almost untested for a feature whose requirement line is written about what an
admin can do. Two UI cases (`EP-011` + `N02-UI`) keep the interface genuinely represented.

**Total selected: 18** (16 HW02 + 2 new) — comfortably above the minimum of 12.

---

## 3. Selected case set

| # | ID | Source | Req | Mechanism | Input / precondition | Expected outcome | `expectedSource` | Reason for mechanism | Batch |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `TC-15-EP-002` | HW02 | **P2** | API | Admin `POST /api/products`, `name: ""`, valid price/category | `name` **not persisted as `""`** | spec — line 195 | Asserts what the backend stores; the admin form may not permit an empty submit, which would hide the backend gap | **A** |
| 2 | `TC-15-EP-003` | HW02 | **P2** | API | Admin `POST`, `name` **omitted entirely** | `name` not persisted as absent/null — a required field | spec — line 195 | **Not expressible through the UI** — the form always sends the field | **A** |
| 3 | `TC-15-BVA-002` | HW02 | **P2** | API | `name` = **255** chars (max, inclusive) | Persisted as the full 255-character name | spec — line 195 | Backend storage claim; a 255-char UI entry tests the form, not the rule | **A** |
| 4 | `TC-15-BVA-003` | HW02 | **P2** | API | `name` = **256** chars (max + 1) | `name` **not persisted** as the 256-character string | spec — line 195 | As above | **A** |
| 5 | `TC-15-BVA-004` | HW02 | **P3** | API | `price` = **−1** | `price` not persisted as `-1` | spec — line 196 | Backend storage claim | **A** |
| 6 | `TC-15-BVA-005` | HW02 | **P3** | API | `price` = **0** (boundary, excluded by "> 0") | `price` not persisted as `0` | spec — line 196 | As above; `0` also discriminates a falsy guard from real validation | **A** |
| 7 | `TC-15-BVA-006` | HW02 | **P3** | API | `price` = **1** (min valid) | Persisted as `1` | spec line 196 for the rule; **HW02 assumption A1** for the concrete integer | Backend storage claim | **B** |
| 8 | `TC-15-BVA-007` | HW02 | **P4** | API | `category_id` = **1** (exists) | Persisted as `1` | spec — line 197 | Backend storage claim | **B** |
| 9 | `TC-15-BVA-009` | HW02 | **P4** | API | `category_id` = **4** (does not exist) | Not persisted as `4` | spec — line 197 | As above | **B** |
| 10 | `TC-15-EP-001` | HW02 | **P1** add | API | Admin `POST` with all-valid fields | Product created and retrievable with the values sent | spec — line 193 | Establishes the write path works, so later failures read as *unguarded*, not *broken* | **B** |
| 11 | `TC-15-N01-API` | **new** | **P1** delete | API | Admin creates a product, then `DELETE /api/products/:id` | The product is **no longer retrievable** | spec — line 193 | Closes HW02's positive-delete hole; asserted on the row this test created only | **B** |
| 12 | `TC-15-EP-010` | HW02 | **P5** | API | Two products created by this test (`target`, `sibling`); `PUT` changes only `target` | `sibling`'s stored fields are **byte-identical** to their recorded originals | spec — line 198 | Backend enforcement path | **B** |
| 13 | `TC-15-EP-006` | HW02 | **P6** | API | `POST /api/products` with **no** `Authorization` header | **No product is created** | spec — README 177–179 | The UI never renders this operation to an unauthorised user | **C** |
| 14 | `TC-15-EP-007` | HW02 | **P6** | API | `POST` with a **valid JWT whose `role` is `user`** | No product is created | spec — README 177–179 | Authenticated-but-not-admin is unreachable through the admin app, which rejects non-admins at login | **C** |
| 15 | `TC-15-EP-008` | HW02 | **P6** | API | `PUT /api/products/:id` with no `Authorization` header | The product is **not modified** | spec — README 177–179 | As #13 | **C** |
| 16 | `TC-15-EP-009` | HW02 | **P6** | API | `DELETE /api/products/:id` with no `Authorization` header | The product is **not deleted** | spec — README 177–179 | As #13 | **C** |
| 17 | `TC-15-EP-011` | HW02 | **P5** | **UI** | Admin panel, ≥2 products visible; edit **one** product's name and submit | Every other product's **displayed** name is unchanged | spec — line 198 | P5 is a user-observable claim; the defect HW02 found here is **UI-only** (§5) | **C** |
| 18 | `TC-15-N02-UI` | **new** | **P1** add | **UI** | Admin panel "Thêm sản phẩm mới" form, valid values, unique name | The product appears in the admin list **and** is retrievable from the API | spec — line 193 | Exercises the admin *interface* for the operation its requirement line describes | **C** |

### 3.1 Coverage by requirement

| Ref | Requirement | Cases | Count |
|---|---|---|---|
| **P1** | add / view / edit / delete | `EP-001`, `N01-API`, `N02-UI`, (+ `EP-010` exercises edit) | **3** dedicated |
| **P2** | name required, ≤ 255 | `EP-002`, `EP-003`, `BVA-002`, `BVA-003` | **4** |
| **P3** | price required, > 0 | `BVA-004`, `BVA-005`, `BVA-006` | **3** |
| **P4** | category required + existing | `BVA-007`, `BVA-009` | **2** |
| **P5** | edit isolation | `EP-010` (backend), `EP-011` (UI) | **2** |
| **P6** | admin-only write APIs | `EP-006`, `EP-007`, `EP-008`, `EP-009` | **4** |
| | | **Total** | **18** |

Every listed requirement area has at least two cases. **"View"** is covered as the verification step
of every case — each asserts persistence by an independent `GET` — rather than by a dedicated case;
that is stated here rather than counted twice.

### 3.2 Declared convergence

`EP-010` and `EP-011` both test **P5**, on **two different enforcement paths** — backend storage
versus rendered state. HW02 found they **disagree**: the stored data is correctly isolated while the
admin panel's local state is not. They are therefore **not** duplicates, and are to be judged
separately, exactly as FR-08's two carts were.

### 3.3 Cases that cannot be automated

**None.** All 18 are automatable through `APIRequestContext` or the admin UI. Request interception is
not required by any of them.

Worth noting: HW02 flagged `TC-15-EP-011` as requiring *"actual browser interaction … not `curl`"*,
and verified it only by evaluating the offending state expression in `node`. HW04 drives the real
admin panel, so this case is a **strict upgrade** over its HW02 execution — the same relationship
FR-04's `TC-04-BVA-002-UI` had to its HW02 form.

---

## 4. Batch plan

| Batch | Surface | Cases | Requirements | Rationale |
|---|---|---|---|---|
| **A** | API | 6 — `EP-002`, `EP-003`, `BVA-002/003/004/005` | **P2, P3** | The input-constraint invalid/boundary set: one coherent review unit, all asserting *"not persisted as X"* |
| **B** | API | 6 — `BVA-006`*, `BVA-007`, `BVA-009`, `EP-001`, `N01-API`, `EP-010` | **P1, P3, P4, P5** | The valid classes and the product lifecycle — create, delete, edit-isolation. These establish the write path **works**, which is what makes Batch A's failures read as *unguarded* rather than *broken*. \*`BVA-006` is **dual-purpose** — see §12 |
| **C** | API + **UI** | 6 — `EP-006/007/008/009`, `EP-011`, `N02-UI` | **P6, P5, P1** | Access control (4 API) plus both admin-UI cases. Grouped because the UI cases need the admin app's own fixtures and selectors, which nothing else in FR-15 uses |

**3 batches × 6 cases**, all within the skill's 4–6 range. **Batch A's freeze is the eighth
qualifying commit**, clearing HW04 §12's minimum.

**Browser coverage forecast:** only `EP-011` and `N02-UI` request `page`, so FR-15 will contribute
**6 genuine browser executions** (2 × 3) out of 54 total. The other 16 cases launch no browser and
will be excluded from the count, as Batch B's were in FR-08.

---

## 5. Risks to carry into Batch A

These are derived from reading the admin app and the backend. Reading source is legitimate for
**locating** behaviour and choosing mechanisms — never for deriving an oracle.

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| 1 | **Products are global state** — the first feature where architecture §3.2's shared-state rule actually bites. FR-04 and FR-08 mutated per-user records; products are shared by every worker, every project and every previous run. | An assertion on a total product count would be broken by any parallel worker, and two tests using the same product name would collide silently. | Every created product takes a **unique name** (label + timestamp + random bytes). Assertions target **only rows this test created**, looked up by that name or by the id returned at creation. **No assertion may reference a total product count** — this is a hard rule for the batch. |
| 2 | **The admin token key is `adminToken`, not `token`.** `frontend-admin/src/App.jsx:7` reads `localStorage.getItem("adminToken")`. | `utils/session.ts`'s `seedSession()` writes `token` and is used by every FR-04 and FR-08 UI test. Reusing it here would leave the admin app logged **out**, and the failure would look like a routing or rendering problem. | A separate admin session helper writing `adminToken`. **Do not inherit `seedSession`.** |
| 3 | **FR-15 must depend on the seeded `admin@eshop.com` account** — an explicit, reasoned exception to the "never depend on seeded data" rule. `POST /api/register` inserts a user **without** a role, so it is impossible to create an admin through the API. | The alternative would be to self-escalate a fresh account via `BUG-04-103` — using a filed security defect as test infrastructure, which would make the suite depend on a bug remaining unfixed. | Use the seeded admin **as a credential only**. Nothing is asserted about that account, and every product the tests create is still uniquely named and privately owned by the test. Recorded here so the exception is visible rather than silent. |
| 4 | **The admin page renders at least four tables** (categories, products, coupons, users). | `getByRole('table')` and `getByRole('row')` are ambiguous across them; an index-based locator would break the moment a section is reordered. | Scope every table locator to its section, and log each last-resort selector per architecture §3.3. |
| 5 | **The admin product form *does* use `placeholder` attributes** — "Tên sản phẩm", "Giá tiền", "URL Ảnh", "Mô tả". | This is the **opposite** of the storefront profile form, where `getByLabel` was unusable and had to be worked around. The FR-04/FR-08 conclusion must not be carried over blindly. | Re-derive selectors from `frontend-admin`; `getByPlaceholder` is available and is the preferred route here. |
| 6 | **The edit path fires `alert("Cập nhật thành công!")`** (`App.jsx` ~line 116). | An unhandled dialog blocks the page and every later command. | Register a dialog handler **before** any interaction in both UI cases, as FR-08 Batch A/C did. |
| 7 | **Test-created products accumulate in the shared catalogue** and are not cleaned up between runs. | Harmless for FR-15 by construction (unique names, no count assertions), but it does grow the catalogue that FR-08's tests read. | FR-08 looks products up **by name**, so it is unaffected. Noted rather than mitigated; a backend restart re-seeds and clears the accumulation. |
| 8 | **No status codes are documented for any product endpoint.** | The observed behaviour is tempting: the write endpoints have **no middleware at all**, so an unauthorised call currently succeeds. Asserting a specific refusal code would invent an oracle. | Outcome-only assertions — *"no product was created"*, *"the product was not modified"*, *"not persisted as X"*. Status recorded as an annotation. |

### 5.1 Anticipated risk areas — *not* the formal prediction

Formal pass/fail predictions belong to each batch's pre-freeze review (skill Phase 4.4). Noting only
where the design expects to find something, so the batch order is understood:

- **HW02 confirmed 7 FR-15 defects** (`BUG-15-001` … `BUG-15-007`) covering name, price and
  `category_id` validation, access control on all three write verbs, and the admin panel's
  edit-isolation bug. Batches A and C are therefore expected to be defect-dense.
- The three product write endpoints (`server.js:167`, `179`, `191`) carry **no middleware
  whatsoever** — not even `authenticateToken`. Batch C's four access-control cases target this.
- `EP-010` (backend edit-isolation) is expected to **pass** while `EP-011` (UI) fails — HW02 found
  exactly that split. If it holds, it is the same two-surface shape as FR-08's R5 and must again be
  judged as two separate questions.

No assertion will be written to match any of this.

---

## 6. What Step 6.1 deliberately did not produce

- **No `.spec.ts`** and **no data file** — both belong to the Batch A freeze commit, alongside the
  review findings that shape them. A design-stage data file would be a half-frozen artefact.
- **No run.** Nothing in FR-15 has been executed.

---

---

# Step 6.2 — Batch A (P2 + P3), **executed**

Freeze `734c6d0` · post-run correction `4dc1cd3` · output `246928a`. Results in §10–§11.

Six API-path cases: `TC-15-EP-002`, `TC-15-EP-003`, `TC-15-BVA-002`, `TC-15-BVA-003`,
`TC-15-BVA-004`, `TC-15-BVA-005`. Files: `automation/data/fr-15-product-crud.json`,
`automation/utils/admin.ts`, `automation/tests/fr-15-product-crud/product-constraints-api.spec.ts`.

## 7. Human review of the AI-generated Batch A specs

Reviewed **before** the freeze commit and before any run.

| # | Finding | Why it was missed | Fix |
|---|---|---|---|
| 62 | **The invalid cases had no way to recognise their own row.** Products are global state, so a test must identify what it created — but `TC-15-EP-002` sends `name: ""` and `TC-15-EP-003` sends **no name at all**. The field that would normally identify the row *is the field under test*. A generated spec that looks the row up by name cannot work for the two cases that matter most. | The marker technique carried over from FR-08 assumed the identifying field is always available. Here the invalid input destroys it. | Every payload carries a unique marker in **`description`** (and in `imageUrl`), independent of `name`. The read-back additionally asserts `description === marker`, so a row mix-up is reported explicitly rather than silently shifting the assertion onto another product. |
| 63 | **A refused create would have failed the test.** The obvious generated shape reads `id` from the POST response and immediately `GET`s it. But HW02's frozen expectation is *"the create is rejected, **or** if created, it must not be persisted with X"* — **both** shapes are compliant. A backend that correctly rejected an empty name returns no id, and the spec would have crashed or failed on a compliant implementation. | The same failure mode as FR-08 findings 38 and 60: writing the test against the behaviour actually in front of us. **Fourth appearance.** | The create result is captured as an **optional** id. When nothing was created the invalid-case oracle is satisfied and the test returns early; only a *valid* case failing to be created is an error. The test now passes against a compliant SUT and fails against this one. |
| 64 | **Length and uniqueness pull against each other.** `BVA-002`/`BVA-003` need names of **exactly** 255 and 256 characters — but products are global, so a fixed `'A'.repeat(255)` would be identical across every worker, project and previous run. | Two correct requirements that happen to conflict; satisfying either one alone looks complete. | `uniqueNameOfLength()` pads the unique marker out to the exact length, so the boundary is exact to the character *and* no two executions collide. The spec asserts the generated length before sending, so a helper bug cannot silently move the boundary being tested. |
| 65 | **`omit` must mean the key is absent, not `undefined`.** `TC-15-EP-003`'s entire point is *field absent* versus *field present-but-empty* (`EP-002`). Assigning `name: undefined` would serialise the key away — accidentally correct — but `name: null` would not, and the two test different things. | The distinction is easy to lose when a payload is assembled from a data-driven mode flag. Same shape as FR-08 finding 45. | The `name` key is only ever assigned for `literal` and `uniqueOfLength`; for `omit` it is never written. The payload actually sent is annotated on every case. |
| 66 | **Admin auth had two wrong-but-tempting routes.** The suite already has `registerAndLogin()`, which produces a `role: 'user'` account — useless here. The other available route is to register a user and self-escalate through `BUG-04-103`. | `registerAndLogin` is the established helper, and the escalation route is *technically* available and would even look clever. | Neither. A dedicated `loginAsAdmin()` uses the seeded credential, memoised per worker so it costs one login rather than one per test. The reasoning is written into the helper: **self-escalating would make the whole FR-15 suite depend on a filed security defect remaining unfixed.** |
| 67 | **`seedSession` would have been the wrong helper even if this were a UI batch.** It writes `localStorage.token`; the admin app reads **`adminToken`**. | Risk 2 from §5, checked explicitly rather than assumed. | Not used — this batch touches no browser at all. Verified: zero references in the spec. |
| 68 | **Nothing may assert a product count.** The natural check for "the invalid product was not created" is to compare list lengths before and after. | It is the most obvious formulation of the requirement, and it is wrong here for the same reason it was wrong in FR-08's Batch B. | No count assertion anywhere. Non-persistence is judged from the created row itself — or from the create having been refused. Verified by gate. |
| 69 | **A status-code oracle was available and unfounded.** The endpoints return 500 on a DB error and 200 otherwise, which is tempting to encode. | The recurring failure mode; **fifth batch running**. | No status assertion. `api_specification.md` §3.3 documents only the request body — no success status, no error contract, no status code in the entire document. Status is annotated as evidence. |

## 8. Static gates — all passed before first execution

| Gate | Result |
|---|---|
| `fr-15-product-crud.json` parses; Batch A count | **6**, all with `expectedSource`, all `status: frozen` |
| Requirement split | **P2 = 4, P3 = 2** |
| `npx tsc --noEmit` | exit **0** |
| Batch A discovery | **18 tests in 1 file** (6 × 3 projects) |
| `page` fixture requested | **none** — the only test signature is `async ({ api })` |
| Status-code / count assertions | **0** |
| `seedSession` **used** | **0 call sites** — this batch touches no browser |
| `BUG-04-103` self-escalation **used** to obtain admin rights | **0 call sites** — auth is the seeded credential via `loginAsAdmin()` |
| Inline test-data literals in the spec | **0** |
| FR-15 executed before freeze | **never** — 0 `fr-15` entries in `test-results/` |
| FR-04 / FR-08 deliverables, fixtures, or `eshop-sut/` modified | **none** |

**A note on how that last gate is worded.** It asserts **no use**, not "no mention". `utils/admin.ts`
deliberately *documents* `BUG-04-103` in prose, to record why self-escalation is forbidden — a
comment explaining a rejected approach is the opposite of using it, and a grep that counted such
mentions as violations would push the reasoning out of the code precisely where it is most worth
keeping. The gate therefore checks call sites, and the one textual match is the explanation itself.

## 9. Pre-run prediction, recorded before the freeze

Derived by reading `server.js:167-177` — legitimate for **predicting**, never as the oracle. The
handler destructures `name, price, description, imageUrl, category_id` and inserts them directly:
there is no validation of any kind, and no middleware on the endpoint.

| Case | Req | Prediction | Reasoning | Confidence |
|---|---|---|---|---|
| `TC-15-EP-002` | P2 | **FAIL** | `name: ""` is inserted verbatim; nothing checks it | **High** |
| `TC-15-EP-003` | P2 | **FAIL** | With the key absent the destructured value is `undefined`, which SQLite stores as **NULL** — exactly what line 195's *required* forbids | **High** |
| `TC-15-BVA-002` | P2 | **PASS** | 255 characters is within the limit and the column has no length constraint, so it should store in full | **High** |
| `TC-15-BVA-003` | P2 | **FAIL** | 256 characters is over the limit, but nothing truncates or rejects it | **High** |
| `TC-15-BVA-004` | P3 | **FAIL** | `-1` is inserted verbatim | **High** |
| `TC-15-BVA-005` | P3 | **FAIL** | `0` is inserted verbatim. **This is the discriminating case**: a naive falsy guard would reject `0` while still accepting `-1` | **Medium** — the outcome is high-confidence, but its *diagnostic* value depends on which failure shape appears |

**Expected tally: 1 pass / 5 fail per project → 3 pass / 15 fail over 18 executions.**

All five predicted failures should map to HW02's `BUG-15-001` (name validation absent) and
`BUG-15-002` (price validation absent). Whether they are **one root cause or two** is left open
deliberately: they are separate fields but possibly a single missing validation step, and the
distinctness test must be applied to the evidence after the run, not now — the same discipline that
produced two defects rather than one from FR-08's Batch C.

`TC-15-BVA-002` passing would matter: it would show the write path stores a long name correctly, so
the fault is *absent validation* rather than a broken column or a truncating driver.

**No assertion has been relaxed** for any of HW02's seven known FR-15 defects.

---

# 12. Batch B sizing — resolving the seventh case before writing any code

Batch A's diagnosis produced `BUG-15-102` (issue #9), which currently has **no owning test**. The plan
called for adding one to Batch B — but Batch B already holds six cases, and the skill's batch rule is
**4–6**. Adding a seventh would quietly break the rule that keeps a pre-freeze review tractable, so
the sizing is resolved here, **before** the batch is written, rather than discovered afterwards.

**Resolution: keep Batch B at 6 by making `TC-15-BVA-006-API` dual-purpose.**

| Purpose | Requirement | Assertion |
|---|---|---|
| Original (HW02) | **P3** | `price = 1` is valid and is persisted as sent |
| Added | **P1** (*"Xem"*, view) | `GET /api/products/:id` and `GET /api/products` **agree** about the same product's `price` |

The two sit naturally together rather than being bolted on: the case already creates a product and
reads its price back, so the added assertion observes the *same row* through the *other* endpoint. No
new fixture, no new setup, and the case keeps a single subject — the price of a product it created.

**Alternatives considered and rejected.** Splitting Batch B into two smaller freezes would add a
freeze commit for one case and fragment the lifecycle group, whose value is that create / delete /
edit-isolation are reviewed together. Moving a case to Batch C would put an API case into the batch
whose whole purpose is the admin UI's fixtures and selectors.

## 12.1 Making the `BUG-15-102` assertion deterministic

The defect only manifests on **even** product ids, so a naive version of this assertion would pass
vacuously whenever the created product happened to land on an odd id — **exactly the false pass that
Batch A's finding 70 was about**. Repeating that mistake immediately after diagnosing it would be
indefensible.

The case therefore creates products until it holds **one of each id parity** (bounded, and both ids
annotated), then asserts endpoint agreement for **both**. That guarantees the class where the SUT can
differ is actually exercised.

**Parity is used only to *select inputs*, never as the oracle.** The assertion says *"the two
endpoints must report the same price for this product"* and never mentions ids, parity or
`toString()`. If the SUT's rule changed from `id % 2` to something else, the oracle would still be
correct and the case would still be meaningful — whereas an assertion written as *"even ids return a
string"* would have encoded the defect as the expectation.

---

# 10. Batch A — execution results

```bash
cd automation && npx playwright test tests/fr-15-product-crud/product-constraints-api.spec.ts
```

No retries. Spec frozen at `734c6d0`, post-run correction at `4dc1cd3` (§11).
Report: `../html-report/batch-a.html`.

## 10.1 Results

| Case | Req | Input | chromium | firefox | webkit | Verdict |
|---|---|---|---|---|---|---|
| `TC-15-EP-002` | P2 | `name: ""` | ❌ | ❌ | ❌ | FAIL → `BUG-15-101` |
| `TC-15-EP-003` | P2 | `name` key absent | ❌ | ❌ | ❌ | FAIL → `BUG-15-101` |
| `TC-15-BVA-002` | P2 | `name` 255 chars | ✅ | ✅ | ✅ | PASS |
| `TC-15-BVA-003` | P2 | `name` 256 chars | ❌ | ❌ | ❌ | FAIL → `BUG-15-101` |
| `TC-15-BVA-004` | P3 | `price: -1` | ❌ | ❌ | ❌ | FAIL → `BUG-15-101` |
| `TC-15-BVA-005` | P3 | `price: 0` | ❌ | ❌ | ❌ | FAIL → `BUG-15-101` |

**3 passed / 15 failed** over 18 executions. All 15 are **assertion** failures — zero timeouts, zero
setup failures. Two consecutive runs produced identical results.

## 10.2 Prediction vs actual

| Case | Predicted | Actual (final) | Match |
|---|---|---|---|
| `TC-15-EP-002` | FAIL | FAIL | ✅ |
| `TC-15-EP-003` | FAIL | FAIL | ✅ |
| `TC-15-BVA-002` | PASS | PASS | ✅ |
| `TC-15-BVA-003` | FAIL | FAIL | ✅ |
| `TC-15-BVA-004` | FAIL | FAIL | ✅ |
| `TC-15-BVA-005` | FAIL | FAIL | ✅ |

**6/6 correct**, tally exactly as predicted (1 pass / 5 fail per project). **But the first run did not
match**, and that discrepancy is the most valuable thing this batch produced — §11.

## 10.3 Real-defect classification

All 15 failures were reached **at an assertion**, are identical across all three projects, and were
corroborated outside Playwright:

```
name empty       POST 200 -> PERSISTED name=""
name absent      POST 200 -> PERSISTED name=null
name 256 chars   POST 200 -> PERSISTED name="BBBB…" len 256
price -1         POST 200 -> PERSISTED price=-1
price 0          POST 200 -> PERSISTED price=0
```

**Verdict: CONFIRMED PRODUCT DEFECT — all 15 → `BUG-15-101` ([#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8)).**

**One root cause, not two — and this differs from HW02 deliberately.** Applying *"would fixing one
fix the other?"*: the fault is the **absence of any validation step in one handler**, so a single
guard on `POST /api/products` fixes all five failing cases together. HW02 split them **by field**
(`BUG-15-001` name, `BUG-15-002` price); HW04 groups **by fault**, the same convention already used
for `BUG-04-102`, where an unvalidated `phone` and an empty `name` on one endpoint were reported as
one missing-validation defect. The HW02 correspondence is recorded in the bug report so either view
can be reconstructed.

**What the single pass establishes.** `TC-15-BVA-002` stores a 255-character name **in full**, so the
create path is sound. The fault is that it is *unguarded*, which is why the recommended fix is a
guard clause rather than a rewrite. `price: 0` being stored additionally rules out a naive
`if (price)` check, which would have rejected `0` while still accepting `-1` — the discrimination
§9 predicted this case would provide.

---

# 11. The first run, and a test defect that produced a false pass

Run 1 returned **5 passed / 13 failed**, not the predicted 3 / 15. The extra passes were
`TC-15-BVA-005` (`price: 0`) on **chromium and firefox** — while the same case **failed on webkit**.

A per-project split on a case that never launches a browser and sends a fixed payload is not a
plausible product behaviour, so it went through the gate before anything was filed.

## 11.1 What was actually happening

`GET /api/products/:id` stringifies `price` for every **even** product id:

```js
if (row.id % 2 === 0) row.price = row.price.toString();
```

So a stored `0` comes back as `"0"` for half of all products. The assertion was
`expect(persisted.price).not.toBe(0)` — and `"0" !== 0`, so it **passed**. The invalid value *was*
persisted; strict equality simply could not see it. Which project passed depended on nothing but
whether that worker's product happened to land on an even id.

**This was a false pass — a test defect — and it was hiding a real product defect.**

## 11.2 Finding 70 — strict equality is representation-blind

| # | Finding | Why it was missed | Fix |
|---|---|---|---|
| 70 | **A strict `toBe` compares type as well as value.** Where a SUT can return the same stored value in more than one representation, the assertion passes on a value that is present. Here it inverted the result of an entire case on 2 of 3 projects. | Every earlier batch compared values the SUT returned in one consistent type, so the question never arose. Nothing about the assertion looks wrong in isolation — it is only wrong against *this* endpoint. | `price` is normalised numerically before comparison, and the **raw value and its type are annotated** so the report shows which representation came back. The change can only make the assertion **stricter** — it can now fail where it previously passed, never the reverse — and no expected value, oracle or data-file entry was touched (`git diff` against the freeze shows the JSON unchanged). |

Committed separately as `4dc1cd3`, before the re-run.

**Generalised lesson, worth carrying beyond FR-15:** *a passing assertion is only evidence if it could
have failed for the right reason.* This is the same principle that replaced the report-stamp grep in
Step 1 and that drove findings 38, 60 and 63 — but in the opposite direction. Those were tests that
could not **pass** against a correct implementation; this was a test that could not **fail** against a
defective one.

## 11.3 The diagnosis surfaced a second, genuine defect

The stringification is not a test artefact. `GET /api/products/:id` and `GET /api/products`
**contradict each other about the same row**:

```
id 34  even: true  | detail "12345"  string | list 12345  number | AGREE: false
id 35  even: false | detail 12345    number | list 12345  number | AGREE: true
```

Filed as **`BUG-15-102`** ([#9](https://github.com/BuhDuy256/automation-testing-hw04/issues/9)),
Medium. It needs no argument about API typing conventions: whichever type is correct, one product
cannot have two.

**Provenance is stated honestly.** It was found while diagnosing a test failure, **not** by a designed
case, and **no Batch A case asserts it** — so it is **not counted as Batch A coverage**. A dedicated
case belongs in Batch B, where the product read path is already in scope.

## 11.4 Browser coverage — Batch A contributes **zero**

No test in `product-constraints-api.spec.ts` requests the `page` fixture, so **no browser was
launched**. Its 18 executions run once per configured project for **matrix uniformity only** and are
**excluded** from the browser-run count. The 14.6–18.6 s wall time for 18 executions corroborates it.

FR-15's browser coverage will come entirely from **Batch C's two UI cases** (6 executions).

---

# 13. Batch B (P1, P3, P4, P5), frozen, not yet run

Six API-path cases: `TC-15-BVA-006-API` (dual-purpose, §12), `TC-15-BVA-007`, `TC-15-BVA-009`,
`TC-15-EP-001`, `TC-15-N01-API`, `TC-15-EP-010`. File:
`automation/tests/fr-15-product-crud/product-lifecycle-api.spec.ts`. Batch A's data entries are
**byte-identical** to their frozen state, and its spec file was not touched.

## 13.1 Human review of the AI-generated Batch B specs

| # | Finding | Why it was missed | Fix |
|---|---|---|---|
| 71 | **The `BUG-15-102` assertion would have passed vacuously about half the time.** The defect appears only on **even** product ids, so a case that creates one product and checks endpoint agreement passes whenever it happens to land on an odd id — while proving nothing. That is precisely the false pass finding 70 was about, and repeating it immediately after diagnosing it would be indefensible. | The natural generated shape creates one product and asserts on it. Nothing about that looks wrong unless you already know the defect is id-conditional. | The case creates products until it holds **one of each id parity**, annotates the ids used, and asserts agreement for **both**. Parity **selects inputs only**; the assertion says the two endpoints must report the same price for the same product and never mentions ids, parity or `toString()`. If the SUT's rule changed, the oracle would still be correct. |
| 72 | **A seventh case would have broken the batch-size rule silently.** `BUG-15-102` needed an owning test and Batch B already held six. | The easy path is to append and move on. | Resolved **in the plan before any code was written** (§12): `TC-15-BVA-006-API` is dual-purpose, so Batch B stays at six. Alternatives — splitting the batch, or moving a case to the admin-UI batch — are recorded with their reasons for rejection. |
| 73 | **`price` comparisons in a NEW file would have re-inherited the Batch A false pass.** The stringification affects any read of `price` through `GET /api/products/:id`, and this batch reads it in three cases. | A fix applied in one file does not travel; the trap is per-comparison, not per-suite. | A shared `asNumber()` normaliser is used for **every** price comparison in the file, with the reason and the issue number in its doc comment so the next person does not remove it as noise. |
| 74 | **"Deleted" invited a global count.** The obvious check for `TC-15-N01-API` is that the product list shrank by one. | It is the most natural reading of "no longer there", and it is wrong under parallel execution for the same reason it was wrong in FR-08 Batch B. | The assertion filters the list for **this test's own id** and requires an empty result. It also asserts the product **was** present *before* the delete, so "gone afterwards" cannot pass vacuously. |
| 75 | **`TC-15-EP-010`'s oracle had to be the sibling's own recorded values, not a constant.** Comparing the sibling against hardcoded expectations would fail for reasons unrelated to P5 — and would need updating whenever the fixture changed. | The requirement reads like "the sibling equals what it should be", which invites a literal. | The sibling's fields are read **before** the edit and compared afterwards, so the oracle is *"unchanged from its own recorded original"* — exactly what line 198 states. |
| 76 | **Two different `test` objects were imported.** The file declared cases with the fixtures' `test` while calling `test.info()` on the plain Playwright import. It typechecked and would have run, because `test.info()` resolves to the active test either way. | A leftover from sketching the file against the raw API before wiring in the shared fixtures. | Unified on `import { test, expect } from '../../fixtures/base'`, consistent with every other spec in the suite. Caught by reading the file after the typecheck passed — `tsc` had nothing to object to. |
| 77 | **Creation failures had to read as setup, not as FR-15 results.** Five of six cases must create a product before they can assert anything. | An unguarded `createProduct` would surface a setup failure as a requirement failure. | `createProduct()` asserts the id is non-null with a message naming it a **setup** failure, and `TC-15-N01-API` additionally asserts its precondition. |

**Scope checks:** no status-code assertion; no product-count assertion; every created product carries
a unique marker; every read-back asserts `description === marker` before judging the row; no browser
is requested; `fixtures/base.ts` was **not** modified.

## 13.2 Static gates — all passed before first execution

| Gate | Result |
|---|---|
| `fr-15-product-crud.json` parses; batch counts | **12 cases — A = 6, B = 6** |
| Batch A **data entries** unchanged | ✅ `git diff 734c6d0` shows **zero** deleted lines |
| Batch A **spec file** touched | **no** |
| Batch B `expectedSource` / `status: frozen` | 6 / 6 |
| `npx tsc --noEmit` | exit **0** |
| Batch B discovery | **18 tests in 1 file** (6 × 3 projects) |
| Whole-feature discovery | **36 tests in 2 files** (12 × 3) |
| `page` fixture requested | **none** — all Batch B tests use only `async ({ api })`; **6 cases** discovered across 3 projects |
| Status-code / global-count assertions | **0** |
| Inline oracle data literals | **0** |
| Failure messages citing an oracle | **11** |
| Batch B executed before freeze | **never** — 0 `lifecycle` entries in `test-results/` |
| FR-04 / FR-08 deliverables, fixtures, `utils/admin.ts`, `eshop-sut/` modified | **none** |

## 13.3 Pre-run prediction, recorded before the freeze

Derived by reading `server.js:167-197` — legitimate for **predicting**, never as the oracle.

| Case | Req | Prediction | Reasoning | Confidence |
|---|---|---|---|---|
| `TC-15-BVA-006-API` — P3 half | P3 | **PASS** | `price: 1` is valid and the column stores it unchanged | **High** |
| `TC-15-BVA-006-API` — view half | P1 | **FAIL** | `GET /api/products/:id` stringifies `price` for even ids while the list does not, so the two disagree for the even-id product this case deliberately holds | **High** — already reproduced twice outside Playwright |
| `TC-15-BVA-007` | P4 | **PASS** | `category_id: 1` exists and is inserted verbatim | **High** |
| `TC-15-BVA-009` | P4 | **FAIL** | Nothing checks `category_id` against the categories table; `4` is inserted verbatim (HW02's `BUG-15-003`) | **High** |
| `TC-15-EP-001` | P1 add | **PASS** | All three fields are valid and the insert stores them as sent | **High** |
| `TC-15-N01-API` | P1 delete | **PASS** | `DELETE /api/products/:id` runs an unconditional `DELETE ... WHERE id = ?`, so the row goes | **High** |
| `TC-15-EP-010` | P5 | **PASS** | `UPDATE ... WHERE id = ?` is scoped to one row, so the sibling is untouched. HW02 found the **backend** correctly isolated and only the admin UI wrong — the UI half is Batch C's `EP-011` | **Medium** — high on the mechanism, but the whole point of pairing it with `EP-011` is that the two surfaces disagreed in HW02 |

**Expected tally: 4 pass / 2 fail per project → 12 pass / 6 fail over 18 executions.**

Because `TC-15-BVA-006-API` is dual-purpose, one *case* can fail on its view half while its price
half passes; it is counted as a failing case.

Two predicted failures, mapping to **different** root causes: `TC-15-BVA-009` to a **new** defect
(no category validation — HW02's `BUG-15-003`, not yet filed in HW04), and `TC-15-BVA-006-API` to the
already-filed **`BUG-15-102`** (#9), which this batch finally gives an owning test.

**The four predicted passes carry the batch's real argument.** If create, delete, edit-isolation and
a valid category all work, then Batch A's fifteen failures cannot be explained by a broken endpoint —
the write path demonstrably functions and is simply **unguarded**. That is what turns the
recommendation into a guard clause rather than a rewrite.

**No assertion has been relaxed** for any known defect.

## > NEXT — run Batch B

`cd automation && npx playwright test tests/fr-15-product-crud/product-lifecycle-api.spec.ts`. The
spec is frozen at the commit below, **before** any execution.
