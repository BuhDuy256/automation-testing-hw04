# Official Soak Execution Handoff

Status: **IMPLEMENTED AND VALIDATED — NOT EXECUTED**

This handoff prepares a future separately authorized official Soak invocation. It does not
authorize traffic or changes to the frozen profile.

## Frozen Profile

- Test plan: `out/23127179_Soak_20260817.js`
- CSV: `out/user_workflow_data.csv`
- Executor: one closed `ramping-vus` scenario
- Entry: 1 -> 12 VUs over 60 seconds
- Hold: 12 VUs for 720 seconds
- Exit: 12 -> 0 VUs over 30 seconds
- `gracefulRampDown`: 30 seconds
- `gracefulStop`: 30 seconds
- Resource sampling: 2 seconds
- Resource-only recovery: 120 seconds after confirmed k6 exit

The runner requires a new unique `K6_RUN_ID` matching `^[a-z0-9]{8,20}$`. Reserve it only
during execution preparation and never reuse an older Load, Stress, Spike, validation, or
Soak invocation ID.

## Restart and Health Gate

Immediately before the authorized run, execute and document:

```powershell
bash ./run.sh stop
bash ./run.sh start
bash ./run.sh status
```

Then verify `GET http://localhost:3000/api/categories`, identify the real `node.exe` process
listening on TCP port 3000, and record its PID and start time. Do not set the runner's
`BackendRestartedBeforeRun` switch to true until these facts are verified.

## Actual Scenario-Start Handshake

Runner preflight time is not the scenario anchor. The k6 script emits exactly one marker from
the first test-wide iteration:

```text
SOAK_SCENARIO_START epoch_ms=<exec.scenario.startTime> scenario=soak run_id=<K6_RUN_ID>
```

The runner reads this k6-created epoch from real stdout, records it in runtime state and final
metadata, and uses it for resource windows and screenshot timing. If the marker is missing,
the run cannot establish attributable steady windows and is invalid.

`TARGET_VUS` is schedule-derived. `ACTUAL_VUS` comes only from real k6 progress or the raw
`soak_actual_vus` metric. Post-run verification must show actual 12 VUs throughout each
compared steady window before those windows may be described as sustained 12-VU evidence.

## GUI Preparation

Before traffic, arrange:

1. the runner console;
2. `work/soak_resource_monitor_pane.ps1`;
3. Task Manager Details showing backend and k6 PID, CPU, and memory where possible; and
4. the Windows clock.

Start the capture helper before the runner. It waits for the actual k6 start marker:

```powershell
& .\work\capture_official_soak_frames.ps1 `
  -RunId '<reserved-run-id>' `
  -RunDirectory '.\out\23127179_Soak_20260817_evidence\<reserved-run-id>' `
  -BackendPid <verified-port-3000-pid>
```

Start the resource pane against the same directory and PID:

```powershell
& .\work\soak_resource_monitor_pane.ps1 `
  -RunId '<reserved-run-id>' `
  -RunDirectory '.\out\23127179_Soak_20260817_evidence\<reserved-run-id>' `
  -BackendPid <verified-port-3000-pid>
```

Planned active screenshots are near 90, 420, and 720 seconds from actual scenario start. An
optional resource-only screenshot occurs about 60 seconds after confirmed traffic end. Never
reconstruct a missed frame.

## Official Runner

Only after separate traffic authorization:

```powershell
& .\work\run_official_soak.ps1 `
  -RunId '<reserved-run-id>' `
  -BackendRestartedBeforeRun $true `
  -GuiCaptureReady $true
```

The booleans are factual declarations, not bypasses. The runner creates one collision-safe
evidence directory, captures pre/post database facts read-only, samples resources through two
post-load minutes, runs the factual verifier, hashes the raw result, and never launches an
automatic rerun.

## Preservation and Interpretation

Keep raw NDJSON under `out/` for submission. Record its exact size and SHA-256. Do not commit
it automatically when it would bloat Git, and never delete it merely because it is untracked.

The factual verifier calculates window rates, their minima, and early-to-late differences.
It never labels them stable, maximum stable RPS, an SLO, or capacity. Memory output is
descriptive only and never diagnoses a leak.
