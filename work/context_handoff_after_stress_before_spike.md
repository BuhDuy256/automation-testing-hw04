# Context Handoff After Stress, Before Spike

## 1. Current milestone

- Load lifecycle: **COMPLETE**.
- Stress lifecycle: **COMPLETE**.
- Next approved milestone: use the reusable Performance Testing Lifecycle Skill with
  `scenario_type=spike` to produce **SPIKE DESIGN ONLY**.
- Spike has **NOT** been designed, implemented, or executed.

Do not treat any conversational Spike idea as an accepted design. Spike parameters
must start from repository evidence and pass human review before implementation or
traffic.

## 2. Repository and student state

- Student: Nguyen Bao Duy, ID `23127179`, class `23KTPM2`.
- Active branch: `hw05-performance`.
- Authoritative HW05 requirement:
  `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`.
- SUT: `eshop-sut/` at the repository root.
- Selected performance tool: k6.
- `work/` contains designs, working notes, calibration, validation, and temporary
  evidence.
- `out/` contains finalized submission artifacts and official invocation evidence.
- `eshop-sut/backend/database.sqlite` is mutable runtime state. Do not treat it as an
  intended HW05 source change, stage it, or commit it.

## 3. Frozen business workflow

Preserve this exact end-to-end workflow for Spike:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

A successful workflow has exactly nine HTTP requests and exactly one Checkout. Preserve
the finalized CSV inputs, unique runtime identity, JWT correlation, category-to-product
selection, Product-Detail-to-Cart correlation, runtime price-to-total calculation, and
explicit CSV `shipping_address` in Checkout. Do not add a post-Checkout request or a
hard-coded fallback.

Authoritative runtime contract: `work/workflow1_runtime_contract.md`.

## 4. Final CSV and data strategy

Final schema:

`identity_seed,name,password,phone,shipping_address,quantity`

The CSV contains controlled input only. JWTs, runtime user/category/product/order IDs,
product name, product price, and calculated totals are generated or correlated during
the workflow. Account identity remains unique per invocation, VU, and iteration. No
dynamic value has a hard-coded fallback.

Authoritative design: `work/csv_test_data_design.md`.

## 5. Load baseline summary

Primary Load invocation: `K6_RUN_ID=20260817t045341487`.

Reviewed synthetic normal load: 4 VUs.

| Measurement | Verified Load result |
|---|---:|
| Completed workflows | 94 |
| HTTP requests | 846 |
| Interrupted iterations | 0 |
| HTTP failures | 0 |
| Checks | 100% |
| `workflow_success` | 100% |
| HTTP p95 | 16.35 ms |
| HTTP p99 | 20.77 ms |
| Iteration p95 | 15.34 s |

Four VUs is a human-reviewed synthetic normal-load reference, not measured production
demand. Load latency thresholds were provisional regression guards for this machine
and SUT state, not business SLOs. Earlier 8-VU calibration preserved correctness but
showed some tail-latency growth.

Evidence:
`out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md`
and `work/load_test_calibration.md`.

Precision note: the Load completion report displays p95 as `16.35 ms`, while its
machine summary retains `16.357925 ms` (which rounds conventionally to `16.36 ms` at
two decimals). The p99 full value is `20.77437 ms`, and iteration p95 is
`15344.844055 ms`. Preserve source precision in later calculations; this display
difference is not a different run or a validity issue.

## 6. Final Stress design

The human-reviewed Stress profile was:

| Phase | Duration |
|---|---:|
| 1 -> 4 VUs | 30 s |
| Hold 4 VUs | 2 min |
| 4 -> 8 VUs | 30 s |
| Hold 8 VUs | 2 min |
| 8 -> 12 VUs | 30 s |
| Hold 12 VUs | 2 min |
| 12 -> 16 VUs | 30 s |
| Hold 16 VUs | 2 min |
| 16 -> 20 VUs | 30 s |
| Hold 20 VUs | 2 min |
| 20 -> 24 VUs | 30 s |
| Hold 24 VUs | 2 min |
| 24 -> 4 VUs | 1 min |
| Recovery hold at 4 VUs | 2 min |
| 4 -> 0 VUs | 1 min |

`gracefulRampDown=30s` and `gracefulStop=30s`. The five reviewed Load think-time
ranges remained unchanged. This is historical Stress context, not a Spike proposal.

## 7. Official Stress execution

Primary official Stress invocation: `K6_RUN_ID=20260817t115158688`.

- Technical validity: **VALID**.
- Submission completeness: **COMPLETE for the Stress Task 1 milestone**.
- k6 exit code: `0`; threshold exit: `false`.

| Measurement | Verified Stress result |
|---|---:|
| Completed workflows | 1,016 |
| HTTP requests | 9,144 |
| Requests per workflow | 9 exactly |
| Checkout requests | 1,016 |
| Interrupted iterations | 0 |
| `vus_max` | 24 |
| HTTP failures | 0 / 9,144 |
| Checks | 35,560 / 35,560 |
| `workflow_success` | 1,016 / 1,016 |
| Global HTTP p95 | 19.43 ms |
| Global HTTP p99 | 41.36 ms |
| Global HTTP maximum | 485.55 ms |

Execution finding: **no meaningful breaking point was observed within the reviewed
range up to 24 VUs**. This does not establish production capacity and does not support
any claim above 24 VUs.

## 8. Stress stage observations relevant to later Spike design

- Derived request throughput increased from `2.692 req/s` at `baseline_4` to
  `15.950 req/s` at `maximum_24`.
- Stage latency was non-monotonic rather than steadily degrading.
- HTTP, semantic-check, and complete-workflow correctness remained intact at every
  reviewed measurement plateau.
- Backend CPU and process memory showed no obvious saturation signal.
- k6 remained healthy and showed no generator-saturation signal.
- `recovery_4` throughput and latency were not worse than the opening `baseline_4`.

Use the direct stage aggregates in
`out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md`
and the same invocation's resource CSVs. These are execution observations only; do
not perform HW05 Task 2 analysis in the Spike-design milestone.

## 9. Stress evidence package

Official directory:

`out/23127179_Stress_20260817_evidence/20260817t115158688/`

Important artifacts include:

- `raw-results.ndjson`;
- `summary.json`;
- `stress-stage-summary.md`;
- `process-resource.csv` and `system-resource.csv`;
- `metadata-pre-run.json` and `metadata.json`;
- `command.txt` and `hashes.sha256`;
- `completion-report.md`;
- `screenshots/`, `capture-log.json`, and `screenshot-manifest.md`; and
- `post-run-verification-notes.md`.

The raw NDJSON is 60,711,245 bytes and has SHA-256
`ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`.
It is intentionally preserved under `out/` for the final submission and intentionally
not committed because of its approximately 60 MB size. Do not delete, clean, move, or
overwrite this untracked submission artifact. Untracked does not mean disposable.

## 10. GUI evidence status

- Six of seven planned plateau screenshots are valid.
- `screenshots/04_level_16_elapsed0540s.png` is a genuine same-run frame but is
  visually obstructed by the Claude Code window.
- It was not recreated, reconstructed, or fabricated.
- Raw stage-tagged samples, direct Markdown metrics, process resources, and system
  resources fully cover `level_16`.
- No Stress rerun is required.

Primary Stress screenshot:
`screenshots/06_maximum_24_elapsed0840s.png` inside the official Stress evidence
directory. Because no meaningful degradation was observed, the reviewed fallback was
the clearest valid `maximum_24` frame.

## 11. Report-type registry

HW05 requires three distinct designated listener/report equivalents.

| Scenario | Designated report | Status |
|---|---|---|
| Load | Native k6 Web Dashboard HTML | USED |
| Stress | Custom k6 end-of-test Markdown Stress Stage Summary | USED |
| Spike | Unassigned | UNASSIGNED |

Spike must not use the Native k6 Web Dashboard HTML mechanism or the Custom k6
Markdown Stress Stage Summary as its designated report.

Raw NDJSON, summary JSON, resource CSV, stdout/stderr, and screenshots may be reused as
common evidence. They do not satisfy the distinct designated-report rule.

Authoritative registry: `work/performance_testing_report_state.md`.

## 12. Reusable Performance Testing Lifecycle Skill

Approved root: `.codex/skills/performance-testing-lifecycle/`.

Important files:

- `SKILL.md`;
- `references/spike.md`;
- `references/evidence.md`; and
- `references/result-analysis.md`.

This one reusable skill supports Load, Stress, and Spike and was successfully reused
for Stress. The fresh context must invoke it with `scenario_type=spike`. Do not create
a Spike-only skill.

## 13. Spike starting evidence and unresolved design decisions

Derive the future Spike proposal from:

- the reviewed 4-VU synthetic normal-load baseline;
- Load calibration evidence;
- the complete official Stress result through 24 VUs;
- observed Stress resource headroom;
- the frozen workflow and data strategy; and
- current same-machine SUT/generator constraints.

Do not pre-decide Spike VUs, spike duration, pre-spike duration, recovery duration,
think-time changes, thresholds, designated report type, or GUI primary capture stage.
The skill must propose them from evidence, and the student must review them.

## 14. Spike conceptual requirement

Spike must create an intentionally rapid load increase and observe immediate response
and recovery. It must remain conceptually distinct from Stress and expose three visible
periods: pre-spike reference, rapid spike, and recovery.

Do not turn Spike into another gradual multi-step Stress profile. Do not choose its
magnitude merely because 24 VUs was the Stress maximum. Use the Load and Stress
evidence to justify the proposal.

## 15. Account lockout

The frozen positive workflow uses one correct-password Login per unique account. No
lockout occurred during Stress. Do not add intentionally wrong-password traffic for
Spike.

If an unexpected lockout occurs, preserve evidence, do not retry credentials
automatically, and reset only between invocations when required and documented.

## 16. Outstanding HW05 work

The following work is **NOT COMPLETE**:

- Spike design, human review, implementation, and execution;
- 10-15 minute soak/endurance execution;
- concrete empirical threshold/capacity observation;
- Task 2 raw-result analysis and AI misinterpretation review;
- optimization recommendation classification;
- genuine GitHub Issues if supported by evidence;
- Task 3 continuous-performance pipeline proposal;
- final report packaging;
- final AI Audit completion;
- mandatory 200-300 word AI Critique; and
- demo video of at least six minutes with the student's own Vietnamese narration.

## 17. Exact next action

1. Read this handoff.
2. Read `AGENTS.md` and the authoritative HW05 requirement.
3. Read the Performance Testing Lifecycle Skill.
4. Read `references/spike.md` and `references/evidence.md`.
5. Read the current report-type registry.
6. Read the Load baseline and official Stress completion evidence.
7. Invoke the skill with `scenario_type=spike`.
8. Produce **SPIKE DESIGN ONLY**.
9. Stop for human review before implementation or traffic.

## 18. Files to read first

1. `AGENTS.md`
2. `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
3. `work/context_handoff_after_stress_before_spike.md`
4. `.codex/skills/performance-testing-lifecycle/SKILL.md`
5. `.codex/skills/performance-testing-lifecycle/references/spike.md`
6. `.codex/skills/performance-testing-lifecycle/references/evidence.md`
7. `work/performance_testing_report_state.md`
8. `work/workflow1_runtime_contract.md`
9. `work/csv_test_data_design.md`
10. `out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md`
11. `out/23127179_Stress_20260817_evidence/20260817t115158688/completion-report.md`
12. `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md`
