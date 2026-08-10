# FR-15 — Automation Report (Product Management CRUD)

> **Status:** Step 6.1 complete — **case selection and design only**. No data file exists, no
> `.spec.ts` has been written, and nothing has been run. Batch A freeze is the next action.
>
> | Field | Value |
> |---|---|
> | Student | Nguyen Bao Duy — 23127179 — 23KTPM2 |
> | Feature | FR-15 Product Management CRUD (Pool C, **admin**) |
> | SUT surface | `frontend-admin` (a different app from FR-04/FR-08) + backend API |
> | Method | `test-automation-design` skill, **Phase 1 only** |

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
| **B** | API | 6 — `BVA-006/007/009`, `EP-001`, `N01-API`, `EP-010` | **P1, P3, P4, P5** | The valid classes and the product lifecycle — create, delete, edit-isolation. These establish the write path **works**, which is what makes Batch A's failures read as *unguarded* rather than *broken* |
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

## > NEXT — Batch A freeze

Apply skill Phases 2–4 to the six P2/P3 input-constraint cases: externalize their data with
`expectedSource` per case, generate the batch, review it against the recurring failure modes, run the
static gates, record the pre-run prediction — **then** commit as `freeze: FR-15 specs batch A`,
before any run. That commit is the **eighth** qualifying one.
