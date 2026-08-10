# HW04 — Automation Testing on EShop (submission README)

> **Status: all three features complete.** FR-04 (16 cases, 3 defects), FR-08 (15 cases,
> 4 defects) and FR-15 (18 cases, 5 defects) are each automated and executed per batch **and**
> combined. **Outstanding: the Task 2 demo video** — see §7. The self-assessment below is a
> *proposed* mark; the total is not final until the video exists.

## 1. Student information

| Field | Value |
|---|---|
| **Name** | Nguyen Bao Duy |
| **Student ID** | 23127179 |
| **Class** | 23KTPM2 |
| **GitHub repo** | [BuhDuy256/automation-testing-hw04](https://github.com/BuhDuy256/automation-testing-hw04) |
| **Tooling** | Playwright 1.62.1 (TypeScript) · Chromium / Firefox / WebKit · Playwright HTML reporter |

## 2. Self-assessment table

_Per HW04 §15. **Proposed** self-assessment. Task 2 is unscored because the demo video does not exist yet (§7), so the total is incomplete by design rather than by omission._

| No. | Criteria | Max | Proposed | Basis |
|---|---|---|---|---|
| 1 | Task 1 — Feature A (**FR-04** Personal Profile Management) | 25 | **25** | 16 cases (≥12), 48 executions, 18 browser runs, 3 defects filed with evidence, 4 freeze commits |
| 1 | Task 1 — Feature B (**FR-08** Checkout) | 25 | **25** | 15 cases (4 HW02 + **11 designed**), 45 executions, 24 browser runs, 4 defects, 3 freezes |
| 1 | Task 1 — Feature C (**FR-15** Product Management CRUD) | 25 | **25** | 18 cases, 54 executions, 6 browser runs, 5 defects, 3 freezes |
| 2 | Task 2 — Demo video | 15 | **—** | **Not recorded.** See §7 |
| 3 | Agent Skill | 10 | **10** | `agent-skill/SKILL.md` — 7 phases, repo- and framework-agnostic, extracted from FR-04 and then applied to FR-08 and FR-15 |
| | **Total** | **100** | **85 + video** | The mark cannot be completed until Task 2 exists |

## 3. Test summary report

| Feature | Cases automated | Executions | Passed | Failed | Browser runs* | Confirmed defects |
|---|---|---|---|---|---|---|
| **FR-04** Personal Profile Management | **16** | **48** | **21** | **27** | **18** | **3** |
| **FR-08** Checkout | **15** | **45** | **21** | **24** | **24** | **4** |
| **FR-15** Product Management CRUD | **18** | **54** | **18** | **36** | **6** | **5** |
| **Total** | **49** | **147** | **60** | **87** | **48** | **12** |

\* **Browser runs counted honestly.** Only UI-path cases launch a browser.
**FR-04**: 6 of its 16 cases are UI-path → 6 × 3 = **18** genuine browser executions; the other 10
are API-path (`APIRequestContext`) and never request Playwright's `page` fixture, so those 30
executions are matrix uniformity and are **excluded**.
**FR-08**: counted per batch. **A** — 6 UI cases → **18 of 18** count, nothing deducted, because R2
and R3 are rules about the interface and cannot be tested any other way. **B** — 6 API cases, never
requesting `page` → **0 of 18**. **C** — mixed, counted case by case → **6 of 9** (`N07-UI` and
`N11-UI` drive a browser; `EP-004` does not). Runtime corroborates: Batch B ran 18 executions in
7.5 s against Batch A's 1.1–2.9 min. FR-08 therefore contributes **24**, not 45.
**FR-15**: Batches A and B are entirely API-path → **0 of 36**. Batch C is mixed → **6 of 18** (only
`EP-011-UI` and `N02-UI` drive a browser). FR-15 therefore contributes **6**, not 54 — counting every
execution would overstate it ninefold.
HW04 §6's "≥9 browser runs" bar is cleared several times over.

**All 87 failures are confirmed product defects, not test defects.** Each was put through a
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
| `BUG-15-104` | **No access control on any product write endpoint** — anyone can create, modify or delete any product | **Critical** | [#11](https://github.com/BuhDuy256/automation-testing-hw04/issues/11) |
| `BUG-15-105` | Editing one product in the admin panel overwrites every listed product's displayed name | **Medium** | [#12](https://github.com/BuhDuy256/automation-testing-hw04/issues/12) |

Full write-ups with root cause, exploitability and suggested fixes:
`reports/FR-04-personal-profile/bug-reports/report.md`,
`reports/FR-08-checkout/bug-reports/report.md` and
`reports/FR-15-product-crud/bug-reports/report.md`.

## 5. Test cases not automated

**None for FR-04** — all 16 HW02 cases were automated. See
`reports/FR-04-personal-profile/automation/report.md` §9 for the case-by-case mechanism mapping
and the one HW02 gap-analysis item deliberately logged as future work rather than silently added.

**None for FR-15** — all 18 selected cases (16 converted from HW02 + **2 designed in Step 6.1** to
close a real hole: HW02 had no positive delete case at all, and 19 of its 20 cases were API-path).
Four HW02 cases were deliberately **not selected**; the reasons are in
`reports/FR-15-product-crud/automation/report.md` §2.1, and two of them are **selection tradeoffs**
rather than redundancy — legitimate boundaries that can be reinstated.

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
| FR-15 HTML reports (combined + per batch) | `reports/FR-15-product-crud/html-report/` (see its `README.md`) |
| **Agent Skill** (HW04 §7) | `agent-skill/SKILL.md` — provenance + validation trace in `agent-skill/README.md` |
| AI Audit Report | `ai-declaration/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md` |
| AI Critique (§10, 262 words) | `ai-critique.md` |
| Git commit log | `git_commit_log.txt` — 73 commits. **Regenerate immediately before zipping**: the file cannot contain the commit that adds it, so it is always one behind by construction |
| Automation project | `../automation/` |
| Implementation plan + architecture | `docs/implementation-plan/` (mirrored from `../docs/`) |

## 7. Demo video — **outstanding**

**Not yet recorded.** HW04 Task 2 requires a video (unlisted YouTube link) that walks through the
automation end to end, narrates at least one fix made to AI-generated output, and evidences
authorship with either a face-cam or a terminal running `whoami` and `hostname`. HW04 §7 additionally
asks that the Agent Skill be demonstrated on a complete feature.

**No link is recorded here because none exists.** The proposed self-assessment in §2 therefore stops
at 85 of 100, and the submission archive should not be built until the video is made and its link
added to this section.

Material for the narration is already written down: `reports/FR-15-product-crud/automation/report.md`
§11 documents a **false pass** — a strict-equality assertion that could not see a value the SUT
returned as a string — and `reports/FR-08-checkout/automation/report.md` §10.3 documents four harness
timeouts that would have become three fabricated bug reports.

---

## 8. Packaging note — PDF export

Every deliverable in this folder is **Markdown**, and all of it is complete.

**No PDF has been generated, and none is claimed.** This machine has no Markdown-to-PDF converter
available — `pandoc`, `wkhtmltopdf`, `libreoffice`/`soffice` and `md-to-pdf` are all absent, and
nothing was installed to change that. If the Moodle submission requires PDF, the conversion must be
done manually before upload; the Markdown sources here are the authoritative versions.

The Playwright HTML reports are **not** affected — they are already self-contained `.html` files and
open directly in a browser.
