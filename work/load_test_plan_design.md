# Load Test Plan Design

## 1. Decision provenance

This document uses three evidence labels so that requirements, facts, and proposals are not mixed:

- **[Assignment requirement]** comes from `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`.
- **[Observed runtime fact]** comes from `work/workflow1_runtime_contract.md` and the finalized CSV design.
- **[Calibration measurement]** comes from the controlled runs documented in `work/load_test_calibration.md`.
- **[AI-proposed parameter]** is an initial test-design hypothesis that requires human review and later empirical calibration.

Calibration now provides a local hardware baseline and measurements at 1, 2, 4, and 8 VUs. No production traffic analytics, business latency SLO, error budget, or throughput requirement exists. Calibrated values below are provisional regression guards for this machine, not established service-level objectives.

## 2. Test objective

**[Assignment requirement]** The Load test must exercise one end-to-end workflow covering auth-heavy, read-heavy, and transactional endpoint groups, use CSV-controlled data, and later preserve real execution evidence.

**[Observed runtime fact]** The finalized workflow is exactly:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

There is exactly one Checkout per iteration. The two Checkout calls in runtime verification were diagnostic probes and are not part of this test plan.

**[AI-proposed parameter]** The objective is to evaluate whether the local EShop backend remains correct and responsive while a small, gradually introduced group of concurrent customers repeatedly completes onboarding and a first order under a steady, normal-use load.

This Load test should establish an initial baseline for response latency, workflow success, throughput, and local resource use. It must not search for the maximum capacity, deliberately exhaust resources, or introduce an abrupt surge; those goals belong to later Stress and Spike designs.

## 3. Workload model

**[AI-proposed parameter]** Use one k6 scenario named `load` with the `ramping-vus` executor.

This is a closed workload model: a bounded population of VUs completes the full workflow repeatedly, and the achieved iteration rate and RPS are measured results. This fits an interactive customer journey because each VU waits for the current request and think-time before continuing.

An arrival-rate executor is not selected because there is no authoritative customer-arrival rate to reproduce. Choosing one now would invent a business traffic rate and could require extra VUs merely to maintain that invented rate when the SUT slows down.

The model is a Load test rather than Stress or Spike because it has a modest target, a gradual one-minute ramp, a stable plateau, and a gradual ramp-down. It neither increases until failure nor jumps suddenly to a high load.

k6 executor reference: <https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-vus/>

## 4. Proposed load profile

| Phase | k6 setting | Purpose and rationale |
|---|---|---|
| Initial load | `startVUs: 1` | **[Calibration measurement]** One VU completed both repeated baselines with 100% correctness. Starting there avoids a simultaneous registration burst and exposes setup failures before concurrency rises. |
| Ramp-up | `48s`, target `4` VUs | **[Calibration-derived proposal]** Confirmed 4-VU iteration p95 was 15.816 seconds. Introducing the three additional VUs across three p95 workflow windows gives `3 x 15.816 = 47.448` seconds, rounded to 48 seconds. |
| Steady load | `4m`, target `4` VUs | **[Calibration-derived proposal]** Confirmed 4-VU throughput was 2.541 RPS, or 0.282 workflows/s. A four-minute plateau estimates about 68 workflows and 610 requests while remaining well below the separate 10-15 minute endurance test. |
| Ramp-down | `64s`, target `0` VUs | **[Calibration-derived proposal]** Four confirmed p95 workflow windows are `4 x 15.816 = 63.264` seconds, rounded to 64 seconds. This removes concurrency progressively instead of creating a hard stop. |
| Iteration grace | `gracefulRampDown: 25s` and `gracefulStop: 25s` | **[Calibration-derived proposal]** Confirmed 4-VU iteration p99/max were 15.894/15.896 seconds. Twenty-five seconds is more than 1.5 times measured p99 and exceeds the 18-second synthetic maximum think-time. |

Nominal stage duration is **5 minutes 52 seconds**: 48 seconds ramp-up + 4 minutes steady + 64 seconds ramp-down. Actual wall-clock time may extend by up to 25 seconds when an iteration needs graceful completion.

Why four VUs is the lowest defensible normal-load target:

- The SUT and k6 share a Dell Inspiron 15 3530 with an i7-1355U, 10 physical cores, 12 logical processors, 15.7 GiB RAM, and NVMe storage.
- Four VUs completed two repeatable runs at 2.541-2.629 RPS with 100% workflow/check success, zero HTTP failure, backend CPU below 1.522% of total machine capacity, and backend working set below 58.586 MB.
- Eight VUs still succeeded, but overall p99 rose to 122.377 ms and Register p95 rose to 123.832 ms. Four VUs stays below that early tail-latency change.
- One VU has no concurrency, and two VUs gives only minimum overlap. Four VUs is the first confirmed level with multiple overlapping stateful workflows and a larger 32-workflow confirmation sample.

At confirmed 4-VU throughput, the four-minute plateau should produce approximately `2.541 / 9 x 240 = 67.76` complete workflows and about 610 requests. This is a sample-count estimate, not a throughput requirement or promised result.

Four VUs remains a synthetic normal-load choice because no production traffic model exists. Calibration makes it defensible for this hardware but cannot turn it into a claim about real customer demand.

## 5. Iteration behavior and identity

**[Assignment requirement]** One iteration executes all nine workflow steps in order.

**[Observed runtime fact]** Register requires a unique email; Login must reuse the exact Register email and password; JWT, category, product, and order values are obtained at runtime; each execution needs isolated account, cart, and order state.

The future implementation must treat one iteration as one new customer and one completed first order:

1. Select a CSV row using the finalized cyclic row-selection strategy.
2. Generate one email from `K6_RUN_ID`, scenario name, test-wide VU ID, scenario-wide iteration ID, and the row's `identity_seed`.
3. Retain that email and the CSV password for Login.
4. Retain the JWT and all response-derived correlation values only within that iteration.
5. Perform one Add to Cart and exactly one Checkout.
6. Start the next iteration with a newly generated email and fresh runtime state.

Reusing one of the three representative CSV rows does not reuse an account. The seed may repeat, but the runtime identity tuple changes, so every iteration produces a different email. A new, previously unused `K6_RUN_ID` remains mandatory for reruns when the backend has not been restarted.

## 6. Think-time strategy

**[Synthetic user-behavior assumption]** Use randomized think-time only at points where a person would make a decision or enter information. Do not sleep between mechanically dependent API calls that a page or client would issue immediately.

| After step | Delay | User behavior represented |
|---|---:|---|
| Register | Random `1-2s` | The customer sees registration success and moves to Login. |
| Read Profile | Random `3-5s` | The customer reviews the profile and enters name, phone, and address data before Update Profile. |
| Read Products | Random `2-4s` | The customer scans the product list and chooses a product correlated to a returned category. |
| Read Product Detail | Random `2-4s` | The customer reviews the item and quantity before Add to Cart. |
| Add Product to Cart | Random `1-3s` | The customer reviews the cart decision before Checkout. |

No think-time is added between Login and Read Profile, Update Profile and Read Categories, Read Categories and Read Products, or the final request and iteration completion because those transitions represent immediate loading or have no subsequent user decision.

The randomized total is 9-18 seconds per iteration, with an expected midpoint of 13.5 seconds before response time. Calibration measured average think-time of 13.30-14.42 seconds and p95 of 14.98-16.08 seconds, confirming that the implementation produces the intended synthetic distribution. No user analytics support its behavioral realism.

## 7. Minimum correctness checks

**[Observed runtime fact]** HTTP `200` alone is insufficient. In particular, Checkout returns `200` even if `shipping_address` is omitted, but then stores a null address.

The future script must evaluate all checks and emit one custom `workflow_success` result only when every required check and correlation succeeds.

| Step | Minimum checks beyond merely receiving a response |
|---|---|
| Register | Status is `200`; response message indicates successful registration; `$.id` is a positive numeric user ID. |
| Login | Status is `200`; `$.token` is a non-empty string; `$.user.email` equals the generated Register email. |
| Read Profile | Status is `200`; `$.email` equals the generated email; authenticated user ID is consistent with Register/Login when those IDs are compared. |
| Update Profile | Status is `200`; response message indicates profile update; the outgoing body contains the exact non-empty CSV `name`, `phone`, and `shipping_address`. |
| Read Categories | Status is `200`; body is a non-empty array; the selected category has a positive numeric `id`. |
| Read Products | Status is `200`; body is a non-empty array; at least one product has `category_id` equal to the selected category ID. Do not fall back to a hard-coded product. |
| Read Product Detail | Status is `200`; `$.id` equals the selected product ID; `$.category_id` equals the selected category ID; `$.name` is non-empty; `$.price` is positive and numeric. |
| Add Product to Cart | Status is `200`; response message indicates success; the outgoing ID, name, and price equal Product Detail values; quantity equals the parsed positive CSV quantity. |
| Checkout | Status is `200`; the single Checkout body explicitly contains the exact non-empty CSV `shipping_address`; `total_amount` equals Product Detail price multiplied by CSV quantity and is positive; success message is present; `$.orderId` is a positive numeric ID. |

The exact nine-step workflow has no post-Checkout order-read endpoint. Therefore, the timed workflow can prove that the correct address was sent and that Checkout returned a valid order ID, but it cannot independently reread the order to prove persistence on every iteration. The verified runtime contract is the current evidence that explicit submission persists the address. Adding another timed API step would change the finalized workflow and is outside this plan.

## 8. Metrics to observe

### k6 metrics

- `http_req_duration`: overall and p50, p90, p95, and p99, plus per-step values using endpoint/step tags.
- `http_req_failed`: transport and HTTP failure rate.
- `checks`: correctness-check pass rate.
- Custom `workflow_success`: complete nine-step business workflow success rate.
- `http_reqs` and achieved requests per second: throughput is an observed outcome of this closed model, not a configured arrival rate.
- `iterations` and `iteration_duration`: completed workflows and end-to-end time, noting that iteration duration includes think-time.
- `vus` and `vus_max`: verify that the intended ramp was actually scheduled.
- Data sent/received: supporting evidence for generator and payload behavior.
- Per-step request counts: each successfully completed workflow should issue exactly one request for each of the nine steps.

### External resource observations

**[Assignment requirement]** Capture the performance tool and backend resource monitor together and preserve hardware evidence.

Observe the backend process and whole-machine CPU utilization, memory working set/commit, disk activity and latency for SQLite writes, and network throughput. Also watch whether the k6 process itself saturates CPU or memory because the generator and SUT run locally; generator saturation would confound SUT conclusions.

## 9. Initial stop/pass/fail expectations

These values are **[Calibration-derived proposals]** from `work/load_test_calibration.md`. They remain provisional for human review and are not business SLOs.

| Metric | Initial hypothesis | Reason for the first baseline |
|---|---:|---|
| `http_req_failed` | `rate == 0` | All 1,062 measured requests succeeded, and this normal workflow has no expected negative response. HTTP/transport failure is separate from semantic failure. |
| `checks` | `rate == 1` | All 4,130 calibration checks passed. Any failed response-shape, identity, correlation, or address check is a known correctness failure. |
| Custom `workflow_success` | `rate == 1` | All 118 measured workflows succeeded. A workflow is false if any of its nine required steps or correlations fails. |
| `http_req_duration` | `p(95) < 60ms` | Confirmed 4-VU p95 was 46.818 ms. A 25% degradation allowance gives 58.523 ms, rounded upward to 60 ms. |
| `http_req_duration` | `p(99) < 85ms` | Confirmed 4-VU p99 was 54.115 ms; 85 ms gives about 57% margin while remaining below the 122.377 ms observed at 8 VUs. |
| `iteration_duration` | `p(95) < 19s` | Confirmed 4-VU iteration p95 was 15.816 seconds; a 20% allowance gives 18.979 seconds, rounded to 19 seconds. This metric includes synthetic think-time. |

Do not set a throughput pass threshold yet. The closed VU model, think-time, and unknown baseline make achieved RPS an observation to calibrate after the first valid run.

For the first evidence run, threshold failures should set a failed k6 exit result but should not automatically abort the test; completing the run preserves the data needed for human review. Manually stop only for an invalid test setup, repeated identity collision caused by a reused `K6_RUN_ID`, loss of monitoring/evidence, backend crash, or machine instability that risks corrupting the run. A slow or threshold-failing SUT is a result to capture, not by itself a reason to discard the run.

## 10. CSV integration

**[Observed runtime fact]** The finalized file `work/user_workflow_data.csv` contains:

`identity_seed,name,password,phone,shipping_address,quantity`

| CSV input | Use in the workflow |
|---|---|
| `identity_seed` | Combined with runtime identity components to generate the Register email. |
| `name` | Sent to Register and Update Profile. |
| `password` | Sent to Register and retained unchanged for Login. |
| `phone` | Sent as a string to Update Profile. |
| `shipping_address` | Sent to Update Profile, retained in iteration memory, and explicitly sent again in the one Checkout. |
| `quantity` | Parsed as a positive integer for Add to Cart and used with runtime Product Detail price to calculate Checkout `total_amount`. |

The three current rows are representative development data. They can be cycled across any number of iterations because account uniqueness comes from the runtime tuple, not from the row count. The Load script design must validate the existing CSV schema before generating traffic; this plan does not change that schema.

## 11. Evidence expected from the eventual Load run

**[Assignment requirement]** Preserve attributable raw results, a distinct k6-equivalent report view, resource-monitor evidence, hardware evidence, and the correctly named test plan.

The later execution phase should preserve at least:

- The reviewed k6 script named with `23127179_Load_YYYYMMDD` and the exact CSV used.
- The exact command, k6 version, base URL, scenario name, unique `K6_RUN_ID`, start time, end time, and threshold exit status.
- Raw k6 time-series output, preferably newline-delimited JSON, as the k6 equivalent of the assignment's raw JMeter `.jtl` evidence.
- A machine-readable end-of-test summary containing thresholds, counts, rates, and percentile values.
- Complete console output, including threshold results and interrupted-iteration warnings.
- One exported k6 HTML report for the Load scenario, placed in its own report folder for submission organization.
- A screenshot or recording frame showing k6 and the backend resource monitor together during the steady stage.
- Resource-monitor capture covering ramp-up, steady load, and ramp-down, with CPU, memory, disk, and process identity visible where possible.
- Hardware specification evidence for the machine that ran both k6 and the SUT.
- Notes for any aborted run, identity collision, incomplete workflow, product-correlation failure, or threshold failure; do not silently replace a failed run.

The final output and report naming will be fixed during implementation and evidence planning. No raw result should be fabricated or reconstructed from a summary.

## 12. Human-review decisions before implementation

Human review is required for these remaining assumptions:

1. Accept four VUs as a synthetic normal-load target for this hardware; it is calibrated but not based on production demand.
2. Accept the 25% p95, approximately 57% p99, and 20% iteration-duration tolerances as provisional regression margins rather than business SLOs.
3. Accept four minutes as enough to estimate about 68 per-step samples while remaining distinct from the 10-15 minute endurance test.
4. Accept or revise the five think-time ranges; calibration validated their implementation, but no user analytics support their realism.
5. Decide the exact unique `K6_RUN_ID` generation procedure; reuse must be prevented when the backend retains registered users.
6. Confirm that request-body validation plus the previously verified runtime contract is sufficient shipping-address evidence without adding an extra order-read step to the finalized workflow.
7. Confirm the exact k6 raw-output and HTML-report commands that satisfy the instructor's k6-equivalent evidence expectation.
