# Official Spike Post-Run Verification Notes

Run ID: `20260817t134816776`
Scope: factual Task 1 completion verification of the single official Spike invocation. No HW05 Task 2 interpretation is performed here.

## 1. Invocation Identity

| Item | Value |
|---|---|
| Test plan | `23127179_Spike_20260817.js` (SHA-256 `CC01F02F8F06064E14D7C1241CE2C4908808BD2B3CDA2E7A597C538DFFD08AE6`) |
| Input data | `user_workflow_data.csv` (SHA-256 `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1`) |
| Commit | `949cf066df974d1299ca68b5bfeb21a95850e4bf` |
| Branch | `hw05-performance` |
| k6 | `v2.1.0 (commit/83a87a41e2, go1.26.4, windows/amd64)` |
| Backend PID | `11976` (`node.exe`, owner of the TCP :3000 listener, started 21:07:42 +07:00) |
| k6 PID | `24360` (started 21:20:08 +07:00) |
| Runner `started_at_utc` | `2026-08-17T14:19:57.5310384Z` |
| k6 scenario start (native CSV derived) | `2026-08-17T14:20:09Z` (±1 s) |
| Ended UTC | `2026-08-17T14:23:58.3573547Z` |
| k6 exit code | `0` (no threshold breach; `threshold_exit=false`) |
| Reruns | none; this is the only official Spike invocation |

All five frozen hashes named in `gui-capture-handoff.md` were verified before traffic, plus the invocation-specific handoff hash pinned inside the runner. Backend restart and SQLite reseed (`./run.sh stop` → `start` → `status`) completed immediately before traffic, and `GET /api/categories` returned HTTP 200 before `BackendRestartedBeforeRun=$true` was declared.

## 2. Core Workflow Facts (from real evidence)

| Fact | Value | Source |
|---|---|---|
| Completed workflows (iterations) | 176 | `summary.json` `iterations.count`; k6 final progress line `176 complete` |
| Interrupted iterations | 0 | k6 final progress line `0 interrupted iterations` |
| Total HTTP requests | 1584 | `summary.json` `http_reqs.count` |
| Requests per completed workflow | 9.0 exactly (1584 / 176) | derived |
| Per-step request counts | 176 for each of the nine steps | `spike-metrics.csv`, `http_reqs` rows grouped by `step` tag |
| Checkout requests | 176 | `spike-metrics.csv`, `step=checkout` |
| HTTP failures | 0 of 1584 (`http_req_failed` = 0.00%) | `summary.json` |
| Checks | 6160 passed, 0 failed (rate 1.00) | `summary.json` |
| `workflow_success` | 176 of 176 (rate 1.00) | `summary.json` |
| Cross-phase iterations | 76 | `spike_cross_phase_iterations.count` |
| `vus_max` | 32 (min 32, max 32) | `summary.json` |
| Observed `vus` max | 32 | native CSV `metric_name=vus` |
| Global `http_req_duration` | avg 7.02 ms, p50 3.13 ms, p90 12.68 ms, **p95 14.26 ms**, **p99 18.70 ms**, max 578.87 ms | `summary.json` |
| Iteration duration | avg 13.55 s, p95 15.44 s, max 16.62 s | `summary.json` |
| Data sent / received | 395 kB / 783 kB | `summary.json` |

All three thresholds (`http_req_failed: rate==0`, `checks: rate==1`, `workflow_success: rate==1`) passed, which is consistent with exit code 0. The `thresholds` sub-objects inside `summary.json` render as `False`; that field is the k6 summary-export *breach* flag, not a failure of the threshold.

Because every one of the nine steps recorded exactly 176 requests, no workflow terminated early: all 176 iterations ran Register → Login → Read Profile → Update Profile → Read Categories → Read Products → Read Product Detail → Add to Cart → Checkout to completion.

### Phase-counter arithmetic note

Summing the per-phase custom counters gives 175 completed workflows and 175 checkout requests, one fewer than the global 176. This is a property of the reviewed script, not a lost workflow: `finishWorkflow()` and `recordResponse()` look up `phaseMetrics[phase.name]`, and the final iteration completed after scenario-elapsed 227 s, in `graceful_completion`, for which no phase-metric object exists. The global `iterations`, `http_reqs`, `workflow_success` and the native-CSV `step=checkout` count all agree on 176.

## 3. Target vs Actual VUs

`TARGET_VUS` in the runner console and in the resource CSV files is schedule-derived and is **not** actual concurrency. Actual concurrency is taken from the native `spike-metrics.csv` rows where `metric_name=vus` (227 one-second samples), aligned by Unix timestamp.

Observed actual-VU behaviour, in scenario-elapsed seconds:

| Scenario elapsed | Actual VUs | Note |
|---|---|---|
| 0-59 s | 4 | matches `warmup_4` and `pre_spike_steady_4` |
| 60 s | 30 | 1 s rise reached 30 within the first second |
| 61-109 s | 32 | full peak; sustained 3 s past the scheduled 106 s drop |
| 110-118 s | 30 → 26 → 24 → 20 → 17 → 10 → 8 → 5 → 5 | graceful ramp-down drain, not an instant drop |
| 119-206 s | 4 | settled |
| 207-226 s | 3 → 2 → 1 | final ramp-down drain |

### Intended recovery comparison interval (137-197 s)

**Actual VUs settled to exactly 4 during the intended recovery window.** All 60 one-second `vus` samples in scenario-elapsed 137-197 s report 4 (min 4, max 4, average 4, zero samples above 4). `recovery_steady_4` is therefore usable as a genuine steady four-VU recovery baseline, verified from measured samples rather than assumed from the schedule.

Two real deviations from the *scheduled* one-second transitions are preserved: the 32→4 drop took about 13 s of wall time (32 VUs held until 109 s, reaching 4 at 119 s) and the final 4→0 ramp-down did not begin draining until about 206 s. Both are consequences of `gracefulRampDown=30s` allowing in-flight iterations to finish, and both completed well before the 137-197 s comparison window opened.

## 4. Evidence Limitation: 11.5 s Runner-Anchor Offset

The runner captured `$startedAt` before computing hashes, querying `k6 version` and launching the process, so its `started_at_utc` (`14:19:57.531Z`) precedes the actual k6 scenario start (`14:20:09Z`, ±1 s) by **about 11.5 s**. Consequences, all recorded rather than corrected:

1. **In-test attribution is correct.** The `spike_phase`, `target_vus` and `step` tags in `raw-results.ndjson` and `spike-metrics.csv` are produced by the script from `exec.scenario.startTime`. Their first-seen timestamps imply a scenario start of `1786976408`-`1786976409` consistently across all eight phases, so all measured per-phase metrics are correctly attributed.
2. **The runner's own external labels are shifted.** In `process-resource.csv` and `system-resource.csv` the `spike_phase` column is computed from the runner clock; 110 of 352 process rows disagree with the scenario-anchored phase. Resource statistics in section 5 were therefore recomputed by aligning sample timestamps to the scenario anchor, not by trusting that column.
3. **The rolling capture schedule is shifted.** The capture helper anchored to `metadata-pre-run.json.started_at_utc`, so its nominal 58-70 s rise window actually recorded scenario 46.5-58.6 s (still pre-spike), and its nominal 104-116 s drop window actually recorded scenario 92.5-104.5 s (still full peak). See `screenshot-manifest.md`. No frame was recreated, restaged, or re-run to compensate.

This is an evidence-alignment constraint of the harness, not a SUT defect and not a rerun trigger.

## 5. Resource Observations (scenario-aligned)

Process samples: 352 (176 per role). System samples: 176. Backend and k6 processes were available in every sample. CPU percentages are of total machine capacity.

| Window (scenario elapsed) | Backend CPU avg / max | Backend WS avg / max | k6 CPU avg / max | k6 WS avg / max |
|---|---|---|---|---|
| `pre_spike_steady_4` 20-60 s | 0.06% / 0.30% | 48.6 / 49.7 MB | 0.08% / 0.40% | 66.5 / 67.2 MB |
| `spike_peak_32` 61-106 s | 0.65% / 1.41% | 58.3 / 64.4 MB | 0.35% / 1.50% | 71.1 / 73.2 MB |
| `recovery_settling_4` 107-137 s | 0.16% / 0.71% | 64.3 / 64.7 MB | 0.07% / 0.30% | 73.6 / 74.1 MB |
| `recovery_steady_4` 137-197 s | 0.06% / 0.30% | 64.4 / 64.6 MB | 0.05% / 0.20% | 75.1 / 75.2 MB |

Whole machine: CPU averaged 20.2% pre-spike, 21.2% at peak, 16.4% during recovery steady state (max 40.5% at peak); committed memory stayed in a narrow 85.5-85.7% band throughout. The machine carried unrelated interactive load (browser, editor, OBS, Task Manager) during the run.

Two factual points follow directly: backend CPU rose about tenfold from pre-spike to peak but never exceeded 1.41% of machine capacity, and the generator consumed CPU of the same order as the backend (peak max 1.50% vs 1.41%), so this invocation shows no generator-dominant bottleneck. Backend working set rose from ~48.6 MB pre-spike to ~64.4 MB at peak and did **not** return to the pre-spike level during the remaining ~90 s of the run; it stayed at ~64.4 MB through `recovery_steady_4`. Whether that is retention or normal heap growth is not decided here.

## 6. Artifact Completeness

| Artifact | Status |
|---|---|
| `raw-results.ndjson` | present, 12,181,217 bytes |
| `summary.json` | present, 52,793 bytes |
| `spike-metrics.csv` | present, 6,977,717 bytes, 37,931 lines, 227 s span |
| `stdout.log` | present, 53,929 bytes |
| `stderr.log` | present, 0 bytes (no error output; expected) |
| `process-resource.csv` | present, 352 samples |
| `system-resource.csv` | present, 176 samples |
| `metadata-pre-run.json` | present |
| `metadata.json` | present |
| `command.txt` | present |
| `hashes.sha256` | present |
| `screenshots/` | present, 30 real PNGs, 11.97 MB, none zero-byte |
| `capture-log.json` | present, 30 capture records |
| `completion-report.md` | present (runner-written, screenshot section completed after review) |
| `screenshot-manifest.md` | present |
| `post-run-verification-notes.md` | this file |

Live `ACTUAL_VUS` was genuinely available: 350 of 352 samples carry `actual_vus_live_source=k6_progress` (only the first two reported `unavailable`), and the recorded values track the real curve (4, 30, 32, and the drain values 26/24/20/17/10/5/3/2/1/0).

The raw NDJSON SHA-256 is `D60B112DF3784CD448EDF12DE95ACE15E9159CDE30A308D0BFC7AFD21EF5AD8A`. It remains in the invocation directory for the final submission but is intentionally excluded from the completion commit because it is a large streaming metric artifact. The designated native CSV SHA-256 is `70B97EAD74F5D27AE4AECDD1445423B8899233B19D4AB257A261ECDDF6288F39` and that report is included in the completion commit.

### GUI and console constraints

- Task Manager was elevated. The attempted `SetWindowPos` automation was denied with Windows error 5, so the automation did not claim that it repositioned or re-columned Task Manager. Its existing Details view nevertheless showed the required Name, PID, CPU and working-set context for backend PID `11976` and k6 PID `24360`; no manual student action was required during traffic.
- The first resource-pane console entered QuickEdit/mark mode and froze before official traffic. QuickEdit and mouse-input console modes were disabled, and the pane was reopened before the invocation. The official files contain all 352 process samples and 176 system samples with no process-availability gap, so this pre-run correction did not compromise measurement.

These are evidence/automation constraints, not SUT defects and not rerun triggers.

## 7. Classification

- **Technical validity:** VALID. One authorized invocation, correct branch and hashes, verified backend restart/reseed on the real port-3000 process, complete measured collection, no corruption, no rerun, no run-ID collision, no generator-dominant bottleneck, backend alive at end.
- **Submission-evidence completeness:** COMPLETE for Spike Task 1 execution. Every planned measured artifact exists and is non-empty where expected, with the documented constraints (runner-anchor offset in externally-labelled artifacts; elevated Task Manager automation denial; pre-run QuickEdit correction).
- **Account lockout:** none observed. Each account performed one Register and one correct-password Login; zero HTTP failures and zero failed checks across 1584 requests. No wrong-password traffic was added and no credential was retried.
- **Preservation:** `out/23127179_Stress_20260817_evidence/20260817t115158688/raw-results.ndjson` re-verified at SHA-256 `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`, unchanged and uncommitted. `eshop-sut/backend/database.sqlite` is historically tracked, but its runtime mutation remains unstaged and is intentionally excluded from the Spike completion commit.

No HW05 Task 2 analysis is performed in this file.
