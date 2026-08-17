# Official Soak GUI and Execution Handoff

Status: **PREPARED - NOT EXECUTED**

This invocation-specific handoff is for the next separately authorized official Soak run.
Preparation sends no traffic and does not authorize execution.

## Invocation Identity and Historical Boundary

- New reserved `K6_RUN_ID`: `20260818t000551547`
- New evidence directory: `out/23127179_Soak_20260817_evidence/20260818t000551547/`
- Reviewed Soak implementation commit: `bf018d50cecd9bb92b6fc521374ac295f483d430`
- Earlier preparation commit: `33f36fa1368dbb525d863fa2423dce562cc9fabe`
- PowerShell-safe marker fix commit: `2697804`

The first real invocation `20260817t225458219` is **TECHNICALLY INVALID / SUBMISSION
INCOMPLETE** and permanently retired. Its directory remains historical evidence and must never
be overwritten. Do not reuse its raw result, resource state, or screenshots as official evidence
for the new invocation.

## Runtime-State Harness Fix

The invalid runner wrote directly to `runtime-state.json` while the resource pane and capture
helper read it. A Windows sharing violation terminated the runner around 51 seconds.

The fixed runner calls `Publish-SoakRuntimeState` from `work/soak_runtime_state_io.ps1`. The
helper validates the complete JSON, writes it to a unique temporary file in the same directory,
closes it, then atomically publishes it with `System.IO.File.Replace`; the first state uses
`System.IO.File.Move`. Transient `IOException` and `UnauthorizedAccessException` failures use a
bounded 20-attempt, 25 ms retry. Readers remain unchanged.

Windows PowerShell 5.1 regression result over 15 seconds:

- successful publishes: 226;
- writer failures: 0;
- valid documents read by three concurrent readers: 2,673;
- invalid or partial documents read: 0;
- deliberate transient locks: 221; and
- malformed JSON: rejected without changing the published state.

No EShop request or k6 process was used by the regression.

## Frozen Artifact Hashes

Stop before traffic if any hash differs:

| Artifact | SHA-256 |
|---|---|
| `out/23127179_Soak_20260817.js` | `BA409623775BB524059996AC62A80515E5A4E0FB3E295CC2895B1EEA78FB98DD` |
| `out/user_workflow_data.csv` | `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1` |
| `work/run_official_soak.ps1` | `A1313BF087A7831910EFD701F65A79B63F47F1A7F9AA0520FCDE1D702EE11F95` |
| `work/verify_soak_results.js` | `F0584DB90448086B73A827C2EFF78C0D231A22BD9A14C728F4C014306EC6B37B` |
| `work/capture_soak_database_state.js` | `4FFE9D654B1218E0211D97CE7CA8F396E1392F6C85ED5FA9D32CB23ADF94720E` |
| `work/capture_official_soak_frames.ps1` | `1FF4A2B0A085029272EA5AFC1BE4B9A46FA445D60D468C1145D4D026C98A40D8` |
| `work/soak_resource_monitor_pane.ps1` | `D3FBF5CBFF02015F43E05FFC812EDDC83C1273982FED00C1BC6E41C565E8AC2A` |
| `work/soak_runtime_state_io.ps1` | `2B7F55B7A6B7751539C0A580142105B612DCF0077AB3B3574F8F6346FA8B7793` |
| `work/validate_soak_runtime_state_contention.ps1` | `7F28E160E9ADBE11C763F89C315EB35CE39E36F3908313F86E054E58BDCEA1BE` |
| `work/validate_soak_preflight_marker.ps1` | `A3F11EB935F901E0DCB204D1F28BB60DA2C0C56102C235890B0BF49A941A1538` |
| `work/official_soak_execution_handoff.md` | `9E6ACD2F82AB9E439C5FDA671EC3B3B920444077CAC5A9934DA30BBA5304EF72` |

The finalized hash of this file is stored in the new invocation's `PREPARATION.md` to avoid a
self-hash cycle.

## Frozen Workload

- Executor: one closed `ramping-vus` scenario; `startVUs: 1`.
- `0 <= elapsed < 60s`: 1 -> 12 target VUs, `warmup_entry`.
- `60 <= elapsed < 300s`: 12 target VUs, `early_steady`.
- `300 <= elapsed < 540s`: 12 target VUs, `middle_steady`.
- `540 <= elapsed < 780s`: 12 target VUs, `late_steady`.
- `780 <= elapsed < 810s`: 12 -> 0 target VUs, `exit_ramp`.
- After 810s: `graceful_completion` while genuine in-flight work finishes.
- `gracefulRampDown: 30s`; `gracefulStop: 30s`.
- Resource sampling: every 2 seconds.
- Resource-only recovery: 120 seconds after confirmed traffic completion.

The nine-request workflow, one Checkout, CSV, correlations, five think-time ranges, and three
correctness-only thresholds are unchanged. No latency, throughput, memory, or resource threshold
was added.

## Immediate Pre-Traffic Gate

Only after separate execution authorization:

```powershell
bash ./run.sh stop
bash ./run.sh start
bash ./run.sh status
$health = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/categories' -TimeoutSec 5
if ($health.StatusCode -ne 200) { throw "Backend health check returned $($health.StatusCode)" }
$listener = netstat -ano -p tcp | Select-String '^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)\s*$' | Select-Object -First 1
if (-not $listener) { throw 'No listener on TCP port 3000' }
$backendPid = [int]$listener.Matches[0].Groups[1].Value
$backend = Get-Process -Id $backendPid
if ($backend.ProcessName -ne 'node') { throw 'Port 3000 listener is not node.exe' }
$backend | Select-Object Id,ProcessName,StartTime,Path
```

Record the real port-3000 `node.exe` PID, start time, and path. Set
`BackendRestartedBeforeRun=$true` only after this gate succeeds. The runner then captures the
clean database byte size and available `users`/`orders` counts read-only before traffic, and
captures the after-state following recovery.

## Actual Scenario Start and VUs

Runner preflight is not the timeline anchor. The k6 script emits:

```text
SOAK_SCENARIO_START epoch_ms=<exec.scenario.startTime> scenario=soak run_id=20260818t000551547
```

The runner parses this real marker from stdout/stderr and uses it for windows, resource rows,
runtime state, and screenshot scheduling. Missing the marker invalidates the run.

`TARGET_VUS` is schedule-derived. `ACTUAL_VUS` comes only from real k6 progress or raw
`soak_actual_vus`; otherwise it is unavailable. Never copy target values into actual evidence.

## Resource and Screenshot Preparation

Start the resource pane before traffic after the backend PID is known:

```powershell
& .\work\soak_resource_monitor_pane.ps1 `
  -RunId '20260818t000551547' `
  -RunDirectory '.\out\23127179_Soak_20260817_evidence\20260818t000551547' `
  -BackendPid $backendPid
```

Prepare one active screenshot only. Start the helper before the runner:

```powershell
& .\work\capture_official_soak_frames.ps1 `
  -RunId '20260818t000551547' `
  -RunDirectory '.\out\23127179_Soak_20260817_evidence\20260818t000551547' `
  -BackendPid $backendPid `
  -IncludeRecoveryCapture $false
```

The only active target is approximately 420 seconds from actual scenario start in
`middle_steady`. Where practical, show active k6/runner, Run ID, window, elapsed time, target and
genuine actual VUs, backend/k6 PID/CPU/memory, Task Manager, and Windows clock. Do not schedule
90-second or 720-second active frames.

The runner always records the full 120-second resource-only recovery. A +60-second recovery
screenshot is optional; enable `-IncludeRecoveryCapture $true` only when it adds no GUI/privacy
risk. It is not a completion requirement.

If UAC blocks Task Manager automation, attempt normal placement once, report the limitation,
request only the minimum manual placement action, and continue same-run evidence. Never
reconstruct a missed frame.

## Exact Official Runner Command

Run only after separate traffic authorization and all gates pass:

```powershell
& .\work\run_official_soak.ps1 `
  -RunId '20260818t000551547' `
  -BackendRestartedBeforeRun $true `
  -GuiCaptureReady $true
```

The booleans are factual declarations, not bypasses. Do not launch an automatic replacement or
cleaner run after poor performance or an invalid condition.

## Post-Run Factual Outputs

The verifier derives actual-VU coverage, duration, requests/rate, clean workflows/rate,
correctness, latency percentiles, per-step facts, and cross-window iterations for each steady
window. It also calculates throughput minima and early-to-late absolute/percentage changes.
These values are not automatically stable throughput, maximum stable RPS, capacity, or an SLO.

Backend working set/private memory facts include count, min, median, mean, max, first, last,
change, and MB/min slope. Directional shape is factual only; do not diagnose a memory leak,
defect, cause, or capacity ceiling.

Expected artifacts include raw NDJSON, summary, stdout/stderr, process/system resource CSV,
pre/final metadata, command, hashes, read-only database before/after state, window summary,
completion and verification notes, the one active screenshot, capture log, and manifest.

## Privacy and Historical Evidence

In invalid invocation `20260817t225458219`:

- frame 01 is historical invalid-run evidence only and cannot be reused;
- frames 02 and 03 are **EXCLUDE FROM SUBMISSION - PRIVATE / NO EVIDENTIARY VALUE**;
- frames 02 and 03 must never appear in a future manifest, submission ZIP, issue, or publication;
- no historical file is deleted, reconstructed, or overwritten.

Preserve without modification:

- Stress raw NDJSON SHA-256 `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`;
- Spike raw NDJSON SHA-256 `D60B112DF3784CD448EDF12DE95ACE15E9159CDE30A308D0BFC7AFD21EF5AD8A`;
- invalid Soak raw NDJSON SHA-256 `51B643A59D9CA6B249A335CFC7717FA34B796CB44BF20B42BA0FF5458CF21892`.

Do not stage `eshop-sut/backend/database.sqlite`.

## Pre-Run Checklist

- [ ] New Run ID and preparation-only directory remain unique.
- [ ] Old Run ID is treated as retired and its directory is untouched.
- [ ] All frozen hashes match.
- [ ] Both PowerShell 5.1 regressions pass offline.
- [ ] Branch and committed harness fix are correct.
- [ ] Backend restart/reseed, health, and real PID gates pass immediately before traffic.
- [ ] Read-only database baseline is ready.
- [ ] Actual scenario-start handshake is understood.
- [ ] Two-second resource monitoring and 120-second recovery are ready.
- [ ] One 420-second active screenshot is ready; no 90/720 targets exist.
- [ ] Optional recovery screenshot choice is made before traffic.
- [ ] Target and actual VUs remain distinct.
- [ ] Throughput stability and memory diagnosis safeguards are understood.
- [ ] UAC, privacy, no-fabrication, and no-auto-rerun rules are understood.
- [ ] Stress, Spike, and invalid Soak raw hashes remain intact.
- [ ] `database.sqlite` is excluded from staging.
