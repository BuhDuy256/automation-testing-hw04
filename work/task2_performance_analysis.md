# HW05 Task 2 — Performance Result Analysis

**Status: COMPLETE / HUMAN-REVIEWED.** This finalized Task 2 analysis uses only the four official valid runs: Load `20260817t045341487`, Stress `20260817t115158688`, Spike `20260817t134816776`, and Soak `20260818t000551547`.

## 1. Scope and Evidence

Primary evidence is the raw k6 NDJSON for Load `20260817t045341487`, Stress `20260817t115158688`, Spike `20260817t134816776`, and Soak `20260818t000551547`. Native/derived evidence is used only to expose phase and steady-window values: Stress `stress-stage-summary.md`, Spike `spike-metrics.csv` and verification notes, and Soak `soak-window-summary.md`. The raw streams independently contain 846, 9,144, 1,584, and 6,201 HTTP-request points respectively, with all nine workflow steps represented in each valid run.

The labels below are deliberately separate: measured facts come from the runs, AI interpretations explain those facts, AI proposals are unaccepted suggestions, and human-reviewed decisions remain pending.

## 2. AI Analysis — Load

- The 4-VU reviewed baseline completed 94 workflows and 846 requests, exactly 9 requests per workflow, with 0 non-200 request points, 3,290/3,290 checks, and 94/94 workflow successes in the raw stream.
- Raw HTTP duration points are approximately p95 16.39 ms, p99 20.95 ms, and maximum 159.33 ms; the official report records approximately 16.35 ms, 20.77 ms, and iteration p95 15.34 s.
- Iteration duration includes the workflow's deliberate think-time, so its p95 is not server latency. The run is a stable synthetic baseline for later comparison, not a statement of production demand.
- Resource evidence shows no observed backend or generator saturation in this run; shared-machine activity limits causal attribution. The baseline is useful for regression comparison, not capacity planning.

## 3. AI Analysis — Stress

- The progressive profile increased through 24 VUs. Raw evidence contains 1,016 workflows and 9,144 requests, exactly 9 requests per workflow, with 0 HTTP failures, 35,560/35,560 checks, and 1,016/1,016 workflow successes.
- Stage throughput increased from 2.692 req/s at 4 VUs to 15.950 req/s at 24 VUs; the measured pattern is approximately increasing throughput as concurrency increased, not a plateau or collapse.
- Global raw HTTP duration is approximately p95 19.44 ms and p99 41.39 ms; the official aggregates are 19.43 ms and 41.36 ms. Latency is variable by stage rather than monotonically worsening; the 16-VU p95 was 33.50 ms, while 24-VU p95 was 17.80 ms.
- Backend and generator process samples remained available without an obvious saturation signal. No meaningful breaking point was observed through the reviewed range to 24 VUs. This bounded observation is not a capacity claim.

## 4. AI Analysis — Spike

- The valid run moved from a 4-VU warm-up to an actual 32-VU peak and then recovered to a verified steady 4-VU interval. It completed 176 workflows and 1,584 requests, exactly 9 requests per workflow, with 0 failures, 6,160/6,160 checks, and 176/176 workflow successes.
- Native phase evidence shows pre-spike p95 13.14 ms, `spike_peak_32` p95 14.27 ms, recovery-settling p95 14.94 ms, and recovery-steady-4 p95 12.14 ms. Peak work therefore did not produce a material correctness failure or a large p95 increase in this run.
- The raw/global maximum of approximately 578.875 ms (reported as 578.87 ms) was the first Register observation during warm-up/cold start. It is not a peak-load latency result.
- Backend CPU increased during the peak but remained low in whole-machine terms, k6 was not generator-dominant, and actual VUs settled at 4 during the verified recovery window. This supports recovery for this invocation only.

## 5. AI Analysis — Soak / Endurance

- The official valid Soak held 12 sustained VUs for the reviewed 12-minute window. Raw evidence contains 6,201 requests and 689 complete workflows, with 0 HTTP failures, 24,115/24,115 checks, and 689/689 workflow successes.
- Steady request rates were early 8.020833, middle 7.987500, and late 7.983333 req/s. The minimum clean-workflow rate was 0.829167 workflows/s. Early-to-late changes were approximately -0.47% req/s and -0.98% workflow/s.
- The already-final Task 1 wording remains unchanged: **observed sustained throughput floor 7.983 req/s and 0.829 clean workflows/s at 12 VUs for 12 minutes, with zero HTTP failures and 100% workflow correctness**. This is not maximum stable RPS, production capacity, or a business SLO.
- Resource and memory direction is mixed and requires more evidence. The records do not establish a leak, defect, or capacity ceiling; no memory-leak diagnosis is made.

## 6. Cross-Scenario Findings

| Scenario | Purpose / profile | Throughput | p95 / p99 | Correctness | Resource behavior | Main factual conclusion |
|---|---|---:|---:|---|---|---|
| Load | 4-VU synthetic baseline | 846 requests / 376.4 s; report ≈2.27 req/s | ≈16.35 / 20.77 ms | 0 failures; 100% checks/workflows | No obvious process saturation | Stable reviewed baseline; not production demand |
| Stress | Progressive 4→24 VUs with recovery | 2.692→15.950 req/s by stage | ≈19.43 / 41.36 ms global | 0 failures; 100% checks/workflows | No obvious saturation; unrelated machine activity present | No meaningful breaking point through 24 VUs |
| Spike | 4→32 VUs, then recovery | 1,584 requests / 176 workflows | peak p95 ≈14.27 ms; global ≈14.26 / 18.70 ms | 0 failures; 100% checks/workflows | Peak resource response remained bounded; recovery reached 4 VUs | Correctness and measured recovery held for this spike |
| Soak | 12 VUs for 12 minutes plus recovery | 7.983–8.021 req/s steady windows | window p95 ≈15.17–18.46 ms | 0 failures; 100% checks/workflows | Memory direction mixed; needs more evidence | Sustained floor observed; no time-dependent collapse |

Cross-scenario findings:

1. Correctness remained intact across all four valid workload shapes and all 9-step workflows completed.
2. Latency increased only modestly in the reviewed Stress aggregate and did not degrade monotonically with VUs; no breaking point was measured.
3. The Spike peak did not create a correctness failure, and the measured recovery interval returned to 4 VUs.
4. Soak throughput changed by less than 1% from early to late steady windows, but this is evidence for the reviewed workload, not a universal endurance guarantee.
5. Shared-machine resource measurements and ambiguous memory direction limit causal claims.

## 7. AI-Proposed Performance Thresholds

These are **HUMAN-APPROVED future regression guards** for comparable hardware, dataset, harness, and scenario profiles. They are not business SLOs, production-capacity claims, or replacements for the final Task 1 endurance threshold.

| Metric | Proposed guard | Evidence basis and reasoning | Confidence | Human review status |
|---|---|---|---|---|
| `http_req_failed` | `rate == 0` | All four valid raw runs had zero failed HTTP requests. | High | HUMAN-APPROVED |
| `checks` and `workflow_success` | `rate == 1` | All 9-step workflows passed semantic and workflow-success checks. | High | HUMAN-APPROVED |
| Global HTTP p95/p99 | p95 ≤ 25 ms and p99 ≤ 50 ms for the same harness/profile | Valid-run tails were approximately p95 14.26–19.43 ms and p99 18.70–41.36 ms. | Medium | HUMAN-APPROVED |
| 12-VU sustained throughput | ≥ 7.983 req/s and ≥ 0.829 clean workflows/s for the reviewed 12-minute protocol | Uses the final Task 1 empirical floor as a comparable-run guard, not capacity or SLO. | Medium | HUMAN-APPROVED; Task 1 fact remains FINAL |
| Soak early-to-late degradation | request-rate loss ≤ 5% and clean-workflow-rate loss ≤ 5% under the same protocol | Observed losses were approximately 0.47% and 0.98%; 5% is a future guard. | Medium | HUMAN-APPROVED |
| Backend memory ceiling | No numeric guard approved | Memory direction is mixed and does not justify a limit or leak diagnosis. | High | HUMAN-APPROVED: no numeric memory threshold |

## 8. Human Verification and Corrections

The following decisions are explicitly **HUMAN-REVIEWED and HUMAN-APPROVED**:

| Decision | Human-approved wording |
|---|---|
| Load interpretation | 4 VUs is a synthetic baseline, not production demand. |
| Stress interpretation | 24 VUs is not maximum capacity; no breaking point was observed within the tested range. |
| Spike maximum | The approximately 578.87 ms maximum is a warm-up/cold-start Register observation, not peak-load latency. |
| Soak throughput | 7.983 req/s is the observed sustained throughput floor for the reviewed Soak protocol, not maximum stable RPS. |
| Soak memory | Memory evidence does not prove a leak. |
| Functional correctness | Correctness is supported by semantic checks, `workflow_success`, and expected request counts, not HTTP 200 alone. |

These decisions are the human review outcome; the detailed comparison table below records the underlying evidence and correction rationale.

The legacy `CORRECTED` and `CONFIRMED` labels in the comparison table are retained only to show the original AI-review draft; the authoritative decisions are the HUMAN-APPROVED decisions above.

| AI interpretation | Raw evidence | Human verdict | Correction if needed | Reason |
|---|---|---|---|---|
| “The 4-VU Load run represents normal production demand.” | Reviewed profile was 4 VUs; 94 workflows and 846 requests. | CORRECTED | It is a reviewed synthetic baseline, not production demand. | No production traffic model was supplied. |
| “24 VUs is the system's maximum capacity.” | Stress reached 24 VUs with 15.950 stage req/s, 0 failures, and 100% correctness. | CORRECTED | No meaningful breaking point was observed through the tested range; 24 VUs is not capacity. | The test stopped at a reviewed bound while throughput still increased. |
| “The Spike run had a 578.87 ms peak-load latency failure.” | Raw maximum ≈578.875 ms; phase evidence places it on first Register in warm-up, not `spike_peak_32`. | CORRECTED | Treat it as a warm-up/cold-start maximum, not peak-load latency. | Global max and peak-phase p95 answer different questions. |
| “7.983 req/s is maximum stable RPS.” | Soak late-window minimum was 7.983333 req/s at 12 VUs for 12 minutes. | CORRECTED | It is the HUMAN-REVIEWED / FINAL observed sustained throughput floor for that protocol. | No maximum search or production-capacity experiment was performed. |
| “The Soak memory trend proves a leak.” | Window directions are `mixed_or_requires_human_review`; recovery values do not establish causality. | CORRECTED | Needs more evidence; do not diagnose a leak. | Working-set movement alone is not a leak proof. |
| “All workflows were functionally successful because HTTP status was 200.” | Raw checks and `workflow_success` were 100% in every valid run, and each step count matched. | CONFIRMED with stronger oracle | Correctness is supported by semantic checks, workflow success, and request-count evidence, not status alone. | This follows the frozen runtime contract. |

## 9. AI Optimization Proposals

1. Evaluate an additional `users(email)` lookup index only if needed. The current `users` schema has no `UNIQUE` constraint or explicit index on `email`, and Login executes `SELECT * FROM users WHERE email = ?`; measured benefit has not yet been demonstrated.
2. Evaluate SQLite WAL mode plus a bounded busy timeout for the write-concurrent workflow. The workflow performs registration, profile update, and checkout writes; the valid runs showed no lock contention, so benchmark before implementation.
3. Benchmark a controlled database-connection strategy (single `sqlite3.Database` versus a bounded pool). The current architecture makes the experiment technically possible, but current evidence does not prove connection handling is a bottleneck or establish a performance gain.
4. Treat an arbitrary backend memory ceiling or “leak fix” as a rejected optimization: the valid evidence does not establish a memory leak, ceiling, or causal defect.

## 10. Feasibility / Hallucination Review

| Proposal | Classification | Reason |
|---|---|---|
| Additional `users(email)` index | FEASIBLE | The schema has no implicit `UNIQUE` index and Login queries by email; benefit is not yet demonstrated, so benchmark before implementation. |
| SQLite WAL + bounded busy timeout | FEASIBLE | Technically applicable to the current SQLite architecture and write-heavy workflow; valid runs did not establish lock contention, so benchmark before implementation. |
| Bounded connection strategy / pool benchmark | FEASIBLE | The current single `sqlite3.Database` architecture makes the experiment possible; no bottleneck or performance gain is established. |
| Arbitrary memory limit or leak fix | HALLUCINATED | Mixed memory evidence cannot justify a leak diagnosis, numeric limit, or claimed benefit. |

No optimization is implemented in Task 2, and no GitHub Issue is created. The Task 1 issue boundary remains unchanged: no genuine SUT bug or performance issue was established in the valid official runs.

## 11. Human Review Closure

**Task 2 status: COMPLETE / HUMAN-REVIEWED.**

- The metric corrections, regression guards, and binary optimization classifications are human-approved.
- No optimization was implemented, no performance test was rerun, and no Task 3 work was started.
