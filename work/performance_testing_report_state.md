# HW05 Designated Report State

This task-specific registry enforces the requirement that Load, Stress, and Spike use three distinct designated k6-equivalent report/listener outputs.

| Scenario | Designated report type | Status | Evidence |
|---|---|---|---|
| Load | Native k6 Web Dashboard HTML export | USED | `out/23127179_Load_20260817_evidence/20260817t045341487/html-report/index.html` |
| Stress | Custom k6 end-of-test Markdown Stress Stage Summary | USED | `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md` |
| Spike | Native k6 CSV metrics output | USED | `out/23127179_Spike_20260817_evidence/20260817t134816776/spike-metrics.csv` (6,977,717 bytes, 37,931 lines, 227 s span) produced by the official Spike invocation `20260817t134816776` and verified present and non-empty after execution. |

Raw NDJSON, summary JSON, stdout/stderr, resource CSV files, and screenshots are common execution evidence. They may be produced for every scenario and do not count as the distinct designated report type.

Stress and Spike were assigned only after explicit human review. Spike's native CSV is a k6 metric stream and is distinct from the external process/system resource CSV files. Spike could not be marked `USED` until official Spike traffic produced the invocation-specific file; that gate was satisfied on 2026-08-17 by run `20260817t134816776`, whose `spike-metrics.csv` was verified after execution rather than on the strength of the command having been issued.

## Additional Endurance Evidence Milestone

| Milestone | Evidence strategy | Status | Note |
|---|---|---|---|
| Soak / Endurance | Raw k6 NDJSON, summary JSON, resource CSV files, and factual Markdown window summary | COMPLETE — measured official invocation | Official Soak Run ID `20260818t000551547`: technical validity VALID, k6 exit code 0, zero HTTP/check/workflow failures, 120-second recovery completed. Historical invalid Soak `20260817t225458219`: PRESERVED / NOT OFFICIAL RESULT (harness-failure and audit history only; must never be mixed into or presented alongside the official result). Soak remains outside the three-report uniqueness rule; screenshot evidence for Soak is OPTIONAL / NOT REQUIRED FOR SOAK COMPLETION per HW05 Section 6 Task 1 (the mandatory same-run screenshot bullet names Load/Stress/Spike, not the separate endurance/soak bullet). |

## Lifecycle Milestone State

| Milestone | Status | Official invocation / note |
|---|---|---|
| Load | COMPLETE | `20260817t045341487` |
| Stress | COMPLETE | `20260817t115158688` |
| Spike | COMPLETE | `20260817t134816776`; technical validity VALID; submission completeness COMPLETE for the Spike Task 1 milestone |
| Soak / Endurance | COMPLETE — measured official invocation | Official Soak Run ID: `20260818t000551547`; technical validity VALID; measured-data completeness COMPLETE; screenshot excluded (private content, not required for Soak). Historical invalid Soak: `20260817t225458219`, PRESERVED / NOT OFFICIAL RESULT. |
| HW05 Task 2 | NOT COMPLETE | No interpretation or misinterpretation analysis performed by this milestone |
| HW05 Task 3 | NOT COMPLETE | Continuous-performance-testing proposal remains a later milestone |

## Frozen Soak Threshold Facts (measured only — Task 2 will interpret)

These are directly measured facts from official invocation `20260818t000551547`, frozen here for
later Task 2 use. They are not yet labelled production capacity, an SLO, or maximum stable RPS.

- **HUMAN-REVIEWED / FINAL — Observed sustained throughput floor:** **7.983 req/s** at 12 sustained VUs for 12 minutes.
- **HUMAN-REVIEWED supporting fact:** minimum clean workflow rate **0.829 workflows/s**.
- Early-to-late request-rate change: **~-0.47%**.
- Early-to-late workflow-rate change: **~-0.98%**.
- Zero correctness failures (0 HTTP failures, 0 failed checks, 0 failed workflows) across all
  three steady windows.
- Backend memory factual status: `mixed_or_requires_human_review` (not a leak/defect diagnosis).

Safe final Task 1 wording: "At the reviewed 12-VU sustained load, the test observed a sustained
throughput floor of 7.983 req/s and a minimum clean workflow rate of 0.829 workflows/s for 12
minutes with zero correctness failures." This is not maximum stable RPS, production capacity,
or an SLO; Task 2 remains separate.
