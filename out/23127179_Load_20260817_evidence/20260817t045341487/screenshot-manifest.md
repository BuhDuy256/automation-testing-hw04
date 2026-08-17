# Visual Evidence Manifest — Official Load Run `20260817t045341487`

All images in `screenshots/` are real desktop captures of this machine
(`DESKTOP-KE0DR9U`). None were reconstructed, composed, or generated from logs.

## Correlation to this invocation

| Identifier | Value from `metadata.json` | Visible in the screenshots |
|---|---|---|
| Backend process | `backend_pid = 25868` | `node.exe` PID **25868** in Task Manager |
| k6 process | `k6_pid = 24148` | `k6.exe` PID **24148** in Task Manager |
| Run start (UTC) | `2026-08-17T05:25:34.770Z` | PowerShell banner + `PROGRESS` lines |
| Run end (UTC) | `2026-08-17T05:31:51.183Z` | system clock 12:25–12:31 (UTC+7) |
| K6_RUN_ID | `20260817t045341487` | PowerShell window title and banner |

The PID match is the strongest correlation: the processes shown in the resource
monitor are the exact backend and k6 processes recorded by this run's metadata.

## Screenshots

| File | Elapsed | Phase shown in PowerShell | Contents |
|---|---|---|---|
| `load-steady-primary.png` | 288 s | `PROGRESS elapsed=278s phase=steady_4vu`, `K6 LIVE 4/4 VUs 4m38.0s/6m00.0s` | **Primary evidence.** k6 execution in PowerShell + Task Manager *Details* view showing `node.exe` PID 25868 and `k6.exe` PID 24148 with PID, CPU and working-set columns, plus the system clock. |
| `load-steady-t150s.png` | 150 s | `PROGRESS elapsed=145s phase=steady_4vu` | Earlier steady-plateau capture. Shows `k6.exe` PID 24148; `node.exe` was below the visible scroll region at that moment. |
| `load-steady-secondary.png` | 235 s | `steady_4vu` | Supporting steady-plateau capture. |
| `load-ramp-up.png` | 42 s | `PROGRESS elapsed=32s phase=ramp_up` | SUT startup output (database reseed), the exact expanded k6 command, and early ramp-up progress. |
| `load-ramp-down.png` | 330 s | `PROGRESS elapsed=329s phase=ramp_down`, 3/4 VUs | Ramp-down phase. |
| `hardware-dxdiag.png` | pre-run | n/a | `dxdiag` System tab: `DESKTOP-KE0DR9U`, Windows 11 Home Single Language 64-bit (build 26200), Dell Inspiron 15 3530, 13th Gen Intel Core i7-1355U (12 CPUs) ~1.7 GHz, 16384 MB RAM. |

## How the primary frame was selected

Screenshots were taken automatically on a fixed schedule (42 s, 150 s, 235 s, 330 s)
plus a rolling capture every ~8 s across the four-VU plateau. Every one of those
frames is a real capture of this invocation.

`load-steady-primary.png` is the rolling frame at elapsed 288 s, chosen because it is
the frame in which both `node.exe` and `k6.exe` were simultaneously inside Task
Manager's visible scroll region. The originally scheduled 150 s frame is preserved
unaltered as `load-steady-t150s.png`; nothing was deleted to make the primary look
better. The complete 22-frame plateau series is preserved at
`work/load_second_run_plateau_captures/` together with the capture timing log.

## Known limitation in the capture environment

Task Manager and Resource Monitor run at a higher Windows integrity level than the
automating process, so `SetWindowPos` and synthetic clicks against them fail with
`ERROR_ACCESS_DENIED` (5). Task Manager's view (Details tab, sorted by CPU) was
therefore set by the student manually before traffic started; window placement of the
PowerShell run window and all screen captures were automated. This limitation affects
only how the monitor was configured, not the authenticity of any capture.

## Demo video

Not covered by this run. The assignment requires the student's own Vietnamese
narration with the testing tool and resource monitor in the same frame; no assistant
may generate or imitate that narration. These screenshots do not substitute for it.
