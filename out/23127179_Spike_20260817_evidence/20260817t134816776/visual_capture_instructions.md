# Official Spike Visual Capture Instructions

These instructions prepare attributable evidence; they do not authorize traffic.

1. Place the runner console, `spike_resource_monitor_pane.ps1`, and Task Manager in one unobstructed desktop layout.
2. Show Name, PID, CPU, and working set in Task Manager; perform this manually if Windows UIPI returns access denied.
3. Start the rolling capture helper with the reserved run ID, run directory, and verified backend PID.
4. Keep the runner phase marker visible throughout the 227-second nominal schedule.
5. Do not interact with foreground windows during the 58-70 s or 104-116 s rolling windows.
6. After execution, verify each image and record valid/invalid status in a screenshot manifest.
7. Preserve obstructed or mistimed genuine frames as evidence notes; never reconstruct or fabricate a frame.

Required visual coverage is `pre_spike_steady_4`, rise/early `spike_peak_32`, later peak, target drop/early recovery, `recovery_settling_4`, and a candidate `recovery_steady_4` frame.
