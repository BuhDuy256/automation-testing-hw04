# Official Spike Screenshot Manifest

Run ID: `20260817t134816776`
Captures: 30 real PNG frames, 11.97 MB total, none zero-byte, all produced during this single official invocation by `capture_official_spike_frames.ps1`.

Capture method: `System.Drawing` `Graphics.CopyFromScreen` over the full 1920x1080 virtual screen. Every frame shows, in one desktop context: the runner console with `SPIKE_PHASE` / `TARGET_VUS` / `ACTUAL_VUS` / `RUN_ID` / `ELAPSED` markers (top left), the Spike resource pane with backend and k6 PID/CPU/working set (bottom left), the rolling capture console (bottom centre), Task Manager **Details** view with Name/PID/CPU/working-set columns (right), and the Windows taskbar clock (bottom right).

No frame was recreated, restaged, re-timed, or produced by a second run. Missed transitions were left missed.

## Timing Anchor Caveat (read before using any frame)

The capture helper anchored its schedule to `metadata-pre-run.json.started_at_utc` = `2026-08-17T14:19:57.531Z`. The k6 scenario actually started at `2026-08-17T14:20:09Z` (±1 s), derived from the native CSV phase-tag alignment. Every frame therefore lands **about 11.5 s earlier in the scenario than its filename claims**.

Two practical consequences:

- The nominal 58-70 s rise window recorded scenario 46.5-58.6 s, so the 4→32 transition at scenario 60 s was **not** captured as a dedicated frame.
- The nominal 104-116 s drop window recorded scenario 92.5-104.5 s, so the 32→4 drop at scenario 106 s was **not** captured as a dedicated frame; those 14 frames are all genuine full-peak frames instead.

Use the `true elapsed`, `actual phase`, and `actual VUs` columns below, not the filename. `actual VUs` is taken from native `spike-metrics.csv` `metric_name=vus` samples at the frame's capture second.

## Frame Table

| File | Filename elapsed (s) | True scenario elapsed (s) | Filename phase | Actual phase | Actual VUs | Label | Size (KB) |
|---|---|---|---|---|---|---|---|
| `00_pre_spike_steady_4_elapsed0045s.png` | 45 | 33.5 | `pre_spike_steady_4` | `pre_spike_steady_4` | 4 | aligned | 380 |
| `01_pre_spike_steady_4_elapsed0058s.png` | 58 | 46.5 | `pre_spike_steady_4` | `pre_spike_steady_4` | 4 | aligned | 385 |
| `02_pre_spike_steady_4_elapsed0059s.png` | 59 | 47.5 | `pre_spike_steady_4` | `pre_spike_steady_4` | 4 | aligned | 388 |
| `03_spike_transition_4_to_32_elapsed0060s.png` | 60 | 48.5 | `spike_transition_4_to_32` | `pre_spike_steady_4` | 4 | shifted | 389 |
| `04_spike_peak_32_elapsed0061s.png` | 61 | 49.5 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 393 |
| `05_spike_peak_32_elapsed0062s.png` | 62 | 50.6 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 396 |
| `06_spike_peak_32_elapsed0063s.png` | 63 | 51.5 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 398 |
| `07_spike_peak_32_elapsed0064s.png` | 64 | 52.5 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 401 |
| `08_spike_peak_32_elapsed0065s.png` | 65 | 53.6 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 401 |
| `09_spike_peak_32_elapsed0066s.png` | 66 | 54.5 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 405 |
| `10_spike_peak_32_elapsed0067s.png` | 67 | 55.6 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 407 |
| `11_spike_peak_32_elapsed0068s.png` | 68 | 56.6 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 406 |
| `12_spike_peak_32_elapsed0069s.png` | 69 | 57.6 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 407 |
| `13_spike_peak_32_elapsed0070s.png` | 70 | 58.6 | `spike_peak_32` | `pre_spike_steady_4` | 4 | shifted | 418 |
| `14_spike_peak_32_elapsed0085s.png` | 85 | 73.5 | `spike_peak_32` | `spike_peak_32` | 32 | aligned | 416 |
| `15_spike_peak_32_elapsed0104s.png` | 104 | 92.5 | `spike_peak_32` | `spike_peak_32` | 32 | aligned | 415 |
| `16_spike_peak_32_elapsed0105s.png` | 105 | 93.5 | `spike_peak_32` | `spike_peak_32` | 32 | aligned | 417 |
| `17_recovery_transition_32_to_4_elapsed0106s.png` | 106 | 94.5 | `recovery_transition_32_to_4` | `spike_peak_32` | 32 | shifted | 417 |
| `18_recovery_settling_4_elapsed0107s.png` | 107 | 95.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 416 |
| `19_recovery_settling_4_elapsed0108s.png` | 108 | 96.6 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 415 |
| `20_recovery_settling_4_elapsed0109s.png` | 109 | 97.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 416 |
| `21_recovery_settling_4_elapsed0110s.png` | 110 | 98.6 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 417 |
| `22_recovery_settling_4_elapsed0111s.png` | 111 | 99.6 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 417 |
| `23_recovery_settling_4_elapsed0112s.png` | 112 | 100.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 418 |
| `24_recovery_settling_4_elapsed0113s.png` | 113 | 101.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 419 |
| `25_recovery_settling_4_elapsed0114s.png` | 114 | 102.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 419 |
| `26_recovery_settling_4_elapsed0115s.png` | 115 | 103.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 420 |
| `27_recovery_settling_4_elapsed0116s.png` | 116 | 104.5 | `recovery_settling_4` | `spike_peak_32` | 32 | shifted | 420 |
| `28_recovery_settling_4_elapsed0122s.png` | 122 | 110.5 | `recovery_settling_4` | `recovery_settling_4` | 30 | aligned | 421 |
| `29_recovery_steady_4_elapsed0165s.png` | 165 | 153.6 | `recovery_steady_4` | `recovery_steady_4` | 4 | aligned | 421 |

Summary: 8 frames are phase-aligned with their filename, 22 are shifted by the anchor offset. 14 frames (`14`-`27`) are genuine `spike_peak_32` frames at 32 actual VUs. Coverage by actual phase: `pre_spike_steady_4` 14 frames, `spike_peak_32` 14 frames, `recovery_settling_4` 1 frame, `recovery_steady_4` 1 frame. There is no captured frame of `warmup_4`, `spike_transition_4_to_32`, `recovery_transition_32_to_4`, or `final_rampdown_4_to_0`.

## Selected Primary Screenshot

**`14_spike_peak_32_elapsed0085s.png`** — true scenario elapsed 73.5 s, actual phase `spike_peak_32`, 32 actual VUs.

Reasons for selection:

1. It is the **earliest genuine full-peak frame** captured, matching the handoff's default rule of choosing the clearest real early `spike_peak_32` frame.
2. Its filename phase label happens to be correct despite the anchor offset, so it needs no caveat to read.
3. Its visible runner-console scrollback contains the **complete real 4→32 rise** — the `SPIKE_PHASE=spike_transition_4_to_32 TARGET_VUS=32 ACTUAL_VUS=4` line followed by `spike_peak_32` lines where live `ACTUAL_VUS` climbs from 4 to 32 — so a single frame shows both the transition and the sustained peak, even though no dedicated transition frame exists.
4. It shows the highest backend CPU of any peak frame in the resource pane (`BACKEND node PID 11976 CPU 1.5% WS 57MB`, alongside `K6 PID 24360 CPU 0.4% WS 68MB`), with `node.exe` PID 11976 and `k6.exe` PID 24360 both visible in Task Manager Details and the clock reading 9:21 PM 8/17/2026.

### Supporting frames

- **`27_recovery_settling_4_elapsed0116s.png`** (true 104.5 s, 32 actual VUs, backend WS 64.4 MB) — corroborates that 32 real VUs persisted past the scheduled 106 s drop and shows the peak-end backend working set.
- **`29_recovery_steady_4_elapsed0165s.png`** (true 153.6 s, 4 actual VUs) — visual counterpart to the measured finding that actual VUs settled to exactly 4 in the 137-197 s recovery window.
- **`00_pre_spike_steady_4_elapsed0045s.png`** (true 33.5 s, 4 actual VUs) — pre-spike reference baseline.
