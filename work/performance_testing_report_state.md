# HW05 Designated Report State

This registry enforces the requirement that Load, Stress, and Spike use three distinct designated k6-equivalent report/listener outputs.

| Scenario | Designated report type | Status | Evidence |
|---|---|---|---|
| Load | Native k6 Web Dashboard HTML export | USED | `out/23127179_Load_20260817_evidence/20260817t045341487/html-report/index.html` |
| Stress | Custom k6 end-of-test Markdown Stress Stage Summary | USED | `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md` |
| Spike | Native k6 CSV metrics output | USED | `out/23127179_Spike_20260817_evidence/20260817t134816776/spike-metrics.csv` |

Raw NDJSON, summary JSON, resource CSV files, and screenshots are common execution evidence and do not count as the distinct designated report type.

## Additional Endurance Evidence Milestone

| Milestone | Evidence strategy | Status | Note |
|---|---|---|---|
| Soak / Endurance | Raw k6 NDJSON, summary JSON, resource CSV files, and factual Markdown window summary | COMPLETE — measured official invocation | Official Soak Run ID `20260818t000551547`; technical validity VALID; k6 exit code 0; zero HTTP/check/workflow failures; 120-second recovery completed. |

## Lifecycle Milestone State

**Task 1 / REQ1 = COMPLETE.** The final endurance threshold is HUMAN-REVIEWED / FINAL. Task 2 remains AWAITING FINAL HUMAN ACCEPTANCE. Task 3 remains NOT STARTED.

| Milestone | Status | Official invocation / note |
|---|---|---|
| Load | COMPLETE | `20260817t045341487` |
| Stress | COMPLETE | `20260817t115158688` |
| Spike | COMPLETE | `20260817t134816776`; technical validity VALID |
| Soak / Endurance | COMPLETE — measured official invocation | `20260818t000551547`; technical validity VALID; measured-data completeness COMPLETE; screenshot not required for Soak |
| HW05 Task 2 | AWAITING FINAL HUMAN ACCEPTANCE | Initial analysis, approved corrections, guards, and binary optimization classifications are recorded in `work/task2_performance_analysis.md` |
| HW05 Task 3 | NOT STARTED | Continuous-performance-testing proposal remains a later milestone |

## Frozen Soak Threshold Facts

- HUMAN-REVIEWED / FINAL observed sustained throughput floor: **7.983 req/s** at 12 sustained VUs for 12 minutes.
- Supporting minimum clean workflow rate: **0.829 workflows/s**.
- Zero correctness failures: 0 HTTP failures, 100% checks, and 100% workflow correctness.
- These facts are not maximum stable RPS, production capacity, or a business SLO.

`eshop-sut/backend/database.sqlite` is runtime state and must not be staged or committed.
