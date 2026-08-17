# HW05 Context Handoff — Task 2 Complete, Before Task 3

## Authoritative requirement

- `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
- Task 3 requires a continuous performance-testing proposal that watches commits, decides whether to run performance tests, flags p95 regressions, and includes a flowchart plus cost/false-alarm trade-offs.

## Milestone state

- Task 1 / REQ1: **COMPLETE**.
- Task 2: **COMPLETE / HUMAN-REVIEWED**.
- Task 3: **NOT STARTED**.

## Official valid runs

- Load: `20260817t045341487`
- Stress: `20260817t115158688`
- Spike: `20260817t134816776`
- Soak: `20260818t000551547`

## Final Task 1 endurance threshold

HUMAN-REVIEWED / FINAL: observed sustained throughput floor **7.983 requests/s** and **0.829 clean workflows/s** at **12 sustained VUs for 12 minutes**, with **0 HTTP failures, 100% checks, and 100% workflow correctness**. This is not maximum stable RPS, production capacity, or a business SLO.

## Final Task 2 regression guards

These apply only under comparable hardware, dataset, harness, and scenario profile. They are regression guards, not business SLOs or production-capacity claims:

- `http_req_failed == 0`
- `checks == 1`
- `workflow_success == 1`
- global HTTP p95 `<= 25 ms`
- global HTTP p99 `<= 50 ms`
- 12-VU sustained throughput `>= 7.983 req/s`
- clean workflow rate `>= 0.829 workflows/s`
- early-to-late Soak throughput degradation `<= 5%`
- no numeric backend-memory guard is approved

## Final human corrections

- 4-VU Load is a synthetic baseline, not production demand.
- 24 VUs is the tested upper bound, not maximum capacity; no breaking point was observed within the tested range.
- Spike approximately 578.87 ms maximum is a warm-up/cold-start Register observation, not peak-load latency.
- 7.983 req/s is the observed sustained throughput floor for the reviewed Soak protocol, not maximum stable RPS.
- Soak memory evidence does not prove a leak.
- Functional correctness is supported by semantic checks, `workflow_success`, and expected request counts, not HTTP 200 alone.

## Final optimization classifications

- Additional `users(email)` index: **FEASIBLE**; the schema has no UNIQUE constraint or explicit email index, but measured benefit is unproven and requires benchmarking.
- SQLite WAL plus bounded busy timeout: **FEASIBLE**; technically applicable, but benefit is not demonstrated and must be benchmarked before implementation.
- Connection-strategy benchmark: **FEASIBLE**; technically possible with the current single `sqlite3.Database`, but connection handling is not proven to be a bottleneck.
- Arbitrary memory ceiling or leak fix: **HALLUCINATED**; evidence does not establish a leak or supported ceiling.

The tested workflow does not exercise an order-history read path, so `orders(user_id, id)` is not a primary Task 2 optimization proposal.

## Relevant artifacts

- Main Task 2 analysis: `work/task2_performance_analysis.md`
- Main submission report: `out/README.md`
- Report registry and milestone state: `work/performance_testing_report_state.md`
- AI Audit Report: `out/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md`
- Valid Soak evidence: `out/23127179_Soak_20260817_evidence/20260818t000551547/`

## AI Audit state

The AI Audit ledger remains **25 artifacts: 24 VALID, 0 INVALID, 1 INCOMPLETE**. The incomplete item records a missing verbatim prompt without fabrication; human-review decisions are recorded separately as human decisions.

## Boundary

Task 3 is **NOT STARTED**. The next approved action is to read this handoff and the authoritative requirement, then design the continuous performance-testing proposal only.
