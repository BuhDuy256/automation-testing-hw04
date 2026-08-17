# HW05 Designated Report State

This task-specific registry enforces the requirement that Load, Stress, and Spike use three distinct designated k6-equivalent report/listener outputs.

| Scenario | Designated report type | Status | Evidence |
|---|---|---|---|
| Load | Native k6 Web Dashboard HTML export | USED | `out/23127179_Load_20260817_evidence/20260817t045341487/html-report/index.html` |
| Stress | Custom k6 end-of-test Markdown Stress Stage Summary | USED | `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md` |
| Spike | Native k6 CSV metrics output | ASSIGNED / USED-FOR-DESIGN | Future invocation-specific `spike-metrics.csv`; human-reviewed and locally validated with k6 v2.1.0, but not yet produced by official Spike traffic. |

Raw NDJSON, summary JSON, stdout/stderr, resource CSV files, and screenshots are common execution evidence. They may be produced for every scenario and do not count as the distinct designated report type.

Stress and Spike were assigned only after explicit human review. Spike's native CSV is a k6 metric stream and is distinct from the external process/system resource CSV files. Do not mark Spike `USED` until official Spike traffic produces the invocation-specific file.
