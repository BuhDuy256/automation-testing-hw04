# Official Stress GUI Execution Handoff

## Reserved invocation

- Status: **PREPARED — NOT EXECUTED**
- `K6_RUN_ID`: `20260817t115158688`
- Evidence directory: `out/23127179_Stress_20260817_evidence/20260817t115158688/`
- Designated Stress report: Custom k6 end-of-test Markdown Stress Stage Summary
- Official runner: `work/run_official_stress.ps1`

Do not use another run ID or directory without a new collision check and updated
preflight record. Do not claim any file in this reserved directory as execution
evidence until the runner has completed a real invocation.

## Exact prerequisites

1. Work from repository branch `hw05-performance` with a clean intended Stress
   implementation. Ignore and never stage `eshop-sut/backend/database.sqlite`.
2. Confirm these SHA-256 values:
   - `out/23127179_Stress_20260817.js`:
     `822F0D7A37A620E37CB8DCA9F8C99CCD1C20118335E8A8FC118C81D35E65C198`
   - `out/stress_stage_report.js`:
     `56542BED0A17AE8A87C31623D86248F52FAD833082F1FEFDD80ED9E0C2BFF865`
   - `out/user_workflow_data.csv`:
     `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1`
3. Confirm `work/performance_testing_report_state.md` still records Load as Native
   k6 Web Dashboard HTML `USED`, Stress as Custom Markdown Stress Stage Summary
   `ASSIGNED / USED-FOR-DESIGN`, and Spike as `UNASSIGNED`.
4. Open a normal, visible PowerShell window at the repository root. Do not start the
   official runner until Task Manager and capture tooling are ready.

## Clean backend preparation immediately before traffic

The backend must be restarted immediately before this invocation. The approved
restart reseeds SQLite and removes runtime-created users and orders.

```powershell
bash ./run.sh stop
bash ./run.sh start
bash ./run.sh status
$health = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/categories' -TimeoutSec 5
$health.StatusCode
$listener = netstat -ano -p tcp | Select-String ':3000\s+.*LISTENING' | Select-Object -First 1
$listener
$backendPid = [int]$listener.ToString().Trim().Split()[-1]
Get-Process -Id $backendPid | Select-Object ProcessName,Id,StartTime,WorkingSet64,PrivateMemorySize64
```

Expected health status is HTTP `200`; the listener PID must resolve to the new backend
`node.exe`. If these checks fail, do not start k6. No backend restart was performed
during package preparation.

## GUI preparation

1. Open Task Manager **Details** in a non-elevated session first.
2. Show `Name`, `PID`, `CPU`, `Memory (active private working set)` or working-set
   memory, and preferably command-line details.
3. Keep the visible runner PowerShell window, Task Manager, and system clock in the
   same frame. The runner window must remain readable enough to show the active marker.
4. After the runner starts, identify `k6.exe` from its PID and retain the verified
   backend `node.exe` PID. Do not confuse frontend Node processes with the backend.

## Exact official invocation

Run this only after the clean restart, HTTP health check, backend PID identification,
and GUI setup are complete:

```powershell
& .\work\run_official_stress.ps1 -RunId '20260817t115158688' -BackendRestartedBeforeRun $true
```

The runner rechecks the approved hashes and backend health before traffic. It writes
the fully expanded k6 command to `command.txt`, supplies `BASE_URL`, `K6_RUN_ID`, and
`STRESS_MARKDOWN_REPORT_PATH`, exports raw NDJSON and summary JSON, redirects
stdout/stderr, and samples backend, k6, and machine resources. It does not enable the
Load Web Dashboard report.

## Frozen stage timeline and capture targets

The runner marker format is:

`STRESS_PHASE=<phase> STRESS_LEVEL=<level> TARGET_VUS=<vus> RUN_ID=20260817t115158688 ELAPSED=<seconds>`

| Elapsed interval | Frozen stage | Target VUs | Suggested capture |
|---:|---|---:|---:|
| 0-30 s | `transition_1_to_4` | 4 | none required |
| 30-150 s | `baseline_4` | 4 | 90 s |
| 150-180 s | `transition_4_to_8` | 8 | none required |
| 180-300 s | `anchor_8` | 8 | 240 s |
| 300-330 s | `transition_8_to_12` | 12 | none required |
| 330-450 s | `level_12` | 12 | 390 s |
| 450-480 s | `transition_12_to_16` | 16 | none required |
| 480-600 s | `level_16` | 16 | 540 s |
| 600-630 s | `transition_16_to_20` | 20 | none required |
| 630-750 s | `level_20` | 20 | 690 s |
| 750-780 s | `transition_20_to_24` | 24 | none required |
| 780-900 s | `maximum_24` | 24 | 840 s |
| 900-960 s | `transition_24_to_4` | 4 | none required |
| 960-1080 s | `recovery_4` | 4 | 1020 s |
| 1080-1140 s | `transition_4_to_0` | 0 | none required |

The nominal schedule is exactly 1,140 seconds. `gracefulRampDown=30s` and
`gracefulStop=30s` can extend process completion beyond that boundary without changing
the frozen stages.

Capture one real same-run frame for every required plateau: `baseline_4`, `anchor_8`,
`level_12`, `level_16`, `level_20`, `maximum_24`, and `recovery_4`. Every frame must
show the current runner marker and run ID, timestamp, active execution context, backend
`node.exe` PID/CPU/memory, and preferably `k6.exe` PID/CPU/memory.

The `level_16` frame is the default primary candidate. After execution, an already
captured frame from the first meaningful degradation plateau may replace it. If no
meaningful degradation is found, use the clearest valid `maximum_24` frame. Never
reconstruct, stage, or recreate a missed same-run frame.

## Windows UAC contingency

Claude should first attempt normal desktop automation. If Task Manager interaction is
blocked by Windows integrity/UAC with access denied, Claude must stop claiming full
automation and ask the student only for the minimal blocked action, such as selecting
the Details tab or enabling the required columns. Continue real capture afterward.
Record the limitation as an evidence constraint, not a SUT defect.

## Expected invocation outputs

The runner creates or completes these real outputs inside the reserved directory:

- `raw-results.ndjson`
- `summary.json`
- `stdout.log` and `stderr.log`
- `stress-stage-summary.md`
- `process-resource.csv` and `system-resource.csv`
- `metadata-pre-run.json` and `metadata.json`
- `command.txt`
- `hashes.sha256`
- copied script, report helper, CSV, hardware context, and GUI instructions
- `completion-report.md`
- `screenshots/` containing the seven same-run frames
- `screenshot-manifest.md`, created after capture with filename, stage, elapsed time,
  run ID, timestamp, visible PIDs, and capture notes

The committed `preflight-metadata.json`, `command-preview.txt`, and
`PREPARED-NOT-EXECUTED.md` are preparation records, not measured results. At runner
start, the marker is renamed to `pre-run-preparation-record.md`.

## Validity and no-automatic-rerun rules

Preserve the invocation and continue ordinary Stress degradation when safe. High
latency, failed correctness thresholds, HTTP/semantic/workflow failures, RPS
flattening, SQLite errors, interrupted iterations, and poor maximum-stage behavior
are possible valid Stress evidence. Do not automatically rerun to obtain a clean
result.

Stop only when the remaining execution is invalid or unsafe: the backend can no
longer exercise the intended workflow, k6/generator saturation makes the generator
the bottleneck, raw/resource evidence is corrupted, the machine becomes unstable, the
SUT restarts or reseeds during the invocation, the run ID collides, or implementation
hashes differ. Preserve all evidence already produced and document the stop reason.

The positive workflow performs one correct-password Login per unique account and does
not naturally trigger the three-failed-login lockout. Do not add wrong-password
traffic or retry credentials. If unexpected failures or lockout appear, preserve the
evidence, record affected stage/accounts, and reset only between invocations after
human review.

## Post-run verification

1. Record the runner/k6 exit code without equating a threshold exit with an invalid run.
2. Verify raw NDJSON, summary JSON, Markdown report, stdout/stderr, metadata, both
   resource CSVs, command record, and completion record exist and are nonempty.
3. Verify raw samples carry `stress_level` and `step`, and the Markdown report contains
   all seven plateaus without invented resource values.
4. Verify resource timestamps and marker labels align with the stage timeline.
5. Save all real frames under `screenshots/` and write `screenshot-manifest.md` from
   those files only.
6. Record any UAC/manual action and any invalid-run concern explicitly.
7. Do not perform Task 2 analysis, design Spike, or create issue reports in this handoff.

Optional live screen footage may be preserved, but do not fabricate or delay this run
for the final demo video. The assignment's demo requires the student's own narration.
