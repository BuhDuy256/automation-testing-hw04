# HW05 Task 2 — Performance Result Analysis

## 1. Evidence Used

Only the four official valid runs were used:

| Scenario | K6 run ID |
|---|---|
| Load | `20260817t045341487` |
| Stress | `20260817t115158688` |
| Spike | `20260817t134816776` |
| Soak / Endurance | `20260818t000551547` |

Detailed working evidence and review rationale remain in [`work/task2_performance_analysis.md`](../work/task2_performance_analysis.md).

## 2. Final Performance Analysis

### Load

The reviewed 4-VU run completed 94 workflows and 846 requests, exactly 9 requests per workflow, with zero HTTP failures and 100% checks and workflow success. Global latency was approximately p95 16.35 ms and p99 20.77 ms. This is a synthetic baseline for regression comparison, not production demand.

### Stress

Throughput increased from approximately 2.692 req/s at 4 VUs to 15.950 req/s at 24 VUs. The run completed 1,016 workflows and 9,144 requests with zero failures and 100% correctness. Global p95/p99 were approximately 19.43/41.36 ms. No meaningful breaking point was observed within the tested range; 24 VUs is not maximum capacity.

### Spike

The run reached an actual 32-VU peak, completed 176 workflows and 1,584 requests, and maintained zero failures with 100% correctness. Peak-phase p95 was approximately 14.27 ms, and the verified recovery interval returned to 4 VUs. The approximately 578.87 ms global maximum was a warm-up/cold-start Register observation, not peak-load latency.

### Soak / Endurance

At 12 sustained VUs for 12 minutes, steady throughput was approximately 8.02, 7.99, and 7.98 req/s across early, middle, and late windows. The observed minimum was 7.983333 req/s and the minimum clean workflow rate was 0.829167 workflows/s. Early-to-late changes were approximately -0.47% req/s and -0.98% workflow rate, with zero HTTP failures and 100% correctness. Memory evidence does not prove a leak.

### Cross-scenario comparison

Correctness remained intact across all four workload shapes. Latency did not show a meaningful monotonic degradation, Stress did not expose a breaking point through 24 VUs, Spike recovered to 4 VUs in the verified interval, and Soak showed no time-dependent throughput collapse under the reviewed protocol.

## 3. Human-Reviewed Corrections to AI Interpretation

The following are FINAL HUMAN-REVIEWED conclusions:

- 4-VU Load is a synthetic baseline, not production demand.
- 24 VUs is not maximum system capacity.
- The approximately 578.87 ms Spike maximum occurred during warm-up/cold-start Register, not peak load.
- 7.983 req/s is an observed sustained throughput floor, not maximum stable RPS.
- Soak memory evidence does not prove a memory leak.
- Functional correctness is supported by semantic checks, `workflow_success`, and expected request counts, not HTTP 200 alone.

## 4. Final Regression Guards

These guards apply only under comparable hardware, dataset, harness, and scenario profile. They are regression guards, not business SLOs, production capacity, or maximum stable RPS:

- `http_req_failed == 0`
- `checks == 1`
- `workflow_success == 1`
- global HTTP p95 `<= 25 ms`
- global HTTP p99 `<= 50 ms`
- sustained throughput `>= 7.983 req/s`
- clean workflow rate `>= 0.829 workflows/s`
- Soak early-to-late degradation `<= 5%`

No numeric backend-memory guard is approved.

## 5. Optimization Proposals and Final Human Classification

### SQLite WAL + bounded busy timeout

**Classification: FEASIBLE**

Technically applicable to the current SQLite architecture and write-heavy workflow, but benefit has not yet been demonstrated. Benchmark before implementation.

### Connection-strategy benchmark

**Classification: FEASIBLE**

The current architecture makes this experiment valid, but current evidence does not prove connection handling is a bottleneck.

### Additional `users(email)` index

**Classification: FEASIBLE**

The current schema has no `UNIQUE` constraint or explicit index on `users(email)`, while Login queries that column directly. Measured benefit remains unproven and requires benchmarking.

### Arbitrary memory ceiling / leak fix

**Classification: HALLUCINATED**

Current evidence does not establish a memory leak, supported memory ceiling, or causal defect.

The untested `orders(user_id, id)` order-history path is not included as a primary Task 2 optimization proposal.

## 6. Final Task 2 Conclusion

**Task 2 = COMPLETE / HUMAN-REVIEWED**

No remaining Task 2 human-review items.
