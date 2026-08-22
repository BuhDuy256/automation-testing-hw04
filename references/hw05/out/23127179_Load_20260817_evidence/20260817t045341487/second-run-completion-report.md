# Official Load Run — Completion Report

- **Test plan:** `23127179_Load_20260817`
- **K6_RUN_ID:** `20260817t045341487`
- **Invocation:** second official Load run, executed to close the submission-evidence
  gap left by the technically valid first run `20260817t042311622`
- **Tool:** k6 v2.1.0 (`commit/83a87a41e2, go1.26.4, windows/amd64`)
- **SUT:** EShop backend on `http://localhost:3000`, restarted immediately before the
  run so the database was reseeded (`backend_restarted_before_run = true`)
- **Commit at execution time:** `6dad2b6ca09ee6db95e66ab6178f036ed863442b`

## Design integrity

Nothing about the test was redesigned for this invocation. The runner verified the
approved artefacts by hash before generating any traffic:

| Artefact | SHA-256 | Matches approved |
|---|---|---|
| `23127179_Load_20260817.js` | `9B8E3B9DAC02B010AFC76D1C349450A707FEF391BB1E2874422FE951094C6704` | yes |
| `user_workflow_data.csv` | `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1` | yes |

Workload (`ramping-vus` 1m→4 VUs, 4m@4 VUs, 1m→0), workflow, think-time, checks,
runtime correlations and thresholds are unchanged from the approved plan.

## Execution

| Field | Value |
|---|---|
| Started (UTC) | `2026-08-17T05:25:34.770Z` |
| Ended (UTC) | `2026-08-17T05:31:51.183Z` |
| Wall clock | 376.4 s (k6 reported `6m13.4s`) |
| k6 exit code | `0` |
| Threshold-triggered exit | no |
| Backend PID | `25868` |
| k6 PID | `24148` |
| Iterations | 94 complete, **0 interrupted** |
| HTTP requests | 846 (2.27 req/s) |
| Checks | 3290 / 3290 passed (100%) |
| `workflow_success` | 100.00% (94 / 94) |

## Threshold results — all passed

| Metric | Threshold | Observed | Result |
|---|---|---|---|
| `checks` | `rate==1` | 100.00% | pass |
| `http_req_failed` | `rate==0` | 0.00% (0 of 846) | pass |
| `workflow_success` | `rate==1` | 100.00% | pass |
| `http_req_duration` | `p(95)<60` | 16.35 ms | pass |
| `http_req_duration` | `p(99)<85` | 20.77 ms | pass |
| `iteration_duration` | `p(95)<19000` | 15.34 s | pass |

The latency thresholds remain provisional calibration-derived regression guards, not
business service-level objectives. They should not be reported as SLO compliance.

## Per-endpoint latency (ms)

| Endpoint | avg | p(95) | p(99) | max |
|---|---|---|---|---|
| Register | 10.29 | 18.50 | 52.78 | 92.21 |
| Login | 4.03 | 6.89 | 12.79 | 34.70 |
| Read profile | 2.82 | 6.11 | 8.83 | 11.98 |
| Update profile | 14.37 | 19.37 | 31.33 | 159.33 |
| Read categories | 1.76 | 6.32 | 9.62 | 11.02 |
| Read products | 1.24 | 2.88 | 3.81 | 8.48 |
| Read product detail | 1.69 | 3.70 | 4.86 | 5.23 |
| Add to cart | 2.52 | 5.19 | 5.79 | 6.14 |
| Checkout | 13.48 | 19.40 | 22.78 | 33.81 |

`iteration_duration` averages 13.44 s because the workflow contains deliberate
think-time; it is not a measure of server latency.

## Evidence produced

| Artefact | Path | Size |
|---|---|---|
| Raw k6 log (NDJSON) | `raw-results.ndjson` | 3,740,219 B |
| Summary export | `summary.json` | 17,757 B |
| HTML report (k6 Web Dashboard) | `html-report/index.html` | 196,352 B |
| Console stdout | `stdout.txt` | 46,045 B |
| Console stderr | `stderr.txt` | 0 B (no errors) |
| Per-process resources | `process-resources.csv` | 366 samples |
| System resources | `system-resources.csv` | 183 samples |
| Run metadata | `metadata.json`, `metadata-pre-run.json` | — |
| Exact expanded command | `command.txt` | — |
| Visual evidence | `screenshots/` (6 PNG) | see `screenshot-manifest.md` |

`metadata.json` still carries the pre-run string
`visual_evidence_status = "Not captured automatically"`. It was deliberately left
unmodified so the machine-generated record stays exactly as k6's runner wrote it;
`screenshot-manifest.md` is the authoritative record of the visual evidence.

## Submission status for Load

Complete, with one outstanding item:

- **Outstanding:** the demo video segment for Load. The assignment requires the
  student's own Vietnamese narration with the testing tool and resource monitor in
  the same frame. No assistant may generate or imitate that narration, and the
  screenshots do not substitute for it.

The first run `20260817t042311622` is retained unchanged for traceability. Stress and
Spike have not been started.
