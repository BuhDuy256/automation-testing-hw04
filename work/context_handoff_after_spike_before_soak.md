# HW05 Context Handoff After Spike, Before Soak / Endurance

This file is the navigation entry point for a fresh Codex context. It records verified repository state after the official Spike milestone and before any Soak / Endurance design. Repository evidence remains authoritative over conversational memory.

## 1. Current Milestone State

| Milestone | State |
|---|---|
| Load | COMPLETE |
| Stress | COMPLETE |
| Spike | COMPLETE |
| Soak / Endurance | NOT DESIGNED / NOT IMPLEMENTED / NOT EXECUTED |
| HW05 Task 2 | NOT STARTED |
| HW05 Task 3 | NOT STARTED |

The next approved milestone is **Soak / Endurance DESIGN ONLY**. Stop for human review before implementation or traffic.

## 2. Authoritative HW05 Requirement

Authoritative requirement:

`docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`

Task 1 requires a short endurance / soak test at sustained load for approximately 10–15 minutes to empirically determine a concrete threshold for the observed hardware and SUT conditions. The requirement gives examples such as maximum stable RPS and a memory ceiling. Another measured threshold is acceptable only when it is defensible from real evidence. Do not invent a business SLO or an assignment requirement that the source does not state.

## 3. Repository and Student State

- Student: Nguyen Bao Duy
- Student ID: `23127179`
- Class: `23KTPM2`
- Active branch: `hw05-performance`
- SUT path: `eshop-sut/`
- Selected performance tool: k6 (official completed runs used local k6 v2.1.0)
- `work/`: intermediate plans, drafts, validation, handoffs, and exploratory evidence
- `out/`: finalized HW05 submission artifacts
- Latest completed Spike milestone commit before this handoff: `2ebe42c904db6475f21ad00971cac70cba483f8c`

`eshop-sut/backend/database.sqlite` is historically tracked and currently runtime-modified. Its mutation is not an intended source change: leave it unstaged and do not commit it accidentally.

## 4. Frozen End-to-End Workflow

Preserve this workflow unless the assignment explicitly requires otherwise:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

A successful workflow has exactly nine HTTP requests and exactly one Checkout. Preserve:

- the finalized CSV schema;
- unique runtime identity per execution;
- original registration password for Login;
- JWT correlation;
- category/product correlation;
- Product Detail to Cart correlation using runtime `id`, `name`, and `price`;
- runtime `price * quantity` total;
- explicit CSV `shipping_address` in Checkout;
- semantic checks, not status-only success;
- `workflow_success`; and
- safe early return after a required dependency fails, with no hard-coded runtime fallback.

## 5. Finalized Data Strategy

CSV schema, in order:

`identity_seed,name,password,phone,shipping_address,quantity`

The CSV contains controlled input only. JWTs, user/category/product/order identifiers, product names, prices, and other response-produced values remain runtime-generated or correlated. Each invocation requires a unique validated `K6_RUN_ID`; there is no silent fallback.

The workflow creates persistent users and orders, so application state grows during sustained execution. This fact is relevant to Soak design but is not yet classified as a problem.

## 6. Load Baseline

Primary Load invocation: `K6_RUN_ID=20260817t045341487`.

The reviewed synthetic normal-load reference is four VUs. It is not measured production demand.

- 94 completed workflows
- 846 HTTP requests
- exactly 9 requests per workflow
- 0 interrupted iterations
- 0 HTTP failures
- checks: 100%
- `workflow_success`: 100%
- HTTP p95: approximately 16.36 ms
- HTTP p99: approximately 20.77 ms
- iteration p95: approximately 15.34 s

## 7. Stress Result

Official Stress invocation: `K6_RUN_ID=20260817t115158688`.

- Technical validity: VALID
- Submission completeness: COMPLETE for the Stress Task 1 milestone
- 1,016 completed workflows
- 9,144 HTTP requests
- exactly 9 requests per workflow
- 0 HTTP failures
- checks: 100%
- `workflow_success`: 100%
- `vus_max=24`
- HTTP p95: approximately 19.43 ms
- HTTP p99: approximately 41.36 ms

No meaningful breaking point was observed within the reviewed range through 24 VUs. This is not a production-capacity claim.

## 8. Spike Result

Official Spike invocation: `K6_RUN_ID=20260817t134816776`.

- Technical validity: VALID
- Submission completeness: COMPLETE for the Spike Task 1 milestone
- 176 completed workflows
- 1,584 HTTP requests
- exactly 9 requests per workflow
- 176 Checkouts
- 0 HTTP failures
- 6,160 / 6,160 checks
- 176 / 176 `workflow_success`
- 0 interrupted iterations
- 76 cross-phase iterations
- `vus_max=32`
- global HTTP p95: approximately 14.26 ms
- global HTTP p99: approximately 18.70 ms
- global maximum: approximately 578.87 ms

The global maximum was the first Register request during `warmup_4`, not a request during the 32-VU peak. The `spike_peak_32` HTTP p95 was approximately 14.27 ms.

## 9. Spike Recovery Result

| Window | HTTP p95 |
|---|---:|
| `pre_spike_steady_4` | approximately 13.14 ms |
| `spike_peak_32` | approximately 14.27 ms |
| `recovery_steady_4` | approximately 12.14 ms |

During intended recovery steady elapsed 137–197 seconds, all 60 native k6 `vus` samples were exactly four: minimum 4, maximum 4, average 4, and zero samples above 4. The recovery comparison window is therefore empirically valid.

The scheduled target dropped in one second, but actual active VUs drained over approximately 13 seconds because graceful completion allowed in-flight workflows to finish. Actual VUs settled before `recovery_steady_4`.

## 10. Resource Observations Relevant to Soak

Stress showed no obvious backend or k6 saturation through the reviewed maximum of 24 VUs.

For the official Spike invocation:

- pre-spike backend working set was approximately 48.6 MB;
- peak and post-Spike backend working set reached approximately 64.4 MB; and
- backend working set remained around 64.4 MB during the observed recovery period instead of returning to the earlier reference.

This is an observed memory-retention pattern only. It has not been diagnosed as a memory leak, defect, or capacity ceiling. Soak evidence may later show whether memory stabilizes, continues growing, periodically returns, or correlates with persistent application state; do not prejudge that result.

## 11. Whole-Machine Constraint

The SUT and k6 generator run on the same Windows machine. Prior whole-machine committed memory was high while unrelated applications were also active. Soak design and evidence must distinguish:

- backend `node.exe` process memory;
- k6 process memory; and
- whole-machine memory.

Do not attribute unrelated system memory to EShop.

## 12. Current Report-Type Registry

| Scenario | Designated report type | Status |
|---|---|---|
| Load | Native k6 Web Dashboard HTML | USED |
| Stress | Custom k6 Markdown Stress Stage Summary | USED |
| Spike | Native k6 CSV metrics output | USED |

The assignment's three-distinct-report requirement for Load, Stress, and Spike is satisfied. Do not assume Soak requires a fourth unique designated report unless the authoritative requirement says so. Soak may reuse appropriate evidence mechanisms only after human review.

## 13. Current Agent Skill

Skill root:

`.codex/skills/performance-testing-lifecycle`

The Skill currently supports only these explicit modes:

- `load`
- `stress`
- `spike`

Do not automatically extend it or create a separate Soak skill. The next context must first decide whether the general lifecycle can support Soak as-is or whether a reviewed reusable soak/endurance extension or reference is needed. This remains a design decision.

## 14. Submission Videos

Both student-provided links are recorded once in `out/README.md`, section **Submission Video Links**:

- Performance Testing Execution Video: https://youtu.be/86qyG0n4Mbs?si=2YBhaUXCnj0kp457
- Performance Testing Agent Skill Demo: https://youtu.be/CXb7EEgjFBs?si=WkQDOfhaKJfTDuuU

Do not infer duration or content compliance from either URL.

## 15. Large Raw Artifact Preservation

Stress raw NDJSON:

- Path: `out/23127179_Stress_20260817_evidence/20260817t115158688/raw-results.ndjson`
- Size: 60,711,245 bytes
- SHA-256: `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`
- Git state: intentionally untracked

Spike raw NDJSON:

- Path: `out/23127179_Spike_20260817_evidence/20260817t134816776/raw-results.ndjson`
- Size: 12,181,217 bytes
- SHA-256: `D60B112DF3784CD448EDF12DE95ACE15E9159CDE30A308D0BFC7AFD21EF5AD8A`
- Git state: intentionally untracked

Do not delete, clean, move, truncate, or commit either file accidentally.

## 16. Spike GUI Limitation History

- 30 genuine screenshots exist.
- Primary screenshot: `out/23127179_Spike_20260817_evidence/20260817t134816776/screenshots/14_spike_peak_32_elapsed0085s.png`.
- Windows UAC blocked `SetWindowPos`, but usable Task Manager Details evidence remained.
- A resource-pane QuickEdit/mark-mode freeze occurred before traffic and was corrected before the official invocation.
- The screenshot/resource schedule had an approximately 11.5-second anchor offset from real k6 traffic because the runner timestamp preceded k6 startup.
- Native k6 CSV and NDJSON timestamps/tags remain authoritative.
- No screenshot was reconstructed, and no rerun occurred.

This history is relevant when designing future Soak evidence capture.

## 17. Soak Design Goal

The next design must answer:

**What sustained-load profile should be run for approximately 10–15 minutes to produce a defensible empirical long-duration performance observation?**

Candidate questions for later design include whether latency, throughput, correctness, backend memory, and persistent-state effects remain stable over time; whether a repeatable operating point exists; and whether a concrete measured threshold can be derived. Do not answer these questions in this handoff.

## 18. Soak Design Decisions Still Open

No decision below is approved:

- Soak VU level;
- whether the reference should be four VUs or another evidence-derived level;
- total duration within approximately 10–15 minutes;
- warm-up duration;
- observation-window splitting;
- think-time strategy;
- thresholds;
- memory-growth evaluation method;
- RPS/throughput threshold methodology;
- persistent-state-growth handling;
- backend restart/reseed strategy;
- report/output choice;
- screenshot frequency;
- resource sampling interval; and
- whether the reusable Skill needs a reviewed soak/endurance extension.

All require an AI proposal followed by human review.

## 19. Do Not Confuse Soak with Stress or Spike

- Stress asks how behavior changes as concurrency progressively increases.
- Spike asks how the SUT responds to a sudden load change and recovers.
- Soak / Endurance focuses on stable sustained load and time-dependent degradation or stability.

Do not design another ramp-to-failure Stress test or another sudden Spike.

## 20. Task 2 Boundary

Do not perform HW05 Task 2 analysis while loading context or designing Soak. Task 2 later requires AI analysis of raw results, human verification/correction, threshold and optimization proposals, and classification of feasible versus hallucinated recommendations. Soak may generate evidence used later by Task 2, but the milestones remain separate.

## 21. Current Git and Milestone State

Latest completed Spike milestone commit: `2ebe42c904db6475f21ad00971cac70cba483f8c`.

- Load: COMPLETE
- Stress: COMPLETE
- Spike: COMPLETE
- Soak: NOT STARTED
- Task 2: NOT STARTED
- Task 3: NOT STARTED

The runtime mutation of `eshop-sut/backend/database.sqlite` remains unstaged and must not be committed.

## 22. Exact Next Action for a Fresh Context

1. Read this handoff.
2. Read `AGENTS.md`.
3. Read the authoritative HW05 requirement.
4. Inspect the existing Performance Testing Lifecycle Skill.
5. Read finalized Load, Stress, and Spike completion evidence.
6. Read the current report registry.
7. Review the factual memory and resource observations.
8. Decide whether the existing Skill can support Soak as-is or requires a reviewed extension.
9. Produce **SOAK / ENDURANCE DESIGN ONLY**.
10. Stop for human review before implementation or traffic.

## 23. Files to Read First

Read these real repository paths in order:

1. `AGENTS.md`
2. `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
3. `work/context_handoff_after_spike_before_soak.md`
4. `.codex/skills/performance-testing-lifecycle/SKILL.md`
5. `.codex/skills/performance-testing-lifecycle/references/evidence.md`
6. `work/performance_testing_report_state.md`
7. `work/workflow1_runtime_contract.md`
8. `work/csv_test_data_design.md`
9. `out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md`
10. `out/23127179_Stress_20260817_evidence/20260817t115158688/completion-report.md`
11. `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md`
12. `out/23127179_Spike_20260817_evidence/20260817t134816776/completion-report.md`
13. `out/23127179_Spike_20260817_evidence/20260817t134816776/post-run-verification-notes.md`
14. `out/README.md`

## Stop Boundary

Do not design, implement, or execute Soak in this handoff milestone. Do not modify completed Load, Stress, or Spike evidence. Do not begin Task 2 or Task 3.
