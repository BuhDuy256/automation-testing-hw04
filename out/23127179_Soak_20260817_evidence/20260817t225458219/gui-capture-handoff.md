# Official Soak GUI and Execution Handoff

Status: **PREPARED — NOT EXECUTED** (harness blocker fixed and revalidated)

This invocation-specific handoff is for Claude Desktop or the student operating the real
Windows desktop. It authorizes preparation only; official traffic still requires a separate
execution instruction.

## Blocker Resolution Notice

A prepared preflight attempt on 2026-08-17 **stopped before any k6 performance traffic** because
of a preflight harness defect, not a SUT problem. The reservation guard compared the marker file
against a Unicode em dash, and Windows PowerShell 5.1 parses this UTF-8-without-BOM runner using
the ANSI code page, corrupting that literal so it could never match.

- Fixed: the machine guard now compares the ASCII-only token `PREPARED-NOT-EXECUTED`.
- Revalidated: `work/validate_soak_preflight_marker.ps1` passes 14/14 checks under PowerShell 5.1.
- Full history: `work/official_soak_blocker_20260817t225458219.md`.
- All hashes below were re-frozen after the fix; earlier values are stale and must not be used.

No `raw-results.ndjson`, `summary.json`, resource CSV, metadata, screenshot, or database-state
file was produced, and a read-only capture confirmed the database stayed at the seeded `users=2`
and `orders=0`. **Run ID `20260817t225458219` was never consumed by performance traffic, so the
next execution is the FIRST official Soak performance invocation, not a rerun.**

## Reserved Invocation

- `K6_RUN_ID`: `20260817t225458219`
- Evidence directory: `out/23127179_Soak_20260817_evidence/20260817t225458219/`
- Reviewed Soak implementation commit: `bf018d50cecd9bb92b6fc521374ac295f483d430`
- Reviewed Codex lifecycle Skill commit: `5a33e5e4fd5fa36bf9985f1b91057e82b2e7eaff`
- Reviewed Claude lifecycle Skill mirror commit: `f815870b7c785267ce01b7ca654dc02171be1e9f`
- This Run ID matches `^[a-z0-9]{8,20}$`, was checked against prior evidence directories,
  validation IDs, and repository text references, and must not be reused.

## Frozen Artifact Hashes

These are raw-file SHA-256 values for the prepared invocation, re-frozen on 2026-08-17 after
the preflight harness fix:

| Artifact | SHA-256 | Changed by the fix |
|---|---|---|
| `out/23127179_Soak_20260817.js` | `BA409623775BB524059996AC62A80515E5A4E0FB3E295CC2895B1EEA78FB98DD` | No |
| `out/user_workflow_data.csv` | `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1` | No |
| `work/run_official_soak.ps1` | `CF74B3F977E99A03861A0874606D5110BB201EFD66FBCDE63928242E61B1F2A3` | **Yes** |
| `work/verify_soak_results.js` | `F0584DB90448086B73A827C2EFF78C0D231A22BD9A14C728F4C014306EC6B37B` | No |
| `work/capture_soak_database_state.js` | `4FFE9D654B1218E0211D97CE7CA8F396E1392F6C85ED5FA9D32CB23ADF94720E` | No |
| `work/capture_official_soak_frames.ps1` | `4F96F134E5CD970DC2DF099E8C3A51D201D42C9459A512499517D302FFFC6326` | No |
| `work/soak_resource_monitor_pane.ps1` | `D3FBF5CBFF02015F43E05FFC812EDDC83C1273982FED00C1BC6E41C565E8AC2A` | **Yes** |
| `work/official_soak_execution_handoff.md` | `C4CBBBF8513C060C08A96F4D1122B023B591CAE4580C3DE31D11B3012A3D0AE5` | No |
| `work/validate_soak_preflight_marker.ps1` | `205BC1870C67581A518D1F0D816B12E7BE788FC78F7AFA1A74BB7BB7AAA6C5BF` | **New** |

The reviewed Soak workload is provably untouched: the k6 script, CSV, factual verifier,
read-only database helper, and screenshot helper all keep their original hashes.

Stop if any value differs before official execution. The finalized hash of this handoff is
recorded outside this file in the invocation's `PREPARATION.md` to avoid a self-hash cycle.

These raw values correspond to the LF working-copy bytes. This repository is checked out with
`core.autocrlf` enabled, so a fresh clone can materialize CRLF line endings and change every
raw text hash without any content change. The runner's own `$approvedHashes` gate is immune
because it compares newline-normalized canonical SHA-256. If a raw value differs, first confirm
whether the file's line endings changed before treating it as a real content mismatch.

## PowerShell 5.1 Compatibility Rule

This repository's `.ps1` files are UTF-8 **without a BOM**, and the only shell available on the
execution machine is Windows PowerShell 5.1, which parses such files using the ANSI code page.
Any Unicode punctuation inside a string literal is therefore corrupted at parse time.

- Machine-critical tokens that are compared, parsed, matched, or validated must be ASCII-only.
- Never use an em dash, smart quote, or non-breaking space in such a token.
- Human-readable Markdown prose may keep richer punctuation; it must not be the guard.
- All three Soak PowerShell helpers are now byte-wise pure ASCII, so source encoding can no
  longer change their parsed meaning.

The reservation marker's machine token is now:

```text
PREPARED-NOT-EXECUTED
```

`PREPARATION.md` declares it on an explicit `Machine status token:` line, matching the existing
`PREPARED-NOT-EXECUTED.md` convention already used by the Load and Stress runners. The guard
still requires both this token and the exact reserved Run ID, and it still rejects an incorrect
marker; it was not weakened. Verify with:

```powershell
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\work\validate_soak_preflight_marker.ps1
```

That validation is preflight-only. It sends no EShop request and starts no k6 process.

## Frozen Profile and Timeline

- Executor: one closed `ramping-vus` scenario; `startVUs: 1`.
- `0 <= elapsed < 60s`: 1 -> 12 target VUs, `warmup_entry`.
- `60 <= elapsed < 300s`: 12 target VUs, `early_steady`.
- `300 <= elapsed < 540s`: 12 target VUs, `middle_steady`.
- `540 <= elapsed < 780s`: 12 target VUs, `late_steady`.
- `780 <= elapsed < 810s`: 12 -> 0 target VUs, `exit_ramp`.
- After 810s: real in-flight work may finish in `graceful_completion`.
- `gracefulRampDown: 30s`; `gracefulStop: 30s`.
- After confirmed traffic completion: 120 seconds of resource-only recovery with no
  intended traffic.

Do not change the load, duration, ramps, workflow, CSV, five think-time ranges, correctness
thresholds, two-second sampling, or recovery duration.

## Immediate Pre-Traffic Restart and Health Gate

Run these only when official traffic is separately authorized and immediately before it:

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

Record the real port-3000 PID, start time, and executable/path where available. Do not use an
unrelated Node process. Set `BackendRestartedBeforeRun=$true` only after this gate succeeds.
No restart, health request, or PID claim occurred during package preparation.

## Database Baseline

The official runner invokes the read-only capture after the restart/health/PID gate and before
k6 starts:

```powershell
node .\work\capture_soak_database_state.js `
  --database .\eshop-sut\backend\database.sqlite `
  --output .\out\23127179_Soak_20260817_evidence\20260817t225458219\database-state-before.json `
  --label before
```

It records the capture timestamp, database byte size, and available `users`/`orders` counts.
The Run ID is attributable through the collision-safe invocation directory and metadata. The
same read-only helper captures `database-state-after.json` after recovery. Never mutate SQLite
for measurement.

## Actual Scenario-Start Handshake

`RUNNER_PREFLIGHT_START` and `SOAK_SCENARIO_START` are different events. The k6 script emits:

```text
SOAK_SCENARIO_START epoch_ms=<exec.scenario.startTime> scenario=soak run_id=20260817t225458219
```

The runner parses this real marker from k6 stdout/stderr, converts its epoch to UTC, and writes
it to `runtime-state.json` and metadata. Window attribution, resource rows, and screenshot
timers use this timestamp. Missing the marker invalidates the invocation; runner launch time
must never substitute for it.

`TARGET_VUS` is schedule-derived. `ACTUAL_VUS` is shown only when parsed from real k6 progress;
otherwise it is `unavailable`. The factual verifier uses raw `soak_actual_vus` samples and
timestamps to decide whether each steady window actually established 12 VUs. Never copy target
VUs into actual-VU evidence.

## Window and Resource Evidence

The runner samples every two seconds from the pre-traffic baseline through warm-up, all steady
windows, exit, graceful completion, and the entire recovery. It records backend and k6 PID,
availability, CPU, working set, private memory, and threads; system CPU, committed memory,
disk throughput, and available network throughput are separate.

Start the resource pane after the backend PID is known and before the runner:

```powershell
& .\work\soak_resource_monitor_pane.ps1 `
  -RunId '20260817t225458219' `
  -RunDirectory '.\out\23127179_Soak_20260817_evidence\20260817t225458219' `
  -BackendPid $backendPid
```

## Screenshot Preparation

Arrange the runner console, resource pane, Task Manager Details, and Windows clock before
traffic. Start the capture helper before the runner; it waits for the real scenario marker:

```powershell
& .\work\capture_official_soak_frames.ps1 `
  -RunId '20260817t225458219' `
  -RunDirectory '.\out\23127179_Soak_20260817_evidence\20260817t225458219' `
  -BackendPid $backendPid
```

Targets measured from actual scenario start:

- about 90s: `early_steady`;
- about 420s: `middle_steady`;
- about 720s: `late_steady`.

After the k6 process exits and traffic completion is confirmed, continue zero-traffic resource
sampling for 120 seconds. Capture one resource-only frame about 60 seconds into recovery; mark
it as recovery, not active traffic.

If elevated Task Manager blocks automation, attempt normal placement once, report the block
truthfully, ask only for the minimum manual view/sort/placement action, and continue the same
run. Do not classify UAC as a SUT defect and never reconstruct a missed screenshot.

## Exact Official Runner Command

Run only after separate traffic authorization and all preceding gates pass:

```powershell
& .\work\run_official_soak.ps1 `
  -RunId '20260817t225458219' `
  -BackendRestartedBeforeRun $true `
  -GuiCaptureReady $true
```

The command is unchanged by the harness fix. The booleans are factual declarations, not
bypasses. There is no automatic rerun.

Because the aborted preflight sent no performance traffic, running this command is the **first**
official Soak performance invocation for `20260817t225458219`. Do not describe it as a rerun,
a retry, or a replacement run. If a future invocation does send traffic and then fails, that
situation is different: preserve the evidence, document the reason, stop, and wait for human
review rather than launching a cleaner second test.

## Post-Run Factual Verification

The runner executes `work/verify_soak_results.js` against real raw NDJSON, process/system CSV,
metadata, and summary JSON. For `early_steady`, `middle_steady`, and `late_steady`, it reports
actual duration/VUs, request and clean same-window workflow counts/rates, failures, checks,
workflow success, p50/p90/p95/p99/max, step counts/latency, and cross-window iterations.

It calculates the minimum request rate, minimum clean-workflow rate, and early-to-late absolute
and percentage differences. A minimum is not automatically a stable floor. Never label a value
`stable throughput`, `maximum stable RPS`, `capacity`, or `SLO` without later human review of
actual VUs, correctness, late behavior, generator/machine limits, latency, and resources.

For backend working set/private memory, the verifier reports per-window count, min, median,
mean, max, first, last, change MB, and approximate MB/min slope, including early baseline and
post-load recovery where available. It may describe factual shape, but must not diagnose a
memory leak, defect, cause, or capacity ceiling.

## Expected Official Artifacts

- `raw-results.ndjson`
- `summary.json`
- `stdout.log` and `stderr.log`
- `process-resource.csv` and `system-resource.csv`
- `metadata-pre-run.json`, `metadata.json`, and `runtime-state.json`
- `command.txt` and `hashes.sha256`
- `database-state-before.json` and `database-state-after.json`
- `soak-window-summary.md`
- `completion-report.md` and `post-run-verification-notes.md`
- `screenshots/`, `screenshot-manifest.md`, and `capture-log.json`
- frozen test/data/helper copies and this handoff as `gui-capture-handoff.md`

Raw NDJSON is authoritative detailed evidence. Preserve its exact bytes under `out/`, record
its byte size and SHA-256, and do not commit it automatically if it would bloat Git. Soak is an
additional endurance milestone, not a fourth designated report type.

## Validity, Safety, and Preservation Rules

Preserve valid bad performance, including genuine latency/throughput/memory/correctness,
contention, threshold, or backend-failure evidence after meaningful valid load. Invalid/unsafe
conditions include wrong hashes, reused Run ID, pre-traffic backend unavailability, unexpected
restart/reseed, corrupted evidence, setup-caused identity collision, generator domination,
machine instability, backend identity loss, or failure to establish actual steady 12 VUs.
Classify technical validity separately from submission completeness and do not rerun
automatically.

The workflow creates a unique account and performs one correct-password Login with no retry.
Long duration creates more accounts, not more failed attempts per account. Preserve unexpected
real authentication failure; setup-caused collisions/retries invalidate execution.

## Pre-Run Checklist

Leave every item unchecked until it is factually verified immediately before traffic:

- [ ] Reserved Run ID is still unique and the directory contains preparation files only.
- [ ] Approved Soak script, CSV, runner, verifier, capture, monitor, and handoff hashes match
  the **re-frozen** table above, not the pre-fix values.
- [ ] `work/validate_soak_preflight_marker.ps1` passes 14/14 under Windows PowerShell 5.1.
- [ ] Reservation marker guard accepts the prepared directory and still rejects a bad marker.
- [ ] Branch and reviewed implementation commit are correct.
- [ ] Lifecycle Skill still routes `scenario_type=soak`; report registry still treats Soak as
  additional endurance evidence rather than a fourth designated report.
- [ ] Backend stop/start/status restart and reseed gate completed immediately before traffic.
- [ ] `/api/categories` returned HTTP 200 after restart.
- [ ] Real port-3000 `node.exe` PID, start time, and path were recorded.
- [ ] Read-only clean database baseline capture is ready.
- [ ] Runner preflight time and k6 scenario-start marker are understood as separate events.
- [ ] Two-second backend/k6/system resource monitoring is ready.
- [ ] Screenshot helper, visible panes, Task Manager context, and Windows clock are ready.
- [ ] 120-second recovery and its +60-second resource-only screenshot are ready.
- [ ] Raw NDJSON, summary, stdout/stderr, metadata, resource CSV, hashes, and verifier outputs
  have valid future destinations and do not yet exist as measured results.
- [ ] Target VUs will not be presented as actual VUs.
- [ ] Throughput minima will not be called stable without the reviewed evidence gate.
- [ ] Memory trend output will remain factual and non-causal.
- [ ] UAC contingency and no-fabrication/no-auto-rerun rules are understood.
- [ ] Stress and Spike raw NDJSON byte sizes and hashes remain intact.
- [ ] `eshop-sut/backend/database.sqlite` is excluded from staging and commit.

Never fabricate a PID, VU value, timestamp, screenshot, result, or completion status. Do not
stage `eshop-sut/backend/database.sqlite`. Do not modify, move, clean, or delete:

- Stress raw NDJSON: 60,711,245 bytes, SHA-256
  `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`;
- Spike raw NDJSON: 12,181,217 bytes, SHA-256
  `D60B112DF3784CD448EDF12DE95ACE15E9159CDE30A308D0BFC7AFD21EF5AD8A`.
