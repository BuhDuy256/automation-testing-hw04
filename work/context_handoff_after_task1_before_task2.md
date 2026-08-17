# HW05 Context Handoff — Task 1 / REQ1 Complete, Before Task 2

## Current milestone state

- **Task 1 / REQ1: COMPLETE.**
- Load: COMPLETE — official `K6_RUN_ID=20260817t045341487`.
- Stress: COMPLETE — official `K6_RUN_ID=20260817t115158688`.
- Spike: COMPLETE — official `K6_RUN_ID=20260817t134816776`.
- Soak / Endurance: COMPLETE — official `K6_RUN_ID=20260818t000551547`.
- **Task 2: NOT STARTED.**
- **Task 3: NOT STARTED.**

Latest relevant commits:

- `5f119cc` — `docs(hw05): finalize test summary`
- `5b2abe8` — `docs(hw05): freeze final soak throughput floor`
- `819fb74` — `test(hw05): finalize official soak evidence`
- `d77e719` — `fix(hw05): harden soak runtime state and prepare new run`

## Authoritative Task 2 requirement

Source: `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`, Section 6,
Task 2 — **AI analysis and misinterpretation hunt**.

The requirement is to:

1. use AI to analyse the collected raw `.jtl`/performance results and suggest performance thresholds;
2. critically review the AI analysis, identify metric misinterpretations, cite the correct values from the raw logs, and explain each error; and
3. have AI propose optimizations and classify each as feasible or hallucinated, with reasoning.

This handoff does not perform any of those activities.

## Official runs for Task 2

Use only these valid official runs for primary analysis:

| Scenario | Run ID |
|---|---|
| Load | `20260817t045341487` |
| Stress | `20260817t115158688` |
| Spike | `20260817t134816776` |
| Soak / Endurance | `20260818t000551547` |

Historical invalid Soak `20260817t225458219` is preserved for debug/audit history only.
It is **INVALID / INCOMPLETE**, must never be treated as an official result, and must
not be mixed into Task 2 metrics or conclusions.

## Final Task 1 facts

### Frozen workflow

All four valid scenarios use the same workflow:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

A successful workflow contains exactly 9 HTTP requests and exactly one Checkout. The
workflow is CSV-driven, uses unique derived identities, preserves JWT and runtime
category/product correlations, explicitly carries `shipping_address` into Checkout,
and records semantic checks plus `workflow_success`.

### Endpoint groups

- **Auth-heavy:** Login, Read Profile, Update Profile (authentication/session and authenticated account operations).
- **Read-heavy:** Read Categories, Read Products, Read Product Detail (product listing/search and product detail reads).
- **Transactional:** Add Product to Cart, Checkout (cart mutation and order creation).

### Distinct designated reports

- Load — Native k6 Web Dashboard HTML: **USED**.
- Stress — Custom k6 Markdown Stress Stage Summary: **USED**.
- Spike — Native k6 CSV metrics output: **USED**.

Soak is an additional endurance evidence milestone and is outside the three-report
uniqueness rule.

### Bugs and issues

**None found in the valid official performance runs; no GitHub Issue was filed.**
UAC/UIPI, ConPTY/invisible windows, screenshot limitations, PowerShell encoding,
runtime-state contention, and the invalid historical Soak invocation are harness or
GUI limitations, not SUT defects.

### Video links

- Performance Testing Execution Video: <https://youtu.be/86qyG0n4Mbs?si=2YBhaUXCnj0kp457>
- Performance Testing Agent Skill Demo: <https://youtu.be/CXb7EEgjFBs?si=WkQDOfhaKJfTDuuU>

These are student-provided URLs; duration and content compliance are not inferred from
the URLs.

## Final endurance threshold

**HUMAN-REVIEWED / FINAL**

Under the tested hardware and reviewed 12-VU workload, EShop sustained at least
**7.983 requests/s** and **0.829 clean workflows/s** for **12 minutes** while
maintaining **0 HTTP failures, 100% checks, and 100% workflow correctness**.

This is a finalized Task 1 empirical endurance threshold. It is **not** maximum stable
RPS, production capacity, or a business SLO.

The final wording is recorded in:

- `out/23127179_Soak_20260817_evidence/20260818t000551547/completion-report.md`
- `work/performance_testing_report_state.md`
- `out/README.md` under `## Test Summary`

## Factual Load evidence for later analysis

- Run ID: `20260817t045341487`.
- Reviewed baseline: 4 VUs; 94 completed workflows; 846 requests; exactly 9 requests/workflow; 0 interrupted iterations; 0 HTTP failures; checks and workflow success 100%.
- HTTP p95 approximately 16.36 ms; HTTP p99 approximately 20.77 ms; iteration p95 approximately 15.34 s.
- Designated report: Native k6 Web Dashboard HTML.
- Resource and same-run screenshot evidence are recorded in the Load evidence directory.

These are facts only; do not extend them into Task 2 conclusions without raw-evidence review.

## Factual Stress evidence for later analysis

- Run ID: `20260817t115158688`.
- Progressive reviewed plateaus through 24 VUs: `baseline_4`, `anchor_8`, `level_12`, `level_16`, `level_20`, `maximum_24`, and `recovery_4`.
- 1,016 completed workflows; 9,144 requests; exactly 9 requests/workflow; 1,016 Checkouts; 0 interrupted iterations; 0 HTTP failures; checks 35,560/35,560; workflow success 1,016/1,016.
- Global HTTP p95 19.43 ms; p99 41.36 ms.
- No meaningful breaking point was observed within the reviewed range through 24 VUs. This is not a capacity claim.
- Backend/generator did not show obvious saturation in the reviewed evidence; whole-machine context includes unrelated activity.

## Factual Spike evidence for later analysis

- Run ID: `20260817t134816776`.
- Sudden profile from 4 VUs to a 32-VU peak, followed by recovery toward 4 VUs.
- 176 completed workflows; 1,584 requests; exactly 9 requests/workflow; 176 Checkouts; 0 interrupted iterations; 0 HTTP failures; checks 6,160/6,160; workflow success 176/176.
- `vus_max=32`; global HTTP p95 14.26 ms; p99 18.70 ms; global max 578.87 ms.
- Actual recovery evidence recorded 4 VUs throughout the intended recovery-steady interval.
- The 578.87 ms maximum came from the first Register request during warmup, not `spike_peak_32`.
- Resource evidence did not show obvious CPU saturation; k6 was not the dominant generator bottleneck.

## Factual Soak evidence for later analysis

- Run ID: `20260818t000551547`.
- 12 sustained VUs for 12 minutes; k6 exit code 0; technical validity VALID; 120-second resource-only recovery completed.
- Steady request rates: early approximately 8.02 req/s, middle approximately 7.99 req/s, late approximately 7.98 req/s.
- Minimum observed request rate 7.983333 req/s; minimum clean workflow rate 0.829167 workflows/s.
- Early-to-late change: approximately -0.47% request/s and -0.98% workflow/s.
- Correctness was 100% across the steady windows.
- Process/system CSV evidence is available. Backend memory status remains `mixed_or_requires_human_review`; do not diagnose a leak.
- Database before/after state is available and read-only counts matched the completed workflow/order facts.

## Highest-value evidence paths

### Load

- `out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md`
- `out/23127179_Load_20260817_evidence/20260817t045341487/raw-results.ndjson`
- `out/23127179_Load_20260817_evidence/20260817t045341487/summary.json`
- `out/23127179_Load_20260817_evidence/20260817t045341487/html-report/index.html`
- `out/23127179_Load_20260817_evidence/20260817t045341487/process-resources.csv`
- `out/23127179_Load_20260817_evidence/20260817t045341487/system-resources.csv`

### Stress

- `out/23127179_Stress_20260817_evidence/20260817t115158688/completion-report.md`
- `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md`
- `out/23127179_Stress_20260817_evidence/20260817t115158688/raw-results.ndjson`
- `out/23127179_Stress_20260817_evidence/20260817t115158688/process-resource.csv`
- `out/23127179_Stress_20260817_evidence/20260817t115158688/system-resource.csv`

### Spike

- `out/23127179_Spike_20260817_evidence/20260817t134816776/completion-report.md`
- `out/23127179_Spike_20260817_evidence/20260817t134816776/post-run-verification-notes.md`
- `out/23127179_Spike_20260817_evidence/20260817t134816776/spike-metrics.csv`
- `out/23127179_Spike_20260817_evidence/20260817t134816776/raw-results.ndjson`
- `out/23127179_Spike_20260817_evidence/20260817t134816776/process-resource.csv`
- `out/23127179_Spike_20260817_evidence/20260817t134816776/system-resource.csv`

### Soak

- `out/23127179_Soak_20260817_evidence/20260818t000551547/completion-report.md`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/soak-window-summary.md`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/post-run-verification-notes.md`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/process-resource.csv`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/system-resource.csv`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/raw-results.ndjson`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/database-state-before.json`
- `out/23127179_Soak_20260817_evidence/20260818t000551547/database-state-after.json`

The valid Soak raw NDJSON is 32,397,207 bytes with SHA-256
`ADE9394117219D4BB1B4983915C612DE10D92A37FC8E5740EC0184B4059D93F0`.

## Screenshot and submission exclusions

HW05 Section 6 explicitly makes the same-run screenshot obligation mandatory for
Load/Stress/Spike; the separate endurance/soak bullet does not add a mandatory Soak
screenshot. The valid Soak screenshot was therefore **NOT REQUIRED / EXCLUDED** after
the genuine capture showed private unrelated browser content. It is not a Task 1
blocker and must not be reused as evidence.

The invalid Soak directory
`out/23127179_Soak_20260817_evidence/20260817t225458219/` remains preserved as
historical debug/audit evidence. Its private/unrelated frames are excluded from
submission-facing manifests and results. The invalid raw NDJSON is preserved but is
not a primary result. Stress, Spike, valid Soak, and invalid Soak raw streams remain
under `out/` under the established large-file policy.

`eshop-sut/backend/database.sqlite` is runtime state and is not a Task 1 result; it
must not be staged or committed.

## AI Audit context

- Audit path: `out/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md`.
- Current report contains 24 audited AI-generated artifacts: 24 VALID, 0 INVALID, 0 INCOMPLETE (100% / 0% / 0%).
- The report explicitly records that exact prompts for later Soak design, reviewed implementation, and execution-handoff interactions are not recoverable from repository evidence; those rows were not fabricated. This is a known human-completion note, not a reason to reopen Task 1 runtime evidence.
- Verdicts evaluate each AI output against its actual prompt. The fresh Task 2 chat must not fabricate missing prompt text.

## Task 2 boundary for the fresh chat

Perform **Task 2 only** in the next context. Analyze the four valid official raw result
sets, compare AI conclusions against raw evidence, propose performance thresholds or
regression guards, identify and correct metric misinterpretations, and classify proposed
optimizations as feasible, needing evidence, or hallucinated.

Do not rerun performance tests, change the Task 1 threshold, use the invalid Soak as
primary evidence, modify the SUT, or begin Task 3. Do not diagnose a memory leak from
the factual memory classification.

## Files to read first in the fresh Task 2 chat

1. `AGENTS.md`
2. `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
3. `work/context_handoff_after_task1_before_task2.md`
4. `.codex/skills/ai-audit-report/SKILL.md`
5. `.codex/skills/performance-testing-lifecycle/SKILL.md`
6. `work/performance_testing_report_state.md`
7. `out/README.md`
8. `out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md`
9. `out/23127179_Stress_20260817_evidence/20260817t115158688/completion-report.md`
10. `out/23127179_Stress_20260817_evidence/20260817t115158688/stress-stage-summary.md`
11. `out/23127179_Spike_20260817_evidence/20260817t134816776/completion-report.md`
12. `out/23127179_Spike_20260817_evidence/20260817t134816776/post-run-verification-notes.md`
13. `out/23127179_Soak_20260817_evidence/20260818t000551547/completion-report.md`
14. `out/23127179_Soak_20260817_evidence/20260818t000551547/soak-window-summary.md`
15. `out/23127179_Soak_20260817_evidence/20260818t000551547/post-run-verification-notes.md`
16. `out/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md`

Also consult the raw NDJSON, native CSV, resource CSV, database-state files, and
submission screenshot manifests at the paths listed above when a Task 2 claim requires
direct evidence.
