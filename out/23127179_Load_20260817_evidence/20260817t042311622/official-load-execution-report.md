# Official Load Execution Report

## Run identity

| Field | Value |
|---|---|
| Test name | `23127179_Load_20260817` |
| Date | 2026-08-17 |
| K6_RUN_ID | `20260817t042311622` |
| Commit | `938df492129f3db7b522f7b445b95696cf067246` |
| k6 | `k6.exe v2.1.0 (commit/83a87a41e2, go1.26.4, windows/amd64)` |
| Start | `2026-08-17T04:26:18.2722178Z` (`11:26:18` Asia/Bangkok) |
| End | `2026-08-17T04:32:27.6047819Z` (`11:32:27` Asia/Bangkok) |
| k6 exit code | `0` |
| Script SHA-256 | `9B8E3B9DAC02B010AFC76D1C349450A707FEF391BB1E2874422FE951094C6704` |
| CSV SHA-256 | `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1` |

The backend was unavailable during pre-run validation, so it was explicitly restarted before this invocation. Startup reseeded SQLite. The read-only initial-state check found 2 seeded users, 0 orders, 3 categories, 5 products, and no user containing this run ID.

Hardware: Dell Inspiron 15 3530; Intel Core i7-1355U; 10 physical cores and 12 logical processors; 15.7 GiB RAM; 512 GB Phison NVMe SSD; Windows 11 Home Single Language build 26200. k6 and the complete local EShop SUT ran on this machine.

The exact command is preserved in `command.txt`.

## Workload

- Scenario: `load`
- Executor: `ramping-vus`
- Start: 1 VU
- Ramp from 1 to 4 VUs over 1 minute
- Hold 4 VUs for 4 minutes
- Ramp from 4 to 0 VUs over 1 minute
- `gracefulRampDown: 25s`
- `gracefulStop: 25s`

The scheduled stages reached 100%. k6 reported 91 completed and 0 interrupted iterations, with `vus` reaching the configured maximum of 4.

## Workflow

1. Register
2. Login
3. Read Profile
4. Update Profile
5. Read Categories
6. Read Products
7. Read Product Detail
8. Add Product to Cart
9. Checkout

Each completed iteration issued exactly one request for every step, including exactly one Checkout.

## Results

| Metric | Actual result |
|---|---:|
| Completed workflows/iterations | 91 |
| Total HTTP requests | 819 |
| Requests per completed workflow | 9 |
| Achieved RPS | 2.235 requests/s |
| `http_req_failed` | 0.000% (0/819) |
| `checks` | 100.000% (3,185/3,185) |
| `workflow_success` | 100.000% (91/91) |
| HTTP p50 | 4.268 ms |
| HTTP p90 | 16.630 ms |
| HTTP p95 | 25.961 ms |
| HTTP p99 | 70.215 ms |
| Iteration p95 | 15.838 s |
| Data sent | 203,622 bytes |
| Data received | 403,978 bytes |

RPS is an observed result of the closed VU model; it has no pass/fail threshold.

## Threshold evaluation

The latency thresholds are provisional calibration-derived regression guards for this machine and SUT state, not business SLOs.

| Metric | Reviewed threshold | Actual | Result |
|---|---:|---:|---|
| `http_req_failed` | `rate == 0` | `0.000` | PASS |
| `checks` | `rate == 1` | `1.000` | PASS |
| `workflow_success` | `rate == 1` | `1.000` | PASS |
| HTTP p95 | `< 60 ms` | `25.961 ms` | PASS |
| HTTP p99 | `< 85 ms` | `70.215 ms` | PASS |
| Iteration p95 | `< 19 s` | `15.838 s` | PASS |

All reviewed thresholds passed, and k6 exited with code 0.

## Per-endpoint latency

No endpoint-specific pass/fail threshold was applied.

| Step | Samples | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) |
|---|---:|---:|---:|---:|---:|
| Register | 91 | 11.595 | 44.487 | 53.153 | 62.397 |
| Login | 91 | 4.447 | 8.209 | 10.485 | 30.149 |
| Read Profile | 91 | 3.788 | 7.391 | 8.685 | 11.378 |
| Update Profile | 91 | 14.853 | 50.671 | 58.996 | 457.626 |
| Read Categories | 91 | 2.100 | 4.158 | 5.503 | 99.289 |
| Read Products | 91 | 1.653 | 4.251 | 5.430 | 11.366 |
| Read Product Detail | 91 | 2.424 | 4.337 | 5.042 | 1,740.829 |
| Add Product to Cart | 91 | 3.469 | 6.068 | 6.727 | 7.454 |
| Checkout | 91 | 14.155 | 31.847 | 57.431 | 368.489 |

The slower endpoint p99 values are retained as observations. They do not invalidate the run, and no endpoint threshold is introduced after execution.

## Resource observations

Process CPU values below are normalized across 12 logical processors. They are not directly comparable to a Task Manager per-core display.

| Process | Samples | CPU avg | CPU max | Working set avg | Working set max |
|---|---:|---:|---:|---:|---:|
| Backend `node` | 178 | 0.098% | 0.378% | 51.948 MB | 55.035 MB |
| k6 | 178 | 0.128% | 0.564% | 34.935 MB | 35.914 MB |

Whole-machine sampling produced 178 records: 28 during ramp-up, 117 during the four-VU plateau, 29 during ramp-down, and 4 during graceful completion.

| Whole-machine metric | Average | Maximum |
|---|---:|---:|
| CPU | 24.694% | 76.930% |
| Committed memory | 77.076% | 79.774% |
| Disk throughput | 15,189,688.822 B/s | 301,018,284.061 B/s |
| Network throughput | 143,391.192 B/s | 3,960,673.535 B/s |

Whole-machine values include unrelated local activity and must not be attributed solely to EShop or k6.

## Execution issues

- No HTTP, semantic-check, workflow, identity-collision, or correlation failure occurred.
- k6 reported zero interrupted iterations.
- Every step had 91 request samples; 819 equals 91 workflows multiplied by nine requests.
- Read-only post-run database verification found 91 distinct run emails, 91 orders for 91 distinct users, no duplicate email group, and no missing order shipping address.
- After this verification, the backend was stopped and the tracked runtime SQLite file was restored to commit `HEAD`; the official evidence files were retained unchanged.
- Raw NDJSON, machine-readable summary, console output, endpoint summaries, resource samples, hashes, metadata, and the exact command are present.
- No compatible k6 HTML-report mechanism was already established in the repository, so no arbitrary dependency was installed and no HTML report was generated.
- Codex did not capture GUI evidence. `visual_capture_instructions.md` states what the student needed to capture during this invocation; no screenshot is claimed.

## Interpretation

This valid local run passed every reviewed overall threshold and completed every workflow correctly under the calibrated synthetic profile. It does not establish production capacity, a production traffic model, or a business SLO. The endpoint tails, especially Product Detail, Update Profile, and Checkout p99, should remain visible for human review rather than being hidden by the passing overall distribution. This result applies only to this educational EShop state, this hardware, and this invocation.
