# HW04 — Automation Testing on EShop (submission README)

> **Status: in progress.** **FR-04 complete** (16 cases automated and executed, 3 defects).
> **FR-08 complete** (15 cases, executed per batch and combined, 4 defects). **FR-15** has its case
> design complete (18 cases), with **Batches A and B executed** (12 cases, 3 defects) and Batch C
> pending. The self-assessment table and totals below are provisional and will be finalised before
> submission.

## 1. Student information

| Field | Value |
|---|---|
| **Name** | Nguyen Bao Duy |
| **Student ID** | 23127179 |
| **Class** | 23KTPM2 |
| **GitHub repo** | [BuhDuy256/automation-testing-hw04](https://github.com/BuhDuy256/automation-testing-hw04) |
| **Tooling** | Playwright 1.62.1 (TypeScript) · Chromium / Firefox / WebKit · Playwright HTML reporter |

## 2. Self-assessment table

_Per HW04 §15. Provisional — completed rows only._

| No. | Criteria | Grade | Self-assessed |
|---|---|---|---|
| 1 | Task 1 — Feature A (**FR-04** Personal Profile Management) | 25 | _pending final review_ |
| 1 | Task 1 — Feature B (**FR-08** Checkout) | 25 | _complete — 15 cases, combined run done_ |
| 1 | Task 1 — Feature C (**FR-15** Product Management CRUD) | 25 | _Batches A+B executed (12/18) — Batch C pending_ |
| 2 | Task 2 — Demo video | 15 | _not started_ |
| 3 | Agent Skill | 10 | _extracted — `agent-skill/SKILL.md`, pending demo video_ |
| | **Total** | **100** | — |

## 3. Test summary report

| Feature | Cases automated | Executions | Passed | Failed | Browser runs* | Confirmed defects |
|---|---|---|---|---|---|---|
| **FR-04** Personal Profile Management | **16** | **48** | **21** | **27** | **18** | **3** |
| **FR-08** Checkout | **15** | **45** | **21** | **24** | **24** | **4** |
| FR-15 Product Management CRUD _(Batches A+B)_ | **12** of 18 | **36** | **15** | **21** | **0** | **3** |
| **Total so far** | **43** | **129** | **57** | **72** | **42** | **10** |

\* **Browser runs counted honestly.** Only UI-path cases launch a browser.
**FR-04**: 6 of its 16 cases are UI-path → 6 × 3 = **18** genuine browser executions; the other 10
are API-path (`APIRequestContext`) and never request Playwright's `page` fixture, so those 30
executions are matrix uniformity and are **excluded**.
**FR-08**: counted per batch. **A** — 6 UI cases → **18 of 18** count, nothing deducted, because R2
and R3 are rules about the interface and cannot be tested any other way. **B** — 6 API cases, never
requesting `page` → **0 of 18**. **C** — mixed, counted case by case → **6 of 9** (`N07-UI` and
`N11-UI` drive a browser; `EP-004` does not). Runtime corroborates: Batch B ran 18 executions in
7.5 s against Batch A's 1.1–2.9 min. FR-08 therefore contributes **24**, not 45.
**FR-15 Batches A and B**: all 12 cases are API-path → **0 of 36** count; no browser is launched by
either. FR-15's browser coverage will come entirely from Batch C's two UI cases.
HW04 §6's "≥9 browser runs" bar is cleared several times over.

**All 72 failures are confirmed product defects, not test defects.** Each was put through a
real-defect gate, and no assertion was ever weakened to make a test pass. Every defect reproduces
identically on all 3 projects. Harness failures did occur — 4 timeouts in FR-08 Batch A's first run
— and were diagnosed as test-side and fixed without touching any expected value; had they been taken
at face value they would have become three fabricated bug reports.

## 4. Defects found

| ID | Title | Severity | Issue |
|---|---|---|---|
| `BUG-04-101` | Profile form rejects every spec-valid phone number, and accepts a spec-invalid one — the client-side regex is the inverse of FR-04 line 65 | **High** | [#1](https://github.com/BuhDuy256/automation-testing-hw04/issues/1) |
| `BUG-04-102` | `PUT /api/users/me` performs no input validation — spec-invalid `phone`, and an empty `name`, are persisted | **High** | [#2](https://github.com/BuhDuy256/automation-testing-hw04/issues/2) |
| `BUG-04-103` | **Privilege escalation** — a user can set their own `role`, and re-login mints a genuine admin JWT | **Critical** | [#3](https://github.com/BuhDuy256/automation-testing-hw04/issues/3) |
| `BUG-08-101` | Checkout renders the order total as a user-editable field, so any customer can change what they are charged | **High** | [#4](https://github.com/BuhDuy256/automation-testing-hw04/issues/4) |
| `BUG-08-102` | `POST /api/checkout` stores the client-sent `total_amount` verbatim and never recomputes it | **Critical** | [#5](https://github.com/BuhDuy256/automation-testing-hw04/issues/5) |
| `BUG-08-103` | The **server** cart is not cleared after a successful checkout | **Medium** | [#6](https://github.com/BuhDuy256/automation-testing-hw04/issues/6) |
| `BUG-08-104` | The **client** cart is not cleared — `clearCart` is wired up but never called | **Medium** | [#7](https://github.com/BuhDuy256/automation-testing-hw04/issues/7) |
| `BUG-15-101` | `POST /api/products` performs no input validation — empty, absent, over-length names and non-positive prices are all persisted | **High** | [#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8) |
| `BUG-15-102` | `GET /api/products/:id` returns `price` as a string for even ids, contradicting `GET /api/products` | **Medium** | [#9](https://github.com/BuhDuy256/automation-testing-hw04/issues/9) |
| `BUG-15-103` | `POST /api/products` never checks `category_id` against existing categories | **Medium** | [#10](https://github.com/BuhDuy256/automation-testing-hw04/issues/10) |

Full write-ups with root cause, exploitability and suggested fixes:
`reports/FR-04-personal-profile/bug-reports/report.md`,
`reports/FR-08-checkout/bug-reports/report.md` and
`reports/FR-15-product-crud/bug-reports/report.md`.

## 5. Test cases not automated

**None for FR-04** — all 16 HW02 cases were automated. See
`reports/FR-04-personal-profile/automation/report.md` §9 for the case-by-case mechanism mapping
and the one HW02 gap-analysis item deliberately logged as future work rather than silently added.

**None for FR-08** — all 15 selected cases (4 converted from HW02 + **11 designed in Step 5.1**)
were automated *and* executed. Request interception proved unnecessary for this feature, so no case
fell outside the available mechanisms; see `reports/FR-08-checkout/automation/report.md` §4.3.

Two FR-08 cases carry a **weaker oracle**, which is a separate matter from being unautomated and is
recorded so the two are not conflated:

| Case | Oracle | Confidence |
|---|---|---|
| `TC-08-N05-UI` | **A-08-1** — R3's *"đầy đủ"* is read as requiring the quantity and line amount to be visible | **MED** |
| `TC-08-N06-UI` | **A-08-2** — R3 applied to an empty cart means no line items are displayed | **MED** |

Both are **inferences** from README line 106, not quoted requirements. **Both passed**, so no defect
rests on assumption-grade evidence — all four FR-08 defects cite a spec line directly. If a reviewer
rejects either inference, the correct response is to **withdraw that case** rather than count it,
which would reduce R3 coverage from 3 cases to 2. They are listed here as an evidence-strength
caveat, **not** as coverage gaps.

## 6. Deliverable index

_Paths relative to this `out/` folder._

| Item | Path |
|---|---|
| FR-04 main report (generation log, AI review, gap analysis, results) | `reports/FR-04-personal-profile/automation/report.md` |
| FR-04 bug reports | `reports/FR-04-personal-profile/bug-reports/report.md` |
| FR-04 HTML reports (combined + per batch) | `reports/FR-04-personal-profile/html-report/` (see its `README.md`) |
| FR-08 main report (design, review, prediction, results) | `reports/FR-08-checkout/automation/report.md` |
| FR-08 bug reports | `reports/FR-08-checkout/bug-reports/report.md` |
| FR-08 HTML reports (combined + per batch) | `reports/FR-08-checkout/html-report/` (see its `README.md`) |
| FR-15 main report (design, review, prediction, results) | `reports/FR-15-product-crud/automation/report.md` |
| FR-15 bug reports | `reports/FR-15-product-crud/bug-reports/report.md` |
| FR-15 HTML reports (per batch: A, B) | `reports/FR-15-product-crud/html-report/` (see its `README.md`) |
| **Agent Skill** (HW04 §7) | `agent-skill/SKILL.md` — provenance + validation trace in `agent-skill/README.md` |
| AI Audit Report | `ai-declaration/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md` |
| AI Critique | `ai-critique.md` _(pending)_ |
| Git commit log | `git_commit_log.txt` _(generated before submission)_ |
| Automation project | `../automation/` |
| Implementation plan + architecture | `../docs/implementation-plan/` |

## 7. Demo video

_Not yet recorded (HW04 Task 2)._
