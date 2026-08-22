# Spike Test Plan Design

- Lifecycle skill: `.codex/skills/performance-testing-lifecycle`
- Scenario mode: `scenario_type=spike`
- Status: **HUMAN-REVIEWED — ACCEPTED FOR IMPLEMENTATION; NOT EXECUTED**
- Intended test-plan name after approval: `23127179_Spike_YYYYMMDD`

The proposal history below is retained for traceability. The final accepted decisions and two human-review corrections are frozen in the last section.

## Objective

**Assignment requirement:** The Spike scenario must exercise the same end-to-end workflow as Load and Stress while covering auth-heavy, read-heavy, and transactional endpoint groups.

The test must answer: **How does the SUT respond to a sudden increase in concurrency from a healthy reference level, and how well does it recover when that sudden load is removed?**

The design must expose three visible periods: pre-spike reference, rapid spike, and recovery. It must not become another gradual, multi-level Stress profile.

## Starting Evidence

**Observed runtime fact:** Load and Stress are complete; Spike is undesigned, unimplemented, and unexecuted.

**Calibration measurement:** The primary Load invocation is `K6_RUN_ID=20260817t045341487`. Its reviewed synthetic normal-load reference is 4 VUs, with 94 complete workflows, 846 requests, zero interrupted iterations, zero HTTP failures, 100% checks, 100% `workflow_success`, HTTP p95 `16.357925 ms`, HTTP p99 `20.77437 ms`, and iteration p95 `15.344844 s`.

**Human-reviewed decision:** Four VUs is a synthetic normal-load reference for this machine and SUT state. It is not measured production demand. The Load latency thresholds are provisional regression guards, not business SLOs.

**Calibration measurement:** Earlier 8-VU Load calibration preserved correctness but increased overall p99 to `122.377 ms` and Register p95 to `123.832 ms`. This was an early tail/contention signal, not a capacity failure.

**Calibration measurement:** The official Stress invocation is `K6_RUN_ID=20260817t115158688`. It completed 1,016 workflows and 9,144 requests with exactly nine requests and one Checkout per completed workflow, zero HTTP failures, zero interrupted iterations, 35,560/35,560 checks, 1,016/1,016 `workflow_success`, global HTTP p95 about `19.43 ms`, p99 about `41.36 ms`, and maximum about `485.55 ms`.

**Calibration measurement:** Stress correctness remained intact through 24 VUs. Throughput increased from `2.692 req/s` at `baseline_4` to `15.950 req/s` at `maximum_24`; latency did not worsen monotonically; backend and k6 process resources showed no obvious saturation; and `recovery_4` was not worse than `baseline_4`.

**Synthetic assumption:** The SUT and k6 generator will continue sharing the same Windows machine. Stress whole-machine committed memory was already high, so process headroom does not remove the need for a pre-run machine-health gate.

No Stress result is interpreted as production capacity, and no claim is made above the tested maximum of 24 VUs.

## Frozen Workflow

**Human-reviewed decision:** Preserve exactly:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

A successful workflow must contain exactly nine HTTP requests and exactly one Checkout.

Preserve the finalized CSV schema:

`identity_seed,name,password,phone,shipping_address,quantity`

Preserve all existing behavior:

- create a unique email from the invocation, scenario, VU, iteration, and CSV identity seed;
- retain Register email and password for Login;
- extract the JWT from `$.token` and use it for authenticated requests;
- select a product whose `category_id` matches a returned category;
- use Product Detail `$.id`, `$.name`, and `$.price` for Add to Cart;
- calculate Checkout `total_amount` as runtime product price multiplied by CSV quantity;
- send the CSV `shipping_address` explicitly in Checkout;
- preserve semantic checks and `workflow_success` separately from transport success; and
- stop the dependent workflow safely when a required value or semantic check fails, without a hard-coded fallback.

## Proposed Spike Profile

All values in this table are **AI PROPOSAL — HUMAN REVIEW REQUIRED**.

Proposed executor: one closed-model `ramping-vus` scenario with `startVUs=4`. This model directly controls concurrent virtual users, keeps one isolated account/workflow per active iteration, and preserves the same concurrency meaning used by Load and Stress.

| Segment | Nominal elapsed time | Target | Duration | Purpose |
|---|---:|---:|---:|---|
| `warmup_4` | 0-20 s | 4 VUs | 20 s | Real warm-up evidence; excluded from the primary healthy-reference comparison |
| `pre_spike_steady_4` | 20-60 s | 4 VUs | 40 s | Stable reference at the reviewed synthetic normal-load level |
| `spike_transition_4_to_32` | 60-61 s | 4 -> 32 VUs | 1 s | Near-immediate concurrency increase |
| `spike_peak_32` | 61-106 s | 32 VUs | 45 s | Observe immediate impact and multiple workflow completions |
| `recovery_transition_32_to_4` | 106-107 s | 32 -> 4 VUs | 1 s | Remove target pressure rapidly |
| `recovery_settling_4` | 107-137 s | target 4 VUs | 30 s | Allow surplus VUs to finish safely under graceful ramp-down |
| `recovery_steady_4` | 137-197 s | 4 VUs | 60 s | Compare stable recovery with the pre-spike reference |
| `final_rampdown_4_to_0` | 197-227 s | 4 -> 0 VUs | 30 s | End the invocation gradually |

Proposed nominal schedule length: `227 s` (`3m47s`), excluding any allowed graceful-completion overrun.

Proposed settings: `gracefulRampDown=30s` and `gracefulStop=30s`.

The 90-second recovery target hold consists of the 30-second settling window plus the 60-second steady comparison window. The future implementation must distinguish target VUs from actual active VUs during graceful removal.

## Spike Magnitude Rationale

### Option A — 4 -> 24 VUs

This option isolates suddenness because 24 VUs was already reached progressively during Stress. It has the lowest uncertainty, but it does not test a previously unseen concurrency level.

### Option B — 4 -> a bounded level above 24 VUs

This option tests both sudden arrival and a limited amount of unmeasured concurrency. It adds risk because the SUT and generator share one machine and every workflow creates persistent user and order state.

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Select **32 VUs**.

The value is derived as two additional 4-VU increments above the reviewed Stress maximum: `24 + (2 x 4) = 32`. It is 33.3% above 24 VUs and eight times the 4-VU reference. It is not selected merely because it is a round number.

Stress showed perfect correctness, increasing throughput, low backend/k6 process utilization, and successful recovery through 24 VUs. Those observations support a bounded step above 24, but high whole-machine committed memory argues against a larger jump. Thirty-two VUs is therefore synthetic exploratory load, not production demand or a capacity claim. The goal is to observe response and recovery, not force a crash.

## Rise-Time Rationale

Alternatives considered:

- an immediate zero-duration transition gives the sharpest change but weakens scheduling and phase-attribution clarity;
- a near-immediate one-second transition gives k6 a bounded scheduling interval while remaining abrupt; and
- a five-second or longer ramp is technically gentle enough to blur the distinction from Stress.

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Use a **1-second rise from 4 to 32 VUs**.

Stress used repeated 30-second ramps through intermediate plateaus. A single 1-second rise is thirty times faster, exposes no intermediate measurement plateaus, and remains a genuine Spike.

## Peak Hold

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Hold 32 VUs for **45 seconds**.

The Load iteration p95 was about `15.34 s`, so 45 seconds covers about 2.9 p95 workflow durations. This permits workflows that start near the rise to complete and provides enough request, correctness, throughput, and resource samples. It remains much shorter than each 120-second Stress plateau, so the test does not become sustained Stress.

## Recovery Design

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Drop the target from 32 to 4 VUs in **1 second**, keep the target at 4 VUs for **90 seconds**, and then ramp from 4 to 0 VUs over **30 seconds**.

`gracefulRampDown=30s` allows surplus VUs to finish an active workflow instead of forcing artificial interruption at the recovery boundary. This means actual active VUs may remain above four briefly after the target drops. The first 30 seconds are therefore `recovery_settling_4`; the following 60 seconds are `recovery_steady_4`.

Ninety seconds covers about 5.9 Load p95 workflow durations. It supports a comparison of latency, throughput, correctness, interrupted iterations, and resources against `pre_spike_steady_4` without inventing a business recovery SLO.

## Think-Time

Option A preserves the five reviewed ranges: `1-2 s`, `3-5 s`, `2-4 s`, `2-4 s`, and `1-3 s` at their existing workflow decision points.

Option B reduces or removes think-time. This would increase request frequency per VU while concurrency also rises, changing two independent workload dimensions at once.

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Preserve the Load/Stress think-time exactly.

This keeps request pacing and user behavior comparable, so the major independent change is the sudden concurrency profile. Removing think-time would test a different workload model and weaken attribution of any impact to concurrency suddenness.

## Metrics

Capture and preserve, globally and by phase where meaningful:

- HTTP request count, rate, failures, p50, p90, p95, p99, and maximum;
- per-step request count, p95, p99, failures, and semantic check outcomes;
- checks passed/failed and `workflow_success` passed/failed;
- completed workflows, Checkout count, requests per completed workflow, and cross-phase workflows;
- iteration duration and interrupted iterations;
- target and actual VUs;
- request and completed-workflow throughput;
- backend `node.exe` availability, PID, CPU, working set, private memory, and threads;
- k6 process availability, PID, CPU, working set, private memory, and threads;
- practical whole-machine CPU, committed memory, disk, and network context;
- SQLite/write-related HTTP or application errors, especially Register, Update Profile, Add to Cart, and Checkout; and
- post-spike latency, throughput, correctness, and persistent process/resource effects.

## Threshold Strategy

### A. Correctness invariants

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Retain global correctness invariants for `http_req_failed`, `checks`, and `workflow_success`, with no abort-on-fail behavior.

The positive workflow still expects `http_req_failed rate==0`, `checks rate==1`, and `workflow_success rate==1`. A failed invariant should cause a failed threshold result at test completion but should not abort a technically valid Spike invocation.

### B. Observational Spike indicators

Do not reuse the Load p95, p99, or iteration-duration limits as Spike pass/fail thresholds. Record p95/p99, per-step tails, throughput, iteration duration, interruptions, backend/generator resources, and recovery behavior as observations. No RPS, latency, resource, or recovery SLO is currently authoritative.

### C. Invalid-run and unsafe conditions

Latency growth, HTTP failures, semantic failures, workflow failures, threshold failure, SQLite contention, or delayed recovery are normally results to preserve. They are not automatic rerun or abort reasons.

Stop before traffic if the reviewed design is not frozen, the report type conflicts with the registry, the SUT/data state is invalid, hashes differ, the run ID collides, or evidence capture is not ready.

During traffic, stop only if the SUT was unavailable before meaningful exercise, evidence collection is corrupted, identity collisions are setup-caused, the backend restarts or crashes so remaining traffic is meaningless, k6/resource monitoring becomes unavailable in a way that destroys attribution, or the shared machine becomes unstable or unsafe. Do not implement any threshold yet.

## Spike Response Interpretation

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Evaluate immediate impact with phase aggregates plus short rolling windows around the rise.

A meaningful impact requires corroborating evidence, not one isolated p99 sample. Treat either of these patterns as investigation-worthy:

1. a burst of HTTP, semantic-check, or complete-workflow failures, especially when accompanied by latency, throughput, resource, or SQLite/write evidence; or
2. at least two aligned non-correctness signals, such as a sustained p95/p99 tail increase, throughput failing to respond to the concurrency jump, backend resource escalation, k6 saturation, SQLite/write contention, longer iteration duration, or interrupted workflows.

Use multiple consecutive rolling windows and the whole `spike_peak_32` aggregate before calling a latency-tail change meaningful. Preserve endpoint attribution because write-heavy steps may degrade while faster reads hide the effect in the global distribution.

## Recovery Interpretation

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Compare `recovery_steady_4` with `pre_spike_steady_4`; treat `warmup_4` as retained but excluded warm-up evidence, and treat `recovery_settling_4` separately because actual VUs may still be draining.

Evaluate whether:

- actual VUs settle to four;
- p95/p99 and per-step tails move back toward the pre-spike range without persistent worsening;
- request and workflow throughput return toward the pre-spike range;
- HTTP failures remain absent or cease;
- checks and `workflow_success` return to the pre-spike state;
- no new interrupted iterations appear after settling; and
- backend/k6 CPU and memory move toward stable reference behavior without continuing growth or persistent resource/state effects.

If behavior has not returned toward the reference within the designed recovery observation window, report delayed or incomplete recovery as an observation. Do not call it a breached business SLO.

## Stop / Invalid-Run Conditions

The future pre-run gate must verify the approved script/data/report hashes, a new `K6_RUN_ID`, the expected branch and commit, SUT health, database reseed state, unique identity construction, evidence destinations, backend/k6 process identification, resource sampling, phase markers, and GUI capture readiness.

The shared machine needs a practical health check because prior Stress whole-machine committed memory averaged about 92% and peaked about 95.7%. Unrelated whole-machine activity must not be attributed to EShop or k6.

Bad performance is evidence. Only invalid setup, lost attribution, corrupted collection, backend restart/crash that prevents meaningful continuation, or machine instability justifies stopping. A rerun requires a documented invalid-execution reason and human approval.

## Account Lockout

**Observed runtime fact:** Each isolated account performs one successful Register followed by one correct-password Login. Stress produced no lockout, no Login retry, and no reset.

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Spike does not change the expected lockout assessment because it changes concurrency, not credential correctness. Do not add wrong-password traffic and do not retry failed credentials automatically.

If unexpected lockout behavior appears, preserve the evidence and end the dependent workflow safely. Diagnose and reset only between invocations when required and documented.

## Third Distinct Report Type

The registry already assigns:

- Load: Native k6 Web Dashboard HTML export;
- Stress: Custom k6 end-of-test Markdown Stress Stage Summary; and
- Spike: unassigned.

Local inspection confirmed k6 `v2.1.0`, the standard `--out` capability, built-in CSV and JSON output code, and no installed output extension.

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Designate a **Native k6 CSV metrics output** for Spike, provisionally named `spike-metrics.csv` inside the future invocation directory.

This is a native streaming k6 output/listener equivalent, not an HTML dashboard and not a custom `handleSummary()` Markdown report. It is locally feasible, tabular and human-readable, preservable in `out/`, derived directly from real k6 metric samples, and requires no external service or third-party package. It is distinct from resource-monitor CSV files, which contain external process/system samples rather than k6 result metrics.

Raw NDJSON, summary JSON, resource CSV, stdout/stderr, and screenshots remain common evidence and do not become the designated report. The registry must remain `UNASSIGNED` until the student accepts this proposal.

## Phase Attribution

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Use these logical phase names:

- `warmup_4`;
- `pre_spike_steady_4`;
- `spike_transition_4_to_32`;
- `spike_peak_32`;
- `recovery_transition_32_to_4`;
- `recovery_settling_4`;
- `recovery_steady_4`; and
- `final_rampdown_4_to_0`.

Assign phase from one monotonic run-start timestamp and the frozen schedule, not from VU count alone. Apply the phase tag at request/metric emission time. Record iteration-start and iteration-end phase, and count cross-phase iterations separately so they are not silently assigned to a single plateau.

The future runner, raw results, native CSV metrics output, resource CSVs, console markers, and screenshot schedule must share the same run ID, phase vocabulary, elapsed-time origin, and target-VU map. Preserve the raw `vus` gauge so actual active VUs can be distinguished from target VUs during graceful recovery.

## GUI Capture Plan

**AI PROPOSAL — HUMAN REVIEW REQUIRED:** Prepare real same-run capture before traffic and use scheduled rolling screenshots because a one-second transition is too fast for manual capture.

Capture at least:

- one fixed pre-spike frame near elapsed 45 s;
- one-second rolling frames from approximately 58-68 s around the rise;
- one fixed peak frame near elapsed 80-90 s;
- one-second rolling frames from approximately 104-114 s around the drop;
- one early-recovery frame during `recovery_settling_4`; and
- one later-recovery frame during `recovery_steady_4`.

Each useful frame must show active k6 execution, run ID, phase marker, elapsed time/target load, backend `node.exe` PID/CPU/memory, preferably k6 PID/CPU/memory, and wall-clock timestamp. Arrange windows and verify capture permissions before traffic so another window cannot obstruct the evidence.

Default primary screenshot candidate: the clearest valid `spike_peak_32` frame within the first ten seconds after the rise, provisionally near elapsed 66 s. If the strongest real multi-signal impact occurs in another already captured frame, the student may select that genuine same-run frame during evidence review. Never reconstruct or restage a missed frame.

## Resource Correlation

Use timestamp and phase as the join keys across all outputs. For each comparison phase, retain:

| Dimension | Required attribution |
|---|---|
| Load | target VUs and timestamp-aligned actual `vus` gauge |
| Traffic | request count/rate and completed-workflow count/rate |
| Latency | global and per-step p95/p99, with sample counts |
| Correctness | HTTP failures, checks, `workflow_success`, Checkout count, and request/workflow ratio |
| Completion | iteration duration, interrupted iterations, and cross-phase iterations |
| Backend | availability, PID, CPU, working set, private memory, and threads |
| Generator | availability, PID, CPU, working set, private memory, and threads |
| Machine | CPU, committed memory, disk, and network context |

Produce direct comparisons for `pre_spike_steady_4`, `spike_peak_32`, and `recovery_steady_4`. Retain `warmup_4` as explicit evidence but exclude it from the primary healthy-reference aggregate. Keep transition and settling evidence separate. Derive rates only from direct counters divided by documented observed phase seconds, and label every derived value.

## Human Review Outcome — Accepted for Implementation

**HUMAN-REVIEWED — ACCEPTED:** One closed `ramping-vus` scenario with `startVUs=4`; 60 seconds at target 4; 4 -> 32 in 1 second; 45 seconds at 32; target 32 -> 4 in 1 second; 90 seconds at target 4; 4 -> 0 in 30 seconds; `gracefulRampDown=30s`; and `gracefulStop=30s`. The nominal traffic schedule is frozen at 227 seconds.

**HUMAN-REVIEWED — ACCEPTED:** Preserve all five think-time ranges unchanged: `1-2 s`, `3-5 s`, `2-4 s`, `2-4 s`, and `1-3 s`.

**HUMAN-REVIEWED — ACCEPTED:** Configure only `http_req_failed: rate==0`, `checks: rate==1`, and `workflow_success: rate==1`, without `abortOnFail`. Latency, RPS, iteration duration, per-step, per-phase, recovery, and resource values remain observational.

**HUMAN-REVIEWED — ACCEPTED:** Use multi-signal Spike-response assessment; compare recovery with the healthy pre-spike reference; retain bad performance as evidence; and classify invalid or unsafe execution separately.

**HUMAN-REVIEWED — ACCEPTED:** Use one correct-password Login per unique account, no intentionally incorrect password, no credential retry, and reset only between invocations if unexpectedly required and documented.

**HUMAN-REVIEWED — ACCEPTED:** Use Native k6 CSV metrics output as the third distinct designated report, provisionally named `spike-metrics.csv`. Keep raw NDJSON, summary JSON, resources, logs, metadata, hashes, and screenshots as separate common evidence.

**HUMAN-REVIEWED — ACCEPTED:** Use explicit elapsed-time phase attribution, cross-phase iteration tracking, timestamp-based resource correlation, and automated rolling GUI capture around the one-second rise and drop.

### Human-review correction 1 — warm-up attribution

The first 60 seconds remain unchanged at target 4 VUs, but attribution is frozen as `warmup_4` for `0s <= elapsed < 20s` and `pre_spike_steady_4` for `20s <= elapsed < 60s`. Warm-up samples remain real evidence and are not deleted or ignored, but they are excluded from the primary healthy-reference comparison. Recovery comparison uses `pre_spike_steady_4` versus `recovery_steady_4`.

### Human-review correction 2 — target versus actual VUs

The one-second 32 -> 4 stage is a target-load drop, not a claim that actual active VUs become four within one second. `recovery_settling_4` is `107s <= elapsed < 137s`; `recovery_steady_4` is `137s <= elapsed < 197s`. Native k6 `vus` evidence must verify actual active VUs. The later review may use `recovery_steady_4` as a steady 4-VU comparison only if actual VUs have settled approximately to four; otherwise it must record and classify the non-steady window without fabricating recovery.

Implementation is authorized from these frozen decisions. Official Spike traffic still requires the implementation/evidence validation gate and a separate execution step.
