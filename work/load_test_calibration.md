# Load Test Calibration Report

## 1. Scope and evidence classes

This was a controlled calibration activity for the finalized Workflow 1. It was not an official Load, Stress, Spike, or submission run. No SUT source or configuration was modified, and all generated evidence remains under `work/`.

After measurements and the read-only database verification were captured, the calibration-started SUT processes were stopped and the tracked runtime SQLite file was restored to repository `HEAD`. The repository therefore retains no SUT change from calibration.

The report keeps five evidence classes separate:

- **Assignment requirement:** mandated by the HW05 specification.
- **Repository/runtime fact:** established by the SUT source, finalized workflow contract, or CSV design.
- **Hardware fact:** observed from the local Windows machine with read-only system queries.
- **Empirical calibration measurement:** produced by the calibration runs in `work/calibration-results/`.
- **Synthetic user-behavior assumption:** a deliberate model used because real usage analytics do not exist.

## 2. Assignment requirements

- Exercise the same end-to-end workflow in Load, Stress, and Spike tests.
- Cover auth-heavy, read-heavy, and transactional endpoints.
- Drive the workflow from CSV data.
- Use k6 as the selected performance tool.
- Preserve raw results, report views, resource monitoring, and hardware evidence during later official runs.
- Keep the separate endurance test around 10-15 minutes.

The assignment provides no production traffic model, target concurrency, latency SLO, error budget, or throughput requirement.

## 3. Repository and runtime facts

The workflow remains exactly:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

There is one Checkout per iteration. It explicitly carries the same non-empty CSV `shipping_address` sent to Update Profile.

Other authoritative facts used by the calibration:

- Each Register call needs a unique email.
- Login reuses the original Register email and password.
- Login returns the JWT at `$.token`.
- Categories and Products are correlated through `category_id`.
- Product Detail `$.id`, `$.name`, and `$.price` feed Add to Cart.
- Checkout `total_amount` is Product Detail price multiplied by CSV quantity.
- Each iteration has isolated user, cart, and order state.
- A new `K6_RUN_ID` was generated for every calibration invocation; the backend was not restarted between runs.
- Every completed workflow issued exactly nine HTTP requests.

The finalized CSV remained unchanged and supplied `identity_seed`, `name`, `password`, `phone`, `shipping_address`, and `quantity`.

## 4. Hardware facts

Observed hardware is recorded in `work/calibration-results/hardware_observation.json`.

| Component | Observed value |
|---|---|
| Machine | Dell Inspiron 15 3530 |
| CPU | 13th Gen Intel Core i7-1355U |
| CPU topology | 10 physical cores, 12 logical processors |
| Physical RAM | 16,857,645,056 bytes, approximately 15.7 GiB |
| Operating system | Microsoft Windows 11 Home Single Language, 64-bit, version `10.0.26200`, build `26200` |
| Storage | 512 GB Phison NVMe SSD, NVMe bus, reported Healthy |
| Load placement | k6 and the complete local EShop SUT ran on the same machine |

Resource percentages in this report are per-process CPU time normalized across all 12 logical processors and sampled at approximately one-second intervals. They are not whole-machine CPU percentages from Task Manager.

## 5. Performance-relevant SUT architecture

| Area | Repository/runtime fact | Calibration implication |
|---|---|---|
| Backend runtime | Node.js `v22.19.0` with Express `5.2.1` | One asynchronous Node process accepts all workflow requests on port 3000. |
| Process model | One `app.listen()` call; no Node cluster, worker-thread, or multi-process server configuration | Concurrency reaches one backend process rather than a configured worker pool. |
| Database | `sqlite3` package `6.0.1` using local file `eshop-sut/backend/database.sqlite` | Database work and k6 traffic remain on the same physical machine. |
| Database access | One exported `sqlite3.Database` object; no connection-pool configuration | Writes for Register, Profile, and Checkout share the same local database handle. |
| SQLite tuning | No explicit WAL, busy-timeout, or other performance PRAGMA appears in the backend configuration | Calibration must observe write-tail behavior rather than assume tuned concurrency. |
| Cart | `userCarts` is an in-process JavaScript object keyed by user ID | Cart state consumes backend memory and is lost when the backend process restarts. Checkout does not clear this object. |
| External dependency | No external service is called by the nine backend endpoints | Measured request latency is local backend/database behavior plus local generator overhead. Product image URLs are returned as strings but are not fetched. |
| Frontends | Web and admin frontends ran locally, but k6 called `http://localhost:3000` directly | Browser rendering and image loading are outside the API calibration. |

The backend reseeds SQLite only when it starts. It stayed running across the measured calibration sequence, so registered users and orders accumulated normally while email uniqueness was preserved by distinct run IDs.

## 6. Calibration implementation

The minimal workflow implementation is `work/k6_workflow_calibration.js`. It contains no final Load/Stress/Spike stages or thresholds. Its concurrency, iterations, and think-time switch are calibration inputs.

It implements:

- standards-compliant CSV parsing with k6's CSV module;
- CSV schema and value validation before traffic;
- stable seed plus run/scenario/VU/iteration email construction;
- JWT and all required runtime correlations;
- exactly one final Checkout with explicit `shipping_address`;
- 35 semantic checks per complete workflow;
- separate endpoint latency, API-time, think-time, wall-time, and workflow-success metrics.

`work/run_k6_calibration.ps1` ran k6 and sampled backend/k6 CPU and memory. The portable official binary was k6 `v2.1.0`; its downloaded ZIP SHA-256 `185ca503ead8f0348daa79c002469e5eb324473c39452f29b5f70b1c1b4c8503` matched the official release checksum.

## 7. Calibration method and runs

The initial one-iteration smoke succeeded with 9/9 requests and 35/35 checks. Its first Register took 651.49 ms, a cold-path outlier retained in `smoke-1vu-no-think/raw.json`. It was not used alone as a steady baseline.

The measured runs were:

| Run | VUs | Iterations per VU | Think-time | Completed workflows | Purpose |
|---|---:|---:|---|---:|---|
| `baseline-1vu-no-think-20i` | 1 | 20 | Disabled | 20 | Separate API processing time from human delay. |
| `baseline-1vu-think-10i` | 1 | 10 | Enabled | 10 | Measure full single-user iterations with the proposed synthetic behavior. |
| `explore-2vu-think-4i` | 2 | 4 | Enabled | 8 | Minimum overlapping workflows. |
| `explore-4vu-think-4i` | 4 | 4 | Enabled | 16 | Modest multi-user overlap. |
| `explore-8vu-think-4i` | 8 | 4 | Enabled | 32 | Lightweight headroom check, not a breaking-point search. |
| `confirm-4vu-think-8i` | 4 | 8 | Enabled | 32 | Confirm the proposed normal-load target with more samples. |

Across these six measured runs, 118 workflows completed, producing 1,062 requests and 4,130 semantic checks. HTTP failure, semantic check failure, and complete workflow failure were all zero. The initial smoke adds one more successful workflow but is kept separate because it exposed the cold-path outlier.

A post-calibration SQLite query opened the database in read-only mode. It found 119 calibration users, 119 orders belonging to 119 distinct calibration users, and zero calibration orders with a null or empty shipping address. This independently confirms one persisted order per workflow and explicit address persistence without adding a request to the timed nine-step workflow. The result is stored in `work/calibration-results/database_verification.json`.

## 8. One-VU baseline

### 8.1 API-only baseline

| Measurement | Result |
|---|---:|
| Completed workflows | 20/20 |
| Workflow/check success | 100% / 100% |
| HTTP failure | 0% |
| Requests | 180, exactly 9 per workflow |
| Achieved RPS | 97.443 |
| Overall HTTP p50 / p90 / p95 / p99 | 6.966 / 20.157 / 21.393 / 24.495 ms |
| API time per workflow, average / p95 | 86.302 / 105.391 ms |
| Iteration duration, average / p95 | 92.306 / 110.037 ms |

The API-only RPS is not a business throughput target. It is the rate produced by one closed VU running without user delay and demonstrates that API processing is a small part of a normal synthetic iteration.

### 8.2 One VU with think-time

| Measurement | Result |
|---|---:|
| Completed workflows | 10/10 |
| Workflow/check success | 100% / 100% |
| HTTP failure | 0% |
| Requests | 90, exactly 9 per workflow |
| Achieved RPS | 0.620 |
| Overall HTTP p50 / p90 / p95 / p99 | 6.078 / 21.701 / 22.662 / 37.042 ms |
| API time per workflow, average / p95 | 88.005 / 107.371 ms |
| Think-time per workflow, average / p95 | 14.418 / 16.083 seconds |
| Complete iteration, average / p95 / p99 | 14.517 / 16.174 / 16.198 seconds |
| Backend CPU average / maximum | 0.037% / 0.379% of total machine capacity |
| Backend working set average / maximum | 53.652 / 53.973 MB |
| k6 CPU average / maximum | 0.039% / 0.507% of total machine capacity |
| k6 working set average / maximum | 32.623 / 33.410 MB |

Separation of time is clear: approximately 14.418 seconds was synthetic think-time, approximately 88 ms was summed API response time, and the remaining small difference was client-side execution/measurement overhead.

## 9. Exploratory concurrency measurements

| VUs | Workflows | HTTP requests | Success: workflow / checks / HTTP | RPS | HTTP p95 | HTTP p99 | Iteration p95 | Backend CPU avg / max | Backend working-set max | k6 CPU avg / max | k6 working-set max |
|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 10 | 90 | 100% / 100% / 0% failed | 0.620 | 22.662 ms | 37.042 ms | 16.174 s | 0.037% / 0.379% | 53.973 MB | 0.039% / 0.507% | 33.410 MB |
| 2 | 8 | 72 | 100% / 100% / 0% failed | 1.357 | 27.360 ms | 33.122 ms | 14.905 s | 0.101% / 0.506% | 55.047 MB | 0.118% / 0.630% | 33.473 MB |
| 4, exploration | 16 | 144 | 100% / 100% / 0% failed | 2.629 | 42.946 ms | 51.696 ms | 15.099 s | 0.168% / 1.004% | 56.609 MB | 0.184% / 1.327% | 34.828 MB |
| 4, confirmation | 32 | 288 | 100% / 100% / 0% failed | 2.541 | 46.818 ms | 54.115 ms | 15.816 s | 0.167% / 1.522% | 58.586 MB | 0.261% / 1.011% | 36.844 MB |
| 8 | 32 | 288 | 100% / 100% / 0% failed | 4.975 | 27.251 ms | 122.377 ms | 16.143 s | 0.354% / 1.138% | 57.430 MB | 0.162% / 1.786% | 37.535 MB |

CPU and memory showed no saturation at any explored level, and k6 was not a resource bottleneck. The 8-VU overall p99 increased to 122.377 ms, 3.30 times the 1-VU p99. Its Register p95 reached 123.832 ms compared with 30.077 ms at 1 VU. That is an early write-tail/contention signal, not a capacity failure.

The two 4-VU runs were repeatable: RPS was 2.629 and 2.541, all correctness measures remained perfect, and overall p99 stayed near 52-54 ms. Four VUs therefore creates overlapping stateful workflows while remaining clearly below the explored level where the tail changed materially.

### Per-endpoint p95 comparison

| Endpoint step | 1 VU p95 | Confirmed 4 VUs p95 | 8 VUs p95 |
|---|---:|---:|---:|
| Register | 30.077 ms | 51.424 ms | 123.832 ms |
| Login | 8.081 ms | 9.770 ms | 9.945 ms |
| Read Profile | 9.378 ms | 9.350 ms | 22.484 ms |
| Update Profile | 26.201 ms | 54.906 ms | 23.675 ms |
| Read Categories | 4.528 ms | 5.579 ms | 7.076 ms |
| Read Products | 4.565 ms | 4.615 ms | 9.192 ms |
| Read Product Detail | 5.343 ms | 5.146 ms | 5.038 ms |
| Add to Cart | 6.324 ms | 7.401 ms | 7.457 ms |
| Checkout | 30.753 ms | 50.235 ms | 28.583 ms |

Small endpoint sample counts make individual p95 values noisy. Overall distributions and the longer 4-VU confirmation run are the stronger basis for provisional thresholds.

## 10. Synthetic user-behavior assumptions

No user analytics exist for this educational SUT. The following delays remain synthetic rather than empirically observed customer behavior:

| Decision point | Range | Semantic reason |
|---|---:|---|
| Register -> Login | 1-2 s | Notice success and move to Login. |
| Read Profile -> Update Profile | 3-5 s | Review and enter profile data. |
| Read Products -> Product Detail | 2-4 s | Scan and select a product. |
| Product Detail -> Add to Cart | 2-4 s | Review product and quantity. |
| Add to Cart -> Checkout | 1-3 s | Review the purchase decision. |

The logical decision points remain appropriate. Calibration measured an average total of 13.30-14.42 seconds and p95 of 14.98-16.08 seconds across the think-time runs, consistent with the theoretical 9-18 second range. This validates implementation of the synthetic model, not realism of the behavior.

## 11. Parameter re-evaluation

All revised performance thresholds remain provisional baselines for this hardware and SUT state, not business SLOs.

| Parameter | Current proposal | Evidence collected | Revised proposal | Reasoning |
|---|---:|---|---:|---|
| Start load | 1 VU | The 1-VU smoke and repeated baselines were correct; one VU avoids a simultaneous initial registration burst. | **1 VU** | Retain the smallest valid start. |
| Target VUs | 5 VUs | 4 VUs repeated at 2.541-2.629 RPS with 100% correctness and low resources; 8 VUs remained correct but overall p99 rose to 122.377 ms and Register p95 to 123.832 ms. | **4 VUs** | Lowest confirmed modest level with repeatable multi-user overlap and clear headroom below the observed 8-VU tail change. No production-user claim is made. |
| Ramp-up | 60 s | Confirmed 4-VU iteration p95 was 15.816 s. Moving from 1 to 4 introduces three VUs; three p95 workflow windows are 47.448 s. | **48 s from 1 to 4 VUs** | Introduces approximately one additional VU per measured p95 workflow window without spike behavior. |
| Steady duration | 3 min | Confirmed 4-VU RPS was 2.541, or 0.282 workflows/s. A 4-minute plateau estimates about 68 workflows and 610 requests. | **4 min at 4 VUs** | Provides roughly 68 samples for every workflow step, more defensible than the approximately 51 samples estimated for 3 minutes, while remaining far below the 10-15 minute endurance duration. |
| Ramp-down | 60 s | Confirmed iteration p95 was 15.816 s. Four p95 workflow windows are 63.264 s. | **64 s from 4 to 0 VUs** | Removes load progressively across about one p95 workflow window per VU, with graceful completion still enabled. |
| Graceful ramp-down/stop | 30 s | Confirmed 4-VU iteration p99/max were 15.894/15.896 s; synthetic think-time can theoretically reach 18 s. | **25 s** | More than 1.5 times measured p99 and above the synthetic maximum think-time, leaving additional allowance for API slowdown. |
| Think-time | Five ranges totaling 9-18 s | Implementation produced the expected distribution and decision points are logical, but no user analytics exist. | **Keep the five ranges unchanged** | This remains explicitly synthetic; calibration validates mechanics only. |
| Overall HTTP p95 | `< 500 ms` | Confirmed 4-VU p95 was 46.818 ms. A 25% degradation allowance gives 58.523 ms. | **`p(95) < 60 ms`** | Rounded above measured value plus 25%; provisional regression guard for this machine, not an SLO. |
| Overall HTTP p99 | `< 1000 ms` | Confirmed 4-VU p99 was 54.115 ms; 8-VU p99 was 122.377 ms. | **`p(99) < 85 ms`** | Approximately 57% above the confirmed target result, but still below the observed 8-VU tail change. Extra margin reflects p99 sample sensitivity. |
| Iteration-duration p95 | `< 20 s` | Confirmed 4-VU p95 was 15.816 s. Adding 20% gives 18.979 s. | **`p(95) < 19 s`** | Directly combines measured synthetic think-time, API time, and client overhead with a stated 20% tolerance. |
| HTTP failure | `< 1%` | Zero HTTP/transport failures in 1,062 measured requests. The workflow has no expected negative responses. | **`rate == 0`** | At this modest normal load, any HTTP failure is unexpected and should fail the run. |
| Semantic checks | `> 99%` | All 4,130 semantic checks passed; known behavior requires exact correlations and shipping address, not tolerant partial success. | **`rate == 1`** | Any known semantic failure means at least one response or request correlation is wrong. |
| Complete workflow | `> 99%` | All 118 measured workflows succeeded; an iteration is meaningful only if all nine steps complete correctly. | **`rate == 1`** | One incomplete onboarding/order journey is a functional failure under the proposed normal load. |
| RPS | Observe only | RPS scaled from 0.620 at 1 VU to 2.541 at confirmed 4 VUs under synthetic delays, but no throughput requirement exists. | **No threshold** | Keep as an observed outcome of the closed VU model. |

The revised nominal profile is:

`1 VU -> ramp to 4 VUs over 48 s -> hold 4 VUs for 4 min -> ramp to 0 over 64 s`

Nominal stage time is 352 seconds, or 5 minutes 52 seconds, with up to 25 seconds for graceful completion.

## 12. Remaining AI/human assumptions

- Four VUs is a calibrated synthetic normal-load target, not a statement about production traffic.
- The 25% p95, approximately 57% p99, and 20% iteration tolerances are explicit test-design choices; the measurements identify the baseline but do not define business acceptability.
- Think-time ranges remain synthetic user-behavior assumptions.
- Four minutes is selected to estimate about 68 per-step samples; the assignment gives no required Load plateau duration or statistical confidence target.
- Process CPU sampling is one-second and normalized across logical processors; official evidence should also show Task Manager for whole-machine context.
- Persistent users, orders, and in-memory carts accumulated across calibration runs. The official run must document its initial SUT state and unique run ID.
- The first cold Register outlier shows that warm/cold state affects maxima. Thresholds use percentiles over the full run, while maximum latency remains an observed diagnostic.
- Instructor acceptance of newline-delimited k6 JSON and exported HTML as the required k6 equivalents still needs human confirmation.

## 13. Calibration artifacts

- `work/k6_workflow_calibration.js`
- `work/run_k6_calibration.ps1`
- `work/calibration-results/hardware_observation.json`
- `work/calibration-results/database_verification.json`
- `work/calibration-results/consolidated_metrics.csv`
- `work/calibration-results/consolidated_metrics.json`
- `work/calibration-results/endpoint_metrics.csv`
- Per-run `metadata.json`, `summary.json`, `raw.json`, `stdout.txt`, `stderr.txt`, and `process-resources.csv` under `work/calibration-results/<run-name>/`

These files are working calibration evidence and must not be presented as official submission execution evidence.
