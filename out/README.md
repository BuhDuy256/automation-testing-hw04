# HW05 Submission README

> **Status:** All three graded tasks are COMPLETE / HUMAN-REVIEWED (see Milestone state below). Four self-assessed grade cells and the resulting total/ZIP filename are marked HUMAN INPUT REQUIRED because they require the student's own quality judgment, not a derivable fact — see the Self-Assessment table.

This README is the submission index and self-assessment summary for HW05.

**Milestone state:** Task 1 = **COMPLETE**. Task 2 = **COMPLETE / HUMAN-REVIEWED**. Task 3 = **COMPLETE / HUMAN-REVIEWED**.

## Student and Submission Information

| Field | Value |
|---|---|
| Student | Nguyen Bao Duy |
| Student ID | 23127179 |
| Class | 23KTPM2 |
| Public GitHub repository | https://github.com/BuhDuy256/automation-testing-hw04/tree/hw05-performance |
| Submission filename | `23127179_HW05_AI_Performance_<HUMAN INPUT REQUIRED>.zip` — the 3-digit grade depends on the Load/Stress/Spike/Agent Skill self-assessed grades below, which are not filled in yet. |

## Self-Assessment

| Criterion | Maximum | Self-assessed grade | Evidence link |
|---|---:|---:|---|
| Load testing | 20 | **HUMAN INPUT REQUIRED** | [`23127179_Load_20260817.js`](23127179_Load_20260817.js), evidence: [`23127179_Load_20260817_evidence/20260817t045341487/`](23127179_Load_20260817_evidence/20260817t045341487/) |
| Stress testing | 20 | **HUMAN INPUT REQUIRED** | [`23127179_Stress_20260817.js`](23127179_Stress_20260817.js), evidence: [`23127179_Stress_20260817_evidence/20260817t115158688/`](23127179_Stress_20260817_evidence/20260817t115158688/) |
| Spike testing | 20 | **HUMAN INPUT REQUIRED** | [`23127179_Spike_20260817.js`](23127179_Spike_20260817.js), evidence: [`23127179_Spike_20260817_evidence/20260817t134816776/`](23127179_Spike_20260817_evidence/20260817t134816776/) |
| AI analysis and misinterpretation hunt | 10 | COMPLETE / HUMAN-REVIEWED | [`work/task2_performance_analysis.md`](../work/task2_performance_analysis.md) |
| Continuous performance-testing proposal | 10 | COMPLETE / HUMAN-REVIEWED | [`Task3_Continuous_Performance_Testing.md`](Task3_Continuous_Performance_Testing.md) |
| Agent Skill | 10 | **HUMAN INPUT REQUIRED** | [`.codex/skills/performance-testing-lifecycle/`](../.codex/skills/performance-testing-lifecycle/), demo video below |
| **Total** | **100** | **HUMAN INPUT REQUIRED** (sum once the four grades above are filled in) | — |

## Test Summary

| Item | Final content to record |
|---|---|
| End-to-end workflow | `Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout` (exactly 9 HTTP requests per successful workflow and exactly one Checkout). |
| Auth-heavy endpoint group | Login, Read Profile, Update Profile (authentication/session and authenticated account operations). |
| Read-heavy endpoint group | Read Categories, Read Products, Read Product Detail (product listing/search and product detail reads). |
| Transactional endpoint group | Add Product to Cart, Checkout (cart mutation and order creation). |
| Scenarios executed | Load `20260817t045341487` (COMPLETE), Stress `20260817t115158688` (COMPLETE), Spike `20260817t134816776` (COMPLETE), Soak/Endurance `20260818t000551547` (COMPLETE) — 12 VUs sustained for 12 minutes, zero HTTP failures, 100% checks, 100% workflow success. See `out/23127179_Soak_20260817_evidence/20260818t000551547/completion-report.md`. |
| Endurance threshold | **HUMAN-REVIEWED / FINAL — Observed sustained throughput floor:** **7.983 req/s** at 12 sustained VUs for 12 minutes; supporting minimum clean workflow rate **0.829 workflows/s**, with zero HTTP failures and 100% workflow correctness. This is not maximum stable RPS, production capacity, or an SLO. See `out/23127179_Soak_20260817_evidence/20260818t000551547/completion-report.md` and `soak-window-summary.md`. |
| Bugs or performance issues | None found in the valid official performance runs; no GitHub Issue was filed. |
| Demo video | Student-provided links are recorded in **Submission Video Links** below; duration, narration, and visible-content compliance remain human submission checks. |

## Task 2 — AI Analysis and Misinterpretation Hunt

Final AI analysis and human-approved corrections are recorded in [`work/task2_performance_analysis.md`](../work/task2_performance_analysis.md). It uses the four official valid runs. The approved regression guards cover zero HTTP failures, 100% checks/workflow success, bounded p95/p99 latency, the 12-VU endurance floor, and ≤5% Soak degradation; these are regression guards, not business SLOs or production-capacity claims. Optimization classifications are binary FEASIBLE/HALLUCINATED, with benchmarking required before implementation. Task 2 is COMPLETE / HUMAN-REVIEWED. No optimization was implemented and no GitHub Issue was created.

Final submission artifact: [`Task2_Performance_Result_Analysis.md`](Task2_Performance_Result_Analysis.md). The detailed working/review source remains [`work/task2_performance_analysis.md`](../work/task2_performance_analysis.md). Task 2 is COMPLETE / HUMAN-REVIEWED.

## Task 3 — Continuous Performance Testing

Final submission artifact: [`Task3_Continuous_Performance_Testing.md`](Task3_Continuous_Performance_Testing.md). Detailed working documentation and the full two-round human-review history remain in [`work/task3_continuous_performance_pipeline.md`](../work/task3_continuous_performance_pipeline.md). Pipeline implementation: [`.github/workflows/performance-regression.yml`](../.github/workflows/performance-regression.yml) and [`out/ci/`](ci/).

The pipeline runs the same frozen 9-step E2E workflow used by Task 1/2 at two cost tiers on GitHub-hosted `ubuntu-latest`: a short 3-VU/~70s **regression** job on every push/PR, and the full, unmodified 12-VU/12-minute official Soak script as a separate **endurance** job on manual dispatch or a weekly schedule. Because the Task 2 numeric guards were established on the student's local Dell hardware, not `ubuntu-latest`, guards are split by hardware-dependence: `http_req_failed==0`/`checks==1`/`workflow_success==1` and the endurance job's early-to-late degradation `<=5%` are hardware-independent and fully gate CI; HTTP p95 `<=25ms`/p99 `<=50ms` are kept as gated but explicitly PROVISIONAL (not re-baselined on this runner); the absolute endurance floor (sustained throughput `>=7.983 req/s`, clean workflow rate `>=0.829 workflows/s`) is reported for visibility only and does not gate CI here — see "Hardware Scope" in the design document. Either job fails CI with a metric/observed/guard/PASS-FAIL table when a gated guard is violated. These are regression guards for a comparable harness/profile, not business SLOs or production-capacity claims. Task 3 is **COMPLETE / HUMAN-REVIEWED**.

## Submission Video Links

- **Performance Testing Execution Video:** https://youtu.be/86qyG0n4Mbs?si=2YBhaUXCnj0kp457
  - Requirement mapping: HW05 Task 1 unlisted performance-testing demo video evidence. The assignment requires at least six minutes total, the test tool and resource monitor in the same frame, and the student's Vietnamese narration; this index records the student-provided URL without inferring those properties from it.
- **Performance Testing Agent Skill Demo:** https://youtu.be/CXb7EEgjFBs?si=WkQDOfhaKJfTDuuU
  - Requirement mapping: HW05 Section 7 demonstration-video evidence for the submitted reusable Performance Testing Lifecycle Skill. This index records the student-provided URL without inferring its contents or duration.

## Submission Contents

- **Main report**: this file, [`README.md`](README.md) (Markdown only — no PDF export, per course policy).
- **Three named test plans** (k6, per HW05's "JMeter (default) or k6 (bonus)" allowance): [`23127179_Load_20260817.js`](23127179_Load_20260817.js), [`23127179_Stress_20260817.js`](23127179_Stress_20260817.js), [`23127179_Spike_20260817.js`](23127179_Spike_20260817.js).
- **Raw results and three distinct report/listener equivalents** (k6 has no `.jtl` format; each scenario's raw NDJSON plus its designated distinct report):
  - Load: [`23127179_Load_20260817_evidence/20260817t045341487/raw-results.ndjson`](23127179_Load_20260817_evidence/20260817t045341487/raw-results.ndjson) + native k6 Web Dashboard HTML export ([`html-report/`](23127179_Load_20260817_evidence/20260817t045341487/html-report/)).
  - Stress: [`23127179_Stress_20260817_evidence/20260817t115158688/raw-results.ndjson`](23127179_Stress_20260817_evidence/20260817t115158688/raw-results.ndjson) + custom Markdown Stress Stage Summary ([`stress-stage-summary.md`](23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md)).
  - Spike: [`23127179_Spike_20260817_evidence/20260817t134816776/raw-results.ndjson`](23127179_Spike_20260817_evidence/20260817t134816776/raw-results.ndjson) + native k6 CSV metrics output ([`spike-metrics.csv`](23127179_Spike_20260817_evidence/20260817t134816776/spike-metrics.csv)).
  - Soak/Endurance: [`23127179_Soak_20260817_evidence/20260818t000551547/raw-results.ndjson`](23127179_Soak_20260817_evidence/20260818t000551547/raw-results.ndjson) + factual window summary ([`soak-window-summary.md`](23127179_Soak_20260817_evidence/20260818t000551547/soak-window-summary.md)).
- **CSV workflow data**: [`user_workflow_data.csv`](user_workflow_data.csv).
- **Resource-monitor and hardware evidence**: per-scenario `process-resource(s).csv` / `system-resource(s).csv` and `hardware_observation.json` inside each evidence folder above; hardware screenshot: [`23127179_Load_20260817_evidence/20260817t045341487/screenshots/hardware-dxdiag.png`](23127179_Load_20260817_evidence/20260817t045341487/screenshots/hardware-dxdiag.png).
- **Task 2 Performance Result Analysis**: [`Task2_Performance_Result_Analysis.md`](Task2_Performance_Result_Analysis.md).
- **Task 3 Continuous Performance Testing**: [`Task3_Continuous_Performance_Testing.md`](Task3_Continuous_Performance_Testing.md) (final); detailed working documentation in [`work/task3_continuous_performance_pipeline.md`](../work/task3_continuous_performance_pipeline.md); implementation in [`.github/workflows/performance-regression.yml`](../.github/workflows/performance-regression.yml) and [`out/ci/`](ci/).
- **AI Critique**: [`ai-critique.md`](ai-critique.md) (Markdown only — no PDF export, per course policy).
- **AI Audit Report**: [`[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md`](%5BAI-02%5D%20-%20FIT%40HCMUS%20-%20AI%20Audit%20Report_En.docx.md) (Markdown only — no PDF export, per course policy).
- **Performance Testing Lifecycle Skill** and its demonstration evidence: [`.codex/skills/performance-testing-lifecycle/`](../.codex/skills/performance-testing-lifecycle/) and **Performance Testing Agent Skill Demo** above.
- **Git commit log**: [`git-commit-log.txt`](git-commit-log.txt).

Final submission files belong in `out/`; intermediate drafts and exploratory artifacts belong in [`work/`](../work/). `eshop-sut/backend/database.sqlite` is runtime state and is not part of the submission.
