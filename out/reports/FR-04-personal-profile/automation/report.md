# FR-04 — Automation Report (Personal Profile Management)

> **Status:** Step 2 (vertical smoke) complete — 1 of ≥12 cases automated.
> Steps 3 extends this to the full ≥12-case set. This file is the §14 "main report" for FR-04.
>
> | Field | Value |
> |---|---|
> | Student | Nguyen Bao Duy — 23127179 — 23KTPM2 |
> | Feature | FR-04 Personal Profile Management (Pool A) |
> | SUT surface | `frontend-web` @ `http://localhost:5173` |
> | Tool | Playwright 1.62.1 (TypeScript), Chromium / Firefox / WebKit |
> | Freeze commit | `e6cd87f` — `freeze: FR-04 smoke spec` |

---

## 1. Scope of this pass

Step 2 is a **vertical smoke**: one case driven end to end so that every HW04 §6 requirement is
exercised at once — external data, ≥3 assertion patterns, 3 browsers, a Run-by-stamped HTML
report — *before* scaling to 12+ cases. It validates the pipeline, not the feature's coverage.

| Automated | Executed | Passed | Failed | Browser runs | Confirmed defects |
|---|---|---|---|---|---|
| 1 | 3 (1 × 3 browsers) | 0 | 3 | 3 | 1 (`BUG-04-101`) |

The single failure is a **confirmed product defect**, not a test defect — see §5.

---

## 2. Case selected, and why

**`TC-04-BVA-002-UI`** — converted from HW02's frozen `TC-04-BVA-002`.

| Field | Value |
|---|---|
| Input | `phone = "0912345678"` (10 digits, leading `0`) |
| Boundary point | **min** of the valid length range |
| Oracle | `eshop-sut/README.md` FR-04 line 65 — *"Số điện thoại hợp lệ: bắt đầu bằng số `0`, từ 10–11 chữ số."* |
| Expected | Accepted: no rejection, `PUT /api/users/me` issued → 200, phone persisted as `0912345678` |
| `expected_source` | `spec` — never derived from observed behaviour |

**Why this case for the smoke:** it has a *certain* outcome (a deterministic client-side check),
it exercises the **real browser UI** as HW04 §4/§5 requires, and it sits exactly on a spec
boundary — so if the SUT and the spec disagree, the disagreement is unambiguous rather than a
matter of interpretation.

**Upgrade over HW02.** HW02's "UI-path" for this case evaluated the frontend regex directly
(`node -e "/^[1-9][0-9]{8,9}$/.test(...)"`) — it never opened a browser. HW04 drives the real
form: fill the field, click **Cập nhật**, observe the dialog, the network, and the stored value.
That is a strictly stronger test: it confirms the regex is actually reached on the submit path
and that the user-visible outcome follows from it.

---

## 3. Data-driven design

All case data lives in **`automation/data/fr-04-profile.json`**; the spec contains no inline test
data (HW04 §6). The file carries the oracle text itself, so an expected value can never be edited
without visibly editing the oracle beside it:

```json
{
  "id": "TC-04-BVA-002-UI",
  "input": { "phone": "0912345678", "shippingAddress": "12 Nguyen Van Cu, Q5, TP.HCM" },
  "expected": { "rejectedByUi": false, "putRequestIssued": true,
                "putStatus": 200, "persistedPhone": "0912345678" },
  "expectedSource": "spec — eshop-sut/README.md FR-04 line 65 (leading 0, 10-11 digits)"
}
```

## 4. The three assertion patterns (HW04 §6 requires ≥3)

| # | Pattern | In this spec | What it alone would miss |
|---|---|---|---|
| 1 | **UI state** | No dialog matching `/không hợp lệ/` may appear | Would pass if the UI silently swallowed the update |
| 2 | **Network response** | `PUT /api/users/me` must be issued and return `200` | Would pass if the request were sent but the write lost |
| 3 | **Persisted round-trip** | Independent `GET /api/users/me` must return `0912345678` | Would pass if the UI merely *looked* correct |

They are **soft** (`expect.soft`), so a single run reports every way the spec was violated rather
than stopping at the first — which is what made the full impact chain visible in §5.

---

## 5. Result — real-defect gate

All 3 browser runs failed **identically**. Applying the gate (*is this a test defect or a product
defect?*):

**Observed**

```
Error: spec-valid phone "0912345678" (10 digits, leading 0) was rejected by the client-side
       check; FR-04 line 65 says it is valid
  Expected: []
  Received: ["Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số."]

Error: no PUT /api/users/me was issued — the update never reached the backend
  Received: null

Error: phone was not persisted as the spec-valid value
  Expected: "0912345678"   Received: null
```

**Analysis.** `frontend-web/src/pages/Profile.jsx:43` guards submission with
`/^[1-9][0-9]{8,9}$/`. That pattern requires the **first digit to be 1–9**, i.e. it rejects every
number beginning with `0` — the exact inverse of the spec's *"bắt đầu bằng số 0"*. Evaluated
against the whole HW02 boundary set:

| Value | Digits | Spec class | Frontend regex |
|---|---|---|---|
| `0912345678` | 10, leading 0 | **valid** | ✗ rejected |
| `09123456789` | 11, leading 0 | **valid** | ✗ rejected |
| `091234567` | 9, leading 0 | invalid | ✗ rejected |
| `091234567890` | 12, leading 0 | invalid | ✗ rejected |
| `1912345678` | 10, leading 1 | invalid | ✓ **accepted** |

The regex accepts exactly the class the spec forbids and rejects both classes it permits.

**Cross-check — is the whole system wrong, or only the UI?** Executed the same value straight at
the backend with a fresh account:

```
PUT /api/users/me  {"phone":"0912345678"}  →  {"message":"Profile updated"}
GET /api/users/me                          →  phone="0912345678"
```

The backend **accepts and stores it correctly**. The defect is therefore **frontend-only**: the
client-side guard blocks a value the server is perfectly willing to persist.

**Verdict: CONFIRMED PRODUCT DEFECT** (`BUG-04-101`). The test typed a spec-valid value into the
correct field and pressed the correct button; nothing about the automation is wrong. **The
assertion was not weakened** — per plan §2 rule 1 and §5.2, an assertion that exposes a real
defect stays red and the finding goes to the bug report.

---

## 6. Human review of the AI-generated script (HW04 §6)

Reviewed before the first run — findings and fixes:

| # | Finding | Why the AI missed it | Fix |
|---|---|---|---|
| 1 | **`getByLabel` would not work.** The obvious locator for a field labelled *"Số điện thoại"* fails: `Profile.jsx:137` renders `<label>` as a **sibling** of `<input>`, with no `for`/`id`, `aria-label`, or nesting — so nothing associates them. | Feature characteristic. An AI reasoning from the *rendered text* assumes a visible label is a programmatic label; only reading the JSX reveals it is not. | Used `getByPlaceholder('VD: 0912345678')` — unique on the page and still a semantic locator, not a CSS/structural hack (arch §3.3 order). Recorded as the reason the label path is unavailable. |
| 2 | **A `waitForResponse` would hang the test.** The natural way to assert the network call is to await the PUT — but when validation blocks, **no request is ever sent**, so the await would simply time out and report a timeout, hiding *why*. | Prompt/model limitation: the AI wrote the happy path first and did not reason about the failing branch changing the *shape* of the observation. | Captured it as a value (`.catch(() => null)`) and asserted on that value, so "no request was made" is reported as a specific, readable failure rather than an opaque timeout. |
| 3 | **Unused data field.** `shippingAddress` was declared in the JSON case but never filled by the spec — data and behaviour silently diverging. | Attention gap between artefacts written in separate passes. | Spec now fills the address too, so `phone` is genuinely the only spec-relevant variable. |
| 4 | **Typecheck failure.** `addInitScript`'s callback runs in the browser and references `window`/`localStorage`, but `tsconfig.lib` had no `DOM`. | Environment characteristic, invisible until a typecheck is actually run. | Added `DOM` to `lib`; `npx tsc --noEmit` now exits 0. Caught **before** the freeze commit. |
| 5 | **Login coupling risk.** Driving the login form would tie every FR-04 test to `Login.jsx`, whose inputs have no `type`/`name`/`id` at all — an FR-02 regression would then masquerade as an FR-04 failure. | Reasonable default (log in like a user) that is wrong once the test's *subject* is considered. | `utils/session.ts` seeds the same `localStorage` token the app itself reads (`AuthContext.jsx:8`); the app still performs its own authenticated fetch, so the session is genuine. |

**Not changed after seeing results:** nothing. The only post-run edits were to *reports*, never to
an assertion or an expected value.

---

## 7. Evidence

| Artefact | Path |
|---|---|
| Multi-browser HTML report (`Run by: 23127179` + ISO) | `../html-report/index.html` |
| Failure screenshot (chromium) | `../bug-reports/evidence/BUG-04-101-profile-form-chromium.png` |
| Bug report | `../bug-reports/report.md` |
| Spec (frozen before run) | `automation/tests/fr-04-profile/phone-boundary.spec.ts` @ `e6cd87f` |
| Data | `automation/data/fr-04-profile.json` |

Report stamp verified with `npm run verify:report` — 5/5 PASS on both the working report and the
copy stored here.

---

## 8. Cases not automated

None yet — Step 2 scope is deliberately one case. See §9 for the full Step 3 selection.

---

# Step 3 — Full pilot (in progress)

## 9. Case selection and mechanism mapping (Step 3.1)

**All 16** HW02 FR-04 cases are selected (minimum is 12) — 6 EP + 10 BVA. Sources:
`references/hw2/.../FR-04-personal-profile/{domain-testing,boundary-value-analysis}/report.md`.

| # | Case | HW02 ref | Variable / target | Mechanism | Batch |
|---|---|---|---|---|---|
| 1 | `TC-04-BVA-002-UI` | `TC-04-BVA-002` | phone, min (10 digits, lead 0) — **valid** | UI | ✅ smoke (done) |
| 2 | `TC-04-BVA-001-UI` | `TC-04-BVA-001` | phone, min−1 (9 digits) — invalid | UI | **A** |
| 3 | `TC-04-BVA-003-UI` | `TC-04-BVA-003` | phone, max (11 digits, lead 0) — **valid** | UI | **A** |
| 4 | `TC-04-BVA-004-UI` | `TC-04-BVA-004` | phone, max+1 (12 digits) — invalid | UI | **A** |
| 5 | `TC-04-BVA-005-UI` | `TC-04-BVA-005` | phone, leading digit `1` — invalid | UI | **A** |
| 6 | `TC-04-BVA-006-API` | `TC-04-BVA-006` | phone 9 digits, persistence | `APIRequestContext` | B |
| 7 | `TC-04-BVA-007-API` | `TC-04-BVA-007` | phone 10 digits, persistence | `APIRequestContext` | B |
| 8 | `TC-04-BVA-008-API` | `TC-04-BVA-008` | phone 11 digits, persistence | `APIRequestContext` | B |
| 9 | `TC-04-BVA-009-API` | `TC-04-BVA-009` | phone 12 digits, persistence | `APIRequestContext` | B |
| 10 | `TC-04-BVA-010-API` | `TC-04-BVA-010` | phone leading `1`, persistence | `APIRequestContext` | B |
| 11 | `TC-04-EP-001-API` | `TC-04-EP-001` | valid update, all 3 fields | `APIRequestContext` | C |
| 12 | `TC-04-EP-002-API` | `TC-04-EP-002` | `name` empty (assumption A2) | `APIRequestContext` | C |
| 13 | `TC-04-EP-003-API` | `TC-04-EP-003` | `shipping_address` empty (A3) | `APIRequestContext` | C |
| 14 | `TC-04-EP-004-API` | `TC-04-EP-004` | spec-invalid phone persists | `APIRequestContext` | C |
| 15 | `TC-04-EP-005-API` | `TC-04-EP-005` | `role` injection (forbidden field) | `APIRequestContext` | C |
| 16 | `TC-04-EP-006-UI-API` | `TC-04-EP-006` | `email` immutability | **UI + API** | C |

### Why these mechanisms (architecture §3.1)

- **UI (6 cases).** The whole phone boundary set runs through the real form. This is the default
  and the majority surface, as HW04 §4/§5 requires.
- **`APIRequestContext` (10 cases).** Chosen only where the behaviour is **unreachable through
  the UI**, and each has a concrete reason, not a convenience:
  - *BVA API-path (6–10):* these assert what the **backend** stores. Since `BUG-04-101` shows the
    client-side regex blocks every leading-`0` value, the backend's persistence behaviour cannot
    be reached through the form at all — a direct call is the only way to observe it. This is the
    same pairing HW02 used, and the two paths disagreeing is itself the finding.
  - *EP 005 `role`, EP 006 `email`:* the form has **no `role` input** and renders `email` as
    `disabled` (`Profile.jsx:119-124`), so neither field is ever sent by the UI. A forged payload
    is the only way to test that the backend ignores them.
  - *EP 001–004:* HW02 froze these as `PUT /api/users/me` cases whose expectation is about the
    **persisted value**, not the rendering. Re-routing them through the UI would collapse them
    onto the same regex assertion the BVA UI cases already cover — duplicated surface, no added
    value.
- **`page.route()` — not needed for FR-04.** No FR-04 case requires forging a value the client
  computes (unlike FR-08's `total_amount`); `role`/`email` are simply absent from the form, which
  a direct request models more honestly than intercepting one the app never sends.
- **`TC-04-EP-006` is deliberately dual-surface.** Spec line 66 says email may not be changed
  *"qua giao diện"* (**through the interface**) — so the UI assertion (the field is `disabled`) is
  testing the literal wording, while the API assertion (a forged `email` is ignored) tests the
  underlying guarantee. Two genuinely different claims, one case.

### Cases that cannot be automated

**None.** All 16 are automatable through the mechanisms above.

One HW02 *gap-analysis* item is knowingly **not** included: a **partial-update / omitted-field**
case (`PUT` without `phone`, where `server.js` would pass `undefined` into the `UPDATE`). HW02
recorded it as an untested hypothesis and never designed a frozen case for it. Step 3 converts
HW02's frozen cases; inventing a new one here would mean designing a test case in an automation
step, so it is logged as future work rather than silently added.

## 10. Batch A — human review of the AI-generated specs

Batch A = the 4 remaining UI-path boundary cases. Reviewed **before** the freeze commit:

| # | Finding | Why the AI missed it | Fix |
|---|---|---|---|
| 6 | **A worker-shared account corrupts boundary assertions.** The obvious move was to reuse `isolatedUser`, as the Step 2 smoke does. But it is *worker-scoped*, and Batch A has 4 tests that each write a phone — a later test's read-back can see an earlier test's value. `TC-04-BVA-005-UI` in particular is expected to leave `1912345678` stored, which a subsequent "must not equal" assertion could then read and judge against the wrong write. | Scope-anchoring on the working example: worker scope was safe for a *single* test, and the AI carried that pattern forward without re-checking the assumption once 4 mutating tests shared it. | Added a **test-scoped `freshUser` fixture** — one private account per test. Documented in `fixtures/base.ts` as the rule: any test asserting on profile state uses `freshUser`, not `isolatedUser`. |
| 7 | **"Not persisted" is a not-equals, not an equals.** The natural generated assertion for an invalid value was `expect(phone).toBeNull()` (or `''`). That **invents an oracle**: HW02's own note states a "not persisted as X" expectation does not prescribe *how* the SUT avoids storing it — reject, coerce, or truncate are all spec-compliant. | Model bias toward a concrete, symmetric assertion; `toBeNull()` looks stronger and reads better, but asserts something line 65 never says. | Modelled persistence in data as `{ mode: "equals" \| "notEquals", value }` and branched on it. The spec now asserts exactly what the oracle states, no more. |
| 8 | **Assertion direction must come from the spec class, not the observed behaviour.** With 2 valid and 2 invalid cases in one loop, it is trivially easy to let the expected direction follow what the UI happens to do. | Genuine risk of the failure mode HW04 §6 warns about — the loop makes it a one-character mistake. | Direction is read from `expected.specClass` / `expected.rejectedByUi` in the **data file**, never inferred in the spec body. Failure messages quote the spec line so a wrong direction is obvious in the report. |
| 9 | **A silent data-file edit could shrink the suite.** In a data-driven loop, deleting a case from JSON makes the suite report "all passed" with fewer tests — a false green nobody notices. | Not a modelling error; an absence the AI had no reason to consider. | Added a guard: `if (batchA.length !== 4) throw`. The suite fails loudly if the data no longer matches the frozen plan. |
| 10 | **Schema drift between Step 2 and Step 3 data.** The smoke case uses `expected.persistedPhone`; batch A needs the richer `expected.persistence`. | Natural consequence of generalizing after a worked example. | Kept the smoke key (its spec is already frozen — churning a frozen artifact for cosmetics is worse) and documented the divergence in the data file's `schemaNote`. Every case from batch A onward uses the new shape. |

**Predicted outcome, recorded before running** (from `Profile.jsx:43`'s `/^[1-9][0-9]{8,9}$/`):
`BVA-001` and `BVA-004` should pass (invalid, correctly rejected — though for the wrong reason);
`BVA-003` should fail as another manifestation of `BUG-04-101`; `BVA-005` should fail in the
**opposite** direction — the UI *accepts* a spec-invalid value. Recorded here so the run can be
compared against a prediction rather than rationalised afterwards.

**No assertion was relaxed** to accommodate `BUG-04-101`.

## 11. Batch A — execution results

Spec frozen at `8053add` before any run. Four runs were needed, and **the first two produced a
false signal that had nothing to do with the SUT** — that story is the most useful part of this
section, so it is recorded in full rather than only the final numbers.

### 11.1 Run log

| Run | Config | Result | Failure causes |
|---|---|---|---|
| 1 | default workers (**6**), `waitUntil: 'load'` | 7 failed / 5 passed | 5 assertion + **2 navigation timeouts** |
| 2 | default workers (**6**), `waitUntil: 'domcontentloaded'` | 8 failed / 4 passed | 5 assertion + **3 navigation timeouts** |
| 3 | **`workers: 3`**, `domcontentloaded` | **6 failed / 6 passed** | **6 assertion, 0 timeouts** |
| 4 | same as run 3 (stability check) | **6 failed / 6 passed** | identical — no flake |

### 11.2 The false signal, and the real-defect gate

Run 1 failed `TC-04-BVA-001-UI` on Firefox — a case **predicted to pass**. The gate question is
whether that is the product or the test. Evidence:

- The error was `page.goto: Test timeout of 30000ms exceeded` — the navigation never completed,
  so **no assertion ever ran**. A failure that never reached an assertion cannot be evidence
  about the spec.
- The same case **passed on Firefox in isolation** (12.9s).
- Chromium and WebKit passed it under the same parallel load.

**Verdict: test-side defect**, in the "flaky waits" category HW04 §6 asks us to find. Two distinct
causes, fixed separately:

1. **Wrong readiness signal.** `page.goto` defaults to `waitUntil: 'load'`, which blocks until
   *every* subresource finishes. The SUT is served by a **Vite dev server** that compiles modules
   on demand, so `load` waits on work the test does not care about. Fixed by waiting for
   `domcontentloaded` and letting the existing web-first assertion on the phone field — which
   retries by itself — be the real readiness signal.
2. **Over-subscription.** Run 2 showed the wait fix alone was not enough: tests that took 2–13s
   in isolation were taking 30–52s. Playwright defaults to `cpus/2` workers = **6** on this
   12-CPU machine, against a **single** Vite dev server and a **single-threaded SQLite** backend.
   Six concurrent browsers starved the SUT. Fixed with `workers: 3` — one per browser project,
   preserving genuine cross-browser parallelism.

After both fixes, runtimes returned to 0.9–16s and two consecutive runs produced identical
results with zero timeouts.

> **Why this matters beyond Batch A.** For one run, an infrastructure timeout was sitting in the
> results wearing the same red as a genuine spec violation. Had it been accepted at face value,
> `TC-04-BVA-001-UI` would have been written up as a Firefox-specific product defect that does
> not exist. The distinguishing question is not "did it fail?" but **"did it fail at an
> assertion?"** — a failure that never reached one is evidence about the harness, not the SUT.

### 11.3 Final results (runs 3 and 4, identical)

| Case | Value | Spec class | chromium | firefox | webkit | Verdict |
|---|---|---|---|---|---|---|
| `TC-04-BVA-001-UI` | `091234567` (9) | invalid | ✅ | ✅ | ✅ | PASS |
| `TC-04-BVA-003-UI` | `09123456789` (11) | **valid** | ❌ | ❌ | ❌ | FAIL → `BUG-04-101` |
| `TC-04-BVA-004-UI` | `091234567890` (12) | invalid | ✅ | ✅ | ✅ | PASS |
| `TC-04-BVA-005-UI` | `1912345678` (lead `1`) | invalid | ❌ | ❌ | ❌ | FAIL → `BUG-04-101` + **`BUG-04-102`** |

**6 passed / 6 failed** across 12 browser runs. All 6 failures are assertion failures.

### 11.4 Prediction vs actual

The prediction recorded in §10 **before** the run:

| Case | Predicted | Actual | Match |
|---|---|---|---|
| `TC-04-BVA-001-UI` | pass | pass | ✅ |
| `TC-04-BVA-003-UI` | fail (`BUG-04-101`) | fail (`BUG-04-101`) | ✅ |
| `TC-04-BVA-004-UI` | pass | pass | ✅ |
| `TC-04-BVA-005-UI` | fail, **opposite direction** (UI accepts invalid) | fail, UI accepted and value persisted | ✅ |

**4/4 correct** once the harness noise was removed. The prediction did *not* anticipate the
infrastructure flake — which is precisely why it was worth writing down: the mismatch in runs 1–2
was the signal that something non-product was interfering, rather than something to explain away.

One nuance the prediction under-specified: `BVA-001` and `BVA-004` pass **incidentally**. They are
rejected by the regex's leading-digit clause, not by any length check — the regex never enforces
the spec's 10–11 length rule at all. A green result here does **not** mean length validation
works.

### 11.5 Defect classification

- **`TC-04-BVA-003-UI`** → same root cause as `BUG-04-101` (one regex, `[1-9]` inverts the spec).
  **No duplicate issue filed**; issue #1 updated with the widened evidence.
- **`TC-04-BVA-005-UI`** → two findings from one case:
  - the UI *accepting* a spec-invalid value is the other half of `BUG-04-101` → issue #1;
  - the backend **persisting** it is a **distinct root cause** — `server.js:118-135` has no
    validation whatsoever, in a different component, needing a different fix, and it would
    **survive any frontend correction**. Filed separately as **`BUG-04-102`** (issue #2).

### 11.6 Additional review findings from this run

| # | Finding | Category | Fix |
|---|---|---|---|
| 11 | `page.goto` used the default `'load'`, which waits on every Vite dev-server subresource and timed out before any assertion ran | flaky wait (test-side) | `waitUntil: 'domcontentloaded'` + rely on the retrying element assertion (`fix: FR-04 post-run corrections`) |
| 12 | Default `workers: 6` over-subscribed a single-threaded SUT, inflating 2–13s tests to 30–52s | environment (test-side) | `workers: 3`, one per browser project |
| 13 | Passing cases (`BVA-001`, `BVA-004`) pass for the *wrong reason* — the length rule is never enforced | oracle interpretation | Recorded here and in the bug report so a green result is not misread as length validation working |

**No assertion, expected value, or oracle was changed at any point.** The only post-run edits were
the navigation wait and the worker count, both of which change *how the test waits*, never *what
it expects*.

## 12. Batch B — human review of the AI-generated specs (frozen, not yet run)

Batch B = the 5 API-path boundary cases (`TC-04-BVA-006-API` … `TC-04-BVA-010-API`), which assert
what the **backend** stores. Reviewed **before** the freeze commit:

| # | Finding | Why the AI missed it | Fix |
|---|---|---|---|
| 14 | **A missing comma broke the whole data file.** Appending the 5 Batch B cases left the previous array element unterminated, so `fr-04-profile.json` no longer parsed. Every spec imports this file, so *all three* spec files would have failed at load — the suite would report a load error, not test failures. | Mechanical editing error while appending to a long array. Cheap to make, disproportionately expensive: it takes down the entire suite, not one case. | Caught by parsing the file with `node -e` **before** committing. Added that parse-and-summarise check as the routine gate after any data edit. |
| 15 | **Asserting a status code for invalid input would invent an oracle.** The natural symmetric generation is `expect(status).toBe(200)` for valid and `toBe(400)` for invalid. But `api_specification.md` §2.2 documents **only the request body** for `PUT /api/users/me` — no validation rule, no error-response contract — and README line 65 says nothing about *how* an invalid value must be refused. | Model bias toward symmetry: a matched pair of status assertions reads complete and rigorous, which disguises that half of it has no source. | Status is asserted **only** for spec-valid cases (traceable to HW02's "must succeed"). For invalid cases the status is recorded as a test **annotation** — evidence without an unfounded claim. Same reasoning as finding 7: the oracle is "not stored as this value", nothing more. |
| 16 | **`TC-04-BVA-010-API` risked being pure duplication.** Batch A's `TC-04-BVA-005-UI` already showed a leading-`1` phone reaching the backend and being stored, so a reviewer could fairly ask why this case earns its place. | Not an AI error — a genuine selection question that had to be answered rather than assumed. | Kept, with the reason recorded in the spec header: `BVA-005-UI` proves a **compound** result ("UI accepts *and* backend stores"), while `BVA-010-API` **isolates the backend half**. That isolation is exactly what substantiates `BUG-04-102`'s central claim — that the defect **survives any frontend fix** — because this case would still fail with `Profile.jsx` corrected. |
| 17 | **API cases launch no browser, so they are not browser coverage.** They never request the `page` fixture, yet still execute once per configured project. Three identical backend results could be silently counted toward HW04 §6's multi-browser requirement. | Absence rather than error — nothing prompts an AI to question what a green result across projects actually demonstrates. | Documented in the spec header and to be repeated in the results section: the §6 multi-browser requirement is carried by the **UI** cases (smoke + Batch A); Batch B rides the same matrix for uniformity only. The browser-run count must not be inflated by them. |
| 18 | **No proof the write landed on the intended account.** With per-test accounts, a fixture regression could point several tests at one user and the persistence assertions would still look plausible. | The AI trusted the fixture, which is reasonable but leaves the failure mode silent. | Added `expect.soft(persisted.email).toBe(freshUser.email)` so a mis-targeted write is reported explicitly instead of corrupting the phone assertion's meaning. |

**Checklist verified before freezing:** no `test@eshop.com` anywhere in `tests/`; Batch B uses
`freshUser` (test-scoped), never `isolatedUser`; no phone literals in the spec (all values read
from the data file); no `toBeNull` / `toBe('')` invented alternatives; all four failure messages
cite **FR-04 line 65**; `npx tsc --noEmit` exits 0; 15 Batch B tests discovered statically.

**Predicted outcome, recorded before running** (from `server.js:118-135`, which has no phone
validation at all): `BVA-007` and `BVA-008` should **pass** (spec-valid values are stored);
`BVA-006`, `BVA-009` and `BVA-010` should **fail**, all three as `BUG-04-102` — the backend
persists spec-invalid values verbatim. Expected tally: **2 pass / 3 fail** per project.

**No assertion was relaxed** because `BUG-04-102` is already known.
