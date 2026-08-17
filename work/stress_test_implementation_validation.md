# Official Stress Script Implementation Validation

## Scope

Validated on 2026-08-17 before any official Stress traffic:

- `out/23127179_Stress_20260817.js`
- `out/stress_stage_report.js`
- `out/user_workflow_data.csv`
- `work/run_official_stress.ps1`
- `work/official_stress_gui_handoff.md`
- `work/official_stress_visual_capture_instructions.md`
- `work/performance_testing_report_state.md`

Installed tool: k6 v2.1.0 (`commit/83a87a41e2, go1.26.4, windows/amd64`).

No SUT request was sent and no official Stress evidence directory was created. A
two-iteration, no-network k6 fixture under `work/` validated installed-k6 metric,
tagging, `handleSummary()`, and Markdown file-output behavior.

## Results

| Validation item | Result | Evidence |
|---|---|---|
| Script initialization and imports | PASS | `k6 inspect` with valid `K6_RUN_ID` and `STRESS_MARKDOWN_REPORT_PATH` exited `0`, loaded the finalized CSV, and resolved the report helper. |
| Mandatory run ID | PASS | Inspection without `K6_RUN_ID` exited `107` before traffic and reported the required `^[a-z0-9]{8,20}$` format. No constant fallback exists. |
| Mandatory invocation report path | PASS | Inspection without `STRESS_MARKDOWN_REPORT_PATH` exited `107` before traffic. The value must end in `.md`; the runner supplies the invocation-specific absolute path. |
| CSV schema and packaging | PASS | Init validation preserves the exact six columns and all reviewed field rules. `out/user_workflow_data.csv` SHA-256 remains `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1`. |
| Exact business workflow | PASS | Static inspection found exactly nine `http.get`/`http.post`/`http.put` calls and the nine reviewed steps in order. |
| Exactly one Checkout | PASS | Static inspection found one `/api/checkout` endpoint occurrence and no post-Checkout order-read request. |
| Runtime correlations | PASS | Email retains run/scenario/test-wide-VU/scenario-iteration/seed identity; Login reuses the original email/password; JWT, category/product, Product Detail fields, CSV address, quantity, and runtime total correlations match Load. |
| Safe dependency failure behavior | PASS | Every required check failure records `workflow_success=false` and returns before dependent traffic. No category, product, token, price, or identity fallback exists. |
| Reviewed think-time | PASS | The only five `randomPause()` calls are `1-2`, `3-5`, `2-4`, `2-4`, and `1-3` seconds in the reviewed workflow positions. |
| Frozen Stress schedule | PASS | k6 inspection resolved `ramping-vus`, `startVUs: 1`, all 15 reviewed stages, `maxVUs: 24`, `gracefulRampDown: 30s`, `gracefulStop: 30s`, and `19m30s` maximum duration including grace. Nominal traffic stages total 19 minutes. |
| Correctness thresholds only | PASS | Inspection resolved only `http_req_failed: rate==0`, `checks: rate==1`, and `workflow_success: rate==1`. No threshold uses `abortOnFail`. |
| No Load performance thresholds | PASS | No p95, p99, iteration-duration, RPS, endpoint-latency, or per-stage latency threshold is configured. Percentiles appear only in `summaryTrendStats` and the observational report. |
| Stable `step` tags | PASS | Requests preserve `register`, `login`, `read_profile`, `update_profile`, `read_categories`, `read_products`, `read_product_detail`, `add_to_cart`, and `checkout`. |
| Stable `stress_level` tags | PASS | Every request receives the active schedule-derived `stress_level`; checks and relevant custom metrics receive the same tag. Fixture raw NDJSON contained `step=checkout, stress_level=level_16` on the same metric sample. |
| Stage marker schedule | PASS | The runner maps the exact reviewed elapsed-time boundaries to `baseline_4`, `anchor_8`, `level_12`, `level_16`, `level_20`, `maximum_24`, and `recovery_4`, and prints `STRESS_PHASE`, `STRESS_LEVEL`, `TARGET_VUS`, `RUN_ID`, and `ELAPSED`. |
| Runner syntax | PASS | PowerShell parser returned zero syntax errors. |
| Script/report integrity pins | PASS | The runner pins script SHA-256 `822F0D7A37A620E37CB8DCA9F8C99CCD1C20118335E8A8FC118C81D35E65C198` and report-helper SHA-256 `56542BED0A17AE8A87C31623D86248F52FAD833082F1FEFDD80ED9E0C2BFF865`. |
| Report registry uniqueness | PASS | Load remains Native k6 Web Dashboard HTML `USED`; Stress is Custom k6 Markdown Stage Summary `ASSIGNED / USED-FOR-DESIGN`; Spike remains `UNASSIGNED`. |
| Markdown report generation | PASS | The exact `buildStressMarkdown()` helper used by the official script generated a 6,399-byte report through installed k6 `handleSummary()` to an absolute Windows path. The preview contains seven plateau rows, opening/recovery comparison, threshold table, and 63 stage/step rows. |
| Direct stage percentiles | PASS | No-network fixture `handleSummary()` data contained a direct Trend for every measurement stage with p50/p90/p95/p99. Example: `stress_level_16_http_duration_ms` produced p95 `13.95` and p99 `13.99` from fixture samples. |
| Direct stage counts | PASS | Direct Counter/Rate metrics were available for stage requests, per-step samples, checks, workflow outcomes, completed workflows, and HTTP failures. Fixture `level_16` contained 18 requests and two Checkout samples. |
| Common evidence preparation | PASS | The runner prepares collision-safe raw NDJSON, summary JSON, stdout/stderr, process/system resource CSV, exact command, timestamps, run metadata, hashes, hardware context, Markdown report, screenshot directory, and GUI handoff. |
| GUI evidence preparation | PASS | Capture instructions cover all seven measurement plateaus; 16 VUs remains the default primary candidate, with first-degradation or maximum-24 selection only from real frames captured during that invocation. |
| Account lockout | PASS | The script performs one correct-password Login per unique account, contains no intentionally incorrect-password traffic, and performs no Login retry. |
| Runtime SQLite exclusion | PASS | `eshop-sut/backend/database.sqlite` is not referenced by the implementation package and remains separate mutable SUT runtime state. It must not be staged or committed. |

## Stage-tagging mechanism

The script uses `exec.scenario.startTime` from the installed `k6/execution` module and
the frozen elapsed-time boundaries to identify the active stage at each request. The
request receives both `step` and `stress_level`; the VU code-defined tag is also updated
to the same level. Transitions have explicit labels, so no request needs wall-clock
classification after execution.

Request timing is attributed to the phase active immediately before the request is
sent. Workflow outcome and completed-workflow count are attributed to the phase in
which the iteration ends. The custom stage iteration Trend receives a value only when
the iteration starts and ends in the same measurement plateau. Cross-stage iterations
are counted separately by `stress_cross_stage_iterations` and remain fully represented
in raw NDJSON.

## How stage-level metrics become available

Installed-k6 validation established two distinct behaviors:

1. User-defined `stress_level` tags are preserved on raw metric samples, but an
   arbitrary tagged submetric such as
   `validation_tagged_trend_ms{stress_level:baseline_4}` did not automatically appear
   in `handleSummary()` without an explicit submetric reference.
2. Custom Trend, Counter, and Rate metrics created in init context with direct stage
   names did appear in `handleSummary()` with their aggregate values.

The official script therefore records both forms:

- real `stress_level` and `step` tags provide granular, reproducible NDJSON evidence;
- direct metrics such as `stress_level_16_http_duration_ms`,
  `stress_level_16_http_requests`, and
  `stress_level_16_latency_checkout_ms` provide stage aggregates without adding
  forbidden observational thresholds.

This is the minimum k6-native mechanism that satisfies stage attribution and avoids
turning p95/p99 observations into pass/fail criteria merely to materialize submetrics.

## How `handleSummary()` obtains and labels values

`handleSummary()` receives the installed k6 aggregate object. The shared report helper
reads direct stage metrics as **DIRECT K6 STAGE AGGREGATE** values:

- stage and per-step p50/p90/p95/p99 come from stage-named Trend metrics;
- request, per-step sample, and completed-workflow counts come from Counters;
- HTTP failure, check, and workflow-success rates/counts come from Rates; and
- same-stage iteration p95 comes from the direct stage iteration Trend.

Stage request and workflow throughput are labeled **DERIVED FROM DIRECT K6 STAGE
COUNTERS**. The calculation is deterministic: direct count divided by the overlap of
the real k6 `data.state.testRunDurationMs` with the frozen plateau interval. The report
does not infer a stage percentile from the global percentile and does not contain
external resource values.

## Raw NDJSON use

The designated Markdown report needs no raw post-processing for its stage p95/p99,
counts, correctness, or throughput table. Raw NDJSON remains mandatory and is the
authoritative granular source for:

- reproducing or auditing stage aggregates;
- checking combined tags such as `step=checkout, stress_level=level_16`;
- deeper transition analysis;
- deterministic follow-up calculations not present in the designated report; and
- later Task 2 analysis, which is outside this milestone.

Any later raw-derived result must be labeled **DERIVED FROM RAW STAGE-TAGGED SAMPLES**
and preserve the calculation procedure. No such Stress result exists yet.

## Validation fixture

The following non-official validation artifacts remain under `work/`:

- `work/k6_stress_stage_metric_validation.js`
- `work/stress-stage-metric-validation/report.md`
- `work/stress-stage-metric-validation/handle-summary-data.json`
- `work/stress-stage-metric-validation/summary.json`
- `work/stress-stage-metric-validation/raw-results.ndjson`
- `work/stress-stage-metric-validation/official-report-preview.md`
- `work/stress-stage-metric-validation/absolute-report-preview.md`

The fixture executed two in-memory iterations and emitted custom metrics only. It did
not import `k6/http`, contact EShop, create users/orders, or represent official Stress
evidence.

## Remaining limitations and execution gate

- The full 19-minute Stress profile has not run, so no Stress performance result,
  resource result, screenshot, lockout event, or threshold outcome exists.
- Real backend and generator resources are external to `handleSummary()` and will be
  correlated from same-run CSV samples by `stress_level` after execution.
- A threshold failure will set the final k6 exit status but will not abort traffic;
  unsafe or invalid-run stopping still requires the reviewed runner/human judgment.
- The runner requires a clean backend restart/reseed, a fresh run ID, valid hashes,
  a healthy backend, prepared Task Manager, and real GUI capture before official
  traffic.

Implementation validation is complete. The lifecycle is intentionally stopped before
official Stress execution.
