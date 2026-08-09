# implementation_plan.md — HW04 Automation Testing

> **Purpose:** Executable plan and resume point. When resuming, read **Status → Next Action**,
> do that step, then update Status.
> **Lineage:** this plan reuses the HW02 method (`references/hw2/eshop-sut-hw2-testing/out/docs/`)
> — *example-first*, *deliverable-first*, *freeze-before-execute*, *audit-as-you-go*. §1 below
> records exactly what carries over, what is superseded, and what is new.

---

## How to use this file

- Do steps in order. Do not start a step until the previous step's **Exit Criteria** all pass.
- Every step ends with a **Git commit**. The **§5 commit schedule** below defines exactly which
  commits touch `.spec.ts` and therefore qualify toward HW04 §12's 8-commit minimum (the 4-day
  span requirement was removed by the instructor on 2026-08-09). Follow it literally — do not
  batch two scheduled commits into one.
- A step's **Stop Conditions** override the plan — if one triggers, halt and get a human decision.
- **FR-04 is the pilot.** FR-08 and FR-15 are produced *through the extracted skill*.

---

## 1. Inheritance from HW02 — what carries, what changes

### 1.1 Carried over unchanged

| Principle | HW02 source | Why it still holds |
|---|---|---|
| **Example-first** | `architecture.md` §2.5 | HW04 §7 explicitly rewards a skill extracted from proven work |
| **Deliverable-first** | §2.6 | Grading is 75/100 on the three features, 10 on the skill |
| **Freeze-before-execute** | §7.4 | Committing a `.spec.ts` before running it *is* the freeze — and produces §12's qualifying commits |
| **Audit-as-you-go** | §7.6 | HW04 §9 requires verbatim prompt + output per artifact |
| **Human gates** | §1.4, §5.2 | "Is this failure a real defect?" is still irreducible judgment |
| **Coupling smell-test** | §6.3 | The new skill must be repo-agnostic to be reusable |
| **MODEL ≠ ORACLE** | §2.1, §7.1 | Expected values still come from spec/accepted-assumption, never from observed output |

### 1.2 Superseded — do not apply

| HW02 invariant | Status in HW04 | Replacement |
|---|---|---|
| **§7.3 Execution Model C** — "agent executes via native Bash; **no test-runner, no assertions-in-code**; comparison lives in the workflow + human gate" | **SUPERSEDED** | HW04 §6 mandates Playwright/Selenium. The runner executes; the **assertion is the comparison**. The human gate moves *downstream*: from "compare expected vs actual" to "is this failing assertion a real defect?" |
| **§4.4 guard 2** — "Execution Result has no `expected` field" | **Re-sited** | The expected value now lives *inside* the committed spec file. The structural guard becomes: **the spec is committed before it is first run** (git order is the proof, exactly as in HW02 §7.4). |

### 1.3 New in HW04 — no HW02 precedent

1. **Data externalization** — test data in `.csv`/`.json`, never inline (§6).
2. **≥3 distinct assertion patterns** (§6).
3. **Multi-browser** — 3 browsers × 3 features ≥ 9 runs (§6).
4. **HTML report evidence** — must **visibly** carry `Run by: 23127179` + ISO timestamp (§6, §11).
   See §3.6 for the required mechanism; metadata alone is **not** sufficient.
5. **Test isolation under parallelism** — see §2.2. HW02 executed serially by hand; this risk did not exist.

### 1.4 Raw-material inventory (input to Steps 3, 5, 6)

Frozen, spec-cited HW02 cases available for conversion:

| Feature | EP | BVA | Total | vs HW04 minimum (12) | Action |
|---|---|---|---|---|---|
| FR-04 Personal Profile | 6 | 10 | **16** | ✅ surplus | Convert; select ≥12 |
| FR-08 Checkout | 4 | 0 | **4** | ❌ **short by 8** | Convert 4 + **design ≥8 new** |
| FR-15 Product CRUD | 11 | 9 | **20** | ✅ surplus | Convert; select ≥12 |

Source: `references/hw2/eshop-sut-hw2-testing/out/reports/FR-{04,08,15}-*/`.
HW02 also confirmed **13 defects** across these three features — expected to reproduce as
failing assertions, which is the intended source of HW04's bug reports.

---

## 2. Global rules (apply in every step)

1. **MODEL ≠ ORACLE.** An assertion's expected value cites the HW02 frozen case, the spec
   (`eshop-sut/README.md`), or an accepted assumption — never observed output. **Never edit an
   assertion to match a failing actual** without first passing the human gate "is this a real
   defect?". Doing so converts a genuine bug into a green test.
2. **Freeze before execute.** Commit the `.spec.ts` before its first run. Git order is the proof.
3. **The SUT is never modified.** No `data-testid` may be added to `eshop-sut/`. Selectors must
   work against the app as shipped (this constraint is *itself* material for the §6 review).
4. **Data externalization.** No inline test-data arrays/objects in a `.spec.ts`. Data lives in
   `automation/data/`.
5. **Audit as you go.** Append an AI Audit row to `[AI-02]` at the moment each AI-generated
   artifact is created — never reconstruct at the end.
6. **Human gates (mandatory).** (a) test-case selection complete? (b) failing assertion → real
   defect or test bug? (c) approve → file GitHub issue.
7. **Record the AI's misses as they happen.** HW04 §6 requires explaining *what* the AI got wrong
   and *why* (prompt quality / model limits / feature characteristics). Log each in the feature's
   `report.md` when found — this is graded content, not incidental.

---

## 3. Architecture decisions to freeze at Step 1

These six (§3.1–§3.6) are decided once, in Step 1, and then not re-opened.

### 3.1 UI-first with a documented API-assist policy
HW04 §4/§5 says *automate the web frontend*. Default = drive the browser UI. Two HW02 case
classes cannot be expressed purely through the UI:
- **Forged-payload cases** (e.g. `TC-08-001` forged `total_amount` — the client computes it)
  → use `page.route()` request interception. Still UI automation; the browser drives it.
- **Missing-access-control cases** (e.g. FR-15's unauthenticated `POST /api/products`) → the UI
  never renders the control, so use Playwright's `APIRequestContext`.

Anything expressible neither way → **document as not-automatable with the reason** (§6 explicitly
asks for this list; it is graded content, not a failure).

### 3.2 Test isolation — the highest-risk decision
One shared SQLite DB + `fullyParallel: true` + 3 browser projects = concurrent writes to the same
rows. Mitigation:
- **FR-04 / FR-08** (per-user state): a worker-scoped fixture registers a unique user
  (`hw04+w{workerIndex}+{ts}@eshop.com`) via `POST /api/register` and logs in. Each worker owns
  its own user. Never depend on seeded `test@eshop.com`.
- **FR-15** (global products): every created product gets a unique name; assertions target only
  rows this test created. Never assert on total product count.
- Also removes the fragility from `database.js` re-seeding on every backend restart (see `CLAUDE.md`).

### 3.3 Selector policy
The SUT has no test ids, and `Login.jsx` inputs carry no `type`/`name`/`id` at all. Order of
preference: `getByRole` → `getByLabel` → `getByText` → scoped CSS as last resort, with a comment
naming the fragility. Every last-resort selector is a documented AI-review finding.

### 3.4 Assertion patterns (≥3 required — these are the three)
1. **UI state** — `expect(locator).toBeVisible()` / `toHaveText` / `toHaveValue`
2. **Network response** — `page.waitForResponse()` / `APIRequestContext` → assert status + body
3. **Persisted round-trip** — mutate via UI, reload, assert the value did (or deliberately did
   **not**) persist — the pattern that catches "UI says saved, backend didn't"

### 3.5 Data format
**JSON** by default (nested expected values — status codes, field maps — flatten badly into CSV).
Reversible: the spec permits either. One feature may use CSV to demonstrate both if desired.

### 3.6 Run-by evidence in the HTML report (§6 + §11, non-negotiable)
HW04 §11 lists the HTML report as **anti-cheat evidence a TA verifies by eye**. A value buried in
report metadata can be missed; the report **title** cannot. Three layers, all required:

| # | Layer | Mechanism | Visible where |
|---|---|---|---|
| 1 | **Reporter title** (**primary**) | `['html', { title: \`EShop Automation — Run by: 23127179 — ${ISO}\` }]` | Browser tab **and** the report's on-page header |
| 2 | Config metadata | `metadata: { 'Run by': '23127179 @ <ISO>' }` | Report metadata panel + JSON reporter |
| 3 | Per-test annotation | `runBy` auto-fixture in `fixtures/base.ts` | Every individual test's detail view |

Mechanism (**measured** 2026-08-09 on Playwright 1.62.1, Step 1 — not assumed): the reporter
resolves `process.env.PLAYWRIGHT_HTML_TITLE || options.title`. The `options.title` form works and
is what the config uses; the ISO timestamp is generated at config load so it reflects the run.

> **Correction — the original verification in this plan was wrong.** It said to
> `grep "<title>"` on `playwright-report/index.html` and expect the stamp. That grep *always*
> reports failure: the `<title>` tag is a **static Vite shell tag** permanently reading
> `Playwright Test Report`. The real title lives at `report.json → options.title` inside a
> **base64 zip embedded** in that same file, and the page sets `document.title` from it at
> runtime. Grepping raw HTML cannot see it — plain text search cannot read compressed data.
> Setting `PLAYWRIGHT_HTML_TITLE` does not change the static tag either, so the earlier claim
> that "the env var does not work" was also a mis-read of the same false signal.

**Verification (run it; do not assume):**
```bash
cd automation && npm run verify:report      # decodes the payload and asserts all 5 conditions
```
`scripts/verify-report-stamp.js` exits non-zero if the stamp is missing. Confirmed visually in
Step 1: the stamp renders as the page's `<h1>` heading *and* the browser-tab title — evidence at
`docs/implementation-plan/evidence/report-run-by-2026-08-09.png`.

Layer 1 is the gating requirement. Layers 2–3 are defence in depth if a reporter override strips
the title.

---

## 4. Folder structure (create minimally, per step — no speculative templates)

```
docs/implementation-plan/
  implementation_plan.md          # this file
  automation-architecture.md      # Step 1 output — the six frozen decisions

automation/
  playwright.config.ts            # exists — 3 projects + Run-by metadata
  fixtures/base.ts                # exists — Run-by annotation; Step 1 adds the isolated-user fixture
  utils/                          # urls.ts exists; Step 1 adds selector/login helpers
  data/fr-0X-*.json               # per feature
  tests/fr-04-profile/*.spec.ts   # Step 2 (smoke) → Step 3 (full)
  tests/fr-08-checkout/*.spec.ts  # Step 5
  tests/fr-15-product-crud/*.spec.ts  # Step 6

out/reports/FR-0X-*/              # DELIVERABLES
  automation/report.md            # §14 main report: generation log, review/fixes, gap analysis
  html-report/                    # copied multi-browser Playwright HTML report
  bug-reports/report.md           # confirmed defects + GitHub issue links
  bug-reports/evidence/*.png

.claude/skills/test-automation-design/SKILL.md   # Step 4
```

---

## 5. Commit schedule — guaranteeing ≥8 qualifying commits

**Qualifying commit** = a commit whose diff **changes at least one `.spec.ts` file** (HW04 §12).
Commits touching only `README`/`report.md`/HTML reports/config/`SKILL.md` do **not** count.

### 5.1 The floor comes from freeze commits only

**Design rule: the ≥8 minimum is met entirely by *freeze* commits — commits that create spec
files before they are first run.** A freeze commit is unconditional: every case that gets
automated must be written and committed before it can be executed (§2 rule 2), so these commits
*always* happen. Nothing in the floor depends on what a test run happens to produce.

Each feature's ≥12 cases are written in **three freeze batches** (≈4 cases each, grouped by
requirement or by variable — a natural review unit, not an artificial split):

| # | Commit | Trigger | Conditional? |
|---|---|---|---|
| **F1** | `freeze: <feature> specs batch A` | Batch A written, **before its first run** | No — always occurs |
| **F2** | `freeze: <feature> specs batch B` | Batch B written, before its first run | No — always occurs |
| **F3** | `freeze: <feature> specs batch C` | Batch C written, before its first run | No — always occurs |

### 5.2 Post-run correction commits are optional extras — never part of the floor

An `fix: <feature> post-run corrections` (**R**) commit may follow a run, but it is **excluded
from the guaranteed minimum by design**. It may only contain corrections to *test* defects (bad
selector, missing wait, wrong precondition).

**If a failing assertion exposed a real product defect, the assertion stays red** and the finding
goes to the bug report — it is never "fixed" into green. If a feature's run yields no legitimate
test-side fixes, **no R commit is created and nothing is owed**: the floor was already met by F1–F3.
This is the point of excluding them. Counting R commits toward the minimum would create pressure
to manufacture test edits, which is exactly the behaviour §12 should not reward.

### 5.3 Ledger — guaranteed floor

| Step | Guaranteed qualifying commits | Running total |
|---|---|---|
| Step 1 — architecture | **0** (config, fixtures, helpers, docs — no `.spec.ts`; see §5.4) | **0** |
| Step 2 — FR-04 smoke | 1 (`freeze: FR-04 smoke spec`) | **1** |
| Step 3 — FR-04 full | 3 (F1, F2, F3) | **4** |
| Step 4 — extract skill | **0** (touches `SKILL.md` only) | **4** |
| Step 5 — FR-08 | 3 (F1, F2, F3) | **7** |
| Step 6 — FR-15 | 3 (F1, F2, F3) | **10** |
| Step 7 — globals | 0 (docs/reports only) | **10** |

**Guaranteed floor: 10 — margin of 2 over the §12 minimum of 8, with zero reliance on optional R
commits.** Any R commits that do occur are genuine extras on top. Steps 1, 4 and 7 are explicitly
marked non-qualifying so they are never miscounted.

**Contingency:** if a feature's cases genuinely do not divide into three batches, the floor still
holds at **8** (1 smoke + 3 + 2 + 2). Below that, add a batch — do not rely on an R commit.

### 5.4 Only feature scripts enter the ledger
Step 1's isolation check (1.4) is scaffolding, not a feature script. Per Step 1 / §5.4 it is
**run and then deleted before committing**, so `git log -- '*.spec.ts'` contains *only* the
committed feature scripts and needs no exclusion filter. Evidence that isolation was proven lives
in `automation-architecture.md` as pasted run output, not as a committed throwaway spec.

### 5.5 Separation rule
Never mix a `.spec.ts` change and a report/doc change in the same commit. Keeping them separate
keeps `git log -- '*.spec.ts'` a clean, auditable list of exactly the qualifying commits.

**Verification before submission (Step 7.4):**
```bash
# every entry must be a feature-script freeze (or an optional post-run fix) — no scaffolding
git log --oneline -- '*.spec.ts' | wc -l    # must be >= 8; planned floor 10 from freezes alone
git log --oneline -- '*.spec.ts' | grep -c '^[0-9a-f]* freeze:'   # must be >= 8 on its own
```
The second command is the real check: **the freeze commits alone must clear 8**, independent of
any correction commits.

---

## Step 1 — Freeze the automation architecture

**Goal:** decide §3's six questions (§3.1–§3.6) once, with evidence, before any test exists.

**Tasks**
- 1.0 Apply §3.6 layer 1: add `title` to the HTML reporter options in `playwright.config.ts`
  (`Run by: 23127179` + ISO). Verify with `npm run verify:report` (§3.6) — **not** a grep on the
  static `<title>` tag, which always reads the default. See the correction note in §3.6.
- 1.1 Write `docs/implementation-plan/automation-architecture.md` recording §3.1–3.6 as frozen
  decisions with rationale.
- 1.2 Implement the worker-scoped isolated-user fixture in `automation/fixtures/base.ts`
  (register + login via API, expose `user` + `token`).
- 1.3 Implement thin login/navigation helpers in `automation/utils/` — helpers, **not** a full
  Page Object Model (simplicity over abstraction until a concrete need appears).
- 1.4 Prove isolation: run one trivial test that mutates its own user's profile, on all 3
  browsers in parallel, and confirm no cross-worker interference.

  **This spec is temporary and is deleted before the Step 1 commit** (`automation/tests/
  _isolation-check.spec.ts` → removed once it passes). Rationale — the most conservative option
  for grading: a throwaway scaffolding spec must never inflate the §12 ledger, and deleting it
  keeps `git log -- '*.spec.ts'` a list of *only* feature scripts, needing no exclusion filter
  a TA would have to trust (§5.4). Paste the passing run output into
  `automation-architecture.md` — **that** is the durable evidence isolation was proven, not a
  committed spec file.

**Exit criteria:** architecture doc written (§3.1–§3.6 frozen); **`npm run verify:report` passes**
(report title + metadata carry the Run-by stamp); fixture yields a distinct user per worker; the parallel
mutation check passes 3/3 with no flake across 2 consecutive runs, its output pasted into the
architecture doc; **the temporary isolation spec is deleted** (`git status` clean of it).
**Risks eliminated:** phantom cross-worker failures; dependence on seeded state; ad-hoc selector drift.
**Commit (§5 ledger — 0 qualifying):** `Step 1: freeze automation architecture + isolated-user
fixture`. Touches `playwright.config.ts`, `fixtures/`, `utils/` and docs — **no `.spec.ts`**, by
design (§5.4).
**Stop condition:** if isolation cannot be achieved per-worker → fall back to `workers: 1` and
record the cost, rather than shipping a flaky suite.

---

## Step 2 — Vertical smoke: one FR-04 case, end to end, every HW04 requirement

**Goal:** prove one case exercises *every* §6 requirement simultaneously, before scaling to 36+.
Mirrors HW02's Step 3 (pipeline validation, not feature coverage).

**Tasks**
- 2.1 Pick one FR-04 HW02 case with a certain outcome. Externalize its data to
  `automation/data/fr-04-profile.json`.
- 2.2 Drive the AI step-by-step (not one generic prompt) to generate the spec; log the verbatim
  prompt + output to `[AI-02]`.
- 2.3 Human review: fix selectors/waits/assertions. Record every fix — this is §6 graded content.
- 2.4 **Commit the spec before running it** (freeze proof).
- 2.5 Run on all 3 browsers; confirm the HTML report renders and carries all three §3.6 layers —
  **run `npm run verify:report`**, do not assume the title took effect.

**Exit criteria:** 3/3 browser runs; data is external; ≥1 assertion pattern demonstrated; HTML
report title contains `Run by: 23127179` + ISO (`npm run verify:report` passes); audit rows appended; git
shows spec committed *before* results.
**Risks eliminated:** "the config works but a real test doesn't"; report-evidence uncertainty;
data-externalization mechanics.
**Commit (§5 ledger — 1 qualifying):** `freeze: FR-04 smoke spec` (before 2.5's run).
Report/config changes go in a separate, non-qualifying commit.
**Stop condition:** the Run-by stamp cannot be made visible in the HTML report → resolve before
scaling (it is an anti-cheat requirement under §11, non-negotiable).

---

## Step 3 — FR-04 full pilot (≥12 cases), by hand, no skill

**Goal:** produce the complete FR-04 deliverable through the workflow. **This is the milestone
the skill is extracted from.**

**Tasks (commit per batch; human gate between phases)**
- 3.1 Select ≥12 of FR-04's 16 HW02 cases; map each to UI / `page.route()` / `APIRequestContext`
  per §3.1. List any non-automatable case with its reason.
- 3.2 Externalize all case data to `automation/data/fr-04-profile.json`.
- 3.3 Drive the AI step-by-step to generate specs, in batches. Audit each batch.
- 3.4 Human review each batch: fragile selectors, weak/missing assertions, flaky waits, missed
  edge cases. Fix, and record *what* + *why the AI missed it*.
- 3.5 Commit specs **before** running (freeze).
- 3.6 Run all 3 browsers. Copy the HTML report to `out/reports/FR-04-personal-profile/html-report/`.
- 3.7 Human gate on each failure: real defect or test bug? Confirmed defects → bug report +
  GitHub issue + screenshot.
- 3.8 Write `out/reports/FR-04-personal-profile/automation/report.md` (§14 main report):
  generation log, review/fix table, AI gap analysis, non-automatable list.

**Exit criteria:** ≥12 cases × 3 browsers green-or-explained; all 3 assertion patterns used;
report.md complete; defects filed; audit rows for every AI artifact.
**Commit (§5 ledger — 3 guaranteed qualifying):** `freeze: FR-04 specs batch A` · `batch B` ·
`batch C`, each **before** its batch is first run. An optional `fix: FR-04 post-run corrections`
may follow, but is **not** counted toward the floor (§5.2). The report.md (3.8) and the copied
HTML report (3.6) go in their own separate, non-qualifying commits (§5.5).
**Stop conditions:** a failing assertion is ambiguous (spec silent) → log an assumption, get a
human decision, do not weaken the assertion to force green. Suspected state pollution → verify
isolation before filing a bug.

---

## Step 4 — Extract the `test-automation-design` skill from FR-04

**Goal:** freeze the proven method into a reusable, repo-agnostic skill (HW04 §7, 10 pts).

**Tasks**
- 4.1 Write methodology notes from what actually worked in Steps 2–3.
- 4.2 Run `generate-skill` on the notes → `.claude/skills/test-automation-design/SKILL.md`.
- 4.3 Validate: run the skill against FR-04's inputs; confirm it reproduces equivalent specs.
  **Do not overwrite the deliverable.**
- 4.4 Coupling smell-test — grep for: `FR-0`, `EShop`, `eshop-sut`, `localhost`, `5173`, `5174`,
  `out/reports`, `Playwright`-specific paths, `23127179`, `HW04`. Zero hits required.
- 4.5 Mirror to `.codex/skills/` per the `sync-agent-config` skill.

**Exit criteria:** reproduces FR-04 equivalently; smell-test 0 hits; format matches
`generate-skill`; Claude/Codex copies byte-identical.
**Commit (§5 ledger — 0 qualifying):** `Step 4: extract test-automation-design skill`. This step
touches `SKILL.md` only and **does not count** toward §12's 8-commit minimum.
**Stop condition:** the skill cannot reproduce FR-04 without embedding HW04 specifics → fix the
notes and regenerate; never hand-patch the generated file.

---

## Step 5 — FR-08 Checkout through the skill (**+ ≥8 new cases**)

**Goal:** first application of the skill — and the step with real design work, since only 4 HW02
cases exist.

**Tasks**
- 5.1 **Design ≥8 new cases to reach ≥12 — derived only from FR-08's own requirements.**

  **Scope guard.** FR-08 in `eshop-sut/README.md` states exactly five requirements. Every counted
  case must trace to one of them:

  | Ref | FR-08 requirement (README) | Existing HW02 coverage |
  |---|---|---|
  | **R1** | Only a **logged-in** user can check out | `TC-08-EP-002`, `TC-08-EP-003` |
  | **R2** | Total is **computed automatically from the cart** and not directly user-editable | **none** |
  | **R3** | The UI displays the **full list of ordered products** | **none** |
  | **R4** | Backend **recomputes** the total; a client-sent `total_amount` is not accepted | `TC-08-001` |
  | **R5** | After a successful checkout, the **cart is cleared** | `TC-08-EP-004` |

  **Out of scope — do not design counted cases for these** (they belong to other features and
  would be graded against the wrong FR):
  - **Coupon / discount code application → FR-09.** FR-09 owns the 5 conditions C1–C5 and the
    discount formula. FR-08 is the checkout mechanism only.
  - **Cart quantity `+/-`, line items, stock, empty-cart illustration → FR-07.**
  - **Order status / state transitions after checkout → FR-10.**
  - **Shipping-address validation rules** are not specified by FR-08. Address may appear in a case
    only as part of checkout **submission / display / persistence** behaviour, never as a
    validation-rule case of its own.

  **Candidate new cases (≥8 required; R2 and R3 have zero existing coverage and take priority):**

  | # | Ref | Case |
  |---|---|---|
  | N1 | R1 | Not-logged-in user navigating directly to the checkout URL is blocked/redirected (UI-level; complements the API-level EP-002/003) |
  | N2 | R1 | Session ends / token cleared while on the checkout page → submission is refused |
  | N3 | R2 | Displayed total equals `Σ(unit price × quantity)` of the cart contents |
  | N4 | R2 | The total is not directly user-editable in the UI (no editable input bound to it) |
  | N5 | R2 | Cart contents differing from a prior visit produce a correspondingly recomputed total (no stale total) |
  | N6 | R3 | Every product in the cart appears on the checkout page with its name, quantity and line amount |
  | N7 | R3 | A multi-product cart displays **all** distinct products — none omitted or truncated |
  | N8 | R4 | Client-forged `total_amount` **higher** than the true total is not accepted (`TC-08-001` covers the lower-value direction) |
  | N9 | R4 | `total_amount` omitted entirely from the request → backend still persists the correct computed total |
  | N10 | R5 | After a successful checkout, returning to the cart shows it empty (UI-level assertion of the cleared state) |

  **Setup vs counted case.** Seeding a cart before checkout necessarily exercises **FR-07**. That
  setup is performed via a **helper/fixture** and is explicitly **non-counting** — it is a
  precondition, not an FR-08 case, and no assertion in it is reported as FR-08 coverage. Same rule
  for any login helper (FR-02). Only assertions on R1–R5 count toward the ≥12.

  Expected values come from `eshop-sut/README.md` FR-08 only.
- 5.2 Freeze + commit the new case designs before automating them.
- 5.3 Apply `test-automation-design` to all ≥12 cases. Audit.
- 5.4 Human review + fixes; commit specs before running.
- 5.5 Run 3 browsers; copy HTML report; file confirmed defects.
- 5.6 Write `out/reports/FR-08-checkout/automation/report.md`, including **how the skill performed
  vs the by-hand pilot** (evidence for §7 and the AI critique).

**Exit criteria:** ≥12 cases × 3 browsers, **each tracing to R1–R5**; R2 and R3 both covered;
report.md complete; skill-vs-hand comparison recorded.
**Commit (§5 ledger — 3 guaranteed qualifying):** `freeze: FR-08 specs batch A` · `batch B` ·
`batch C`, each before its batch is first run. An optional `fix: FR-08 post-run corrections` may
follow but is not counted (§5.2). Report/HTML-report commits stay separate (§5.5).
**Stop conditions:** the skill produces materially worse output than Step 3 → record the gap and
fix the *skill*, not just the output (the skill is the graded artifact). A candidate case cannot
be traced to R1–R5 → it belongs to FR-07/FR-09/FR-10; drop it or demote it to non-counting setup.

---

## Step 6 — FR-15 Product CRUD through the skill

**Goal:** second application; confirms the skill generalizes to an admin UI on a different origin.

**Tasks**
- 6.1 Select ≥12 of the 20 HW02 cases. Note that FR-15's access-control cases are
  `APIRequestContext` per §3.1, and product state is global per §3.2.
- 6.2–6.5 As Step 5 (apply skill → review → freeze → run → report).

**Exit criteria:** ≥12 cases × 3 browsers; report.md complete.
**Commit (§5 ledger — 3 guaranteed qualifying):** `freeze: FR-15 specs batch A` · `batch B` ·
`batch C`, each before its batch is first run. An optional `fix: FR-15 post-run corrections` may
follow but is not counted (§5.2). Report/HTML-report commits stay separate (§5.5).
**Stop condition:** admin-origin (`:5174`) auth/CORS behaves differently than assumed → re-verify
before mass-generating specs.

---

## Step 7 — Globals and submission packaging

**Tasks**
- 7.1 `out/README.md` — self-assessment table + test summary (features, cases automated/executed/
  passed/failed, browser runs, bugs, video link).
- 7.2 `out/ai-critique.md` — 200–300 words, built from the logged corrections in Steps 2–6.
- 7.3 Finalize `[AI-02]` §4 verdict counts and §5 conclusion.
- 7.4 `git log --oneline > out/git_commit_log.txt`; verify the §5 ledger held by running **both**
  §5.5 commands — the **freeze commits alone** must reach ≥8 (planned floor: 10), independent of
  any optional post-run correction commits.
- 7.5 Record the demo video (§8 below).
- 7.6 Mirror `docs/implementation-plan/*` → `out/docs/` (HW02 precedent).
- 7.7 Markdown → PDF for the main reports, AI critique, AI audit (**no `pandoc` on this machine —
  resolve before this step**).
- 7.8 Zip as `23127179_HW04_AI_Automation_<grade>.zip`.

**Exit criteria:** every §14 required item present.
**Commit:** `Step 7: finalize submission artifacts`.

---

## Step 8 — Demo video (HW04 §7 Task 2)

- ≥5 minutes, unlisted YouTube, **Vietnamese narration**.
- Shows one automation script running end to end, the multi-browser run, and the HTML report.
- **Narrates at least one fix made to AI-generated script** (pull from a Step 3/5/6 review log).
- Authorship evidence: face-cam **or** terminal running `whoami` and `hostname`.
- A second video may demonstrate the skill end-to-end (§7).

**Stop condition:** none — but do not defer; this is 15 points and cannot be reconstructed late.

---

## Global stop conditions (override the plan)

- A required authoritative input is missing and cannot be inferred → stop and ask.
- Business logic or user-facing behavior is ambiguous → stop and get a human decision.
- A step would add a new module/architecture layer beyond §4's structure → confirm first.
- A failing assertion would be "fixed" by weakening it → **stop**; run the real-defect gate first.
- The SUT would need modification to make a test pass → stop; the SUT is never modified.

---

## Status

| Step | State |
|---|---|
| 1 Freeze automation architecture | [x] **done 2026-08-09** (`569ac80`) |
| 2 FR-04 vertical smoke | [x] **done 2026-08-09** (freeze `e6cd87f`, output `64bff25`) |
| 3 FR-04 full pilot (≥12) | **in progress** — A done; **B frozen (`5af1749`), awaiting run**; C pending |
| 4 Extract skill | [ ] |
| 5 FR-08 through skill (+8 new cases) | [ ] |
| 6 FR-15 through skill | [ ] |
| 7 Globals + packaging | [ ] |
| 8 Demo video | [ ] |

**Already complete (pre-plan):** repo scaffold, `run.sh`, Playwright project with 3 browser
projects + Run-by metadata, browsers installed, SUT health-checked, feature selection confirmed
(FR-04/08/15), main-report location decided.

**Delivered by Step 1 (`569ac80`):** the six decisions frozen in `automation-architecture.md`;
reporter `title` + metadata + per-test annotation (§3.6 layers 1–3); worker-scoped `api` /
`isolatedUser` fixtures and `utils/api.ts`; `scripts/verify-report-stamp.js`. Isolation proven
3 browsers × 2 runs (6/6, distinct ids, no leak).

**Delivered by Step 2 (freeze `e6cd87f`, output `64bff25`):** `TC-04-BVA-002-UI` automated from
HW02's `TC-04-BVA-002`, data externalized to `data/fr-04-profile.json`, 3 assertion patterns,
`utils/session.ts`. Ran 3/3 browsers → **all failed**; real-defect gate confirmed a genuine
frontend defect (`Profile.jsx:43` regex is the inverse of FR-04 line 65) — filed as `BUG-04-101`
/ GitHub issue [#1](https://github.com/BuhDuy256/automation-testing-hw04/issues/1). No assertion
was weakened. Report stamp verified 5/5.

**Step 3 progress — 3.1 done, Batch A done (5 of 16 cases automated):**

- **3.1 selection (`fb2f23d`):** all 16 HW02 FR-04 cases selected (min 12), each mapped to
  UI / `APIRequestContext`; `page.route()` not needed for FR-04; **none non-automatable**.
- **Batch A (freeze `8053add`, optional R `9e6a8bb`, output `326ff83`):** 4 UI-path boundary
  cases completing the 5-point set. **6 passed / 6 failed** over 12 browser runs, matching the
  pre-run prediction **4/4**. Widened `BUG-04-101` (issue #1, commented — no duplicate) and
  found a **distinct** defect `BUG-04-102` (issue
  [#2](https://github.com/BuhDuy256/automation-testing-hw04/issues/2) — `server.js:118-135` has
  no phone validation, survives any frontend fix). Runs 1–2 carried navigation timeouts that
  the real-defect gate classified **test-side**, fixed by `waitUntil: 'domcontentloaded'` +
  `workers: 3`; runs 3–4 identical, zero timeouts. No assertion was weakened.

**`.spec.ts` ledger: 3 commits total — but only 2 are freezes** (`e6cd87f`, `8053add`).
`9e6a8bb` is an optional R commit and is **not** counted toward the §12 floor (§5.2), which
rests on freeze commits alone.

**Batch B is FROZEN at `5af1749`** (5 API-path cases `TC-04-BVA-006-API` … `-010-API`, plus their
data). Review findings recorded at `c051027` before the freeze. **Not yet run.**

## > NEXT ACTION

**Step 3 — run Batch B.** Do **not** re-freeze it and do **not** restart Step 3 from 3.1.

1. `cd automation && npx playwright test tests/fr-04-profile/phone-boundary-api.spec.ts`
2. Record per-case/per-project results in the FR-04 automation report; compare against the
   **pre-run prediction** (§12): `BVA-007`/`BVA-008` pass, `BVA-006`/`BVA-009`/`BVA-010` fail as
   `BUG-04-102` → **2 pass / 3 fail per project, 6 pass / 9 fail total**.
3. Real-defect gate on every failure. Failures matching `BUG-04-102` update issue
   [#2](https://github.com/BuhDuy256/automation-testing-hw04/issues/2) — **no duplicate**; only a
   distinct root cause gets a new bug.
4. Copy the HTML report to `out/reports/FR-04-personal-profile/html-report/batch-b.html`
   (keep `batch-a.html`); verify with `npm run verify:report` and against each copy.
5. Then Batch C (6 EP cases): freeze first, then run.

**Honesty constraint for the report:** Batch B never requests the `page` fixture, so **no browser
launches**. Those 15 executions are matrix uniformity, **not** browser-coverage evidence — HW04
§6's multi-browser requirement is carried by the UI cases (smoke + Batch A). Do not inflate the
browser-run count with them.

**Carry forward:** use `freshUser` (test-scoped), never the seeded `test@eshop.com`, and never
`isolatedUser` where profile state is asserted. Do **not** relax any assertion because
`BUG-04-102` is already known.

**Carry into Step 3:** `getByLabel` does **not** work anywhere on the profile form —
`Profile.jsx` renders `<label>` as a sibling of `<input>` with no `for`/`id`. Use
`getByPlaceholder` / `getByRole`, and log each as an AI-review finding (§6 graded content).

**Known risk to carry:** FR-08 is 8 cases short of the minimum (§1.4). Do not discover this at
Step 5 — the design work is real and is budgeted inside Step 5.1.
