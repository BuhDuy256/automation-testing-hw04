# Official Stress GUI Evidence Handoff

This handoff is preparation only. Do not capture or claim official Stress evidence
until the reviewed runner starts a real invocation with a fresh `K6_RUN_ID`.

## Before traffic

1. Restart the backend so SQLite is reseeded, then confirm port 3000 is healthy.
2. Open Task Manager **Details** and expose `Name`, `PID`, `CPU`, and working-set memory.
3. Place the runner PowerShell window and Task Manager in the same desktop frame.
4. Keep the system clock visible.
5. Do not reuse an evidence directory or run ID.

Windows integrity boundaries may require the student to configure Task Manager's view
manually. Record that limitation; do not simulate clicks or reconstruct screenshots.

## Deterministic capture schedule

The runner prints `STRESS_PHASE`, `STRESS_LEVEL`, `TARGET_VUS`, `RUN_ID`, and
`ELAPSED`. Capture at least one real frame during the middle or final third of each
measurement plateau:

| Stress level | Plateau interval | Suggested elapsed capture |
|---|---:|---:|
| `baseline_4` | 30-150 s | 90 s |
| `anchor_8` | 180-300 s | 240 s |
| `level_12` | 330-450 s | 390 s |
| `level_16` | 480-600 s | 540 s |
| `level_20` | 630-750 s | 690 s |
| `maximum_24` | 780-900 s | 840 s |
| `recovery_4` | 960-1080 s | 1020 s |

The 16-VU frame is the default primary candidate. After execution, an already captured
frame from the first clear degradation plateau may replace it. If no degradation is
observed, use a clear `maximum_24` frame. Never recreate a missed frame after the run.

## Required same-frame content

- active k6 execution/progress in PowerShell;
- current stage marker and fresh run ID;
- system timestamp;
- backend `node.exe` PID, CPU, and memory;
- preferably `k6.exe` PID, CPU, and memory; and
- enough Task Manager context to attribute the shown processes to the invocation.

Preserve every selected image under the invocation's `screenshots/` directory and
create a post-run manifest that maps file, elapsed time, stage, run ID, and visible
PIDs. A screenshot is submission evidence only when it came from that same invocation.
