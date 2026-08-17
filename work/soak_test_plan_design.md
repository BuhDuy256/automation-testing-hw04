# HW05 Soak / Endurance Test Plan Design

> **Status:** HUMAN-REVIEWED — ACCEPTED FOR IMPLEMENTATION
>
> Implementation and offline validation are authorized. Backend restart, official evidence
> generation, and performance traffic remain unauthorized until a separate execution review.

## Human Review Outcome — Accepted for Implementation

**HUMAN-REVIEWED — ACCEPTED:** Use one closed `ramping-vus` scenario starting at 1 VU,
ramping to 12 VUs over 60 seconds, sustaining 12 VUs for 720 seconds, and ramping to 0 VUs
over 30 seconds. Use `gracefulRampDown: 30s` and `gracefulStop: 30s`.

**HUMAN-REVIEWED — ACCEPTED:** Freeze these actual-scenario-elapsed windows:

- `warmup_entry`: `0 <= elapsed < 60s`;
- `early_steady`: `60 <= elapsed < 300s`;
- `middle_steady`: `300 <= elapsed < 540s`;
- `late_steady`: `540 <= elapsed < 780s`;
- `exit_ramp`: `780 <= elapsed < 810s`;
- `graceful_completion`: after 810 seconds while real in-flight work continues; and
- `post_load_recovery`: two resource-only minutes after confirmed traffic completion.

**HUMAN-REVIEWED — ACCEPTED:** Preserve the five existing think-time ranges, frozen
workflow, finalized CSV schema, runtime correlations, semantic checks, safe dependency
failure, and absence of hard-coded runtime fallbacks.

**HUMAN-REVIEWED — ACCEPTED:** Use only `http_req_failed: rate==0`, `checks: rate==1`, and
`workflow_success: rate==1`, without `abortOnFail`. Keep latency, throughput, memory, and
resources observational. Define no pre-run business SLO and reuse no Load latency threshold.

**HUMAN-REVIEWED — ACCEPTED:** Sample resources every two seconds, take active-run screenshot
targets near 90, 420, and 720 seconds, and optionally capture a resource-only frame about 60
seconds after confirmed traffic completion.

**HUMAN-REVIEWED — ACCEPTED:** Perform one clean backend restart/reseed immediately before
official execution. Use no fourth designated report type. Prepare a compact Soak evidence
package based on raw NDJSON, summary, resource evidence, and a human-readable factual window
summary.

**HUMAN-REVIEWED — ACCEPTED:** Extend the existing Performance Testing Lifecycle Skill with
one reusable Soak/Endurance reference rather than creating a new Skill.

### Accepted throughput interpretation correction

After execution, calculate the candidate sustained-throughput floor as the minimum measured
request rate and minimum measured completed-workflow rate across `early_steady`,
`middle_steady`, and `late_steady`, using direct counts divided by actual measured window
seconds.

The existence of a minimum does not prove stable throughput. Use “observed stable RPS at 12
VUs over 12 minutes” only if actual VUs maintained the reviewed steady load, measured
correctness is considered, throughput has no material sustained late collapse, the generator
or shared machine did not dominate, and latency/resource evidence supports the wording. Do
not define a fixed percentage stability SLO before execution.

If throughput materially declines, report: “Minimum observed sustained-window throughput was
X req/s, with a late-vs-early change of Y%.” Do not call the late minimum a stable floor,
maximum stable RPS, SLO, or capacity.

## Evidence Labels

- **Assignment requirement:** mandated by the authoritative HW05 brief.
- **Observed runtime fact:** verified from the SUT contract or an official execution artifact.
- **Calibration measurement:** measured during a completed, controlled performance run.
- **Synthetic planning estimate:** calculated for planning and not yet measured by Soak.
- **AI proposal:** recommended design choice that is not accepted yet.
- **Human-reviewed decision required:** a responsible human must accept or correct the proposal before implementation.

## Objective

**Assignment requirement:** Determine whether the SUT remains correct and stable under a
stable sustained load for approximately 10–15 minutes, and collect enough evidence to
report at least one concrete empirical threshold or stable operating observation for the
tested hardware and SUT conditions.

The Soak should answer these factual questions after execution:

1. Do transport checks, semantic checks, and complete workflows remain correct over time?
2. Do HTTP latency and completed-workflow duration remain stable from early to late steady load?
3. Does achieved request rate and workflow rate remain stable across steady windows?
4. Does backend memory remain flat, rise and stabilize, keep rising, or fall after traffic stops?
5. Are backend, k6, and whole-machine resources available and attributable throughout the run?
6. How much persistent user and order state accumulates during the observation?

This design does not define a business SLO, diagnose a memory leak, claim production
capacity, or propose code optimization.

## Assignment Requirement

**Assignment requirement:** Run a short endurance/soak test at sustained load for around
10–15 minutes and report a concrete empirical threshold with numbers, such as an observed
stable RPS or a memory ceiling.

**Assignment requirement:** The submitted Load, Stress, and Spike plans use the same
data-driven end-to-end workflow across auth-heavy, read-heavy, and transactional endpoint
groups.

**Observed runtime fact:** Current project direction freezes that verified workflow for Soak
as well. This design therefore does not simplify or replace it.

**Assignment requirement:** Real raw results, resource evidence, and screenshots must be
attributable to the actual invocation. No evidence may be reconstructed.

The requirement does not require a fourth distinct report type for Soak. The three distinct
types required across Load, Stress, and Spike are already assigned and used.

## Starting Evidence

### Load

**Calibration measurement:** Official Load run `20260817t045341487` used a reviewed
synthetic normal-load reference of 4 VUs and completed 94 workflows and 846 requests.
Correctness was 100%, HTTP p95 was approximately 16.36 ms, HTTP p99 was approximately
20.77 ms, and iteration p95 was approximately 15.34 seconds.

Four VUs is not measured production demand.

### Stress

**Calibration measurement:** Official Stress run `20260817t115158688` preserved 100%
correctness through 24 VUs and found no meaningful breaking point in the reviewed range.
There was no obvious backend or k6 saturation.

The directly measured two-minute plateaus relevant to sustained-load selection were:

| VUs | Requests/s | Workflows/s | Workflows/min | HTTP p95 | Correctness |
|---:|---:|---:|---:|---:|---:|
| 4 | 2.692 | 0.292 | 17.5 | 24.61 ms | 100% |
| 8 | 5.275 | 0.583 | 35.0 | 22.47 ms | 100% |
| 12 | 7.983 | 0.883 | 53.0 | 19.08 ms | 100% |
| 16 | 10.508 | 1.158 | 69.5 | 33.50 ms | 100% |
| 20 | 13.233 | 1.483 | 89.0 | 18.64 ms | 100% |
| 24 | 15.950 | 1.767 | 106.0 | 17.80 ms | 100% |

These are bounded synthetic measurements, not production-capacity claims.

### Spike

**Calibration measurement:** Official Spike run `20260817t134816776` preserved 100%
correctness during a sudden 32-VU peak. Peak-window HTTP p95 was approximately 14.27 ms,
backend CPU showed no obvious saturation, and k6 was not the dominant bottleneck.

**Observed runtime fact:** Backend working set was approximately 48.6 MB before the peak,
rose to approximately 64.4 MB, and remained around 64.4 MB during the short observed
recovery. This is an observation only and is not evidence of a memory leak.

## Skill Reuse / Extension Decision

### Option A — reuse the current generic lifecycle

The generic lifecycle already supplies authoritative-input resolution, human-review gates,
correctness rules, invocation packaging, evidence attribution, validity classification, and
anti-fabrication rules. It can guide a one-off Soak design if the scenario-specific rules are
kept entirely in this project document.

The limitation is that the Skill routes only `load`, `stress`, and `spike`. It contains no
reusable guidance for sustained-window comparison, memory trend handling, persistent-state
growth, long-duration resource sampling, or post-load recovery.

### Option B — add a reviewed reusable Soak reference

The Skill could later route `soak` or `endurance` to a reviewed
`references/soak.md`. That reference should define the mode-specific design questions while
reusing the existing generic lifecycle and `evidence.md` rules.

**HUMAN-REVIEWED — ACCEPTED:** Use Option B before Soak implementation.

Soak has genuinely different mode rules: stable load rather than changing load, explicit
early-versus-late time-series comparison, persistent-state accumulation, memory trend
classification without leak diagnosis, sparse long-duration screenshots, and optional
post-load observation. A small mode reference improves future reuse without creating a new
Skill or duplicating the generic lifecycle. No Skill modification is authorized by this
document.

## Frozen Workflow

**Observed runtime fact:** Preserve this exact workflow:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

A successful workflow must contain exactly nine HTTP requests and exactly one Checkout.

Preserve all reviewed behavior:

- CSV schema: `identity_seed,name,password,phone,shipping_address,quantity`;
- a unique account identity using the required validated `K6_RUN_ID`, scenario, VU, iteration, and CSV seed;
- original Register email and password reused for Login;
- JWT from `$.token` for authenticated requests;
- category-to-product correlation through `category_id`;
- Product Detail `$.id`, `$.name`, and `$.price` as Cart inputs;
- Checkout total calculated as runtime `price * quantity`;
- explicit CSV `shipping_address` in both profile update and Checkout;
- semantic response checks, not status-only checks;
- a separate `workflow_success` result;
- safe early return after a required dependency fails; and
- no hard-coded fallback for a runtime token, identifier, product, price, or other correlation.

## Candidate Sustained Load Levels

| Candidate | Evidence basis | Advantages | Limitations |
|---|---|---|---|
| **4 VUs** | Reviewed Load baseline and Stress baseline/recovery | Cleanest Load comparison; lowest shared-machine and persistent-state pressure; isolates time effects | May be too light to expose long-duration degradation |
| **8 VUs** | Stress `anchor_8`, 5.275 req/s and 0.583 workflows/s with 100% correctness | Doubles the Load baseline while remaining conservative | May still provide limited pressure for a short 10–15 minute observation |
| **12 VUs** | Stress `level_12`, 7.983 req/s and 0.883 workflows/s with 100% correctness | Three times the Load baseline; half the highest sustained Stress VUs; meaningful state and write activity; substantial backend and generator headroom | Accumulates state about three times faster than 4 VUs and increases shared-machine activity |
| **20–24 VUs** | Highest reviewed Stress range, 13.233–15.950 req/s with 100% correctness | Stronger endurance pressure and faster exposure of resource trends | Creates roughly 89–106 users and orders per minute; risks making time effects harder to separate from high sustained concurrency |

Thirty-two VUs is excluded because Spike established short sudden-load behavior, not
suitability for a 10–15 minute sustained run.

## Selected Soak Load Proposal

**HUMAN-REVIEWED — ACCEPTED:** Sustain **12 VUs**.

Twelve VUs is high enough to produce approximately 53 completed workflows per minute in the
reviewed Stress plateau, yet it is only half of the highest sustained Stress concurrency.
Correctness, backend headroom, and generator headroom were already observed at this level.
It increases the chance of observing time-dependent behavior relative to 4 VUs while keeping
database growth and shared-machine effects more interpretable than 20–24 VUs.

This is a synthetic experimental operating point, not a normal-production load claim.

## Duration Proposal

| Sustained duration | Approximate cycles per VU at a 15 s workflow | Evaluation |
|---:|---:|---|
| 10 minutes | 40 | Meets the lower assignment bound but gives shorter comparison windows |
| 12 minutes | 48 | Supports three equal four-minute windows and enough repeated cycles per VU |
| 15 minutes | 60 | Maximizes observation time but increases persistent state and artifact size by 25% over 12 minutes |

**HUMAN-REVIEWED — ACCEPTED:** Use **12 minutes of stable sustained
load**, excluding entry, exit, and recovery.

This choice is not based only on being the midpoint. It creates three equal four-minute
steady windows, and each window matches the duration of the reviewed Load plateau. It also
provides roughly 48 theoretical workflow cycles per VU at a 15-second cycle while keeping
state growth and raw-output size below the 15-minute option.

## Executor / Load Profile

**HUMAN-REVIEWED — ACCEPTED:** Use a closed `ramping-vus` executor:

| Segment | Target | Duration | Purpose |
|---|---:|---:|---|
| Entry/warm-up | 1 -> 12 VUs | 60 s | Enter load gradually and exclude startup effects |
| Sustained load | 12 VUs | 12 min | Produce the required stable endurance observation |
| Exit | 12 -> 0 VUs | 30 s | Stop gradually without a Spike-like drop |
| Grace | in-flight work only | up to 30 s | Allow started workflows to finish where practical |

Proposed `gracefulRampDown` and `gracefulStop` are 30 seconds because prior measured
workflow p95 was about 15–16 seconds and the reviewed synthetic think-time can reach 18
seconds. Actual VUs must be verified from native k6 metrics or attributable progress data;
the target schedule alone is not proof of stable concurrency.

This profile has one stable level. It does not create progressive Stress plateaus or sudden
Spike transitions.

## Warm-up and Observation Windows

Window time is relative to the actual k6 scenario start, not runner preflight time.

| Window | Scenario elapsed | Duration | Traffic interpretation |
|---|---:|---:|---|
| `warmup_entry` | 0–60 s | 1 min | 1 -> 12 VUs; excluded from steady conclusions |
| `early_steady` | 60–300 s | 4 min | First stable observation window |
| `middle_steady` | 300–540 s | 4 min | Middle stable observation window |
| `late_steady` | 540–780 s | 4 min | Final stable observation window |
| `exit_ramp` | 780–810 s | 30 s | 12 -> 0 VUs; excluded from sustained metrics |
| `graceful_completion` | after 810 s, if needed | up to 30 s | Complete in-flight work; reported separately |
| `post_load_recovery` | after confirmed traffic end | 2 min | Resource-only observation; not sustained-load time |

**HUMAN-REVIEWED — ACCEPTED:** Use these boundaries and compare
`early_steady` directly with `late_steady`. Treat the first 60 seconds of
`early_steady` as the post-warmup memory baseline subset while retaining the full
four-minute early window for latency and throughput comparisons.

Iterations crossing a boundary must remain in raw evidence. Requests are attributed by the
window in which each response is recorded. Workflow success retains explicit start/end-window
tags, but completed-workflow rate uses only workflows that start and finish in the same
window. Cross-window iterations are counted separately and are not silently assigned to one
steady-window throughput total.

## Think-Time

### Option A — preserve the reviewed pacing

Keep the five existing ranges at their existing workflow positions:

`1–2 s`, `3–5 s`, `2–4 s`, `2–4 s`, and `1–3 s`.

### Option B — reduce or remove pacing

Removing think-time would shorten each workflow from roughly 13–15 seconds to near API-only
time. The same VU count would then issue requests much faster, so both duration and request
frequency would change. That would create a different workload model and weaken comparison
with Load, Stress, and Spike.

**HUMAN-REVIEWED — ACCEPTED:** Preserve Option A exactly. The Soak
changes observation duration, not user pacing.

## Persistent-State Growth Estimate

**Synthetic planning estimate:** The Stress 12-VU plateau completed 106 workflows in 120
seconds, or approximately 53 workflows per minute. At that observed rate, the proposed
12-minute steady window would produce approximately:

- 636 completed workflows;
- 636 new users;
- 636 Checkouts/orders;
- 5,724 requests associated with those complete workflows; and
- approximately 5,748 requests when projecting the independently observed 7.983 req/s rate.

The theoretical 15-second workflow cycle gives a lower planning estimate of 48 workflows per
minute, or 576 workflows and 5,184 requests over 12 minutes. Therefore, a reasonable planning
range for the steady window is **576–636 users/orders and 5,184–5,748 requests**.

**Synthetic planning estimate:** Linear scaling of the observed 12-VU workflow rate suggests
about 29 additional workflows during the 60-second entry ramp and about 13 during the
30-second exit ramp. The complete traffic profile may therefore approach about 618–678
workflows and 5,562–6,102 requests before graceful-completion effects. These are storage and
artifact-size estimates only.

Persistent growth is part of the frozen business workflow and must not be removed. It can
affect SQLite file size, write cost, cache behavior, and memory. Record pre-run and post-run
database file size and, if the schema can be queried read-only and safely, user/order counts.
Interpret latency and memory alongside this growth rather than attributing every trend to
elapsed time alone.

## Backend Restart / Reseed Policy

**HUMAN-REVIEWED — ACCEPTED:** Immediately before the official Soak,
perform one documented backend stop/start/reseed using the established project workflow,
then verify the real port-3000 backend and a health/read endpoint before declaring readiness.

This gives a predictable database and memory starting point, avoids contamination from
Stress/Spike runtime state, and matches prior official-run preparation. Record backend PID,
start time, initial database size/counts, and pre-traffic resources. Do not restart, reseed,
or clean state during traffic or recovery.

No restart is authorized during this design milestone.

## Metrics

### Correctness and workflow

- `http_req_failed` rate and count;
- `checks` pass/fail count and rate;
- `workflow_success` pass/fail count and rate;
- completed and interrupted iterations;
- requests per completed workflow;
- Checkout count and per-step request counts;
- safe-early-return count or incomplete-workflow evidence;
- cross-window iteration count; and
- actual VUs over time.

### Performance

- global and per-window HTTP p50, p90, p95, p99, average, and maximum;
- per-step count and p95/p99 latency by steady window;
- request count and requests/s by window;
- completed workflows and workflows/s by window; and
- same-window iteration-duration p50/p95/p99, clearly identified as including think-time.

### Resources

- backend availability, CPU, working set, private memory, and thread count;
- k6 availability, CPU, working set, private memory where available, and thread count;
- whole-machine CPU and committed-memory percentage;
- disk bytes/s and other practical disk context;
- timestamp, actual scenario window, target VUs, and actual VUs for attribution; and
- database size and optional read-only row counts before and after the run.

## Memory Stability Evaluation

**HUMAN-REVIEWED — ACCEPTED:** Capture backend, k6, and whole-machine
resources every two seconds and align them to the actual k6 scenario start.

For backend working set and private memory, report count, minimum, median, mean, maximum, and
first/last values for:

1. the pre-traffic baseline;
2. the first 60 seconds of `early_steady` as the post-warmup baseline;
3. full `early_steady`;
4. `middle_steady`;
5. `late_steady`; and
6. `post_load_recovery`.

Also calculate the observed change in MB and MB/minute between early and late windows, and
inspect the time series for these factual shapes:

- approximately flat within normal sample variation;
- increase followed by a stable band;
- continued increase through the late window; or
- decrease after traffic ends.

Report the observed shape without labeling it a leak. Compare backend memory with k6 memory,
whole-machine committed memory, CPU, disk activity, and persistent-state growth. Unrelated
whole-machine activity must not be attributed to EShop.

## Throughput / RPS Evaluation

**HUMAN-REVIEWED — ACCEPTED:** For each four-minute steady window,
derive request rate as direct request count divided by observed window seconds and workflow
rate as completed workflows divided by observed window seconds. Verify the denominator from
actual timestamps and actual VU samples rather than assuming the schedule was followed.

Report early, middle, and late rates with direct counts. Compare late against early using both
the absolute difference and percentage difference. Interpret the rates together with
correctness, latency, incomplete workflows, CPU, memory, disk, and actual VUs.

One sustained level cannot establish a maximum. If the run is stable, use wording such as:

> Observed stable RPS at 12 sustained VUs over 12 minutes under the tested hardware and SUT conditions.

Do not call it “maximum stable RPS” unless a separately reviewed experiment searches higher
sustained levels and demonstrates the maximum boundary.

## Candidate Empirical Threshold Forms

No numeric result is final before execution.

### A — observed sustained-throughput floor

After the run, a defensible form is:

> At 12 sustained VUs over 12 minutes, the SUT sustained at least **Y workflows/s** or
> **Z requests/s** in every four-minute steady window while reporting the measured
> correctness result.

Set `Y` and `Z` only from direct run evidence. The minimum observed steady-window rate is the
candidate empirical floor; it is not a production SLO or maximum capacity.

### B — observed memory ceiling or late-window band

If memory reaches a stable band, a defensible form is:

> Backend working set remained at or below **M MB** and stabilized within **L–U MB** during
> the late steady window.

Set `M`, `L`, and `U` only from the run. If memory continues rising, report the observed peak,
change, and slope instead; do not falsely call the peak a stable ceiling.

### C — latency stability relation

A factual form is:

> Late-window HTTP p95 was **P ms**, compared with **E ms** in the early window, an observed
> change of **D ms / R%**, while actual VUs remained at 12.

Populate every value from evidence. Do not invent a pass ratio before the run.

**HUMAN-REVIEWED — ACCEPTED WITH CORRECTION:** Calculate the candidate empirical throughput
floor from the minimum steady-window rates, but do not label it stable automatically. A human
must apply the accepted wording gate using actual VUs, correctness, early-to-late throughput,
generator/shared-machine evidence, latency, and resources. Use memory and latency only as
factual supporting observations.

## Correctness Threshold Strategy

**HUMAN-REVIEWED — ACCEPTED:** Retain the three strict global
thresholds:

- `http_req_failed: rate==0`;
- `checks: rate==1`; and
- `workflow_success: rate==1`.

Also report correctness counts per time window. Preserve a run with failures as valid bad
performance when execution conditions remain valid.

Do not reuse Load HTTP latency or iteration-duration thresholds. They are provisional
calibration-derived guards, not authoritative Soak limits. Keep latency, throughput, memory,
and resources observational until real Soak evidence supports a concrete empirical statement.

## Time-Series Attribution

**HUMAN-REVIEWED — ACCEPTED:** Use one `soak_window` tag and the
existing `step` tag on request metrics. Keep one global `workflow_success` metric tagged by
completion window, plus a cross-window counter. Do not create a separate custom metric for
every window/step/percentile combination.

Use raw timestamped metrics as the detailed source. A compact post-run factual verifier may
group them by `soak_window` and `step` to calculate counts, rates, percentiles, failures,
checks, workflow success, and iteration duration. This keeps implementation maintainable and
avoids the metric explosion seen when every combination becomes a named Trend.

External resource rows must use the same actual scenario-start anchor. Record the runner
preflight timestamp separately so the approximately 11.5-second Spike attribution problem is
not repeated. Verify window alignment after the run against native k6 timestamps or measured
progress.

## Report / Output Strategy

**HUMAN-REVIEWED — ACCEPTED:** Do not assign a fourth designated
report type. Produce one invocation-specific evidence package containing:

- raw k6 NDJSON as the direct machine-readable result;
- compact `summary.json`;
- stdout and stderr;
- a compact human-readable Soak completion/window summary derived from the same run;
- two-second backend/k6 process-resource CSV;
- two-second whole-machine resource CSV;
- command, tool version, commit, run ID, timestamps, metadata, and hashes;
- implementation and CSV copies/hashes after implementation is separately approved;
- pre/post database-state facts where safely available;
- screenshots and a screenshot manifest; and
- post-run factual validity/completeness notes.

Do not also emit a full native k6 metric CSV by default because it would duplicate the raw
NDJSON stream and materially increase a 12-minute artifact package. Preserve the NDJSON
outside Git when its size is unsuitable for repository history, while recording exact byte
size and SHA-256 and retaining it under `out/` for submission.

No official output or evidence directory is created by this design.

## Screenshot Plan

**HUMAN-REVIEWED — ACCEPTED:** Capture three sparse active-run frames,
plus one optional recovery frame:

| Capture | Scenario elapsed | Window | Purpose |
|---|---:|---|---|
| 1 | approximately 90 s | `early_steady` | Confirm post-warmup stable 12 VUs and starting resources |
| 2 | approximately 420 s | `middle_steady` | Show sustained mid-run behavior |
| 3 | approximately 720 s | `late_steady` | Show late behavior before exit |
| 4, optional | 60 s after confirmed traffic end | `post_load_recovery` | Show backend resources after load; clearly mark k6 as ended |

Each active-run frame should show active k6, run ID, window and elapsed time, target and
actual VUs where available, backend and k6 PID/CPU/memory, and Windows timing context. The
optional recovery frame is resource-only evidence and must explicitly show that traffic has
ended. Prepare windows and GUI placement before traffic; never reconstruct a missed frame.

## Resource Sampling Plan

| Interval | Approximate samples over 15.5 min | Evaluation |
|---:|---:|---|
| 1 s | 930 per stream | Highest resolution but unnecessary volume and overhead for a slow memory trend |
| 2 s | 465 per stream | Good trend resolution with modest files and overhead |
| 5 s | 186 per stream | Smallest files but fewer points for short CPU/disk changes and window boundaries |

**HUMAN-REVIEWED — ACCEPTED:** Sample every **2 seconds** from the
pre-traffic baseline through the end of recovery. For process resources this yields about
465 samples per role, or roughly 930 backend/k6 rows, plus about 465 whole-machine rows.

## Optional Recovery Observation

**HUMAN-REVIEWED — ACCEPTED:** Keep monitoring for **2 minutes after
confirmed traffic completion** with zero intended VUs and no synthetic recovery traffic.

The 12-minute sustained requirement remains separate and fully satisfied. Recovery is
observational only. It can show whether backend memory decreases, stabilizes, or remains
elevated after load, but it cannot by itself diagnose a leak. Start its clock only after k6
has exited and in-flight workflows have ended.

## Account Lockout

**Observed runtime fact:** Each workflow creates a unique account and performs one Login with
the correct original password. Completed Load, Stress, and Spike runs observed no lockout.

Longer duration creates more accounts but does not increase failed attempts per account.

**HUMAN-REVIEWED — ACCEPTED:** Add no wrong-password requests and no
Login retries. On Login failure, record the semantic/check failure and end that iteration
safely. A setup-caused identity collision or accidental retry policy is an invalid-execution
condition; an authentic SUT Login failure under valid unique input is valid bad-performance
evidence.

## Stop / Invalid-Run Conditions

### Valid but bad performance — preserve and do not rerun automatically

- latency grows over time;
- request or workflow throughput decreases;
- backend memory grows or remains elevated;
- HTTP, semantic, or `workflow_success` correctness fails;
- SQLite contention or delayed responses occur under the intended workload;
- a threshold fails;
- the backend crashes after meaningful valid traffic in a way attributable to the tested load; or
- the observed empirical threshold is lower than expected.

### Invalid or unsafe execution — stop when practical and do not treat as official evidence

- the intended backend is unavailable before meaningful traffic;
- an unexpected restart or reseed occurs;
- evidence collection is corrupted or loses required attribution;
- `K6_RUN_ID` is missing, invalid, reused, or collides;
- test implementation, CSV, think-time, workflow, checks, or load profile differs materially from the reviewed design;
- setup causes account identity collisions;
- the generator becomes the dominant sustained bottleneck and prevents a meaningful SUT observation;
- the machine becomes unstable or unsafe;
- backend/process identity cannot be verified; or
- actual VUs do not establish the reviewed steady window.

An externally caused backend failure before meaningful measurement is invalid. A genuine SUT
failure caused during valid meaningful load is a result to preserve. Technical validity and
submission completeness must be classified separately after execution.

## Human Review Record

Every implementation decision below was accepted in this review:

- [x] Soak/Endurance Skill extension/reference;
- [x] 12-VU Soak level and synthetic rationale;
- [x] 12-minute sustained duration;
- [x] `ramping-vus` executor and exact entry/hold/exit profile;
- [x] 30-second graceful settings;
- [x] warm-up exclusion and frozen steady-window boundaries;
- [x] preservation of all five think-time ranges;
- [x] persistent-state estimates and interpretation boundary;
- [x] clean restart/reseed policy;
- [x] three strict correctness thresholds without abort-on-fail;
- [x] observational latency, throughput, memory, and resource policy;
- [x] corrected empirical-throughput floor calculation and stability wording gate;
- [x] NDJSON/summary/resource CSV/human-readable summary strategy;
- [x] active screenshots near 90, 420, and 720 seconds;
- [x] optional recovery screenshot;
- [x] two-second resource sampling;
- [x] two-minute post-load recovery observation;
- [x] no wrong-password traffic and no Login retries;
- [x] valid-bad-performance versus invalid-run rules; and
- [x] actual scenario-start anchoring and post-run attribution verification.

Implementation is authorized under these frozen choices. Official traffic remains blocked
until implementation validation is complete and a separate execution preparation is approved.
