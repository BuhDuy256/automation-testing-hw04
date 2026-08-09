# implementation_plan.md — HW04 Automation Testing

> **Purpose:** Executable plan and resume point. When resuming, read **Status → Next Action**,
> do that step, then update Status.
> **Lineage:** this plan reuses the HW02 method (`references/hw2/eshop-sut-hw2-testing/out/docs/`)
> — *example-first*, *deliverable-first*, *freeze-before-execute*, *audit-as-you-go*. §1 below
> records exactly what carries over, what is superseded, and what is new.

---

## How to use this file

- Do steps in order. Do not start a step until the previous step's **Exit Criteria** all pass.
- Every step ends with a **Git commit**. Steps 2–6 touch `.spec.ts` files and therefore count
  toward HW04 §12's 8-commit minimum (the 4-day span requirement was removed by the instructor
  on 2026-08-09).
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
4. **HTML report evidence** — must visibly carry `Run by: 23127179` + ISO timestamp (§6, §11).
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

These five are decided once, in Step 1, and then not re-opened.

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

---

## 4. Folder structure (create minimally, per step — no speculative templates)

```
docs/implementation-plan/
  implementation_plan.md          # this file
  automation-architecture.md      # Step 1 output — the five frozen decisions

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

## Step 1 — Freeze the automation architecture

**Goal:** decide §3's five questions once, with evidence, before any test exists.

**Tasks**
- 1.1 Write `docs/implementation-plan/automation-architecture.md` recording §3.1–3.5 as frozen
  decisions with rationale.
- 1.2 Implement the worker-scoped isolated-user fixture in `automation/fixtures/base.ts`
  (register + login via API, expose `user` + `token`).
- 1.3 Implement thin login/navigation helpers in `automation/utils/` — helpers, **not** a full
  Page Object Model (simplicity over abstraction until a concrete need appears).
- 1.4 Prove isolation: run one trivial test that mutates its own user's profile, on all 3
  browsers in parallel, and confirm no cross-worker interference.

**Exit criteria:** architecture doc written; fixture yields a distinct user per worker; the
parallel mutation test passes 3/3 with no flake across 2 consecutive runs.
**Risks eliminated:** phantom cross-worker failures; dependence on seeded state; ad-hoc selector drift.
**Commit:** `Step 1: freeze automation architecture + isolated-user fixture`.
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
- 2.5 Run on all 3 browsers; confirm the HTML report renders and carries `Run by: 23127179` + ISO
  timestamp.

**Exit criteria:** 3/3 browser runs; data is external; ≥1 assertion pattern demonstrated; HTML
report shows the Run-by stamp; audit rows appended; git shows spec committed *before* results.
**Risks eliminated:** "the config works but a real test doesn't"; report-evidence uncertainty;
data-externalization mechanics.
**Commit:** `Step 2: FR-04 vertical smoke (1 case, 3 browsers)`.
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
**Commit:** per batch — `Step 3.x FR-04 <batch>`.
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
**Commit:** `Step 4: extract test-automation-design skill`.
**Stop condition:** the skill cannot reproduce FR-04 without embedding HW04 specifics → fix the
notes and regenerate; never hand-patch the generated file.

---

## Step 5 — FR-08 Checkout through the skill (**+ ≥8 new cases**)

**Goal:** first application of the skill — and the step with real design work, since only 4 HW02
cases exist.

**Tasks**
- 5.1 **Design ≥8 new cases** to reach ≥12. Candidate areas from the FR-08 spec: empty-cart
  checkout, missing/invalid shipping address, quantity/stock edges, coupon interaction, order
  status after checkout, auth-state transitions. Expected values from `eshop-sut/README.md` only.
- 5.2 Freeze + commit the new case designs before automating them.
- 5.3 Apply `test-automation-design` to all ≥12 cases. Audit.
- 5.4 Human review + fixes; commit specs before running.
- 5.5 Run 3 browsers; copy HTML report; file confirmed defects.
- 5.6 Write `out/reports/FR-08-checkout/automation/report.md`, including **how the skill performed
  vs the by-hand pilot** (evidence for §7 and the AI critique).

**Exit criteria:** ≥12 cases × 3 browsers; report.md complete; skill-vs-hand comparison recorded.
**Commit:** per batch.
**Stop condition:** the skill produces materially worse output than Step 3 → record the gap and
fix the *skill*, not just the output (the skill is the graded artifact).

---

## Step 6 — FR-15 Product CRUD through the skill

**Goal:** second application; confirms the skill generalizes to an admin UI on a different origin.

**Tasks**
- 6.1 Select ≥12 of the 20 HW02 cases. Note that FR-15's access-control cases are
  `APIRequestContext` per §3.1, and product state is global per §3.2.
- 6.2–6.5 As Step 5 (apply skill → review → freeze → run → report).

**Exit criteria:** ≥12 cases × 3 browsers; report.md complete.
**Commit:** per batch.
**Stop condition:** admin-origin (`:5174`) auth/CORS behaves differently than assumed → re-verify
before mass-generating specs.

---

## Step 7 — Globals and submission packaging

**Tasks**
- 7.1 `out/README.md` — self-assessment table + test summary (features, cases automated/executed/
  passed/failed, browser runs, bugs, video link).
- 7.2 `out/ai-critique.md` — 200–300 words, built from the logged corrections in Steps 2–6.
- 7.3 Finalize `[AI-02]` §4 verdict counts and §5 conclusion.
- 7.4 `git log --oneline > out/git_commit_log.txt`; verify ≥8 commits touching `.spec.ts`.
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
| 1 Freeze automation architecture | [ ] |
| 2 FR-04 vertical smoke | [ ] |
| 3 FR-04 full pilot (≥12) | [ ] |
| 4 Extract skill | [ ] |
| 5 FR-08 through skill (+8 new cases) | [ ] |
| 6 FR-15 through skill | [ ] |
| 7 Globals + packaging | [ ] |
| 8 Demo video | [ ] |

**Already complete (pre-plan):** repo scaffold, `run.sh`, Playwright project with 3 browser
projects + Run-by metadata (verified in the JSON reporter), browsers installed, SUT health-checked,
feature selection confirmed (FR-04/08/15), main-report location decided.

## > NEXT ACTION

**Step 1** — write `docs/implementation-plan/automation-architecture.md` freezing §3.1–3.5, then
implement the worker-scoped isolated-user fixture and prove isolation across 3 parallel browsers.

**Known risk to carry:** FR-08 is 8 cases short of the minimum (§1.4). Do not discover this at
Step 5 — the design work is real and is budgeted inside Step 5.1.
