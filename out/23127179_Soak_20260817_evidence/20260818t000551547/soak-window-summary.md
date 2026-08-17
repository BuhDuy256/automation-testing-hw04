# Official Soak Factual Window Summary

- Run ID: `20260818t000551547`
- Actual k6 scenario start: `2026-08-17T17:26:06.157Z`
- Confirmed traffic end: `2026-08-17T17:39:50.416Z`
- Scope: factual Task 1 measurements only; no Task 2 interpretation is performed.

## Steady Window Measurements

| Window | Measured s | Actual VUs samples/min/max | Requests | req/s | Workflows | workflows/s | HTTP failures | Checks pass/fail | Workflow pass/fail | p50 ms | p90 ms | p95 ms | p99 ms | max ms |
|---|---:|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|
| early_steady | 240 | 120/11/12 | 1925 | 8.020833 | 204 | 0.85 | 0 | 7487/0 | 215/0 | 1.929 | 12.722 | 18.464 | 59.701 | 110.717 |
| middle_steady | 240 | 119/12/12 | 1917 | 7.9875 | 199 | 0.829167 | 0 | 7451/0 | 211/0 | 2.56 | 12.65 | 15.166 | 19.082 | 36.11 |
| late_steady | 240 | 119/12/12 | 1916 | 7.983333 | 202 | 0.841667 | 0 | 7451/0 | 214/0 | 2.668 | 12.979 | 15.4 | 35.662 | 116.475 |

## Per-Step Tail Latency

| Window | Step | Count | p95 ms | p99 ms |
|---|---|---:|---:|---:|
| early_steady | register | 216 | 49.446 | 96.996 |
| early_steady | login | 214 | 4.999 | 9.695 |
| early_steady | read_profile | 214 | 4.153 | 7.296 |
| early_steady | update_profile | 213 | 50.291 | 75.841 |
| early_steady | read_categories | 213 | 6.486 | 37.851 |
| early_steady | read_products | 213 | 2.261 | 9.392 |
| early_steady | read_product_detail | 215 | 3.347 | 5.224 |
| early_steady | add_to_cart | 212 | 3.672 | 4.574 |
| early_steady | checkout | 215 | 47.925 | 70.913 |
| middle_steady | register | 211 | 13.816 | 17.999 |
| middle_steady | login | 213 | 5.476 | 6.803 |
| middle_steady | read_profile | 213 | 4.905 | 7.733 |
| middle_steady | update_profile | 215 | 19.077 | 21.635 |
| middle_steady | read_categories | 215 | 6.273 | 9.815 |
| middle_steady | read_products | 215 | 2.872 | 4.502 |
| middle_steady | read_product_detail | 211 | 3.208 | 5.554 |
| middle_steady | add_to_cart | 213 | 4.945 | 6.802 |
| middle_steady | checkout | 211 | 18.244 | 19.673 |
| late_steady | register | 214 | 15.552 | 40.621 |
| late_steady | login | 214 | 5.922 | 13.204 |
| late_steady | read_profile | 214 | 4.94 | 11.356 |
| late_steady | update_profile | 211 | 24.741 | 54.442 |
| late_steady | read_categories | 211 | 8.002 | 12.993 |
| late_steady | read_products | 211 | 3.414 | 12.758 |
| late_steady | read_product_detail | 212 | 3.698 | 9.547 |
| late_steady | add_to_cart | 215 | 3.965 | 4.924 |
| late_steady | checkout | 214 | 19.88 | 48.077 |

## Empirical Throughput Facts

- Minimum observed steady-window request rate: **7.983333 req/s**.
- Minimum observed steady-window completed-workflow rate: **0.829167 workflows/s**.
- Early-to-late request-rate change: **-0.0375 req/s (-0.468%)**.
- Early-to-late workflow-rate change: **-0.008333 workflows/s (-0.98%)**.
- Cross-window iterations: **52**.

The minima are candidate empirical floors only. This verifier does not label them stable, maximum stable RPS, an SLO, or capacity.

## Stability Wording Gate

- Actual 12-VU condition established in all compared windows: **false**.
- Measured correctness preserved in all compared windows: **true**.
- Material late collapse: human review required; no fixed percentage SLO is applied.
- Generator/shared-machine dominance: human review required.
- Latency and resources: human review required.
- Stable-throughput wording is never authorized automatically.

## Backend Memory Facts

| Window | Metric | Samples | Min | Median | Mean | Max | First | Last | Change | Approx. per minute |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| early_steady | working_set_mb | 120 | 52.473 | 58.201 | 57.589 | 58.848 | 52.473 | 58.664 | 6.191 | 1.552 |
| early_steady | private_memory_mb | 120 | 60.031 | 65.387 | 65.028 | 67.117 | 60.031 | 65.75 | 5.719 | 1.434 |
| middle_steady | working_set_mb | 119 | 58.676 | 59.129 | 59.085 | 59.629 | 58.676 | 59.379 | 0.703 | 0.178 |
| middle_steady | private_memory_mb | 119 | 65.508 | 66.219 | 66.31 | 67.93 | 65.762 | 66.801 | 1.039 | 0.263 |
| late_steady | working_set_mb | 119 | 49.281 | 58.793 | 57.495 | 59.77 | 59.398 | 58.824 | -0.574 | -0.145 |
| late_steady | private_memory_mb | 119 | 56.609 | 66.449 | 65.124 | 67.961 | 66.816 | 65.707 | -1.109 | -0.281 |
| post_load_recovery | working_set_mb | 61 | 59.223 | 59.223 | 59.223 | 59.223 | 59.223 | 59.223 | 0 | 0 |
| post_load_recovery | private_memory_mb | 61 | 66.074 | 66.074 | 66.074 | 66.074 | 66.074 | 66.074 | 0 | 0 |

- Working-set direction: `mixed_or_requires_human_review`; recovery: `increase_from_late_last_to_recovery_last`.
- Private-memory direction: `mixed_or_requires_human_review`; recovery: `increase_from_late_last_to_recovery_last`.
- These are factual directional descriptions, not a leak, defect, or capacity diagnosis.

## Resource Evidence Boundary

Backend, k6, and whole-machine samples are retained separately. Causal interpretation remains for later human review.
