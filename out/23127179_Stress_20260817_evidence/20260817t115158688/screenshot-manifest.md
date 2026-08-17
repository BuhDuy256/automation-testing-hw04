# Official Stress Screenshot Manifest

- Run ID: `20260817t115158688`
- Evidence directory: `out/23127179_Stress_20260817_evidence/20260817t115158688/`
- Runner started (UTC): `2026-08-17T12:08:09.7497025Z` (local `19:08:09`)
- Runner ended (UTC): `2026-08-17T12:27:18.8101299Z`
- Backend `node.exe` PID: `11520` (restarted and reseeded immediately before the run)
- k6 PID: `7724`
- Capture method: `System.Drawing Graphics.CopyFromScreen` over the full 1920x1080 virtual screen,
  fired from `work/capture_official_stress_frames.ps1`
- Capture timing anchor: the runner's own `started_at_utc` from `metadata-pre-run.json`, so each
  frame's elapsed value matches the runner marker timeline (all frames landed within 60 ms of target)

Every frame below is a real, unmodified same-run desktop capture from this single invocation.
No frame was reconstructed, staged, recreated, or taken from any other run.

## On-screen panes

| Pane | Position | Content |
|---|---|---|
| Runner console | top-left | `OFFICIAL-STRESS-RUNNER RUN_ID=20260817t115158688` title, exact k6 command, live `STRESS_PHASE/STRESS_LEVEL/TARGET_VUS/RUN_ID/ELAPSED` marker, `K6 LIVE` progress |
| Resource monitor pane | bottom-left | `RUN_ID`, wall clock, backend `node` PID/CPU/working set, `k6` PID/CPU/working set (live `Get-Process` values) |
| Task Manager | right | Details tab, columns Name / PID / Status / User name / CPU / Working set, sorted by CPU |
| Windows taskbar clock | bottom-right | System date and time |

The resource monitor pane was started at approximately elapsed 110 s, so it is present from
`anchor_8` onward and absent from the two earliest frames. It displays live values only and
produces no measured artifact; the authoritative resource evidence is `process-resource.csv`
and `system-resource.csv`.

## Required plateau frames

| # | File | Stage | Target elapsed | Actual elapsed | Local time | Marker visible in frame | Backend PID / CPU / WS | k6 PID / CPU / WS | Status |
|---|---|---|---:|---:|---|---|---|---|---|
| 01 | `screenshots/01_baseline_4_elapsed0090s.png` | `baseline_4` | 90 s | 90.055 s | 19:09:39 | `STRESS_LEVEL=baseline_4 TARGET_VUS=4 ... ELAPSED=84` | 11520 / 0.259% / 50.06 MB | 7724 / 0.778% / 61.62 MB | VALID |
| 02 | `screenshots/02_anchor_8_elapsed0240s.png` | `anchor_8` | 240 s | 240.028 s | 19:12:09 | `STRESS_LEVEL=anchor_8 TARGET_VUS=8 ... ELAPSED=238` | 11520 / 0.259% / 54.61 MB | 7724 / 0.257% / 62.20 MB | VALID |
| 03 | `screenshots/03_level_12_elapsed0390s.png` | `level_12` | 390 s | 390.029 s | 19:14:39 | `STRESS_LEVEL=level_12 TARGET_VUS=12 ... ELAPSED=382` | 11520 / 0.261% / 56.48 MB | 7724 / 0% / 62.98 MB | VALID |
| 04 | `screenshots/04_level_16_elapsed0540s.png` | `level_16` | 540 s | 540.009 s | 19:17:09 | not visible - panes occluded | 11520 / 0.129% / 57.31 MB | 7724 / 0% / 61.66 MB | **INVALID - OCCLUDED** |
| 05 | `screenshots/05_level_20_elapsed0690s.png` | `level_20` | 690 s | 690.043 s | 19:19:39 | `STRESS_LEVEL=level_20 TARGET_VUS=20 ... ELAPSED=682` | 11520 / 1.032% / 55.82 MB | 7724 / 0.13% / 64.51 MB | VALID |
| 06 | `screenshots/06_maximum_24_elapsed0840s.png` | `maximum_24` | 840 s | 840.059 s | 19:22:09 | `STRESS_LEVEL=maximum_24 TARGET_VUS=24 ... ELAPSED=835` | 11520 / 0.651% / 58.24 MB | 7724 / 0.387% / 65.98 MB | VALID |
| 07 | `screenshots/07_recovery_4_elapsed1020s.png` | `recovery_4` | 1020 s | 1020.047 s | 19:25:09 | `STRESS_LEVEL=recovery_4 TARGET_VUS=4 ... ELAPSED=1,010` | 11520 / 0.129% / 57.28 MB | 7724 / 0% / 66.65 MB | VALID |

Supplementary, not a required plateau frame:

| # | File | Stage | Target elapsed | Actual elapsed | Local time | Purpose |
|---|---|---|---:|---:|---|---|
| 00 | `screenshots/00_context_run_start_elapsed0012s.png` | `transition_1_to_4` | 12 s | 12.048 s | 19:08:21 | Shows run start, full expanded k6 command, and `K6_RUN_ID` before load ramps |

Result: **6 of 7 required plateau frames are valid.** The `level_16` frame is not.

## Evidence constraint 1 - Windows integrity blocked Task Manager automation

Task Manager runs at a higher Windows integrity level than this automation session. `SetWindowPos`
against its window returned `LastError=5` (`ERROR_ACCESS_DENIED`) under UIPI, so the Details tab,
the column selection, and the window placement could not be automated. The student performed that
minimal setup manually before traffic started. This is an evidence-collection constraint of the
Windows desktop, not a defect of the system under test.

Because Task Manager sorts by instantaneous CPU and the backend never became CPU-bound, the
`node.exe` row was sometimes below the visible scroll fold. The separate resource monitor pane was
added for that reason so that backend PID, CPU, and working set are explicit in every frame from
`anchor_8` onward. In frame 01 the backend row is below the Task Manager fold and no monitor pane
existed yet; `k6.exe` PID 7724 is visible in that frame, and backend resource values for that exact
timestamp are preserved in `process-resource.csv`.

## Evidence constraint 2 - level_16 frame occluded

At elapsed 540 s the Claude Code terminal window was raised to the foreground by an unrelated
interactive command typed in that terminal. It covered the runner console, the resource monitor
pane, and Task Manager at the exact capture instant. Frame 04 is therefore a genuine same-run
capture that does not show the required evidence panes, and it is recorded here as INVALID rather
than deleted.

The `level_16` plateau spans elapsed 480-600 s and had already ended before the occlusion was
detected, so no valid `level_16` frame can exist for this invocation. The frame was **not**
reconstructed, restaged, or recreated, in accordance with the GUI handoff.

Remaining same-run visual evidence covering `level_16`:

- Frame 05 (`level_20`, VALID) shows the runner scrollback still containing the live `level_16`
  markers `ELAPSED=526` through `ELAPSED=600` at `TARGET_VUS=16`. This is same-run scrollback
  text inside a valid frame, not a substitute `level_16` frame.

Non-visual `level_16` evidence is complete and unaffected: the plateau appears in
`raw-results.ndjson` (29,829 tagged samples), in `stress-stage-summary.md`, and in both resource
CSV files.

After the occlusion was detected, the runner console and monitor pane were set `TOPMOST` at
elapsed 676 s, which is why frames 05, 06, and 07 are unoccluded.

## Primary screenshot candidate

The GUI handoff names `level_16` as the default primary candidate, allows an already captured frame
from the first meaningful degradation plateau to replace it, and directs that the clearest valid
`maximum_24` frame be used when no meaningful degradation is found.

This invocation produced no meaningful degradation at any plateau: HTTP failure rate was 0.00% at
every level, checks and workflow success were 100.00% at every level, derived throughput rose
linearly from 2.692 to 15.950 req/s, and HTTP p95 did not trend upward (24.61 ms at `baseline_4`
versus 17.80 ms at `maximum_24`).

**Primary candidate: `screenshots/06_maximum_24_elapsed0840s.png`** - the highest load plateau,
24/24 VUs, with runner marker `ELAPSED=835`, run ID, monitor pane, Task Manager showing both
`node.exe` 11520 and `k6.exe` 7724, and the taskbar clock at 7:22 PM 8/17/2026.
