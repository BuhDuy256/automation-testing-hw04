# Stress Test Plan Design

## 1. Decision provenance

This design uses the evidence labels required by the reusable Performance Testing
Lifecycle Skill:

- **[Assignment requirement]**: mandated by the authoritative HW05 brief.
- **[Observed runtime fact]**: verified from the SUT, finalized workflow contract,
  finalized CSV design, or official Load execution.
- **[Calibration measurement]**: measured during controlled Load calibration.
- **[AI proposal]**: proposed in this Stress design and not yet approved.
- **[Synthetic assumption]**: deliberately modeled without production evidence.
- **[Human-reviewed decision required]**: must be explicitly accepted or corrected
  before Stress implementation or execution.
- **[Human-reviewed decision — ACCEPTED]**: explicitly accepted by the student after
  reviewing the proposal and its evidence limits.

No production traffic model, business latency SLO, error budget, throughput target,
or known breaking point exists. Four VUs is a reviewed synthetic normal-load level for
this local machine, not a production-demand claim. The Stress decisions recorded as
accepted below are frozen for implementation; their acceptance does not convert them
into production requirements.

## 2. Objective

**[Assignment requirement]** The Stress test must exercise the same end-to-end
workflow as Load, cover the auth-heavy, read-heavy, and transactional endpoint groups,
use the finalized CSV-controlled inputs, and preserve real execution evidence.

**[Human-reviewed decision — ACCEPTED]** The Stress objective is to
progressively exceed the reviewed 4-VU normal-load baseline and make the first region
of sustained degradation observable. The test should distinguish stable scaling,
visible degradation, and severe degradation or instability if those regions occur.
It should not choose one arbitrary large VU count, claim a production capacity, or
force the SUT to crash merely to report a breaking point.

The later run should answer this question:

> At what tested VU plateau did additional concurrency stop producing healthy scaling,
> and which latency, throughput, correctness, backend-resource, or generator-resource
> signals support that conclusion?

## 3. Starting evidence

### 3.1 Primary official Load baseline

**[Observed runtime fact]** The primary Load submission-evidence invocation is
`K6_RUN_ID=20260817t045341487`.

| Measurement | Primary Load result |
|---|---:|
| Reviewed synthetic normal-load level | 4 VUs |
| Completed workflows | 94 |
| HTTP requests | 846 |
| Requests per successful workflow | 9 |
| Interrupted iterations | 0 |
| `http_req_failed` | 0% |
| `checks` | 100% |
| `workflow_success` | 100% |
| HTTP p95 | 16.35 ms |
| HTTP p99 | 20.77 ms |
| Iteration p95 | 15.34 s |

The Load latency thresholds were provisional regression guards for the measured
machine and SUT state. They are not business SLOs and are not copied into Stress as
universal pass/fail limits.

### 3.2 Calibration evidence

**[Calibration measurement]** Controlled exploration covered 1, 2, 4, and 8 VUs.
Both 4-VU measurements were correct and repeatable. Eight VUs also preserved 100%
workflow and semantic correctness, but overall HTTP p99 increased to approximately
122.377 ms and Register p95 increased to approximately 123.832 ms. This is an early
tail-latency/contention signal, not a demonstrated capacity failure.

The 8-VU point is therefore the first Stress anchor: it must be revisited before moving
to unmeasured levels.

### 3.3 Resource and architecture evidence

**[Observed runtime fact]** During the primary 4-VU Load run, the backend process used
approximately 0.065% average and 0.502% maximum total-machine CPU, with a maximum
working set of 55.289 MB. k6 used approximately 0.084% average and 0.322% maximum
total-machine CPU, with a maximum working set of 43.438 MB. Whole-machine CPU averaged
12.424% and peaked at 40.843%; committed memory averaged 74.461% and peaked at 74.823%.
Whole-machine measurements include unrelated activity and must not be attributed only
to EShop or k6.

**[Observed runtime fact]** The SUT uses one Node.js/Express backend process, one local
SQLite database handle, no configured Node worker pool, and no observed explicit WAL
or busy-timeout tuning. Register, Update Profile, and Checkout write persistent state.
The in-process cart is keyed by user ID and is not cleared by Checkout. k6 and the SUT
run on the same Windows machine, so generator saturation and unrelated system load can
confound a backend conclusion.

These facts justify progressive observation of write tails, persistent-state growth,
backend resources, generator resources, and whole-machine safety. Low 4-VU process
utilization does not prove linear scaling at higher VUs.

## 4. Frozen workflow and data strategy

**[Assignment requirement] [Observed runtime fact]** Every successful Stress iteration
must execute exactly this workflow without simplification:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

Each successful workflow must issue exactly nine HTTP requests and exactly one
Checkout.

The finalized CSV schema remains unchanged:

`identity_seed,name,password,phone,shipping_address,quantity`

The Stress implementation must later preserve all reviewed Load behavior:

- generate a unique email from the fresh run ID, scenario identity, test-wide VU ID,
  scenario iteration ID, and CSV `identity_seed`;
- retain the Register email and CSV password for Login;
- correlate the Login JWT into Profile, Cart, and Checkout requests;
- select a product whose `category_id` matches a returned category;
- use Product Detail `id`, `name`, and `price` as the Cart values;
- calculate Checkout `total_amount` from runtime price multiplied by CSV quantity;
- explicitly send the same non-empty CSV `shipping_address` to Update Profile and
  Checkout;
- preserve the same semantic checks, dependency-failure behavior, per-step tags, and
  custom `workflow_success` definition;
- keep each iteration's account, cart, and order state isolated; and
- never insert a hard-coded runtime correlation fallback.

## 5. Proposed workload profile

**[Human-reviewed decision — ACCEPTED]** Use one closed `ramping-vus`
scenario named `stress`. The measurement plateaus are 4, 8, 12, 16, 20, and 24 VUs.
Use a short controlled transition between levels, then hold each target for two
minutes. After the maximum plateau, return to 4 VUs and hold for two minutes to observe
recovery before ramping to zero.

### 5.1 Profile summary

| Sequence | Target VUs | Duration | Relationship to evidence | Reason for inclusion | Expected signal |
|---:|---:|---:|---|---|---|
| 1 | Ramp from 1 to 4 | 30 s | Reaches the reviewed 4-VU Load baseline | Detect setup problems without an abrupt initial registration burst; not a measurement plateau | Valid traffic begins, scheduled VUs are reached, and no identity/correlation failure appears |
| 2 | Hold 4 | 2 min | `1x` baseline; below the explored 8-VU point | Establish an in-run reference under the same invocation, machine state, database state, and instrumentation as later plateaus | Latency, RPS, correctness, and resources should resemble healthy Load behavior, without treating exact Load values as mandatory |
| 3 | Ramp 4 to 8 | 30 s | Moves to `2x` baseline and the highest calibrated point | Avoid a spike-shaped jump and make the transition attributable | Tail latency may begin to change while correctness remains intact |
| 4 | Hold 8 | 2 min | `2x` baseline; exactly the previously explored point | Test whether the earlier p99 growth is reproducible within the official Stress invocation | Repeated workflow samples plus p95/p99 and Register/write-tail behavior at the known anchor |
| 5 | Ramp 8 to 12 | 30 s | Moves to `3x` baseline and `1.5x` the explored 8-VU point | Enter the first unmeasured region with one baseline-sized increment | Determine whether tail growth persists and whether RPS still scales with VUs |
| 6 | Hold 12 | 2 min | `3x` baseline; `1.5x` the 8-VU point | Sample an intermediate level rather than jumping directly to a large maximum | First possible sustained degradation across latency, throughput, correctness, or resources |
| 7 | Ramp 12 to 16 | 30 s | Moves to `4x` baseline and `2x` the 8-VU point | Continue the same four-VU increment and reach a clearly elevated but bounded level | A stronger distinction between healthy scaling and tail/throughput degradation may appear |
| 8 | Hold 16 | 2 min | `4x` baseline; `2x` the 8-VU point | Provide the planned primary visual-evidence stage and a central high-load plateau | Stable scaling, visible degradation, or resource growth should be distinguishable without waiting for the maximum |
| 9 | Ramp 16 to 20 | 30 s | Moves to `5x` baseline and `2.5x` the 8-VU point | Avoid the larger unobserved jump from 16 directly to 24 | Check marginal RPS gain, latency-tail progression, and state/resource growth |
| 10 | Hold 20 | 2 min | `5x` baseline; `2.5x` the 8-VU point | Add another measured plateau before the bounded ceiling | Confirm whether a suspected transition is sustained rather than a one-stage outlier |
| 11 | Ramp 20 to 24 | 30 s | Moves to `6x` baseline and `3x` the 8-VU point | Reach the proposed bounded exploration ceiling gradually | Observe whether severe degradation or instability appears, but do not require failure |
| 12 | Hold 24 | 2 min | `6x` baseline; `3x` the 8-VU point | Highest proposed level; large enough to extend beyond calibration while remaining bounded | Highest valid-stage latency, RPS, correctness, resource, SQLite/backend, and interruption signals |
| 13 | Ramp 24 to 4 | 1 min | Returns to the reviewed normal-load level | Reduce pressure gradually and test whether behavior recovers after accumulated state and load | Latency, RPS, and resources should trend toward the opening 4-VU plateau if recovery is healthy |
| 14 | Hold 4 | 2 min | Same VU count as the opening reference | Compare pre-stress and post-stress behavior within one invocation | Persistent degradation, unrecovered resources, or state-growth effects become visible |
| 15 | Ramp 4 to 0 | 1 min | Graceful completion | Avoid discarding active workflows at normal shutdown | Active iterations complete within the reviewed grace period |

Nominal stage time is 19 minutes: 30 seconds to the opening baseline, twelve minutes
across six measurement plateaus, 2.5 minutes across five upward transitions, one
minute to recovery load, two minutes of recovery, and one minute to zero.

**[Human-reviewed decision — ACCEPTED]** Use
`gracefulRampDown: 30s` and `gracefulStop: 30s`. Thirty seconds exceeds the primary
Load iteration p95 of 15.34 seconds and the theoretical 18-second maximum synthetic
think-time, while allowing additional time for stressed API responses.

### 5.2 Duration rationale

**[Calibration measurement]** At the primary Load iteration p95, a two-minute plateau
spans approximately 7.8 p95 iteration durations. At 4 VUs this corresponds to roughly
31 potential workflow envelopes before allowing for transitions and variation. Higher
levels provide more concurrent opportunities if the SUT remains healthy.

**[Human-reviewed decision — ACCEPTED]** Two minutes is intended to produce repeated
complete workflows and make a sustained change more credible than a brief peak. It
does not claim statistical confidence. If iteration duration expands so far that few
workflows finish during a plateau, the reduced completion count and interruption
behavior are Stress evidence; they must not be hidden by silently extending or
rerunning the official test.

### 5.3 Maximum-VU rationale

**[Synthetic assumption] [Human-reviewed decision — ACCEPTED]** Twenty-four VUs is a
bounded exploration ceiling, not a known capacity limit. It is six times the reviewed
normal-load level and three times the highest calibrated level. Four-VU increments
create intermediate evidence at 12, 16, and 20 VUs before reaching it. This is more
diagnostic than one large jump.

The ceiling is deliberately bounded because no evidence establishes a safe or useful
larger number, the SUT and generator share one machine, committed memory was already
approximately 74.5% under Load due to all machine activity, and every completed
workflow grows persistent user/order state and in-memory cart state. Human review
accepted 24 VUs as the bounded maximum; it must not be changed during implementation
or execution without renewed review.

## 6. Think-time decision

### Option A: preserve Load think-time

**[Synthetic assumption]** Keep the same user-decision delays:

| After step | Delay |
|---|---:|
| Register | Random 1-2 s |
| Read Profile | Random 3-5 s |
| Read Products | Random 2-4 s |
| Read Product Detail | Random 2-4 s |
| Add Product to Cart | Random 1-3 s |

This preserves the Load traffic model and changes one main independent variable:
concurrent users. It supports direct comparison of latency, achieved RPS, workflow
duration, and resource behavior against Load and the in-run 4-VU reference.

### Option B: reduce or remove think-time

Reducing or removing think-time changes the traffic model from an interactive closed
customer journey toward a tight API-processing loop. Each VU would issue requests far
more frequently, so a result could not be attributed only to higher concurrency. This
could be useful for a separate throughput or saturation experiment, but it would
confound the requested Stress comparison unless explicitly reviewed as a different
model.

**HUMAN-REVIEWED — ACCEPTED:** Keep Option A unchanged for this HW05 Stress test.
Increase pressure through progressive VU levels, not by silently changing user
behavior. Do not remove or shorten think-time during implementation or execution.

## 7. Metrics and stage attribution

Every later measurement must be attributable to a named VU plateau or transition.
The future implementation and runner should preserve timestamps and a stable phase
label such as `baseline_4`, `anchor_8`, `level_12`, `level_16`, `level_20`,
`maximum_24`, or `recovery_4`.

Observe at each full plateau:

- overall and per-endpoint `http_req_duration` p50, p90, p95, and p99;
- `http_req_failed` rate and count;
- semantic `checks` rate, passes, and failures;
- custom `workflow_success` rate, successes, and failures;
- completed workflows and per-step request counts;
- achieved RPS and completed workflows per second;
- `iteration_duration` p95 and p99, clearly noting that it includes think-time;
- active/scheduled VUs and maximum VUs reached;
- interrupted iterations;
- backend CPU, working set/private memory, thread count, and process availability;
- k6 CPU, memory, thread count, and ability to schedule the intended VUs;
- whole-machine CPU, committed memory, and disk activity, with unrelated activity
  explicitly acknowledged; and
- backend/SQLite symptoms such as lock-related errors, write-tail growth, crash, or
  loss of responsiveness.

Each successfully completed workflow must still contribute one request to each of the
nine stable step tags. A mismatch between completed workflows and step counts requires
explanation rather than a fabricated normalization.

### 7.1 Human-review correction: direct stage attribution

**[Human-reviewed decision — ACCEPTED]** Every request, check, workflow result, and
relevant custom metric must carry a stable `stress_level` tag derived during execution
from the reviewed schedule. Measurement values are `baseline_4`, `anchor_8`,
`level_12`, `level_16`, `level_20`, `maximum_24`, and `recovery_4`. Transitions use
separate explicit labels. The existing `step` tag remains unchanged, so raw samples
support combinations such as `step=checkout, stress_level=level_16`.

Installed k6 v2.1.0 validation showed that arbitrary tagged submetrics do not appear in
`handleSummary()` unless k6 materializes them. Because human review forbids adding
per-stage latency thresholds merely to force materialization, implementation must also
record direct stage-named Trend, Counter, and Rate metrics. These direct metrics supply
real stage aggregates to `handleSummary()` while the tags preserve granular raw
evidence. Any report rate calculated from a direct count and observed stage duration
must be labeled as deterministic derivation, not a direct k6 percentile.

## 8. Threshold strategy

### 8.1 Correctness invariants

**[Human-reviewed decision — ACCEPTED]** Keep these strict invariants:

- `http_req_failed: rate == 0`;
- `checks: rate == 1`; and
- `workflow_success: rate == 1`.

They describe the intended positive workflow, not acceptable latency. If implemented,
they should set the final Stress threshold status but must not use `abortOnFail`.
An error or semantic failure is boundary evidence and should normally allow the
remaining valid Stress stages to continue. Per-stage rates and counts must also be
reported so an aggregate does not hide the first affected level.

### 8.2 Performance degradation indicators

**[Human-reviewed decision — ACCEPTED]** Do not apply the Load HTTP p95
`<60 ms`, HTTP p99 `<85 ms`, or iteration p95 `<19 s` guards as Stress-wide pass/fail
thresholds. Do not invent a throughput pass threshold.

Treat p95, p99, per-endpoint tails, iteration duration, completed workflows, RPS,
marginal RPS gain, and resource growth as stage-by-stage observational indicators.
Their purpose is to locate and explain degradation, not require Stress to remain as
fast as normal Load at every level.

### 8.3 Invalid-run conditions

Preflight and runtime validity conditions are separate from metric thresholds. The
runner should verify the SUT and data before traffic, preserve evidence continuously,
and stop only when a condition makes the remaining run unsafe, untrustworthy, or no
longer representative. Section 10 defines those conditions.

## 9. Stress-boundary interpretation

**[Human-reviewed decision — ACCEPTED]** Identify the first meaningful
degradation stage from a combination of signals, never from one arbitrary latency
number.

Use the opening 4-VU plateau as the primary same-run reference and the official Load
metrics as historical context. Mark the earliest full plateau as a candidate boundary
when both conditions below hold:

1. **A sustained performance signal exists**, such as:
   - overall p95 or p99 is at least twice the opening 4-VU value and at least 50% worse
     than the immediately preceding plateau;
   - repeated p95/p99 growth appears in at least two relevant endpoint steps, especially
     write-heavy Register, Update Profile, or Checkout; or
   - a VU increase of at least 50% produces less than half of the proportional RPS gain,
     or RPS becomes flat/declines while completed-workflow duration rises.
2. **An independent corroborating signal exists**, such as:
   - HTTP, semantic-check, or complete-workflow correctness deteriorates;
   - backend CPU, memory, disk behavior, or responsiveness shows sustained pressure;
   - interrupted iterations appear or completed workflows fall materially;
   - the backend remains pressured while k6 still has generator headroom; or
   - the next plateau repeats the same latency/throughput pattern.

The `2x`, `50%`, and scaling-efficiency rules are accepted diagnostic rules relative
to measured baselines, not business SLOs. They require later validation against the
raw stage data before drawing a result conclusion.

Classify a region as severe degradation or instability only when evidence becomes
stronger, for example correctness falls, errors repeat, RPS plateaus or declines while
VUs rise, latency and iteration tails escalate across plateaus, resources approach
sustained saturation, the backend becomes intermittently unavailable, or interrupted
workflows accumulate. A single short peak is insufficient.

If all valid plateaus through 24 VUs remain healthy, report only that no meaningful
boundary was observed within the reviewed range. Do not claim capacity above 24 VUs
and do not rerun automatically with a larger maximum merely to force failure.

## 10. Stop and invalid-run conditions

### 10.1 Bad performance that remains valid evidence

Continue the reviewed run, while preserving evidence, when the machine remains safe
and the traffic remains meaningful despite:

- Load regression guards or Stress correctness thresholds failing;
- high p95/p99 or iteration duration;
- RPS flattening or declining;
- HTTP, semantic-check, or workflow failures;
- endpoint tail growth or SQLite lock/error responses;
- high but stable backend resource use;
- interrupted iterations that do not make the remaining traffic meaningless; or
- an unfavorable maximum-stage result.

These outcomes are the purpose of Stress testing and must not trigger an automatic
clean rerun.

### 10.2 Conditions that stop an invalid or unsafe run

**[Human-reviewed decision — ACCEPTED]** Stop and preserve all evidence
collected so far when any of these conditions occurs:

- the backend crashes or remains unreachable long enough that later stages cannot
  exercise the intended nine-step workflow;
- k6/generator CPU, memory, scheduling, or process stability becomes the limiting
  factor, so additional VUs no longer represent SUT pressure;
- raw output, resource monitoring, timestamps, stage markers, or run identity becomes
  corrupted or unavailable;
- a reused/malformed `K6_RUN_ID`, CSV fault, or setup-caused identity collision makes
  generated accounts invalid;
- Windows or the shared machine becomes unstable, memory/disk pressure threatens the
  machine, or continuing risks data/evidence corruption;
- the SUT is restarted, reseeded, or materially changed during the invocation;
- the implementation diverges from the reviewed workflow, think-time, stage profile,
  checks, or correlations; or
- repeated dependency failures leave most VUs unable to progress beyond an early step,
  so the remaining traffic no longer represents the intended full workflow.

Do not define one transient CPU or latency sample as an automatic stop. Generator and
machine-safety judgments should use sustained observations and must be included in the
human pre-run review.

## 11. Account-lockout assessment

**[Assignment requirement]** When Stress or Spike triggers the three-failed-login
lockout, reset it between runs and document the steps.

**[Observed runtime fact]** The frozen positive workflow registers a unique account and
logs in once with the exact generated email and original correct CSV password. It does
not retry Login and does not intentionally send an incorrect password.

Assessment: the lockout is **not naturally triggered** by this Stress workflow. Do not
add wrong-password traffic merely to exercise lockout, because that would alter the
frozen workflow and the Stress traffic model.

If an unexpected Login failure or lockout response appears:

1. preserve the response, account/run identity, stage, and raw evidence;
2. record it as an HTTP/semantic/workflow failure without retrying credentials;
3. continue only while later VUs still execute the intended workflow meaningfully;
4. stop if lockout or authentication behavior prevents representative end-to-end
   traffic; and
5. diagnose and reset lockout only between invocations, with documented human review,
   before any later approved run.

## 12. Proposed distinct Stress report type

Current designated-report registry:

| Scenario | Designated report | Status |
|---|---|---|
| Load | Native k6 Web Dashboard HTML export | USED |
| Stress | Custom k6 end-of-test Markdown Stress Stage Summary | ASSIGNED / USED-FOR-DESIGN |
| Spike | Unassigned | UNASSIGNED |

**HUMAN-REVIEWED — ACCEPTED:** Use a **custom k6 end-of-test Markdown Stress
Stage Summary**, generated through k6's built-in `handleSummary()` lifecycle function,
as the designated Stress report type.

The report should be a human-readable `.md` file under the invocation-specific Stress
evidence directory in `out/`. It should contain the run identity, reviewed stage
profile, stage-by-stage VUs, completed workflows, RPS, correctness, p95/p99,
iteration duration, interrupted iterations, threshold status, and a resource-summary
cross-reference. It must be generated from that invocation's summary data, not rebuilt
afterward from memory.

This qualifies as distinct because it is a k6 custom end-of-test summary rendered as
a stage-comparison Markdown document, not the native k6 Web Dashboard HTML mechanism
used by Load. It is also not merely stdout/stderr or raw JSON. k6 officially supports
custom text formats and file destinations through `handleSummary()`:
<https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/>.
No third-party package, remote dashboard, or arbitrary dependency is required.

This accepted Stress assignment does not assign a Spike report type. The task-specific
registry records the design use now; the evidence path remains pending until an
official invocation exists.

## 13. Evidence and GUI capture plan

### 13.1 Common attributable evidence

The later official Stress invocation should preserve, in a new non-overwriting run-ID
directory:

- exact reviewed script and CSV with hashes;
- exact command, environment, k6 version, commit, start/end timestamps, and run ID;
- direct raw NDJSON, machine summary JSON, stdout, and stderr;
- stage-attributable per-step metrics and completed-workflow counts;
- backend, k6, and whole-machine resource samples covering every phase;
- the approved custom Markdown Stress Stage Summary;
- real same-run screenshots and a screenshot manifest; and
- all stop, crash, lockout, threshold, interruption, reseed, and evidence notes.

These common files may repeat mechanisms used for Load; only the designated Markdown
report view must be distinct.

### 13.2 GUI screenshot strategy

**[Human-reviewed decision — ACCEPTED]** Plan the 16-VU plateau as the
primary capture stage because it is four times the normal-load baseline, twice the
highest calibrated level, and still leaves two later plateaus for escalation. Capture
near the middle or final third of its two-minute hold, after enough complete workflows
have accumulated.

The actual first degradation stage cannot be known before execution. Therefore,
prepare capture before traffic and take multiple real screenshots:

- one during the opening 4-VU reference;
- one during each 8, 12, 16, 20, and 24-VU plateau;
- one during the recovery 4-VU plateau; and
- optional rolling captures every 10-15 seconds across 12-24 VUs if storage and desktop
  automation remain reliable.

After the run, select the clearest already-captured frame from the first meaningful
degradation stage as the primary analytical screenshot. If no degradation appears,
use the clearest valid 24-VU plateau frame. Never reconstruct a missed screenshot.

The runner should print an entry marker and periodic live marker such as:

```text
STRESS_PHASE=plateau STRESS_LEVEL=level_16 TARGET_VUS=16 RUN_ID=<run_id> ELAPSED=<seconds>
```

Each same-frame screenshot should show:

- active k6 execution and current VU/progress output;
- the visible run ID, stage marker, elapsed time, and system timestamp;
- Task Manager or Resource Monitor showing the backend `node.exe` PID, CPU, and memory;
- preferably the `k6.exe` PID, CPU, and memory in the same view; and
- enough desktop context to attribute the monitor and k6 process to the invocation.

Task Manager view/sort/placement should be prepared before traffic. If Windows
integrity boundaries block automation, request only the required manual setup and
record the limitation honestly.

## 14. Resource interpretation plan

For every full plateau, build one aligned comparison row:

`VU level <-> completed workflows <-> RPS <-> p95/p99 <-> workflow success <-> backend resources <-> k6 resources <-> interruptions`

Use timestamps and phase labels to align raw k6 points with process/system resource
samples. Compare:

1. opening 4 VUs against the official Load baseline;
2. 8 VUs against the earlier calibration signal;
3. every higher plateau against both the previous plateau and opening 4 VUs;
4. RPS gain against the percentage VU increase;
5. overall latency against per-endpoint tails, especially the write-heavy steps;
6. correctness and completion counts against backend resource growth;
7. backend pressure against k6 pressure to rule out generator saturation; and
8. recovery 4 VUs against opening 4 VUs to detect persistent degradation or state
   growth effects.

Do not infer backend saturation from whole-machine CPU or memory alone. Whole-machine
signals include unrelated work and must be corroborated by backend process behavior,
disk symptoms, response patterns, and generator headroom.

## 15. Human Review Outcome — Accepted for Implementation

On 2026-08-17, the student explicitly accepted the following decisions:

1. the closed `ramping-vus` executor and exact 19-minute profile;
2. opening `1 -> 4` over 30 seconds, then two-minute plateaus at 4, 8, 12, 16, 20,
   and 24 VUs with 30-second upward transitions;
3. 24 VUs as the bounded exploratory maximum;
4. `24 -> 4` over one minute, a two-minute 4-VU recovery hold, and `4 -> 0` over
   one minute;
5. `gracefulRampDown: 30s` and `gracefulStop: 30s`;
6. all five Load think-time ranges without reduction;
7. strict `http_req_failed`, `checks`, and `workflow_success` correctness thresholds,
   without `abortOnFail` and without latency, iteration-duration, RPS, endpoint, or
   stage latency thresholds;
8. the relative multi-signal degradation interpretation;
9. the distinction between bad-but-valid Stress results and invalid/unsafe stop
   conditions;
10. the account-lockout assessment and no intentionally incorrect password traffic;
11. the custom k6 `handleSummary()` Markdown Stress Stage Summary as the distinct
    designated Stress report;
12. direct `stress_level` attribution plus the existing stable `step` tag;
13. direct stage-named metrics for `handleSummary()` and real tags in raw evidence;
14. the 16-VU default primary candidate and multi-stage GUI capture strategy; and
15. the stage-by-stage resource-correlation method.

These decisions are frozen for implementation. The next lifecycle gate remains in
force: validate the implementation and evidence preparation, then stop before official
Stress traffic. Any material implementation difference requires renewed human review.
