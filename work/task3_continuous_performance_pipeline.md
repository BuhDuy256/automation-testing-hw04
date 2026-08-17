# HW05 Task 3 — Continuous Performance Testing

Status: **AWAITING HUMAN REVIEW**

## Requirement

Authoritative source: `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`, §6 Task 3
(graded item 5, 10 points, Bloom-AI G9.6 Disrupt):

> In your conclusion, propose a continuous performance-testing model that watches the SUT's
> commits, decides whether to run performance tests, and flags p95 regressions. Include a flow
> chart and a discussion of the trade-offs (cost, false alarms).

The assignment asks for a **proposal** with a flowchart and a trade-off discussion. This
document delivers that proposal and additionally implements and locally validates a working
version of it (GitHub Actions pipeline, k6 scripts, threshold evaluators), so the proposal is
demonstrated rather than only described. The implementation is scoped to this repository's own
hardware/dataset/harness — it is a regression-detection tool, not a business SLO or a
capacity/production guarantee.

## Pipeline Design

```mermaid
flowchart TD
    A[Commit pushed / PR opened] --> B{Which trigger?}
    B -- push or pull_request --> C[Job: regression]
    B -- workflow_dispatch or weekly schedule --> D[Job: endurance]

    C --> C1[Checkout + npm ci backend deps]
    C1 --> C2[Start backend node server.js]
    C2 --> C3{Health check<br/>GET /api/products == 200<br/>up to 30s}
    C3 -- timeout --> CFAIL[FAIL: SUT did not start]
    C3 -- healthy --> C4[k6 run regression_workflow.js<br/>3 VUs, ~70s, 9-step E2E workflow]
    C4 --> C5[evaluate_regression.js<br/>parses summary.json]
    C5 --> C6{All guards PASS?<br/>http_req_failed==0, checks==1,<br/>workflow_success==1,<br/>p95<=25ms, p99<=50ms}
    C6 -- no --> C7[Job FAILS<br/>PASS/FAIL table in logs + artifact]
    C6 -- yes --> C8[Job PASSES]
    C7 --> C9[Stop backend]
    C8 --> C9
    C9 --> C10[Upload summary.json + result.json/.md]

    D --> D1[Checkout + npm ci backend deps]
    D1 --> D2[Start backend node server.js]
    D2 --> D3{Health check<br/>GET /api/products == 200}
    D3 -- timeout --> DFAIL[FAIL: SUT did not start]
    D3 -- healthy --> D4[k6 run official Soak script unchanged<br/>12 VUs, 12 min + ramp]
    D4 --> D5[evaluate_endurance.js<br/>groups raw NDJSON by soak_window tag]
    D5 --> D6{All guards PASS?<br/>throughput>=7.983 req/s,<br/>workflow rate>=0.829/s,<br/>degradation<=5%,<br/>+ correctness}
    D6 -- no --> D7[Job FAILS]
    D6 -- yes --> D8[Job PASSES]
    D7 --> D9[Stop backend]
    D8 --> D9
    D9 --> D10[Upload summary.json + raw NDJSON + result.json/.md]
```

Two jobs in one workflow file, split by cost rather than by concept — both evaluate the same
frozen "New Customer Onboarding and First Order" E2E workflow (Register -> Login -> Read
Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add
Product to Cart -> Checkout), just at different VU counts/durations:

- **`regression`** — cheap, runs on every push/PR. Correctness + latency guards only.
- **`endurance`** — expensive, runs only on manual dispatch or a weekly schedule. Full 12-VU
  throughput/degradation guards, which are only meaningful at that VU count and duration.

## Trigger Strategy

| Trigger | Job that runs | Rationale |
|---|---|---|
| `push` to `main` / `hw05-performance` | `regression` | Catch regressions as soon as they land. |
| `pull_request` to `main` / `hw05-performance` | `regression` | Catch regressions before merge; ~70s k6 run keeps PR feedback fast. |
| `workflow_dispatch` | both (mutually exclusive by `if:`) | Let a human force either profile on demand, e.g. before a release. |
| `schedule` (weekly, `0 18 * * 0`) | `endurance` only | Amortizes the expensive 12-VU/12-minute protocol instead of paying for it on every commit. |

**Cost/false-alarm trade-offs (per the assignment's explicit ask):**

- **Cost.** The `regression` job costs ~2-3 CPU-minutes per push/PR (npm install + ~70s k6 run).
  Running the full Soak protocol on every commit instead would cost ~15-20 CPU-minutes per
  commit — for a solo/course-scale repository that is disproportionate to the marginal
  regression-detection value, which is why endurance is weekly/manual instead.
- **False alarms from a short, low-VU profile.** 3 VUs for ~70s produces roughly 35-45
  iterations, i.e. a few hundred latency samples. p95/p99 on that few samples has real run-to-run
  variance (observed locally: p99 ranged ~20-44ms across two back-to-back runs on the same
  unmodified code, both still under the 50ms guard but not by a fixed margin). A shared/noisy
  CI runner could push a healthy commit over the guard by chance. Mitigation options if this
  proves noisy in practice: re-run once before failing (quarantine-and-retry), or widen the
  guard band for the short profile specifically instead of reusing the Task 2 numbers verbatim.
  This trade-off is documented rather than silently "fixed" because retrying was not requested
  and would mask real regressions if applied blindly.
- **False alarms from the endurance job.** Being scheduled/manual rather than per-commit means a
  throughput regression is detected up to a week late, not at the commit that caused it — the
  classic cost-vs-detection-latency trade-off inherent to expensive endurance profiles.
- **Missed regressions.** The short profile cannot detect throughput-under-sustained-load
  regressions (e.g., a slow memory/connection leak that only manifests after minutes) — that is
  exactly why the endurance job exists as a separate, slower safety net rather than being folded
  into the fast path.

## Performance Regression Profile

CI regression profile (`out/ci/regression_workflow.js`), reusing the shared workflow logic in
`out/ci/lib/workflow_steps.js` and `out/ci/lib/csv_contract.js` (extracted from the reviewed
official `out/23127179_Load_20260817.js`, unchanged in behavior — same 9 requests, same
semantic checks, same CSV contract):

- Executor: `ramping-vus`, 1→3 VUs over 15s, hold 3 VUs for 45s, 3→0 VUs over 10s
  (`gracefulRampDown`/`gracefulStop` 15s each; total wall time ≈70-90s).
- Think-time between steps shortened to 1-2s (vs. the official Load script's calibrated 1-5s)
  so a 3-VU/70s profile still yields enough iterations for a meaningful p95/p99 sample; this is
  a deliberate CI-only deviation, not a claim that it reproduces Load's calibrated pacing.
- CSV data: `out/user_workflow_data.csv` (same 3-row dataset used by the official scenarios).

## Regression Guards

Enforced in the `regression` job by `out/ci/evaluate_regression.js`, reading the k6
`--summary-export` JSON (k6's own native `thresholds` block enforces the same values as a
redundant safety net — see `out/ci/regression_workflow.js`):

| Metric | Guard | Source |
|---|---|---|
| `http_req_failed` | `== 0` | HUMAN-APPROVED, `work/task2_performance_analysis.md` §7 |
| `checks` | `== 1` | same |
| `workflow_success` | `== 1` | same |
| HTTP `p(95)` | `<= 25 ms` | same |
| HTTP `p(99)` | `<= 50 ms` | same |

**Scope caveat (explicit, per instructions):** the p95/p99 numbers were established from
Load/Stress/Spike/Soak runs at 4-24 VUs on this same hardware/dataset/harness, where tail
latency did not scale materially with VU count (13-33ms across that range). Applying them to a
3-VU short CI profile assumes that same non-scaling relationship holds down to 3 VUs — it is a
reasonable extrapolation on the same harness, not a re-validated guard. These are **not**
business SLOs, maximum capacity, or production guarantees, and they are only meaningful when
compared against a run on comparable hardware/dataset/harness.

## Endurance Guard Strategy

The three throughput/degradation guards from `work/context_handoff_after_task2_before_task3.md`
are **not** applied in the short `regression` job — they were derived from and are only
meaningful at the full 12-VU/12-minute protocol:

| Metric | Guard |
|---|---|
| Sustained throughput (min steady-window req/s) | `>= 7.983 req/s` |
| Clean workflow rate (min steady-window workflows/s) | `>= 0.829 workflows/s` |
| Early-to-late throughput degradation | `<= 5%` |

They are instead enforced in the dedicated `endurance` job, which runs the **unmodified**
official Soak script `out/23127179_Soak_20260817.js` (same CSV, same 12-VU/12-minute/warmup/
exit-ramp schedule already reviewed and executed for Task 1/2 — official run ID
`20260818t000551547`). `out/ci/evaluate_endurance.js` groups the run's raw NDJSON output by the
`soak_window` tag the script already attaches to every request/check (`early_steady`,
`middle_steady`, `late_steady`), instead of recomputing wall-clock windows — the same grouping
approach used by the Task 1 evidence-grade verifier
(`out/23127179_Soak_20260817_evidence/20260818t000551547/verify_soak_results.js`), but without
that verifier's resource-CSV/screenshot/database-fact dependencies, which don't exist in a
headless CI run.

This job runs only on `workflow_dispatch` or a weekly schedule (§ Trigger Strategy) — never on
every commit — per the "do not create an unnecessarily expensive 12-minute Soak for every normal
commit" instruction.

## CI Failure Logic

Both jobs fail the same way: an evaluator script (`evaluate_regression.js` /
`evaluate_endurance.js`) reads the run's output, prints a Markdown PASS/FAIL table to the job
log, writes it to an artifact, and sets `process.exitCode = 1` if any guard failed — which fails
the CI step and therefore the job. No raw k6 log inspection is required to see why CI failed.

Example table (this exact format, reused for both jobs):

```
| Metric | Observed | Guard | Result |
|---|---:|---|---|
| http_req_failed | 0.05 | == 0 | FAIL |
| checks | 1 | == 1 | PASS |
| workflow_success | 1 | == 1 | PASS |
| http_req_duration p(95) | 31.2 ms | <= 25 ms | FAIL |
| http_req_duration p(99) | 19.731 ms | <= 50 ms | PASS |

Overall: **FAIL**
```

## Generated Artifacts

Per job, uploaded via `actions/upload-artifact`:

| Job | Artifacts | Retention |
|---|---|---|
| `regression` | `summary.json` (k6 native summary), `regression-result.json`, `regression-result.md`, `k6-stdout.log` | 14 days |
| `endurance` | `summary.json`, `endurance-result.json`, `endurance-result.md`, `raw-results.ndjson` | 5 days |

The regression job never uploads raw NDJSON (not generated — correctness/latency come from the
k6 summary export, which is sufficient and small). The endurance job does upload raw NDJSON
(~30MB for the full protocol) because it is not a per-commit job and the raw trace is the only
way to re-derive per-window rates for later human review; retention is kept short (5 days)
because it is not submission evidence — the reviewed Task 1/2 evidence directory already holds
the authoritative raw NDJSON for the official run.

## How to Run Locally

Regression profile (from repo root, backend already running on `:3000`):

```bash
K6_RUN_ID="localdev$(date +%s)" \
BASE_URL=http://localhost:3000 \
WORKFLOW_CSV_PATH=../user_workflow_data.csv \
k6 run --summary-export=summary.json out/ci/regression_workflow.js

node out/ci/evaluate_regression.js summary.json regression-result.json
```

Endurance profile (from `out/`, backend already running on `:3000` — this is the same
official Soak invocation used for Task 1, so treat a fresh run as new evidence, not a
replacement for run ID `20260818t000551547`):

```bash
cd out
K6_RUN_ID="localend$(date +%s)" BASE_URL=http://localhost:3000 \
  k6 run --summary-export=summary.json --out json=raw-results.ndjson 23127179_Soak_20260817.js
cd ..
node out/ci/evaluate_endurance.js out/raw-results.ndjson endurance-result.json
```

## How to Run in CI

- Automatic: push a commit or open a PR against `main`/`hw05-performance` → `regression` job
  runs automatically.
- Manual: GitHub → Actions → "Performance Regression" → "Run workflow" → choose which job runs
  based on the trigger you pick (`workflow_dispatch` runs both jobs' `if:` conditions true, so
  both execute).
- Scheduled: `endurance` runs automatically every Sunday at 18:00 UTC.

## Example PASS / FAIL Interpretation

**PASS** (real local run, see Local Validation below):

```
| Metric | Observed | Guard | Result |
|---|---:|---|---|
| http_req_failed | 0 | == 0 | PASS |
| checks | 1 | == 1 | PASS |
| workflow_success | 1 | == 1 | PASS |
| http_req_duration p(95) | 17.162 ms | <= 25 ms | PASS |
| http_req_duration p(99) | 44.046 ms | <= 50 ms | PASS |

Overall: **PASS**
```

Read as: the code under test on this commit behaves the same as the HUMAN-REVIEWED Task 1/2
baseline on this harness — no action needed.

**FAIL** (synthetic fixture, not a real SUT run — see Local Validation):

```
| Metric | Observed | Guard | Result |
|---|---:|---|---|
| http_req_failed | 0.05 | == 0 | FAIL |
| checks | 1 | == 1 | PASS |
| workflow_success | 1 | == 1 | PASS |
| http_req_duration p(95) | 31.2 ms | <= 25 ms | FAIL |
| http_req_duration p(99) | 19.731 ms | <= 50 ms | PASS |

Overall: **FAIL**
```

Read as: either the commit introduced a real latency/error-rate regression, or the CI runner was
noisy for this run (see the false-alarm trade-off above) — re-run once to distinguish the two
before treating it as a confirmed regression.

## Human Review

Prepared for review, not yet finalized:

- **Pipeline files created:** `.github/workflows/performance-regression.yml`.
- **Supporting scripts created:** `out/ci/regression_workflow.js`,
  `out/ci/lib/workflow_steps.js`, `out/ci/lib/csv_contract.js`,
  `out/ci/evaluate_regression.js`, `out/ci/evaluate_endurance.js`.
- **Triggers:** `push`/`pull_request` to `main`/`hw05-performance` → `regression`;
  `workflow_dispatch` → both; weekly `schedule` (`0 18 * * 0`) → `endurance`.
- **Regular regression profile:** 3 VUs, ~70-90s, same 9-step E2E workflow.
- **Guards enforced (regular job):** `http_req_failed==0`, `checks==1`, `workflow_success==1`,
  HTTP p95 `<=25ms`, HTTP p99 `<=50ms`.
- **Endurance strategy:** unmodified official 12-VU/12-minute Soak script, run only on
  `workflow_dispatch`/weekly schedule; guards: throughput `>=7.983 req/s`, workflow rate
  `>=0.829/s`, degradation `<=5%`.
- **Local validation performed:**
  - One real PASS execution of the regression profile against the live local backend (twice,
    from both `out/` and repo-root working directories, matching the exact CI invocation path).
  - `evaluate_regression.js` validated against that real summary.json (PASS) and a synthetic
    fixture with a forced `p(95)=31.2ms` / `http_req_failed=0.05` (FAIL, exit code 1).
  - `evaluate_endurance.js` validated against the **existing official Soak raw NDJSON**
    (`out/23127179_Soak_20260817_evidence/20260818t000551547/raw-results.ndjson`) — reproduced
    the exact HUMAN-REVIEWED numbers (7.983 req/s and 0.829 workflows/s minima, PASS) — and
    against a synthetic degraded fixture (late-window throughput dropped 25%, FAIL, exit
    code 1).
  - Backend start/health-check pattern (`node server.js` + `/api/products` polling) validated
    locally; identical logic is used in the workflow YAML.
- **Not validated:** the actual GitHub Actions execution (no `gh` run was triggered) — the
  workflow YAML has only been checked for valid syntax (`yaml.safe_load`) and its steps have
  been reproduced locally command-by-command, not run inside an Actions runner. The
  `grafana/setup-k6-action` marketplace action's exact behavior on `ubuntu-latest` was not
  exercised locally (only the k6 binary itself, same version, was exercised locally).
  `npm ci` in the backend directory was not re-run in this session (it was already installed
  from prior HW05 work) — its cold-install path in a clean CI runner is unverified.
- **Limitations:**
  - 3-VU/70s p95/p99 has visible run-to-run variance (see Trigger Strategy trade-offs); the
    guard could occasionally flag a healthy commit on a noisy runner.
  - The endurance job's weekly cadence means a throughput regression can go undetected for up to
    a week.
  - `database.sqlite` is reseeded by every backend start in CI, same as local — no state carries
    between regression and endurance job runs, or between separate CI runs.
