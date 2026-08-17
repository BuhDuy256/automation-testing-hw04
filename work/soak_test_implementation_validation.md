# HW05 Soak / Endurance Implementation Validation

## Status

**HARNESS FIXED AND NEW INVOCATION PREPARED OFFLINE — NO NEW TRAFFIC**

The first real Soak invocation `20260817t225458219` completed its k6 workload but is closed as
**TECHNICALLY INVALID / SUBMISSION INCOMPLETE** because the runner failed during warm-up.
No new EShop request, performance traffic, backend restart, reseed, or official screenshot was
produced during this harness-fix validation.

## Final Frozen Soak Profile

| Setting | Human-reviewed value | Validation |
|---|---|---|
| Executor | one closed `ramping-vus` scenario | PASS |
| `startVUs` | 1 | PASS |
| Entry | 1 -> 12 VUs over 60 seconds | PASS |
| Sustained load | 12 VUs for 720 seconds | PASS |
| Exit | 12 -> 0 VUs over 30 seconds | PASS |
| `gracefulRampDown` | 30 seconds | PASS |
| `gracefulStop` | 30 seconds | PASS |
| Correctness thresholds | `http_req_failed rate==0`, `checks rate==1`, `workflow_success rate==1` | PASS |
| `abortOnFail` | absent | PASS |
| Latency/RPS/memory/resource thresholds | absent | PASS |
| Resource sampling | 2 seconds | PASS |
| Post-load recovery | 120 seconds after confirmed k6 exit | PASS |

`k6 inspect` resolved the stages as `1m0s -> 12`, `12m0s -> 12`, and `30s -> 0`,
with both graceful settings at 30 seconds. Inspection without `K6_RUN_ID` failed as intended
with exit code 107.

## Human-Review Outcome

`work/soak_test_plan_design.md` now records **HUMAN-REVIEWED — ACCEPTED FOR
IMPLEMENTATION**. It preserves the proposal history, accepted settings, review checklist,
and corrected empirical-throughput wording rule.

The throughput-floor correction is frozen:

- calculate the minimum measured request rate and completed-workflow rate across the three
  steady windows;
- calculate early-to-late absolute and percentage changes;
- never infer stability merely because a minimum exists;
- apply no fixed pre-run stability percentage; and
- reserve stable wording for later evidence-based human review of actual VUs, correctness,
  throughput shape, generator/shared-machine validity, latency, and resources.

## Skill Extension

The existing `.codex/skills/performance-testing-lifecycle` Skill was extended rather than
duplicated. `scenario_type=soak` routes to `references/soak.md`, and `endurance` is an alias
that routes to the same reference.

The reference contains reusable rules for stable sustained load, warm-up exclusion,
early/middle/late windows, actual-start anchoring, actual VUs, throughput wording, factual
memory direction, persistent state, resources, sparse screenshots, recovery, validity, raw
preservation, and no automatic rerun. It contains no EShop workflow, student Run ID, 12-VU,
or 12-minute hard-coding.

Validation results:

- Codex Skill `quick_validate.py`: PASS;
- Claude Skill `quick_validate.py`: PASS;
- full `.codex/skills` versus `.claude/skills` inventory: 19 files versus 19 files;
- inventory differences: 0; and
- byte-content differences: 0.

No shared-memory block or agent-specific settings file was changed.

## Workflow Preservation

Static validation of `out/23127179_Soak_20260817.js` found:

- exactly 9 `http.get`/`http.post`/`http.put` calls;
- exactly one Checkout request;
- exact CSV header `identity_seed,name,password,phone,shipping_address,quantity`;
- required unique `K6_RUN_ID` validation with no fallback;
- generated unique email containing Run ID, scenario, VU, iteration, and CSV seed;
- original Register email/password reused for Login;
- JWT correlation;
- category/product correlation;
- Product Detail ID/name/price correlation into Cart;
- CSV quantity and runtime `price * quantity` total;
- explicit CSV `shipping_address` in profile update and Checkout;
- semantic checks and safe early returns;
- global `workflow_success`; and
- no wrong-password traffic or Login retry.

The five think-time calls remain exactly `1–2`, `3–5`, `2–4`, `2–4`, and `1–3`
seconds at the reviewed workflow positions.

## Window Attribution

The script derives active windows from `Date.now() - exec.scenario.startTime`:

| Window | Actual scenario elapsed |
|---|---:|
| `warmup_entry` | 0–60 s |
| `early_steady` | 60–300 s |
| `middle_steady` | 300–540 s |
| `late_steady` | 540–780 s |
| `exit_ramp` | 780–810 s |
| `graceful_completion` | after 810 s while k6 is still completing work |

Every HTTP request receives `step`, `soak_window`, and schedule-derived `target_vus` tags.
Workflow outcomes retain `start_window` and `end_window`. Cross-window iterations increment
`soak_cross_window_iterations`; they are excluded from the clean same-window completed-
workflow throughput counter and are not silently assigned to one steady window.

## Actual k6-Start Anchoring

The runner stores `RUNNER_PREFLIGHT_START` separately. The first test-wide iteration emits:

```text
SOAK_SCENARIO_START epoch_ms=<exec.scenario.startTime> scenario=soak run_id=<run-id>
```

The runner reads that real k6 marker from stdout/stderr and records both epoch milliseconds
and UTC. Resource attribution, runtime-state display, and screenshot timing use that marker.
The runner rejects a completed invocation whose marker is missing.

A temporary no-network k6 fixture verified that local k6 v2.1.0 exposes both
`exec.scenario.startTime` and `exec.instance.vusActive`. It emitted the expected marker,
completed one iteration, and reported `data_received=0 B` and `data_sent=0 B`. The temporary
fixture was deleted after validation.

## Target Versus Actual VUs

`target_vus` is calculated from the frozen schedule. It is never presented as measured
concurrency.

Actual VUs have two real evidence paths:

1. runner samples parsed from genuine k6 progress every two seconds; and
2. raw `soak_actual_vus` Gauge points using `exec.instance.vusActive`.

The factual verifier prefers periodic k6-progress resource samples and falls back to the raw
Gauge. It reports sample count, minimum, maximum, mean, and whether every measured sample in
each steady window equals 12. Stable-12-VU wording is blocked when evidence does not support
that condition.

## Factual Post-Run Verifier

`work/verify_soak_results.js` streams the raw NDJSON and derives, for each steady window:

- actual measured window seconds anchored to the real scenario start and traffic end;
- actual-VU evidence;
- requests and requests/s;
- clean same-window completed workflows and workflows/s;
- HTTP failures;
- checks and workflow success pass/fail counts;
- HTTP p50/p90/p95/p99/max;
- per-step counts and p95/p99;
- same-window iteration-duration percentiles; and
- the global cross-window iteration count.

The implementation deliberately uses raw tags instead of defining a metric for every
window × step × statistic combination.

The verifier self-test passed. Its synthetic three-window fixture produced a minimum of
8 req/s, 0.8 workflows/s, and a -20% early-to-late request-rate change, while keeping
automatic stable wording false.

## Throughput Calculations and Wording Guard

The verifier divides direct window counts by the measured window seconds derived from the
actual scenario anchor and confirmed traffic end. It calculates:

- minimum requests/s across early, middle, and late;
- minimum clean completed-workflows/s across those windows;
- early-to-late absolute request-rate and workflow-rate differences; and
- early-to-late percentage differences.

Output identifies the minima as candidate empirical floors only. It never emits a stable
threshold, maximum stable RPS, SLO, or capacity claim. Materiality of any late decline and
the final wording remain human-review decisions with no fixed percentage gate.

## Memory and Resource Calculations

For backend working set and private memory, the verifier reports per-window sample count,
minimum, median, mean, maximum, first, last, change, and approximate MB/minute slope. It also
retains backend CPU, threads, and availability.

k6 CPU, working set, private memory, threads, and availability remain separate. Whole-machine
CPU, committed memory, disk bytes/s, and network context remain separate from both processes.

The verifier may emit directional descriptions such as continued rise, rise into the middle
band, exact flat window means, mixed evidence, or recovery increase/decrease. It explicitly
sets causal diagnosis to `not_performed` and does not diagnose a leak, defect, or ceiling.

## Persistent-State Capture

`work/capture_soak_database_state.js` opens SQLite with `OPEN_READONLY`, records database file
size, available table names, and `users`/`orders` row counts when present. The future runner
captures `database-state-before.json` and `database-state-after.json` without mutating data.

Read-only validation against the existing database passed. File size and last-write timestamp
were unchanged across capture, and the temporary validation output was removed.

## Resource Sampling and Recovery

The runner captures one pre-traffic baseline, then samples backend, k6, and whole-machine
resources every two seconds. It continues after k6 exits for 120 seconds. Recovery begins from
the actual confirmed k6 exit timestamp, not scheduled second 810, and sends no recovery
traffic.

## Runtime-State Contention Regression

**Observed runtime fact:** During invocation `20260817t225458219`, the runner's direct
`Set-Content` write to `runtime-state.json` collided with the resource pane/capture readers at
about 51 seconds. With `$ErrorActionPreference = 'Stop'`, the Windows sharing violation
terminated the runner while k6 continued independently. This is a harness defect, not an EShop
defect. The historical evidence and full classification remain in
`work/official_soak_invalid_execution_20260817t225458219.md`.

**Human-reviewed fix:** `work/soak_runtime_state_io.ps1` now validates the complete JSON, writes
it to a uniquely named temporary file in the same directory, closes that file, and publishes it
with `System.IO.File.Replace` (or `File.Move` for the first state). IOException and access-denied
sharing failures receive at most 20 attempts with a 25 ms delay. Temporary/backup files are
cleaned in `finally`. Readers were not weakened or removed.

`work/validate_soak_runtime_state_contention.ps1` ran for 15 seconds in Windows PowerShell 5.1
with one writer, three concurrent readers, and an additional transient lock producer:

| Measurement | Result |
|---|---:|
| Successful atomic publishes | 226 |
| Writer failures | 0 |
| Valid JSON documents read | 2,673 |
| Invalid/partial documents read | 0 |
| Deliberate transient locks | 221 |
| Malformed JSON rejected without changing published state | PASS |
| EShop requests / k6 processes | 0 / 0 |

Result: **PASS**. This regression exercises real Windows file contention without network or
performance traffic.

Replacement invocation `20260818t000551547` is reserved in a new preparation-only directory.
The consumed invalid Run ID `20260817t225458219` is permanently retired.

## Screenshot Preparation

`work/capture_official_soak_frames.ps1` waits for the actual k6 scenario-start marker and now
captures exactly one active full-desktop frame near 420 seconds in `middle_steady`. Separate
90-second and 720-second active frames were removed by human review. A resource-only recovery
frame at +60 seconds is optional and disabled by default so it cannot add unnecessary GUI risk.
The helper writes `capture-log.json` and `screenshot-manifest.md` from real captured files only.

Invalid-run frame 01 remains historical evidence only. Frames 02 and 03 contain unrelated
private third-party information and no performance evidence; they are preserved but marked
**EXCLUDE FROM SUBMISSION — PRIVATE / NO EVIDENTIARY VALUE** and must never appear in a future
official manifest.

`work/soak_resource_monitor_pane.ps1` displays Run ID, window, elapsed time, target VUs,
genuine actual VUs when available, traffic state, backend/k6 PIDs, and process memory.

No official screenshot was captured during validation.

## Output Package

The future collision-safe invocation directory is prepared to contain:

- `raw-results.ndjson`;
- `summary.json`;
- `stdout.log` and `stderr.log`;
- `process-resource.csv` and `system-resource.csv`;
- `metadata-pre-run.json`, `metadata.json`, and `runtime-state.json`;
- `command.txt` and `hashes.sha256`;
- `database-state-before.json` and `database-state-after.json`;
- `screenshots/`, `capture-log.json`, and `screenshot-manifest.md`;
- `completion-report.md`;
- `soak-window-summary.md`; and
- `post-run-verification-notes.md`.

Native k6 CSV is not enabled. Soak is recorded as an additional endurance evidence milestone,
not a fourth designated report type. Large raw NDJSON remains under `out/`, receives exact
byte-size and SHA-256 records, and is not automatically committed or deleted.

Runner preflight validates reviewed text artifacts with LF/CRLF-normalized SHA-256 so a normal
Windows Git checkout cannot cause a false mismatch. The invocation package separately records
raw-byte SHA-256 values for the exact copied files and raw NDJSON that were actually used.

## Validation Commands and Results

| Validation | Result |
|---|---|
| `k6 inspect` with valid Run ID | PASS; exact executor, stages, graceful settings, and three correctness-only thresholds |
| `k6 inspect` without Run ID | PASS; rejected with exit 107 |
| No-network k6 runtime fixture | PASS; actual start/actual VUs available; 0 B sent/received |
| Node syntax checks | PASS |
| Factual verifier self-test | PASS |
| PowerShell parser on runner/capture/resource pane | PASS |
| PowerShell 5.1 reservation-marker regression (`work/validate_soak_preflight_marker.ps1`) | PASS; 14/14 checks, no traffic |
| PowerShell 5.1 runtime-state contention regression | PASS; 226 publishes, 2,673 valid reads, 221 transient locks, zero failures/invalid reads |
| Static workflow count | PASS; 9 HTTP calls and one Checkout |
| CSV header | PASS; exact six-column schema |
| Think-time ranges | PASS; all five exact ranges |
| Window and cross-window assertions | PASS |
| Runner artifact hash pins | PASS |
| Read-only database-state capture | PASS; database size/mtime unchanged |
| Codex/Claude Skill validation | PASS |
| Full Skill inventory/content parity | PASS; 19/19 files, zero differences |
| Final staged `git diff --check` | PASS in the project, `.codex`, and `.claude` repositories |

## Preservation and Repository State

The Stress raw NDJSON and Spike raw NDJSON must remain local, untracked, and byte-identical to
their recorded hashes. `eshop-sut/backend/database.sqlite` remains a runtime-modified tracked
file and must stay unstaged. No validation fixture output belongs in the commit.

## Regression: Windows PowerShell 5.1 Source-Encoding Safety for Machine-Critical Markers

Found on 2026-08-17 during the first prepared Soak preflight, which aborted **before any k6
performance traffic**. Full history: `work/official_soak_blocker_20260817t225458219.md`.

The previous reservation guard was Unicode-dependent and therefore unsafe. It compared the
marker file against a literal containing U+2014. Because `work/run_official_soak.ps1` is
UTF-8 without a BOM, Windows PowerShell 5.1 parsed that literal using the ANSI code page and
turned the em dash into U+00E2, U+20AC, U+201D. `PREPARATION.md` decoded correctly to a single
U+2014, so the guard could never match and threw on every invocation before k6 started.

Rule now recorded for reuse:

- machine-critical tokens compared, parsed, matched, or validated by PowerShell must be
  ASCII-only;
- em dashes, smart quotes, and non-breaking spaces must never appear in such tokens; and
- human-readable Markdown prose stays separate from the machine guard.

Current state:

| Item | Status |
|---|---|
| Previous Unicode-dependent marker | Unsafe; removed |
| New machine marker `PREPARED-NOT-EXECUTED` | ASCII-safe; matches the existing Load/Stress `PREPARED-NOT-EXECUTED.md` convention |
| `run_official_soak.ps1`, `capture_official_soak_frames.ps1`, `soak_resource_monitor_pane.ps1` | Byte-wise pure ASCII |
| Preflight validation on a valid prepared marker | PASS |
| Invalid marker (missing token) | Still rejected |
| Marker for a different Run ID | Still rejected |
| Test proven to detect the original Unicode defect | PASS |
| Runner internal `$approvedHashes` gate replayed | PASS on all seven pinned artifacts |
| EShop traffic sent during validation | None; `users=2`, `orders=0` unchanged from seed |
| k6 processes started during validation | None |

The pane header em dash was also corrected to an ASCII hyphen. That string is display-only and
was not the blocker, but the corrupted glyph rendered into official Soak screenshots, so it was
fixed for evidence legibility. The reviewed Soak workload, profile, thresholds, think-times,
scenario-start handshake, sampling interval, recovery duration, and screenshot schedule are all
unchanged and byte-identical.

## Remaining Execution-Preparation Limitations

Before new official Soak traffic, execution must:

1. use only the newly reserved Run ID and never reuse `20260817t225458219`;
2. perform and document the accepted restart/reseed and health/PID checks;
3. arrange the visible runner, resource pane, Task Manager, and clock for the single 420-second frame;
4. start the screenshot helper and confirm GUI readiness;
5. verify the committed implementation hashes and branch; and
6. receive explicit authorization for official traffic.

Windows UAC may still require a minimal human Task Manager placement action. Record such a
limitation honestly; never reconstruct a screenshot or rerun automatically because
performance is poor.
