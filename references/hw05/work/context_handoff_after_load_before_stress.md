# Context Handoff After Load, Before Stress

## 1. Current milestone

The Load lifecycle is complete.

The next intended milestone is to use the reusable Performance Testing Lifecycle Skill with `scenario_type=stress` to **design the Stress Test only**.

Stress has not been designed, implemented, or executed. The cancelled Stress-design prompt produced no accepted artifact and must not be treated as completed work.

## 2. Student and repository state

- Student: Nguyen Bao Duy (`23127179`), class `23KTPM2`.
- Active HW05 branch: `hw05-performance`.
- Authoritative assignment: `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`.
- SUT: `eshop-sut/` at the repository root.
- Performance tool: k6, not JMeter.
- `work/` holds designs, calibration, working notes, and exploratory evidence.
- `out/` holds finalized submission artifacts and official evidence.
- Do not commit `eshop-sut/backend/database.sqlite`; it is mutable SUT runtime state.

## 3. Final business workflow

The frozen workflow is:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

A successful iteration has exactly nine HTTP requests and exactly one Checkout. Checkout must explicitly send the CSV `shipping_address`. Preserve the verified JWT, identity, category-to-product, Product-Detail-to-Cart, price-to-total, and shipping-address correlations. The authoritative request/response details are in `work/workflow1_runtime_contract.md`.

## 4. CSV and identity strategy

The finalized CSV schema is:

`identity_seed,name,password,phone,shipping_address,quantity`

CSV contains controlled test inputs only. JWTs, runtime user/category/product/order identifiers, product name, and product price are correlated at runtime.

Every registration email is derived from a fresh run identifier, scenario identity, test-wide VU identity, scenario iteration identity, and the selected CSV `identity_seed`. This permits representative rows to be reused without sharing user, cart, or order state. The complete rules are in `work/csv_test_data_design.md`; execution-specific run IDs are not generic defaults.

## 5. Load calibration summary

- Controlled calibration covered 1, 2, 4, and 8 VUs, with a second 4-VU confirmation run.
- Four VUs became the human-reviewed synthetic normal-load target because the two 4-VU measurements were repeatable and correct.
- Eight VUs still completed correctly but showed tail-latency growth, including overall p99 around 122.377 ms and increased Register tail latency.
- Think-time was a synthetic user-behavior assumption, not analytics-derived behavior.
- No production traffic model exists.

Use `work/load_test_calibration.md` for the complete measurements, hardware methodology, and resource caveats.

## 6. Approved Load design

- Executor: `ramping-vus`.
- Start: 1 VU.
- Ramp to 4 VUs over 1 minute.
- Hold 4 VUs for 4 minutes.
- Ramp to 0 VUs over 1 minute.
- `gracefulRampDown: 25s`.
- `gracefulStop: 25s`.

Synthetic think-time:

- after Register: 1–2 seconds;
- after Read Profile: 3–5 seconds;
- after Read Products: 2–4 seconds;
- after Product Detail: 2–4 seconds;
- after Add to Cart: 1–3 seconds.

Reviewed Load thresholds:

- `http_req_failed: rate == 0`;
- `checks: rate == 1`;
- `workflow_success: rate == 1`;
- HTTP p95 `< 60 ms`;
- HTTP p99 `< 85 ms`;
- iteration p95 `< 19 s`.

The latency and iteration thresholds were provisional calibration-derived regression guards for the measured machine and SUT state. They were not business SLOs or production-capacity claims. See `work/load_test_plan_design.md`.

## 7. Official Load execution history

### First official run

- K6_RUN_ID: `20260817t042311622`.
- Status: technically valid; submission evidence incomplete.
- Result: 91 workflows, 819 requests, zero interrupted iterations, and all reviewed thresholds passed.
- Evidence gap: no same-run GUI screenshot showed active k6 together with backend resource usage.

Do not delete or invalidate this invocation. Its evidence is preserved at `out/23127179_Load_20260817_evidence/20260817t042311622/`.

### Second official run

- K6_RUN_ID: `20260817t045341487`.
- Status: **PRIMARY LOAD SUBMISSION-EVIDENCE RUN**.
- Result: 94 workflows; 846 requests; exactly 9 requests per workflow; zero interrupted iterations; 0% `http_req_failed`; 100% checks; 100% `workflow_success`; HTTP p95 16.35 ms; HTTP p99 20.77 ms; iteration p95 15.34 seconds.

The invocation directory `out/23127179_Load_20260817_evidence/20260817t045341487/` contains direct raw NDJSON, summary JSON, stdout/stderr, process and system resource samples, real same-run screenshots, a hardware screenshot, metadata, and the native k6 Web Dashboard HTML report. Start with `second-run-completion-report.md` and `screenshot-manifest.md` in that directory.

## 8. GUI and evidence lesson

HW05 requires a same-run screenshot showing the active performance tool together with backend resource usage. Prepare capture before traffic; never present an after-the-fact screenshot as evidence from an earlier invocation.

Windows Task Manager or Resource Monitor may run at a higher integrity level and reject desktop automation. During the second Load run, the student manually adjusted Task Manager's Details view and CPU sorting, while the remaining capture workflow operated around that restriction. The limitation was recorded honestly. It is an evidence-environment constraint, not a SUT defect.

## 9. Report-type uniqueness state

HW05 requires three distinct designated k6-equivalent listener/report outputs across Load, Stress, and Spike.

- Load: native k6 Web Dashboard HTML — **USED**.
- Stress: **UNASSIGNED**.
- Spike: **UNASSIGNED**.

Raw NDJSON, summary JSON, resource CSV, stdout/stderr, and screenshots may recur as common evidence. They do not count as the distinct designated report view. Read `work/performance_testing_report_state.md` before assigning a Stress report, and do not assign Spike's report during Stress work.

## 10. Reusable Agent Skill

The approved skill root is `.codex/skills/performance-testing-lifecycle/`.

Important files:

- `SKILL.md`;
- `references/load.md`;
- `references/stress.md`;
- `references/spike.md`;
- `references/evidence.md`;
- `references/result-analysis.md`.

This is one generic evidence-first lifecycle skill with `load`, `stress`, and `spike` modes, not three separate methodologies. A byte-identical Claude mirror exists for configuration parity. The next session must read the Codex skill and explicitly invoke it with `scenario_type=stress`.

## 11. Stress starting point

Derive Stress design from the reviewed 4-VU synthetic normal-load baseline, calibration results, primary Load result, endpoint-tail observations, hardware/resource headroom, and the SUT architecture.

Do not pre-decide Stress VU stages, maximum VUs, stage durations, think-time changes, thresholds, designated report type, or primary screenshot stage. Each requires AI design followed by explicit human review.

## 12. Account lockout note

HW05 says to reset the three-failed-login lockout between Stress/Spike runs when those runs trigger it. This positive workflow registers a unique account and logs in with the correct generated password, so lockout is not naturally expected. Stress design must assess applicability explicitly and must not inject wrong-password traffic automatically.

## 13. Outstanding HW05 work

The following milestones remain incomplete:

- Stress design, human review, implementation, and execution;
- Spike design, human review, implementation, and execution;
- 10–15 minute endurance/soak run and concrete hardware threshold;
- Task 2 raw-result analysis and misinterpretation hunt;
- feasible/unsupported/hallucinated optimization classification;
- genuine GitHub issues if real defects are found;
- Task 3 continuous-performance-testing proposal;
- final reports, README, and Git commit log;
- at least six minutes of demo video with the student's own Vietnamese narration;
- final AI Audit and AI Critique deliverables.

## 14. Exact next action for a fresh context

1. Read this handoff.
2. Read `AGENTS.md` and the authoritative HW05 requirement.
3. Read the Performance Testing Lifecycle Skill.
4. Read the current report-type state.
5. Read the primary Load baseline evidence.
6. Invoke the skill with `scenario_type=stress`.
7. Produce **Stress DESIGN ONLY**.
8. Stop for human review before implementation or traffic.

## 15. Files to read first

1. `AGENTS.md`
2. `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
3. `work/context_handoff_after_load_before_stress.md`
4. `.codex/skills/performance-testing-lifecycle/SKILL.md`
5. `.codex/skills/performance-testing-lifecycle/references/stress.md`
6. `.codex/skills/performance-testing-lifecycle/references/evidence.md`
7. `work/performance_testing_report_state.md`
8. `work/workflow1_runtime_contract.md`
9. `work/csv_test_data_design.md`
10. `work/load_test_calibration.md`
11. `work/load_test_plan_design.md`
12. `out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md`
