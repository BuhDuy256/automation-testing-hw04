# Official Spike GUI and Execution Handoff

Status: **PREPARED — NOT EXECUTED**

This handoff is invocation-specific. It prepares the approved Spike execution and does not authorize changing the workload or creating replacement evidence.

## Reserved Invocation

- `K6_RUN_ID`: `20260817t134816776`
- Evidence directory: `out/23127179_Spike_20260817_evidence/20260817t134816776/`
- Reviewed implementation commit: `4709209f461b3c0a90c2a4165d3bdb7e808dc6e2`
- Required branch: `hw05-performance`
- Test plan: `out/23127179_Spike_20260817.js`
- Input data: `out/user_workflow_data.csv`

The Run ID matches `^[a-z0-9]{8,20}$` and was checked against existing repository evidence, previous Load/Stress IDs, Spike validation IDs, and prepared IDs before reservation.

## Frozen Hashes

Verify these immediately before execution:

| File | SHA-256 |
|---|---|
| `out/23127179_Spike_20260817.js` | `CC01F02F8F06064E14D7C1241CE2C4908808BD2B3CDA2E7A597C538DFFD08AE6` |
| `out/user_workflow_data.csv` | `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1` |
| `work/capture_official_spike_frames.ps1` | `0076CA8DA90B5297DB38680539D6506AFA2D031F6F04755C14CBDA9B09778F43` |
| `work/spike_resource_monitor_pane.ps1` | `6066C45AFEF2DC659C11DFD08BB9D54E3B2E8A5E16408F417259A38A34A87213` |
| `work/official_spike_visual_capture_instructions.md` | `BC8E2ADC8B3BB80B0411D7FD62562C4407C156178D6CB8CF469E823874A0A287` |

The runner pins the approved workload/data/capture/resource hashes and this invocation-specific handoff hash. It copies the handoff into the evidence directory and records its current hash in `hashes.sha256` and `metadata-pre-run.json`.

## Backend Restart and Reseed Gate

Do not set `BackendRestartedBeforeRun=$true` until all three commands have completed immediately before traffic:

```powershell
bash ./run.sh stop
bash ./run.sh start
bash ./run.sh status
```

Then verify the backend health endpoint:

```powershell
$response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/categories' -TimeoutSec 5
if ($response.StatusCode -ne 200) { throw "Backend health check failed: HTTP $($response.StatusCode)" }
```

Identify the new backend PID from the process listening on port 3000; do not select a frontend Node process:

```powershell
$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -First 1
$backendPid = [int]$listener.OwningProcess
Get-Process -Id $backendPid | Select-Object Id, ProcessName, StartTime, Path
```

The process must be `node.exe`, must own the port-3000 listener, and must have a new start time after the restart. Keep `eshop-sut/backend/database.sqlite` out of Git.

## Frozen Timeline

| Elapsed | Phase | Scheduled target |
|---:|---|---:|
| 0-20 s | `warmup_4` | 4 VUs |
| 20-60 s | `pre_spike_steady_4` | 4 VUs |
| 60-61 s | `spike_transition_4_to_32` | changes 4 -> 32 VUs |
| 61-106 s | `spike_peak_32` | 32 VUs |
| 106-107 s | `recovery_transition_32_to_4` | target changes 32 -> 4 VUs |
| 107-137 s | `recovery_settling_4` | target 4 VUs |
| 137-197 s | `recovery_steady_4` | target 4 VUs |
| 197-227 s | `final_rampdown_4_to_0` | changes 4 -> 0 VUs |

`gracefulRampDown=30s` and `gracefulStop=30s`. Preserve all five reviewed think-time ranges. Do not alter the 32-VU maximum, stages, thresholds, workflow, CSV, report type, or phase attribution.

## Window and Resource Preparation

Arrange these before traffic:

1. runner console showing phase markers;
2. Spike resource pane showing backend and k6 process data;
3. Task Manager Details view showing Name, PID, CPU, and working set where possible; and
4. Windows clock.

After restart, open the resource pane with the verified port-3000 PID:

```powershell
& .\work\spike_resource_monitor_pane.ps1 `
  -RunId '20260817t134816776' `
  -BackendPid $backendPid
```

The runner samples backend and k6 PID, availability, CPU, working set, private memory, and thread count. It also samples whole-machine CPU, committed memory, disk, and network counters where Windows exposes them. Every sample contains a UTC timestamp, `spike_phase`, and schedule-derived `target_vus`.

## Rolling Capture Preparation

Start the capture helper before the runner. It waits for the runner-created `metadata-pre-run.json`, then anchors captures to its real `started_at_utc`:

```powershell
& .\work\capture_official_spike_frames.ps1 `
  -RunId '20260817t134816776' `
  -RunDirectory '.\out\23127179_Spike_20260817_evidence\20260817t134816776' `
  -BackendPid $backendPid
```

Capture schedule:

- reference: approximately 45 s;
- rise/early peak: every second from 58 through 70 s;
- peak: approximately 85 s;
- drop/early recovery: every second from 104 through 116 s;
- recovery settling: approximately 122 s; and
- recovery steady candidate: approximately 165 s.

Do not rely on manual timing during the one-second transitions. The default primary screenshot candidate is the clearest already-captured real early `spike_peak_32` frame. Do not preselect a nonexistent filename, recreate a missed transition, or stage another run to manufacture a screenshot.

## Exact Official Runner Invocation

Run this only after the restart/reseed, health check, PID verification, GUI arrangement, rolling helper start, and execution authorization:

```powershell
& .\work\run_official_spike.ps1 `
  -RunId '20260817t134816776' `
  -BackendRestartedBeforeRun $true `
  -GuiCaptureReady $true
```

The two `$true` values are factual declarations, not convenience switches. Do not use them before the corresponding gates are actually satisfied.

## Phase Markers and VU Meaning

The runner prints:

```text
SPIKE_PHASE=<phase> TARGET_VUS=<scheduled-target> ACTUAL_VUS=<observed-or-unavailable> RUN_ID=20260817t134816776 ELAPSED=<seconds>
```

`TARGET_VUS` is derived from the frozen schedule. It is not actual concurrency. `ACTUAL_VUS` is printed only when k6 progress yields a real active-VU value; otherwise it must remain `unavailable`. The authoritative actual-VU evidence is the Native k6 CSV rows where `metric_name=vus`.

## Native Outputs

Installed k6 v2.1.0 supports simultaneous output arguments used by the runner:

```text
--summary-export <run-directory>/summary.json
--out json=<run-directory>/raw-results.ndjson
--out csv=<run-directory>/spike-metrics.csv
```

Native CSV stores `step`, `spike_phase`, and `target_vus` in `extra_tags`, uses Unix epoch-second timestamps, and includes built-in `vus`/`vus_max` samples. Native `vus` rows do not inherit custom phase tags; align them by timestamp to `metadata-pre-run.json.started_at_utc`.

## Expected Official Artifacts

The following paths are planned. Measured files must be created only by the real invocation or its real post-run verification:

- `raw-results.ndjson`
- `summary.json`
- `spike-metrics.csv`
- `stdout.log`
- `stderr.log`
- `process-resource.csv`
- `system-resource.csv`
- `metadata-pre-run.json`
- `metadata.json`
- `command.txt`
- `hashes.sha256`
- `completion-report.md`
- `screenshots/`
- `screenshot-manifest.md`
- `capture-log.json`
- `post-run-verification-notes.md`

Before execution, only legitimate preparation files and the screenshot destination's preparation marker may exist. They must be labeled **PREPARED — NOT EXECUTED**.

## Post-Run Verification

1. Preserve all outputs even when thresholds fail or performance is poor.
2. Verify raw NDJSON, native CSV, summary, logs, metadata, resources, and real captures are nonempty and attributable to this Run ID.
3. Confirm request/workflow/Checkout counts and interrupted/cross-phase iterations from direct evidence.
4. Align resource samples and native CSV timestamps to the frozen phase timeline.
5. Inspect `metric_name=vus` samples in 137-197 s before using `recovery_steady_4` as a steady four-VU comparison.
6. If actual VUs remain materially above four, record: `actual VUs did not fully settle during the intended recovery window.`
7. Review real screenshots and create `screenshot-manifest.md`; select the primary frame only from valid captured evidence.
8. Record factual validity/completeness notes in `post-run-verification-notes.md`; do not perform Task 2 analysis here.

## Validity, Rerun, and Lockout Rules

High latency, p95/p99 spikes, HTTP or semantic failures, threshold failure, SQLite contention, low throughput, delayed recovery, slow VU draining, and interrupted iterations are results to preserve. They are not automatic rerun reasons.

Stop only for invalid or unsafe conditions such as an unavailable backend before meaningful exercise, restart/reseed during traffic, corrupted collection, run-ID collision, hash mismatch, machine instability, generator-dominant bottleneck, unusable monitoring, or setup-caused identity collision. Never automatically launch a cleaner replacement invocation.

Each unique account performs one correct-password Login after Register. Do not add wrong-password traffic or retry credentials. Preserve unexpected auth/lockout evidence with phase, account, and Run ID; reset only between invocations after review.

## Windows UAC Contingency

Attempt normal window automation first. If Windows integrity/UAC blocks elevated Task Manager manipulation, stop claiming full automation and ask the student only to perform the blocked view, sort, or placement action. Continue real same-run capture afterward. Record the limitation as an evidence constraint, not a SUT defect.

## Preservation Warning

Do not modify, move, clean, truncate, or commit:

`out/23127179_Stress_20260817_evidence/20260817t115158688/raw-results.ndjson`

Its expected SHA-256 is `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`.
