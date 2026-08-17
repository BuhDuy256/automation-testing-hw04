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
| AI analysis and misinterpretation hunt | 10 | TODO | TODO |
| Continuous performance-testing proposal | 10 | TODO | TODO |
| Agent Skill | 10 | TODO | TODO |
| **Total** | **100** | **TODO** | — |

## Test Summary

| Item | Final content to record |
|---|---|
| End-to-end workflow | TODO - describe the single workflow shared by Load, Stress, and Spike |
| Auth-heavy endpoint group | TODO |
| Read-heavy endpoint group | TODO |
| Transactional endpoint group | TODO |
| Scenarios executed | Load `20260817t045341487` (COMPLETE), Stress `20260817t115158688` (COMPLETE), Spike `20260817t134816776` (COMPLETE), Soak/Endurance — **official valid Soak Run ID `20260818t000551547`** (COMPLETE; technical validity VALID, k6 exit code 0, 120-second recovery completed). A historical invocation, Run ID `20260817t225458219`, is preserved separately as harness-failure/audit history only and is **not** an official successful Soak result — see `out/23127179_Soak_20260817_evidence/20260818t000551547/completion-report.md`. |
| Endurance threshold | Directly measured facts only (Task 2 will interpret them as a threshold/capacity claim): minimum observed steady-window request rate **7.983333 req/s**, minimum observed steady-window clean-workflow rate **0.829167 workflows/s**, zero HTTP/check/workflow failures across all three steady windows, early-to-late change ~-0.47% req/s / ~-0.98% workflows/s. Backend memory direction is factually `mixed_or_requires_human_review`, not diagnosed as a leak. See `out/23127179_Soak_20260817_evidence/20260818t000551547/soak-window-summary.md`. |
| Bugs or performance issues | TODO - state the count and link GitHub Issues, or state none found |
| Demo video | Student-provided links are recorded in **Submission Video Links** below; duration, narration, and visible-content compliance remain human submission checks. |

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
