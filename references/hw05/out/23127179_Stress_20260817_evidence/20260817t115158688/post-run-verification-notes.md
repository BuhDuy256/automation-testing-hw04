# Official Stress Post-Run Verification Notes

These notes record only what was verified from real artifacts produced by this single invocation.
They contain no result interpretation, no Task 2 analysis, and no Spike design.

- Run ID: `20260817t115158688`
- Commit at execution: `9dd90f705b38c8fd05696259062f15fc66303fc8`
- k6 version: `v2.1.0 (commit/83a87a41e2, go1.26.4, windows/amd64)`
- Started UTC `2026-08-17T12:08:09.7497025Z`, ended UTC `2026-08-17T12:27:18.8101299Z`, elapsed `1149.06 s`
- Nominal schedule 1140 s; the 9 s overrun is `gracefulRampDown`/`gracefulStop` completion, which the
  handoff explicitly allows without changing the frozen stages

## Pre-traffic gates

| Gate | Result |
|---|---|
| Branch `hw05-performance`, only `eshop-sut/backend/database.sqlite` modified and never staged | PASS |
| `out/23127179_Stress_20260817.js` SHA-256 matches approved value | PASS |
| `out/stress_stage_report.js` SHA-256 matches approved value | PASS |
| `out/user_workflow_data.csv` SHA-256 matches approved value | PASS |
| Report registry records Load `USED`, Stress `ASSIGNED / USED-FOR-DESIGN`, Spike `UNASSIGNED` | PASS |
| Reserved evidence directory held only preparation records, no execution artifacts | PASS |
| Backend stopped, restarted, and database reseeded immediately before traffic | PASS |
| `GET /api/categories` returned HTTP 200 before traffic | PASS |
| Port 3000 listener resolved to new backend `node.exe` PID 11520, started 19:06:07 | PASS |
| Backend PID distinguished from the four frontend Node processes | PASS |

The runner re-verified the three hashes and backend health independently before starting k6.

## Invocation

Exactly one official invocation was executed:

```
& .\work\run_official_stress.ps1 -RunId '20260817t115158688' -BackendRestartedBeforeRun $true
```

The fully expanded k6 command is preserved in `command.txt`. No workload parameter, threshold,
report type, or run ID was changed at any point.

## Output package verification

| Artifact | Bytes | Nonempty |
|---|---:|---|
| `raw-results.ndjson` | 60,711,245 | yes |
| `summary.json` | 52,876 | yes |
| `stress-stage-summary.md` | 6,455 | yes |
| `stdout.log` | 139,343 | yes |
| `stderr.log` | 0 | empty by design - k6 emitted no error output |
| `process-resource.csv` | 127,251 | yes |
| `system-resource.csv` | 58,502 | yes |
| `metadata-pre-run.json` | 2,122 | yes |
| `metadata.json` | 2,245 | yes |
| `command.txt` | 739 | yes |
| `hashes.sha256` | 278 | yes |
| `completion-report.md` | 694 | yes |
| `capture-log.json` | 13,894 | yes |
| `screenshot-manifest.md` | 7,285 | yes |
| `screenshots/*.png` | 3.14 MB across 8 files | yes |

An empty `stderr.log` is recorded as a clean-execution signal, not a missing artifact.

## Raw and resource evidence checks

- Raw samples carry both required tags. Example `http_req_duration` point includes
  `"step":"register"` and `"stress_level":"transition_1_to_4"`, plus `"test_phase":"official_stress"`.
- All seven measurement plateaus are present in the raw stream:
  `baseline_4` 7,629 samples, `anchor_8` 14,979, `level_12` 22,666, `level_16` 29,829,
  `level_20` 37,596, `maximum_24` 45,284, `recovery_4` 7,765, plus all transition stages.
- `stress-stage-summary.md` contains all seven plateaus and states explicitly that external
  backend/k6/system resource values are unavailable inside `handleSummary()`. No resource value is
  invented in the report.
- `process-resource.csv` holds 1,116 samples and `system-resource.csv` 558 samples. Stage labels
  align with the frozen timeline: each 120 s plateau carries about 118 backend/k6 sample pairs and
  each 30 s transition about 28.
- Backend `node.exe` 11520 remained alive for the whole run and was available at exit
  (`backend_process_available_at_end: true`). The SUT did not restart or reseed during the run.

## Exit status and threshold outcome

- k6 exit code `0`; `threshold_exit: false`.
- All three declared correctness thresholds PASS: `http_req_failed rate==0`, `checks rate==1`,
  `workflow_success rate==1`.
- Totals: 9,144 HTTP requests, 1,016 completed iterations, 0 interrupted iterations, 0 HTTP
  failures, `vus_max` 24.
- Overall HTTP p95 19.43 ms, p99 41.36 ms, max 485.55 ms.

## Validity assessment

No stop condition from the handoff's invalid-run rules occurred. The backend continued to exercise
the full workflow at every level, the generator did not saturate (k6 CPU stayed at or below roughly
0.8% of total machine capacity at capture instants), raw and resource evidence are intact, the
machine stayed stable, the SUT did not restart or reseed mid-run, the run ID did not collide, and
the implementation hashes were identical before and after execution.

The invocation is technically valid. The only defect is visual: one of seven required plateau
frames (`level_16`) was occluded at the capture instant, as documented in `screenshot-manifest.md`.
That is an evidence-capture gap, not a reason to invalidate or repeat the measured run.

## Manual interaction required

Task Manager could not be automated because it runs at a higher Windows integrity level than this
session; `SetWindowPos` returned `ERROR_ACCESS_DENIED` under UIPI. The student manually selected the
Details tab, enabled the Name/PID/CPU/Memory columns, sorted by CPU, and positioned the window
before traffic began. No other manual action was needed.

## Explicitly not performed in this step

Task 2 analysis, degradation-criteria application, breaking-point determination, Spike design,
soak/endurance execution, and issue reports were not performed here.
