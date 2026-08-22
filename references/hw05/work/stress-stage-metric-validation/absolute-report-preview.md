# Official Stress Stage Summary

- Test plan: `23127179_Stress_20260817`
- K6_RUN_ID: `validationrun01`
- Generated at: `2026-08-17T11:38:32.984Z`
- Designated report: custom k6 end-of-test Markdown Stress Stage Summary
- Stage aggregates: DIRECT K6 STAGE AGGREGATE from stage-named Trend/Counter/Rate metrics
- Stage request/workflow rates: DERIVED FROM DIRECT K6 STAGE COUNTERS divided by actual observed stage seconds
- External backend/k6/system resource values are not available inside handleSummary(); see the invocation resource CSV files.

## Reviewed workload

`1->4/30s; 4/2m; 4->8/30s; 8/2m; 8->12/30s; 12/2m; 12->16/30s; 16/2m; 16->20/30s; 20/2m; 20->24/30s; 24/2m; 24->4/1m; 4/2m recovery; 4->0/1m; gracefulRampDown=30s; gracefulStop=30s`

## Correctness threshold status

| Metric | Threshold | Result |
|---|---|---|
| http_req_failed | rate==0 | NOT AVAILABLE |
| checks | rate==1 | NOT AVAILABLE |
| workflow_success | rate==1 | NOT AVAILABLE |

No latency, iteration-duration, RPS, endpoint, or per-stage latency threshold is applied.

## Measurement plateau comparison

| Stress level | Target VUs | Observed s | Requests | Derived req/s | Completed workflows | Derived workflows/s | HTTP failure rate | HTTP failure count | Checks | Check pass/fail | Workflow success | Workflow pass/fail | HTTP p50 ms | HTTP p90 ms | HTTP p95 ms | HTTP p99 ms | Same-stage iteration p95 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline_4 | 4 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 10.50 | 10.90 | 10.95 | 10.99 | 13000.00 |
| anchor_8 | 8 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 11.50 | 11.90 | 11.95 | 11.99 | 13001.00 |
| level_12 | 12 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 12.50 | 12.90 | 12.95 | 12.99 | 13002.00 |
| level_16 | 16 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 13.50 | 13.90 | 13.95 | 13.99 | 13003.00 |
| level_20 | 20 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 14.50 | 14.90 | 14.95 | 14.99 | 13004.00 |
| maximum_24 | 24 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 15.50 | 15.90 | 15.95 | 15.99 | 13005.00 |
| recovery_4 | 4 | 0.0 | 18 | 11003.790 | 2 | 1222.643 | 0.00% | 0 | 100.00% | 2/0 | 100.00% | 2/0 | 16.50 | 16.90 | 16.95 | 16.99 | 13006.00 |

A same-stage iteration duration is recorded only when an iteration starts and ends in the same measurement plateau. Cross-stage iterations remain in raw evidence and the `stress_cross_stage_iterations` counter.

## Opening versus recovery at 4 VUs

| Position | Stress level | Derived req/s | HTTP p90 ms | HTTP p95 ms | HTTP p99 ms | Workflow success |
|---|---|---|---|---|---|---|
| Opening | baseline_4 | 11003.790 | 10.90 | 10.95 | 10.99 | 100.00% |
| Recovery | recovery_4 | 11003.790 | 16.90 | 16.95 | 16.99 | 100.00% |

## Per-step tail latency by measurement plateau

| Stress level | Step | Samples | p95 ms | p99 ms |
|---|---|---|---|---|
| baseline_4 | register | 2 | 5.00 | 5.00 |
| baseline_4 | login | 2 | 6.00 | 6.00 |
| baseline_4 | read_profile | 2 | 7.00 | 7.00 |
| baseline_4 | update_profile | 2 | 8.00 | 8.00 |
| baseline_4 | read_categories | 2 | 9.00 | 9.00 |
| baseline_4 | read_products | 2 | 10.00 | 10.00 |
| baseline_4 | read_product_detail | 2 | 11.00 | 11.00 |
| baseline_4 | add_to_cart | 2 | 12.00 | 12.00 |
| baseline_4 | checkout | 2 | 13.00 | 13.00 |
| anchor_8 | register | 2 | 6.00 | 6.00 |
| anchor_8 | login | 2 | 7.00 | 7.00 |
| anchor_8 | read_profile | 2 | 8.00 | 8.00 |
| anchor_8 | update_profile | 2 | 9.00 | 9.00 |
| anchor_8 | read_categories | 2 | 10.00 | 10.00 |
| anchor_8 | read_products | 2 | 11.00 | 11.00 |
| anchor_8 | read_product_detail | 2 | 12.00 | 12.00 |
| anchor_8 | add_to_cart | 2 | 13.00 | 13.00 |
| anchor_8 | checkout | 2 | 14.00 | 14.00 |
| level_12 | register | 2 | 7.00 | 7.00 |
| level_12 | login | 2 | 8.00 | 8.00 |
| level_12 | read_profile | 2 | 9.00 | 9.00 |
| level_12 | update_profile | 2 | 10.00 | 10.00 |
| level_12 | read_categories | 2 | 11.00 | 11.00 |
| level_12 | read_products | 2 | 12.00 | 12.00 |
| level_12 | read_product_detail | 2 | 13.00 | 13.00 |
| level_12 | add_to_cart | 2 | 14.00 | 14.00 |
| level_12 | checkout | 2 | 15.00 | 15.00 |
| level_16 | register | 2 | 8.00 | 8.00 |
| level_16 | login | 2 | 9.00 | 9.00 |
| level_16 | read_profile | 2 | 10.00 | 10.00 |
| level_16 | update_profile | 2 | 11.00 | 11.00 |
| level_16 | read_categories | 2 | 12.00 | 12.00 |
| level_16 | read_products | 2 | 13.00 | 13.00 |
| level_16 | read_product_detail | 2 | 14.00 | 14.00 |
| level_16 | add_to_cart | 2 | 15.00 | 15.00 |
| level_16 | checkout | 2 | 16.00 | 16.00 |
| level_20 | register | 2 | 9.00 | 9.00 |
| level_20 | login | 2 | 10.00 | 10.00 |
| level_20 | read_profile | 2 | 11.00 | 11.00 |
| level_20 | update_profile | 2 | 12.00 | 12.00 |
| level_20 | read_categories | 2 | 13.00 | 13.00 |
| level_20 | read_products | 2 | 14.00 | 14.00 |
| level_20 | read_product_detail | 2 | 15.00 | 15.00 |
| level_20 | add_to_cart | 2 | 16.00 | 16.00 |
| level_20 | checkout | 2 | 17.00 | 17.00 |
| maximum_24 | register | 2 | 10.00 | 10.00 |
| maximum_24 | login | 2 | 11.00 | 11.00 |
| maximum_24 | read_profile | 2 | 12.00 | 12.00 |
| maximum_24 | update_profile | 2 | 13.00 | 13.00 |
| maximum_24 | read_categories | 2 | 14.00 | 14.00 |
| maximum_24 | read_products | 2 | 15.00 | 15.00 |
| maximum_24 | read_product_detail | 2 | 16.00 | 16.00 |
| maximum_24 | add_to_cart | 2 | 17.00 | 17.00 |
| maximum_24 | checkout | 2 | 18.00 | 18.00 |
| recovery_4 | register | 2 | 11.00 | 11.00 |
| recovery_4 | login | 2 | 12.00 | 12.00 |
| recovery_4 | read_profile | 2 | 13.00 | 13.00 |
| recovery_4 | update_profile | 2 | 14.00 | 14.00 |
| recovery_4 | read_categories | 2 | 15.00 | 15.00 |
| recovery_4 | read_products | 2 | 16.00 | 16.00 |
| recovery_4 | read_product_detail | 2 | 17.00 | 17.00 |
| recovery_4 | add_to_cart | 2 | 18.00 | 18.00 |
| recovery_4 | checkout | 2 | 19.00 | 19.00 |

## Interpretation boundary

This report presents measurements only. Apply the human-reviewed multi-signal degradation criteria to the raw and resource evidence after execution; do not infer a business SLO or breaking point from one percentile.
