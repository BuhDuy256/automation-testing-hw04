# automation-architecture.md — the six frozen decisions

> **Status:** FROZEN at Step 1 (2026-08-09). Owner of §3.1–§3.6 of `implementation_plan.md`.
> These decisions are not re-opened in Steps 2–8; a change here requires an explicit
> re-plan. Every claim below was **measured**, not assumed — the evidence is inline.
>
> **Scope:** how the automation suite is built. It says nothing about *which* cases to write
> (that is each feature's report) and nothing about the SUT's correctness.

---

## §3.1 UI-first, with a documented API-assist policy

**Decision.** Default to driving the browser UI. Two classes of case cannot be expressed that way
and use a named escape hatch:

| Case class | Mechanism | Why the UI cannot do it |
|---|---|---|
| Forged payload (e.g. `TC-08-001` forged `total_amount`) | `page.route()` interception | The client computes the total; there is no field to type a forged value into |
| Missing access control (e.g. FR-15's unauthenticated `POST /api/products`) | `APIRequestContext` | The UI never renders the control to an unauthorised user, so the defect is unreachable through it |

Anything expressible by neither → **documented as not-automatable, with the reason**. HW04 §6 asks
for that list explicitly; it is graded content, not an admission of failure.

**Rationale.** HW04 §4/§5 says *automate the web frontend*, so the UI is the default and the escape
hatches are the exception that must be justified per case — not a general licence to test the API.

---

## §3.2 Test isolation — a fresh user per worker

**Decision.** A **worker-scoped** fixture registers a brand-new account per worker
(`hw04-w{index}-{ts}-{rand}@eshop.test`) via `POST /api/register` and logs it in.
**Never depend on the seeded `test@eshop.com`.**

- **FR-04 / FR-08** (per-user state: profile, cart): each worker owns its account outright.
- **FR-15** (global state: products): products are shared, so every created product takes a
  unique name and assertions target only rows that test created. **Never assert on a total
  product count** — a parallel worker's row would break it.

**Rationale — this is the highest-risk decision in the suite.** 3 browser projects run in parallel
against **one** SQLite database. Two workers mutating the same profile row produce failures that
look exactly like product defects, which would then be filed as bugs. Isolating by data removes
the race at the source rather than serialising the suite (`workers: 1`) and paying the runtime.

It also removes a second hazard: `backend/database.js` calls `initDatabase()` unconditionally at
module load (no `require.main` guard), so **every backend restart drops and re-seeds all tables**.
Tests that depend on seeded rows are hostage to restart timing; tests that create their own data
are not.

**Uniqueness is our responsibility.** `users.email` has **no UNIQUE constraint** in the SUT schema,
and `POST /api/login` resolves an email with `db.get` — first match wins. Two workers landing on the
same email would silently share an account and isolation would fail *without any error*. Hence
label + timestamp + 4 random bytes.

**Known caveat, accepted.** Worker scope means tests *within* one worker share the account
sequentially. A test needing a pristine profile must not assume defaults; it calls
`registerAndLogin(api, 'label')` directly for a private account. Chosen over test-scoped because a
worker runs its tests serially, so sharing is safe for concurrency, and one registration per worker
is far cheaper than one per test.

### Evidence — isolation proven, 3 browsers × 2 consecutive runs

Temporary spec `automation/tests/_isolation-check.spec.ts` (deleted before commit, per plan §5.4).
Each test wrote a worker-unique phone to its own profile, waited 750 ms to give any competing
worker a window to clobber the row, then read it back and asserted it got **its own** value.

```
########## FINAL RUN 1 (3 browsers, 3 workers) ##########
Running 3 tests using 3 workers

[isolation] project=chromium worker=0 id=12 email=hw04-w0-1786269137027-21495645@eshop.test phone=0900chr
[isolation] project=webkit   worker=2 id=13 email=hw04-w2-1786269137279-fa13f05c@eshop.test phone=0902web
  ✓  1 [chromium] › tests\_isolation-check.spec.ts:9:5 › each worker owns a distinct user and its profile write does not leak (1.6s)
  ✓  3 [webkit] › tests\_isolation-check.spec.ts:9:5 › each worker owns a distinct user and its profile write does not leak (2.0s)
[isolation] project=firefox  worker=1 id=14 email=hw04-w1-1786269139196-f74ee843@eshop.test phone=0901fir
  ✓  2 [firefox] › tests\_isolation-check.spec.ts:9:5 › each worker owns a distinct user and its profile write does not leak (9.3s)

  3 passed (11.9s)

########## FINAL RUN 2 (3 browsers, 3 workers) ##########
Running 3 tests using 3 workers

[isolation] project=chromium worker=0 id=15 email=hw04-w0-1786269164216-162bb7f6@eshop.test phone=0900chr
[isolation] project=webkit   worker=2 id=16 email=hw04-w2-1786269164314-52aaf953@eshop.test phone=0902web
  ✓  1 [chromium] › tests\_isolation-check.spec.ts:9:5 › each worker owns a distinct user and its profile write does not leak (1.7s)
  ✓  2 [webkit] › tests\_isolation-check.spec.ts:9:5 › each worker owns a distinct user and its profile write does not leak (2.3s)
[isolation] project=firefox  worker=1 id=17 email=hw04-w1-1786269166679-6f83d5e9@eshop.test phone=0901fir
  ✓  3 [firefox] › tests\_isolation-check.spec.ts:9:5 › each worker owns a distinct user and its profile write does not leak (5.2s)

  3 passed (8.6s)
```

**What this proves:** distinct user ids per worker in both runs (12/13/14, then 15/16/17 — no
reuse across runs), each read-back returned that worker's own phone, and no email was
`test@eshop.com`. 6/6 passes, zero flake.

---

## §3.3 Selector policy

**Order of preference:** `getByRole` → `getByLabel` → `getByText` → scoped CSS as a last resort,
each last-resort selector carrying a comment naming its fragility.

**Constraint that forces this.** The SUT is never modified (no `data-testid` may be added), and it
ships with genuinely hostile markup. Measured example — `frontend-web/src/pages/Login.jsx:29-35`:
both the email and password inputs have **no `type`, `name`, or `id`**, the password field is
`type="text"`, and the page heading reads *"Đăng Ký"* (Register) on the **login** page. Any
AI-generated selector of the form `input[name="email"]` fails silently against this app.

Every last-resort selector is logged as an AI-review finding for HW04 §6 — the fragility is
evidence, not just an inconvenience.

---

## §3.4 Assertion patterns (≥3 required by HW04 §6)

| # | Pattern | Mechanism | Catches |
|---|---|---|---|
| 1 | **UI state** | `expect(locator).toBeVisible() / toHaveText / toHaveValue` | What the user actually sees |
| 2 | **Network response** | `page.waitForResponse()` / `APIRequestContext` → status + body | Wrong status codes, silent 500s, missing validation |
| 3 | **Persisted round-trip** | Mutate via UI → reload/re-fetch → assert the value did (or deliberately did **not**) persist | "UI says saved, backend didn't" — invisible to patterns 1 and 2 alone |

Pattern 3 is the one that earns its place: patterns 1 and 2 can both pass while the write is lost.

---

## §3.5 Data format — JSON

**Decision.** Test data lives in `automation/data/*.json`; **no inline arrays/objects** in any
`.spec.ts` (HW04 §6 rejects hardcoded data).

**Rationale.** Expected values are nested (status codes, field maps, multi-field payloads) and
flatten badly into CSV. Reversible — the spec permits either, and one feature may use CSV to
demonstrate both.

---

## §3.6 Run-by evidence in the HTML report

**Decision.** Three layers, all applied:

| # | Layer | Mechanism | Visible where |
|---|---|---|---|
| 1 | **Reporter title** (primary) | `['html', { title: \`… Run by: ${STUDENT_ID} — ${ISO}\` }]` | Page `<h1>` **and** browser tab |
| 2 | Config metadata | `metadata: { 'Run by': '…' }` | Metadata panel + JSON reporter |
| 3 | Per-test annotation | `runBy` auto-fixture in `fixtures/base.ts` | Every individual test's detail view |

The ISO timestamp is generated once at config load, so it reflects the moment the run started.

### Correction — the plan's original verification was wrong

The plan first said to verify with `grep "<title>" playwright-report/index.html`. **That check can
never pass**, and it produced a false failure that nearly led to reverting a working feature:

- `<title>` in `index.html` is a **static Vite shell tag**, permanently `Playwright Test Report`.
- The real title is at `report.json → options.title`, inside a **base64-encoded zip embedded** in
  that same file. The page sets `document.title` from it at runtime.
- Plain-text grep cannot read compressed data, so the stamp is invisible to it.

The same false signal also produced the earlier claim that `PLAYWRIGHT_HTML_TITLE` "does not work".
Re-tested properly: the env var **does** populate `options.title`. Both paths work; the config
`options.title` form is what the suite uses.

**Replacement check:** `automation/scripts/verify-report-stamp.js` (`npm run verify:report`), which
decodes the payload and asserts all five conditions, exiting non-zero on failure.

```
report:   playwright-report\index.html
title:    EShop Automation — Run by: 23127179 — 2026-08-09T09:52:43.131Z
metadata: Run by = 23127179 @ 2026-08-09T09:52:43.131Z

PASS  report title contains "Run by: 23127179"
PASS  report title contains an ISO timestamp
PASS  report title is not the default
PASS  metadata "Run by" contains 23127179
PASS  metadata "Run by" contains an ISO timestamp

All checks passed.
```

**Visual confirmation** (what a TA actually sees) — the stamp renders as the report's `<h1>`
heading, not only the tab title:

```
document.title        => EShop Automation — Run by: 23127179 — 2026-08-09T09:52:43.131Z
contains Run by stamp => true
is NOT default title  => true
on-page heading       => "EShop Automation — Run by: 23127179 — 2026-08-09T09:52:43.131Z"
```

Screenshot: `evidence/report-run-by-2026-08-09.png`.

**Method note worth carrying forward.** Both errors above came from *one* root cause: trusting a
verification command instead of checking that the command could observe the thing it claimed to
test. A check that cannot fail for the right reason is worse than no check — it manufactures
confidence in the wrong direction. Applied here in both directions: the grep was replaced, and its
replacement was proven to actually fail when the stamp is absent before being trusted.

---

## Artefacts created in Step 1

| Path | Role |
|---|---|
| `automation/playwright.config.ts` | reporter `title` + `metadata` (layers 1–2) |
| `automation/fixtures/base.ts` | `api`, `isolatedUser` (worker-scoped), `runBy` (auto, layer 3) |
| `automation/utils/api.ts` | `registerAndLogin()` — unique-account creation |
| `automation/utils/urls.ts` | `WEB_URL` / `ADMIN_URL` / `API_URL` |
| `automation/scripts/verify-report-stamp.js` | §3.6 verification, reused by Steps 2/3/5/6 |
| `docs/implementation-plan/evidence/report-run-by-2026-08-09.png` | visual anti-cheat evidence |

**No `.spec.ts` is committed in Step 1** — the isolation spec was deleted after use (plan §5.4), so
the §12 ledger contains only feature scripts.
