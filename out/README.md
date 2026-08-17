# HW05 Submission README

> **Status:** TODO - complete this file after the performance runs and final review.

This README is the submission index and self-assessment summary for HW05.

## Student and Submission Information

| Field | Value |
|---|---|
| Student | TODO |
| Student ID | 23127179 |
| Class | 23KTPM2 |
| Public GitHub repository | TODO - add the public repository URL |
| Submission filename | TODO - use `23127179_HW05_AI_Performance_<grade>.zip` |

## Self-Assessment

| Criterion | Maximum | Self-assessed grade | Evidence link |
|---|---:|---:|---|
| Load testing | 20 | TODO | TODO |
| Stress testing | 20 | TODO | TODO |
| Spike testing | 20 | TODO | TODO |
| AI analysis and misinterpretation hunt | 10 | AWAITING HUMAN REVIEW | [`work/task2_performance_analysis.md`](../work/task2_performance_analysis.md) |
| Continuous performance-testing proposal | 10 | TODO | TODO |
| Agent Skill | 10 | TODO | TODO |
| **Total** | **100** | **TODO** | — |

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

Initial AI analysis and human-approved corrections are recorded in [`work/task2_performance_analysis.md`](../work/task2_performance_analysis.md). It uses only the four valid official runs and excludes historical invalid Soak `20260817t225458219` from performance conclusions. The approved regression guards cover zero HTTP failures, 100% checks/workflow success, bounded p95/p99 latency, the 12-VU endurance floor, and ≤5% Soak degradation; these are regression guards, not business SLOs or production-capacity claims. Optimization classifications are binary FEASIBLE/HALLUCINATED, with benchmarking required before implementation. Task 2 remains AWAITING FINAL HUMAN ACCEPTANCE. No optimization was implemented and no GitHub Issue was created.

## Submission Video Links

- **Performance Testing Execution Video:** https://youtu.be/86qyG0n4Mbs?si=2YBhaUXCnj0kp457
  - Requirement mapping: HW05 Task 1 unlisted performance-testing demo video evidence. The assignment requires at least six minutes total, the test tool and resource monitor in the same frame, and the student's Vietnamese narration; this index records the student-provided URL without inferring those properties from it.
- **Performance Testing Agent Skill Demo:** https://youtu.be/CXb7EEgjFBs?si=WkQDOfhaKJfTDuuU
  - Requirement mapping: HW05 Section 7 demonstration-video evidence for the submitted reusable Performance Testing Lifecycle Skill. This index records the student-provided URL without inferring its contents or duration.

## Submission Contents

- Main report in Markdown and PDF: TODO - add paths.
- Three named test plans: TODO - add paths.
- Three raw `.jtl` logs and three HTML report folders: TODO - add paths.
- CSV workflow data: TODO - add path.
- Resource-monitor and hardware evidence: TODO - add paths.
- AI Critique in Markdown and PDF: TODO - add paths.
- AI Audit Report in Markdown and PDF: TODO - add paths.
- Continuous performance-testing proposal and flowchart: TODO - add paths.
- Performance Testing Lifecycle Skill and its demonstration evidence: [`.codex/skills/performance-testing-lifecycle/`](../.codex/skills/performance-testing-lifecycle/) and **Performance Testing Agent Skill Demo** above.
- Git commit log: [`git-commit-log.txt`](git-commit-log.txt).

Final submission files belong in `out/`; intermediate drafts and exploratory artifacts belong in [`work/`](../work/).
