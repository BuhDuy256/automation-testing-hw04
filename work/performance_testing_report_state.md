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
| Soak / Endurance | Raw k6 NDJSON, summary JSON, resource CSV files, and factual Markdown window summary | PREPARED / NOT EXECUTED | Invocation `20260817t225458219` is reserved for additional Task 1 endurance evidence. It is not a fourth designated report and is not part of the Load/Stress/Spike report-type uniqueness rule. |

## Lifecycle Milestone State

| Milestone | Status | Official invocation / note |
|---|---|---|
| Load | COMPLETE | `20260817t045341487` |
| Stress | COMPLETE | `20260817t115158688` |
| Spike | COMPLETE | `20260817t134816776`; technical validity VALID; submission completeness COMPLETE for the Spike Task 1 milestone |
| Soak / Endurance | PREPARED / NOT EXECUTED | Human-reviewed implementation is frozen; invocation `20260817t225458219` and its GUI/execution handoff are prepared; official traffic remains blocked |
| HW05 Task 2 | NOT COMPLETE | No interpretation or misinterpretation analysis performed by this milestone |
| HW05 Task 3 | NOT COMPLETE | Continuous-performance-testing proposal remains a later milestone |
