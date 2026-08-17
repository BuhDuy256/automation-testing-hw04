# Official Soak Execution — Run ID `20260817t225458219`

Status: **TECHNICALLY INVALID — RUNNER FAILED 51 SECONDS INTO A REAL 12-VU RUN**

This was the first official Soak performance invocation. Real performance traffic **did**
occur and is preserved. The invocation is classified invalid because the reviewed runner
died early, so most of the mandated evidence was never produced.

This is a **test-harness defect**, not an EShop defect, and not a consequence of poor
performance. No replacement run was launched.

## Timeline

| Event | UTC |
|---|---|
| Runner preflight start | `2026-08-17T16:39:38.7486183Z` |
| Read-only database baseline captured | `2026-08-17T16:39:38.931Z` |
| Actual k6 scenario start (`SOAK_SCENARIO_START`) | `2026-08-17T16:39:40.897Z` (epoch `1786984780897`) |
| Last successful `runtime-state.json` write | `2026-08-17T16:40:29.024Z` (elapsed 48.1 s) |
| **Runner process died** | `2026-08-17T16:40:32Z` (elapsed ~51 s, `warmup_entry`) |
| k6 continued alone through all steady windows | 48 s -> 810 s |
| k6 exited normally | `2026-08-17T16:53:15Z` |
| Read-only database after-state captured manually | `2026-08-17T16:53:56.799Z` |

The runner survived only the warm-up ramp. It never reached `early_steady`.

## Root cause

The runner writes `runtime-state.json` every two seconds with no contention handling, while
two other reviewed helpers read the same file concurrently:

| Component | Line | Behaviour |
|---|---:|---|
| `work/run_official_soak.ps1` | 16 | `$ErrorActionPreference = 'Stop'` makes any non-terminating error fatal |
| `work/run_official_soak.ps1` | 362 | `... \| Set-Content -LiteralPath $runtimeStatePath -Encoding utf8` every 2 s, **no retry, no try/catch** |
| `work/soak_resource_monitor_pane.ps1` | 31 | `Get-Content -LiteralPath $runtimeStatePath -Raw` **every 1 second** |
| `work/capture_official_soak_frames.ps1` | 26 | `Get-Content -LiteralPath $runtimeStatePath -Raw` |

Verbatim failure from the runner console:

```text
Set-Content: The process cannot access the file
'...\20260817t225458219\runtime-state.json' because it is being used by another process.
```

Preserved as `runner-console-failure-transcript.log` in the evidence directory. The transcript
shows the error recurring three times before the terminating throw, and the on-screen console
confirms the last emitted sample was `ELAPSED=48.1271652`.

Both readers guard *themselves* (the pane has try/catch, the capture helper retries ten times),
but the **writer has no protection at all**. The handoff explicitly instructs starting the
resource pane and the capture helper before the runner, so writer/reader collision was a matter
of time rather than bad luck. The earlier blocked preflight never reached the sampling loop, so
this code path had never executed before.

This is the second latent defect in the same runner, both surfacing only on first real execution.

## What was lost

The runner's sampling loop owns everything after the k6 launch, so none of the following exist:

- `process-resource.csv` and `system-resource.csv` — **no backend or k6 resource evidence at all**
- `metadata.json` — no k6 exit code, threshold-exit state, or final run metadata
- `confirmed_traffic_end_utc` — never detected
- the 120-second post-load recovery observation and its `+60 s` resource-only screenshot
- `database-state-after.json` (runner-produced)
- `soak-window-summary.md` — the factual verifier never ran
- `completion-report.md` and `post-run-verification-notes.md`

`runtime-state.json` is frozen at elapsed 48.1 s and must not be read as end-of-run state.

`work/verify_soak_results.js` **cannot be run**: it requires `--process`, `--system`, and
`--metadata`, which do not exist. Manufacturing those inputs would be fabrication, so no
verifier output is presented. Per-window early/middle/late metrics are therefore unavailable.

## What is genuine and preserved

k6 was launched as an independent process and was completely unaffected by the runner's death.
It ran the full frozen schedule and exited normally.

**Direct k6 output (`summary.json`, k6's own export):**

| Metric | Value |
|---|---|
| `http_reqs` | 6,120 (7.5295/s) |
| `iterations` | 680 (0.8366/s) |
| Requests per workflow | **exactly 9.0** |
| `http_req_failed` | rate **0** — 0 failures of 6,120 |
| `checks` | rate **1** — 23,800 passed, 0 failed |
| `workflow_success` | rate **1** — 680 passed, 0 failed |
| `vus_max` | 12 |
| `soak_actual_vus` (gauge) | min 1, max **12** |
| `soak_completed_workflows` | 630 clean same-window |
| `soak_cross_window_iterations` | 50 (630 + 50 = 680, consistent) |
| Global `http_req_duration` | avg 5.550 ms, med 0 ms, p90 12.111 ms, p95 16.311 ms, max 210.980 ms |
| `iteration_duration` | p50 13,617 ms, p95 15,578 ms, p99 16,310 ms, max 16,738 ms |
| `data_received` / `data_sent` | 3,023,545 / 1,525,820 bytes |

`summary.json` exports only p90/p95, so a global p99 is not quoted; it would require deriving it
from the raw stream.

**Read-only persistent-state evidence:**

| | Before | After | Delta |
|---|---:|---:|---:|
| Captured (UTC) | `16:39:38.931Z` | `16:53:56.799Z` | |
| Database bytes | 311,296 | 311,296 | 0 |
| `users` | 2 | 682 | **+680** |
| `orders` | 0 | 680 | **+680** |

Exactly 680 new accounts and 680 orders for 680 iterations — a clean 1:1 confirming every
iteration registered a unique account and completed one Checkout. No lockout, no credential
retry, no identity collision. The database file was not mutated by either capture.

**Raw stream:** `raw-results.ndjson`, 31,980,398 bytes,
SHA-256 `51B643A59D9CA6B249A335CFC7717FA34B796CB44BF20B42BA0FF5458CF21892`.

**Screenshots:** three genuine same-run frames were captured at the correct anchors, but only
one of them contains any performance evidence.

| File | Anchor | Written (local) | Bytes | Evidentiary value |
|---|---:|---|---:|---|
| `01_early_steady_elapsed0090s.png` | 90 s | 23:41:11 | 451,662 | **Usable** |
| `02_middle_steady_elapsed0420s.png` | 420 s | 23:46:41 | 663,706 | **None — fully obstructed** |
| `03_late_steady_elapsed0720s.png` | 720 s | 23:51:41 | 715,202 | **None — fully obstructed** |

Submission classification for frames 02 and 03: **EXCLUDE FROM SUBMISSION — PRIVATE / NO
EVIDENTIARY VALUE**. The files remain preserved unchanged as historical capture output.

Frame 01 is the only usable frame. It shows the live runner console emitting
`SOAK_WINDOW=warmup_entry ... ELAPSED=48.12`, the resource pane with `RUN_ID`, window, target
and genuine actual VUs, backend `node PID=7668` and `K6 PID=31100` with working set and private
memory, Task Manager Details showing both PIDs, and the Windows clock at 23:41.

Frames 02 and 03 were captured while the desktop was being used for unrelated browsing. Both
show a full-screen Chrome window with Facebook and Messenger; the runner console, resource pane,
and Task Manager are entirely hidden. They contain **no** Run ID, window, elapsed time, VU
count, or process resource information.

> **Privacy warning.** Frames 02 and 03 contain third-party personal information: real names in
> a Messenger contact list, private message content, and another person's CV including partially
> redacted contact details. They must **not** be placed in the submission ZIP, attached to a bug
> report, or published. Deleting them is recommended; that is the student's decision, and they
> were deliberately not deleted here because they are genuine capture output.

Consistent with the Spike precedent for the obstructed `level_16` frame, these frames were
neither reconstructed, restaged, nor re-timed, and their obstruction is **not** grounds for a
rerun on its own.

The capture helper completed normally (`CAPTURE_COMPLETE count=3`) and wrote `capture-log.json`
and `screenshot-manifest.md`.

### The manifest's elapsed and VU columns are misleading

`screenshot-manifest.md` and `capture-log.json` report `actual_elapsed = 48.1`,
`target_vus = 10`, `actual_vus = 9`, and `traffic_active = True` for **all three** frames.
Those fields are read from `runtime-state.json`, which froze when the runner died, so they
describe 48.1 seconds in every row rather than 90 s, 420 s, and 720 s. The `target elapsed`
column and the file names are correct; the `actual elapsed` and VU columns must be disregarded
for frames 02 and 03, and are stale even for frame 01 relative to its 90 s anchor.

### Three genuine resource samples did survive

`capture-log.json` snapshots the backend and k6 processes live at capture time, independently of
the frozen runtime state. These are the **only** surviving process-resource measurements:

| Anchor | Backend working set | k6 working set |
|---:|---:|---:|
| 90 s | 56.918 MB | 42.855 MB |
| 420 s | 58.754 MB | 44.027 MB |
| 720 s | 59.066 MB | 45.098 MB |

Both processes were available at all three points. Factually, backend working set rose about
2.1 MB and k6 about 2.2 MB across the run, with the backend's increase concentrated between the
90 s and 420 s samples and nearly flat afterwards. Three points across 630 seconds are far too
sparse to characterise a trend, and no leak, defect, cause, or capacity conclusion is drawn.

A further caveat applies even to frame 01's siblings: frames 02 and 03 were captured after the
runner died, so any runner or resource pane visible in them would have been frozen at
`ELAPSED=48.1` regardless of the obstruction. The `+60 s` recovery frame was never captured
because `confirmed_traffic_end_utc` was never written.

## Classification

**A. Technical validity: INVALID.**
The k6 workload itself ran correctly and its results are internally consistent, but the
invocation lacks resource evidence, run metadata, recovery observation, and verifier output.
Per-window `early_steady` / `middle_steady` / `late_steady` attribution cannot be established
from the reviewed tooling. It also fails the handoff's own invalid-condition list under
"corrupted evidence".

**B. Submission evidence completeness: INCOMPLETE.**
Missing both resource CSVs, `metadata.json`, `soak-window-summary.md`, `completion-report.md`,
`post-run-verification-notes.md`, the recovery observation, and the recovery screenshot. Only
one of three active-run screenshots is usable, and the other two cannot be submitted at all
because of third-party personal content.

These two classifications are independent of performance quality. Correctness was perfect:
zero HTTP failures, 23,800/23,800 checks, 680/680 workflows.

## Preservation and safety

- No replacement or "cleaner" run was launched, and none may be launched automatically.
- k6 was allowed to finish naturally rather than being killed, so the raw stream is complete.
- No missing artifact was fabricated. No substitute resource sampler was improvised, because
  that would inject unreviewed, non-attributable evidence into an official directory.
- The runner was **not** edited during the invocation.
- `database-state-after-manual.json` is deliberately named to show it was captured by hand with
  the reviewed read-only helper after the runner died — it is not runner-produced evidence.
- Stress raw NDJSON (60,711,245 bytes) and Spike raw NDJSON (12,181,217 bytes) verified intact.
- `eshop-sut/backend/database.sqlite` is runtime-modified and remains unstaged and uncommitted.

## Human-reviewed closure

This invocation is closed as technically **INVALID** and submission **INCOMPLETE**. Run ID
`20260817t225458219` is consumed and retired permanently. Human review authorized an atomic
runtime-state publishing fix, a concurrent writer/reader regression, a new Run ID, and one
active screenshot near 420 seconds for the next invocation. No result from this directory and
no old screenshot may be reused as official evidence for the replacement invocation.
