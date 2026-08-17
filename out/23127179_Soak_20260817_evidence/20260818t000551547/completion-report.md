# Official Soak Execution Completion Record

- Run ID: `20260818t000551547`
- Status: **OFFICIAL VALID SOAK RESULT.**

## Technical validity

- Runner preflight start: `2026-08-17T17:26:03.9427784Z`
- Actual k6 scenario start (real marker): `2026-08-17T17:26:06.1570000Z`
- Confirmed traffic end: `2026-08-17T17:39:50.4164132Z`
- Evidence collection end (after 120 s recovery): `2026-08-17T17:41:52.0827707Z`
- k6 exit code: `0`
- Threshold exit: `False`
- **Technical validity: VALID.**

## Correctness result (measured, independently re-verified from raw NDJSON and database state)

- HTTP failures: `0` (6,201 HTTP requests, 0 `http_req_failed`).
- Failed checks: `0` (24,115 checks, 0 fails).
- Failed workflows: `0` (689 completed workflows, 0 `workflow_success` fails).
- Cross-check: database before `users=2, orders=0` (seeded) -> after `users=691, orders=689`;
  689 new users and 689 new orders match the 689 completed workflows exactly (one Checkout per
  workflow, one registration per workflow).

## Steady-window metrics (factual, from `soak-window-summary.md`)

| Window | req/s | workflows/s | HTTP failures | Checks pass/fail | Workflow pass/fail | p99 checkout ms |
|---|---:|---:|---:|---|---|---:|
| early_steady | 8.020833 | 0.85 | 0 | 7487/0 | 215/0 | 70.913 |
| middle_steady | 7.9875 | 0.829167 | 0 | 7451/0 | 211/0 | 19.673 |
| late_steady | 7.983333 | 0.841667 | 0 | 7451/0 | 214/0 | 48.077 |

- Minimum observed steady-window request rate: **7.983333 req/s**.
- Minimum observed steady-window clean-workflow rate: **0.829167 workflows/s**.
- Early-to-late change: request rate **-0.0375 req/s (-0.468%)**; workflow rate **-0.008333
  workflows/s (-0.98%)**.

### HUMAN-REVIEWED / FINAL — Task 1 Endurance Threshold

**Observed sustained throughput floor:** Under the tested hardware and reviewed 12-VU workload,
EShop sustained at least 7.983 requests/s and 0.829 clean workflows/s for 12 minutes while
maintaining zero HTTP failures and 100% workflow correctness. This is a measured floor, not a
maximum-stable-RPS, production-capacity, or SLO claim (Task 2 will interpret it further).

## Resource and recovery evidence

- Resource sampling: 2 seconds, confirmed by 944 process-resource rows and 472 system-resource
  rows (both counts independently recounted from the CSV files).
- Recovery: full 120-second resource-only recovery completed after confirmed traffic end.
- Backend memory direction: `mixed_or_requires_human_review` (see `soak-window-summary.md`); not
  diagnosed here as a leak, defect, or capacity ceiling.

## Raw evidence

- Raw NDJSON: `32,397,207` bytes.
- Raw NDJSON SHA-256: `ADE9394117219D4BB1B4983915C612DE10D92A37FC8E5740EC0184B4059D93F0`.
- Database before/after state: `database-state-before.json`, `database-state-after.json`.

## Screenshot limitation

The one active screenshot (`01_middle_steady_elapsed0420s.png`, fired at 418.2 s into
`middle_steady`) was a genuine same-run capture but showed a private browser window instead of
the tool/resource evidence, because the runner/resource pane ran under a non-interactive ConPTY
shell with no desktop window (`MainWindowHandle = 0`). The image was deleted by the student as
private content with no evidentiary value. See `screenshot-manifest.md` for the full note.

Per the HW05 requirement, the mandatory same-run screenshot obligation is stated for the
Load/Stress/Spike scenario runs (Section 6, Task 1); the separate endurance/soak bullet does not
carry the same mandate. Soak screenshot evidence is therefore **OPTIONAL / NOT REQUIRED FOR SOAK
COMPLETION**, and its absence does not invalidate the measured Soak evidence in this report.

## No rerun

No rerun occurred, and none is planned, for Run ID `20260818t000551547`. Poor performance is
evidence and does not authorize an automatic rerun. Stable-throughput, capacity, SLO,
memory-leak, defect, and optimization claims are not made in this report.
