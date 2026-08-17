# HW05 Designated Report State

This task-specific registry enforces the requirement that Load, Stress, and Spike use three distinct designated k6-equivalent report/listener outputs.

| Scenario | Designated report type | Status | Evidence |
|---|---|---|---|
| Load | Native k6 Web Dashboard HTML export | USED | `out/23127179_Load_20260817_evidence/20260817t045341487/html-report/index.html` |
| Stress | Unassigned | UNASSIGNED | Assign only during reviewed Stress design. |
| Spike | Unassigned | UNASSIGNED | Assign only during reviewed Spike design. |

Raw NDJSON, summary JSON, stdout/stderr, resource CSV files, and screenshots are common execution evidence. They may be produced for every scenario and do not count as the distinct designated report type.

Before assigning Stress or Spike, read this registry and the authoritative assignment. Do not reuse the native k6 Web Dashboard HTML export as either scenario's designated report.
