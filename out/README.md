# HW04 — Automation Testing on EShop (submission README)

> **Status: in progress.** FR-04 is complete; FR-08 and FR-15 are not started. The
> self-assessment table and totals below are provisional and will be finalised before submission.

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
| 1 | Task 1 — Feature B (**FR-08** Checkout) | 25 | _not started_ |
| 1 | Task 1 — Feature C (**FR-15** Product Management CRUD) | 25 | _not started_ |
| 2 | Task 2 — Demo video | 15 | _not started_ |
| 3 | Agent Skill | 10 | _extracted — `agent-skill/SKILL.md`, pending demo video_ |
| | **Total** | **100** | — |

## 3. Test summary report

| Feature | Cases automated | Executions | Passed | Failed | Browser runs* | Confirmed defects |
|---|---|---|---|---|---|---|
| **FR-04** Personal Profile Management | **16** | **48** | **21** | **27** | **18** | **3** |
| FR-08 Checkout | — | — | — | — | — | — |
| FR-15 Product Management CRUD | — | — | — | — | — | — |
| **Total so far** | **16** | **48** | **21** | **27** | **18** | **3** |

\* **Browser runs counted honestly.** Only UI-path cases launch a browser. FR-04 has 6 UI cases
× 3 browsers = **18 genuine browser executions**. Its other 10 cases are API-path
(`APIRequestContext`) and never request Playwright's `page` fixture; those 30 executions are
matrix uniformity and are **excluded** from this column. HW04 §6's "≥9 browser runs" bar is
cleared by FR-04 alone.

**Every one of the 27 failures is a confirmed product defect, not a test defect** — each was put
through a real-defect gate, and no assertion was ever weakened to make a test pass. The three
defects reproduce identically on all 3 projects.

## 4. Defects found

| ID | Title | Severity | Issue |
|---|---|---|---|
| `BUG-04-101` | Profile form rejects every spec-valid phone number, and accepts a spec-invalid one — the client-side regex is the inverse of FR-04 line 65 | **High** | [#1](https://github.com/BuhDuy256/automation-testing-hw04/issues/1) |
| `BUG-04-102` | `PUT /api/users/me` performs no input validation — spec-invalid `phone`, and an empty `name`, are persisted | **High** | [#2](https://github.com/BuhDuy256/automation-testing-hw04/issues/2) |
| `BUG-04-103` | **Privilege escalation** — a user can set their own `role`, and re-login mints a genuine admin JWT | **Critical** | [#3](https://github.com/BuhDuy256/automation-testing-hw04/issues/3) |

Full write-ups with root cause, exploitability and suggested fixes:
`reports/FR-04-personal-profile/bug-reports/report.md`.

## 5. Test cases not automated

**None for FR-04** — all 16 HW02 cases were automated. See
`reports/FR-04-personal-profile/automation/report.md` §9 for the case-by-case mechanism mapping
and the one HW02 gap-analysis item deliberately logged as future work rather than silently added.

## 6. Deliverable index

_Paths relative to this `out/` folder._

| Item | Path |
|---|---|
| FR-04 main report (generation log, AI review, gap analysis, results) | `reports/FR-04-personal-profile/automation/report.md` |
| FR-04 bug reports | `reports/FR-04-personal-profile/bug-reports/report.md` |
| FR-04 HTML reports (combined + per batch) | `reports/FR-04-personal-profile/html-report/` (see its `README.md`) |
| **Agent Skill** (HW04 §7) | `agent-skill/SKILL.md` — provenance + validation trace in `agent-skill/README.md` |
| AI Audit Report | `ai-declaration/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md` |
| AI Critique | `ai-critique.md` _(pending)_ |
| Git commit log | `git_commit_log.txt` _(generated before submission)_ |
| Automation project | `../automation/` |
| Implementation plan + architecture | `../docs/implementation-plan/` |

## 7. Demo video

_Not yet recorded (HW04 Task 2)._
