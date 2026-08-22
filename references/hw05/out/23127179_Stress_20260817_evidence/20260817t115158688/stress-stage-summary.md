# Official Stress Stage Summary

- Test plan: `23127179_Stress_20260817`
- K6_RUN_ID: `20260817t115158688`
- Generated at: `2026-08-17T12:27:16.815Z`
- Designated report: custom k6 end-of-test Markdown Stress Stage Summary
- Stage aggregates: DIRECT K6 STAGE AGGREGATE from stage-named Trend/Counter/Rate metrics
- Stage request/workflow rates: DERIVED FROM DIRECT K6 STAGE COUNTERS divided by actual observed stage seconds
- External backend/k6/system resource values are not available inside handleSummary(); see the invocation resource CSV files.

## Reviewed workload

`1->4/30s; 4/2m; 4->8/30s; 8/2m; 8->12/30s; 12/2m; 12->16/30s; 16/2m; 16->20/30s; 20/2m; 20->24/30s; 24/2m; 24->4/1m; 4/2m recovery; 4->0/1m; gracefulRampDown=30s; gracefulStop=30s`

## Correctness threshold status

| Metric | Threshold | Result |
|---|---|---|
| http_req_failed | rate==0 | PASS |
| checks | rate==1 | PASS |
| workflow_success | rate==1 | PASS |

No latency, iteration-duration, RPS, endpoint, or per-stage latency threshold is applied.

## Measurement plateau comparison

| Stress level | Target VUs | Observed s | Requests | Derived req/s | Completed workflows | Derived workflows/s | HTTP failure rate | HTTP failure count | Checks | Check pass/fail | Workflow success | Workflow pass/fail | HTTP p50 ms | HTTP p90 ms | HTTP p95 ms | HTTP p99 ms | Same-stage iteration p95 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline_4 | 4 | 120.0 | 323 | 2.692 | 35 | 0.292 | 0.00% | 0 | 100.00% | 1252/0 | 100.00% | 35/0 | 4.14 | 17.92 | 24.61 | 46.25 | 15710.95 |
| anchor_8 | 8 | 120.0 | 633 | 5.275 | 70 | 0.583 | 0.00% | 0 | 100.00% | 2462/0 | 100.00% | 70/0 | 4.12 | 18.05 | 22.47 | 48.03 | 15489.20 |
| level_12 | 12 | 120.0 | 958 | 7.983 | 106 | 0.883 | 0.00% | 0 | 100.00% | 3724/0 | 100.00% | 106/0 | 3.87 | 16.84 | 19.08 | 23.84 | 15612.00 |
| level_16 | 16 | 120.0 | 1261 | 10.508 | 139 | 1.158 | 0.00% | 0 | 100.00% | 4901/0 | 100.00% | 139/0 | 4.28 | 17.18 | 33.50 | 49.83 | 15629.20 |
| level_20 | 20 | 120.0 | 1588 | 13.233 | 178 | 1.483 | 0.00% | 0 | 100.00% | 6176/0 | 100.00% | 178/0 | 3.98 | 16.53 | 18.64 | 23.87 | 15643.90 |
| maximum_24 | 24 | 120.0 | 1914 | 15.950 | 212 | 1.767 | 0.00% | 0 | 100.00% | 7439/0 | 100.00% | 212/0 | 3.77 | 15.78 | 17.80 | 21.85 | 15367.40 |
| recovery_4 | 4 | 120.0 | 327 | 2.725 | 38 | 0.317 | 0.00% | 0 | 100.00% | 1278/0 | 100.00% | 38/0 | 3.41 | 15.67 | 17.07 | 18.83 | 15812.50 |

A same-stage iteration duration is recorded only when an iteration starts and ends in the same measurement plateau. Cross-stage iterations remain in raw evidence and the `stress_cross_stage_iterations` counter.

## Opening versus recovery at 4 VUs

| Position | Stress level | Derived req/s | HTTP p90 ms | HTTP p95 ms | HTTP p99 ms | Workflow success |
|---|---|---|---|---|---|---|
| Opening | baseline_4 | 2.692 | 17.92 | 24.61 | 46.25 | 100.00% |
| Recovery | recovery_4 | 2.725 | 15.67 | 17.07 | 18.83 | 100.00% |

## Per-step tail latency by measurement plateau

| Stress level | Step | Samples | p95 ms | p99 ms |
|---|---|---|---|---|
| baseline_4 | register | 36 | 45.62 | 79.83 |
| baseline_4 | login | 36 | 6.87 | 9.55 |
| baseline_4 | read_profile | 36 | 6.88 | 10.98 |
| baseline_4 | update_profile | 37 | 42.80 | 49.12 |
| baseline_4 | read_categories | 37 | 4.70 | 6.18 |
| baseline_4 | read_products | 37 | 4.61 | 6.08 |
| baseline_4 | read_product_detail | 34 | 8.12 | 11.73 |
| baseline_4 | add_to_cart | 35 | 7.10 | 8.19 |
| baseline_4 | checkout | 35 | 38.64 | 45.29 |
| anchor_8 | register | 71 | 39.88 | 55.25 |
| anchor_8 | login | 71 | 9.75 | 19.37 |
| anchor_8 | read_profile | 71 | 9.16 | 19.76 |
| anchor_8 | update_profile | 69 | 35.51 | 44.25 |
| anchor_8 | read_categories | 69 | 5.53 | 15.24 |
| anchor_8 | read_products | 69 | 4.17 | 22.14 |
| anchor_8 | read_product_detail | 71 | 5.33 | 6.61 |
| anchor_8 | add_to_cart | 72 | 7.33 | 9.50 |
| anchor_8 | checkout | 70 | 41.16 | 53.20 |
| level_12 | register | 107 | 22.56 | 30.07 |
| level_12 | login | 107 | 7.60 | 21.37 |
| level_12 | read_profile | 107 | 6.91 | 20.59 |
| level_12 | update_profile | 106 | 21.32 | 23.87 |
| level_12 | read_categories | 106 | 7.74 | 16.15 |
| level_12 | read_products | 106 | 4.96 | 8.13 |
| level_12 | read_product_detail | 106 | 5.44 | 11.56 |
| level_12 | add_to_cart | 107 | 5.92 | 6.55 |
| level_12 | checkout | 106 | 22.96 | 24.28 |
| level_16 | register | 140 | 44.21 | 69.54 |
| level_16 | login | 139 | 10.65 | 17.19 |
| level_16 | read_profile | 139 | 8.50 | 14.50 |
| level_16 | update_profile | 142 | 46.03 | 51.35 |
| level_16 | read_categories | 142 | 11.34 | 34.85 |
| level_16 | read_products | 142 | 4.70 | 11.35 |
| level_16 | read_product_detail | 139 | 5.10 | 16.61 |
| level_16 | add_to_cart | 139 | 6.20 | 7.77 |
| level_16 | checkout | 139 | 42.38 | 67.41 |
| level_20 | register | 179 | 22.82 | 25.98 |
| level_20 | login | 177 | 8.44 | 10.41 |
| level_20 | read_profile | 177 | 8.20 | 14.45 |
| level_20 | update_profile | 175 | 22.18 | 27.01 |
| level_20 | read_categories | 175 | 7.78 | 14.07 |
| level_20 | read_products | 175 | 4.44 | 8.50 |
| level_20 | read_product_detail | 177 | 5.49 | 15.54 |
| level_20 | add_to_cart | 175 | 5.62 | 6.37 |
| level_20 | checkout | 178 | 22.15 | 27.08 |
| maximum_24 | register | 213 | 18.76 | 25.25 |
| maximum_24 | login | 214 | 10.23 | 16.07 |
| maximum_24 | read_profile | 214 | 10.62 | 14.63 |
| maximum_24 | update_profile | 213 | 20.42 | 23.35 |
| maximum_24 | read_categories | 213 | 10.31 | 14.26 |
| maximum_24 | read_products | 213 | 4.59 | 13.55 |
| maximum_24 | read_product_detail | 211 | 5.47 | 11.64 |
| maximum_24 | add_to_cart | 211 | 5.44 | 6.90 |
| maximum_24 | checkout | 212 | 20.84 | 27.77 |
| recovery_4 | register | 35 | 16.18 | 18.45 |
| recovery_4 | login | 35 | 7.88 | 8.88 |
| recovery_4 | read_profile | 35 | 5.31 | 6.99 |
| recovery_4 | update_profile | 36 | 18.66 | 20.02 |
| recovery_4 | read_categories | 36 | 3.87 | 5.19 |
| recovery_4 | read_products | 36 | 2.55 | 2.72 |
| recovery_4 | read_product_detail | 38 | 3.73 | 4.29 |
| recovery_4 | add_to_cart | 38 | 4.70 | 5.51 |
| recovery_4 | checkout | 38 | 18.63 | 21.83 |

## Interpretation boundary

This report presents measurements only. Apply the human-reviewed multi-signal degradation criteria to the raw and resource evidence after execution; do not infer a business SLO or breaking point from one percentile.
