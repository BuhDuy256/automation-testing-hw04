# Spike Test Implementation Validation

## Scope and Status

The reusable Performance Testing Lifecycle Skill was applied with `scenario_type=spike`. This validation covers the human-reviewed implementation, the designated native k6 CSV output, phase attribution, execution safeguards, and future evidence preparation. It does not contain an official Spike result, and no request was sent to EShop during validation.

Status: **IMPLEMENTED AND VALIDATED — OFFICIAL TRAFFIC NOT EXECUTED**

## Final Frozen Workload

The official script uses one closed `ramping-vus` scenario with `startVUs=4` and this immutable schedule:

| Elapsed interval | Scheduled target | Attribution |
|---|---:|---|
| `0s <= elapsed < 20s` | 4 | `warmup_4` |
| `20s <= elapsed < 60s` | 4 | `pre_spike_steady_4` |
| `60s <= elapsed < 61s` | ramp 4 -> 32 | `spike_transition_4_to_32` |
| `61s <= elapsed < 106s` | 32 | `spike_peak_32` |
| `106s <= elapsed < 107s` | target drop 32 -> 4 | `recovery_transition_32_to_4` |
| `107s <= elapsed < 137s` | target 4 | `recovery_settling_4` |
| `137s <= elapsed < 197s` | target 4 | `recovery_steady_4` |
| `197s <= elapsed < 227s` | ramp 4 -> 0 | `final_rampdown_4_to_0` |

The nominal traffic schedule is 227 seconds. Both `gracefulRampDown` and `gracefulStop` are 30 seconds. The maximum scheduled target is 32 VUs. The five reviewed think-time ranges remain exactly `1-2s`, `3-5s`, `2-4s`, `2-4s`, and `1-3s` at their original workflow locations.

## Human-Review Corrections

### Correction 1: warm-up is not the primary reference

The first 60 seconds still target 4 VUs, but the first 20 seconds are explicitly tagged `warmup_4`. The primary healthy reference begins at 20 seconds and is tagged `pre_spike_steady_4`. Warm-up samples remain evidence; they are not included in the primary comparison against `recovery_steady_4`.

### Correction 2: target VUs are not actual active VUs

The schedule-derived `target_vus` tag and GUI marker describe requested load. They do not claim actual VU convergence. Native k6 `vus` gauge samples in `spike-metrics.csv` are the authoritative actual-active-VU evidence. During result review, their timestamps must be converted to elapsed time using `metadata-pre-run.json.started_at_utc` and aligned with the frozen phase boundaries.

`recovery_steady_4` may be used as a steady comparison window only after inspection of its actual `vus` samples shows that active VUs have settled approximately to the reviewed target of four. If they remain materially above four, the window must be recorded as non-steady rather than converted into a fabricated clean recovery comparison. No numerical recovery SLO or unstated tolerance is introduced here.

## Frozen Workflow and Data Contract

Static validation confirmed exactly nine `http.*` calls per full successful workflow and exactly one Checkout request:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

The implementation preserves the finalized CSV header, mandatory validated `K6_RUN_ID`, unique runtime email, original password for Login, JWT propagation, category/product correlation, Product Detail `id`/`name`/`price`, CSV quantity, runtime `total_amount`, explicit CSV `shipping_address`, semantic checks, `workflow_success`, and safe early returns after dependency failure. There is no hard-coded runtime fallback and no Login retry.

## Phase Attribution Mechanism

One scenario-start timestamp is captured from `exec.scenario.startTime`. The phase resolver uses elapsed milliseconds and the frozen boundaries above. Request and custom metric emission obtains the current phase at emission time and attaches both `step` and `spike_phase`, plus the schedule-derived `target_vus`.

Each iteration records its start and end phase. A same-phase iteration contributes to that phase's clean iteration-duration metric. An iteration crossing a boundary increments `spike_cross_phase_iterations` with both `iteration_start_phase` and `iteration_end_phase`; it is not silently counted as a phase-clean workflow duration.

## Direct Phase Metrics

Each phase has direct k6 `Trend`, `Counter`, and `Rate` metrics for HTTP duration, requests, failures, checks, workflow success, completed workflows, clean iteration duration, and per-step duration/count/failure. The native sample stream therefore supports p50/p90/p95/p99 calculation and count/rate analysis without creating latency or recovery thresholds. Warm-up, transitions, settling, and primary comparison windows remain separate.

The implementation does not automatically claim that the Spike failed or recovery succeeded. Interrupted-iteration evidence will be retained through native k6 progress/final stdout together with summary/raw output, while cross-phase iteration behavior has a dedicated counter.

## Thresholds

Only these correctness invariants are configured, all without `abortOnFail`:

- `http_req_failed`: `rate==0`
- `checks`: `rate==1`
- `workflow_success`: `rate==1`

No latency, percentile, iteration-duration, request-rate, per-step, phase, recovery, or resource threshold is configured.

## Native k6 CSV Metrics Output

The future official runner invokes installed k6 v2.1.0 with both common raw JSON output and the distinct designated output:

```text
--out json=<invocation-directory>/raw-results.ndjson
--out csv=<invocation-directory>/spike-metrics.csv
```

The designated report is accurately registered as **Native k6 CSV metrics output**. It is not a custom summary and remains distinct from process/system resource CSV files.

A three-second no-network fixture was executed with k6 v2.1.0. It produced a real native CSV metric stream with the exact header:

```text
metric_name,timestamp,metric_value,check,error,error_code,expected_response,group,method,name,proto,scenario,service,status,subproto,tls_version,url,extra_tags,metadata
```

The fixture verified:

- `step`, `spike_phase`, and `target_vus` are retained in the `extra_tags` field as URL-query-form tag pairs;
- custom Trend, Counter, and Rate samples are present and usable;
- built-in `vus` and `vus_max` samples are present;
- timestamps are Unix epoch seconds;
- CSV and JSON native outputs can be emitted together;
- the requested file path is created; and
- the fixture sent and received zero network bytes.

Built-in `vus` rows do not inherit the custom phase tag. This is not treated as missing evidence: actual VUs are aligned to phases by their real timestamps and the invocation start timestamp. Actual VUs must never be reconstructed from `target_vus`.

## Evidence and Execution Preparation

`work/run_official_spike.ps1` prepares, but was not used to execute, an invocation-specific directory containing the script, input CSV, raw NDJSON, summary JSON, `spike-metrics.csv`, stdout/stderr, process-resource CSV, system-resource CSV, metadata, exact command, hashes, screenshots, screenshot manifest, and factual completion record.

Its preflight gates require the correct branch, a unique run ID, reviewed file hashes, backend restart/reseed confirmation, GUI readiness, report-registry assignment, backend reachability, and a new evidence path. During later execution it prints `SPIKE_PHASE`, `TARGET_VUS`, `ACTUAL_VUS`, `RUN_ID`, and `ELAPSED`. Live actual VUs are displayed only when parsed from k6 progress; otherwise they are explicitly shown as unavailable. Native CSV `vus` samples remain authoritative.

The runner pins the reviewed script, CSV, capture helper, resource pane, visual instructions, and GUI handoff hashes. The official script currently has SHA-256 `CC01F02F8F06064E14D7C1241CE2C4908808BD2B3CDA2E7A597C538DFFD08AE6`.

## GUI Rolling-Capture Preparation

The capture helper schedules real full-screen same-run frames at approximately 45 seconds; every second from 58 through 70 seconds; 85 seconds; every second from 104 through 116 seconds; 122 seconds; and 165 seconds. This covers the reference, rise/early peak, later peak, drop/early recovery, settling, and steady-recovery windows.

The planned default primary screenshot is the clearest valid early `spike_peak_32` frame showing active k6, run ID, phase, target load, elapsed time, wall-clock timestamp, backend PID/CPU/memory, and preferably k6 PID/CPU/memory. The separate resource pane and GUI handoff preserve the Windows UAC contingency. No screenshot has been captured or reconstructed during implementation validation.

## Validation Commands and Results

Validation was intentionally limited to static inspection, k6 script inspection, PowerShell parsing, hashing, and the no-network fixture.

| Validation | Result |
|---|---|
| Installed version | k6 `v2.1.0` confirmed |
| Official-script `k6 inspect` with valid validation run ID | Exit 0; exact executor, stages, maximum, grace settings, and thresholds reported |
| Official-script `k6 inspect` without `K6_RUN_ID` | Expected rejection, exit 107 |
| Static workflow/data checks | 9 requests, one Checkout, finalized CSV schema, required correlations, five think times confirmed |
| Schedule checks | 227-second nominal schedule, 32 maximum, one-second rise/drop, 45-second peak, 90-second recovery target, 30-second final ramp and graceful settings confirmed |
| Attribution checks | All eight phases, warm-up split, target/actual distinction, emission-time tags, and cross-phase handling confirmed |
| Threshold checks | Only the three reviewed correctness thresholds; no `abortOnFail` or latency/resource thresholds |
| Native CSV fixture | Exit 0; 80,831-byte CSV, usable tags and built-in `vus` samples; zero network bytes |
| PowerShell parsing | Runner, rolling capture helper, and resource pane parse with zero syntax errors |
| Hash gates | All runner-pinned reviewed hashes match current files |
| Report registry | Spike is `ASSIGNED / USED-FOR-DESIGN`, not execution `USED` |
| Official evidence path | Does not exist; no official Spike result was created |
| Stress raw preservation | SHA-256 remains `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA` |
| Runtime database | Remains an unstaged runtime modification and is excluded from the intended commit |

## Remaining Limitation and Execution Gate

There is no implementation blocker. Native CSV has enough metric, tag, timestamp, and actual-VU information for the approved purpose. The future human review must still verify actual `vus` convergence before treating `recovery_steady_4` as a clean four-VU comparison.

Official traffic remains prohibited at this milestone. Before a later official invocation, the operator must approve execution, restart/reseed the backend, prepare the unobstructed GUI and rolling capture, choose a unique official run ID, and pass the runner's preflight checks.
