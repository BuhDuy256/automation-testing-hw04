# Official Load Script Implementation Validation

## Scope

Validated on 2026-08-17 before the official Load evidence run:

- `out/23127179_Load_20260817.js`
- `out/user_workflow_data.csv`

The portable k6 v2.1.0 binary previously used for calibration performed init-time validation. No HTTP traffic was generated.

## Results

| Validation item | Result | Evidence |
|---|---|---|
| Script initialization and CSV loading | PASS | `k6 inspect -e K6_RUN_ID=20260817official01` exited `0`. |
| Mandatory run ID | PASS | The same command without `K6_RUN_ID` exited `107` before traffic and reported the required format. No constant fallback exists. |
| CSV identity and field validation | PASS | Init validates the exact six-header set, six fields per row, unique seed format, password complexity, phone format, non-empty name/address, and safe positive quantity. |
| CSV packaging | PASS | The SHA-256 hashes of `work/user_workflow_data.csv` and `out/user_workflow_data.csv` are both `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1`. |
| Successful-workflow request count | PASS | Static inspection found exactly nine `http.get`/`http.post`/`http.put` calls. |
| Checkout count | PASS | Static inspection found exactly one `/api/checkout` occurrence and no post-Checkout verification request. |
| Stable step tags | PASS | The nine tags are `register`, `login`, `read_profile`, `update_profile`, `read_categories`, `read_products`, `read_product_detail`, `add_to_cart`, and `checkout`. |
| Reviewed workload | PASS | k6 inspection resolved `ramping-vus`, `startVUs: 1`, stages `1m -> 4`, `4m -> 4`, `1m -> 0`, and both graceful settings at `25s`. |
| Reviewed thresholds | PASS | k6 inspection resolved zero HTTP failure, 100% checks/workflow success, HTTP p95/p99 below 60/85 ms, and iteration p95 below 19,000 ms. No RPS or endpoint-specific threshold exists. |
| Think-time | PASS | Static inspection found the five reviewed ranges in their required positions: 1-2, 3-5, 2-4, 2-4, and 1-3 seconds. |
| Runtime correlation | PASS | Email uses run/scenario/test-wide-VU/scenario-iteration/seed; JWT is reused; categories feed product selection; Product Detail feeds Cart; CSV address is reused explicitly; total is runtime price times CSV quantity. |
| Correlation failure handling | PASS | Every required semantic/correlation check records `workflow_success=false` and returns before dependent traffic. No hard-coded category or product fallback exists. |
| Per-endpoint latency retention | PASS | Nine endpoint Trends use the stable step names and retain p50, p90, p95, and p99 through `summaryTrendStats`. No endpoint-specific threshold was introduced. |

## Smoke decision

A traffic-generating smoke run was not required. The official script reuses the already successful calibration workflow logic, while k6 init inspection proved that the new fixed scenario, thresholds, imports, and packaged CSV load correctly. The official six-minute run remains intentionally unexecuted.
