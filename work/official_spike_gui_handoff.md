# Official Spike GUI Handoff

Use only after the implementation commit is frozen and a separate official-execution decision is given.

## Preconditions

- Use a new `K6_RUN_ID` matching `^[a-z0-9]{8,20}$`.
- Restart the backend immediately before traffic so SQLite is reseeded.
- Confirm the backend PID on port 3000 and keep `database.sqlite` out of Git.
- Confirm the runner's pinned script and CSV hashes.
- Confirm the report registry says Spike Native k6 CSV metrics output is `ASSIGNED / USED-FOR-DESIGN`.
- Prepare Task Manager manually if Windows UAC blocks window automation.
- Arrange the runner, resource pane, and Task Manager before traffic.

## Windows to show

The same frame should show:

- runner output with `SPIKE_PHASE`, `TARGET_VUS`, `ACTUAL_VUS`, `RUN_ID`, and `ELAPSED`;
- the Spike resource pane with backend and k6 PID/CPU/working set;
- Task Manager Details view where practical; and
- the Windows clock.

`TARGET_VUS` comes from the frozen schedule. `ACTUAL_VUS` is parsed only from live k6 progress when available; `unavailable` must remain visible otherwise. The official Native k6 CSV `vus` rows are the authoritative actual-active-VU evidence.

## Capture preparation

Start `capture_official_spike_frames.ps1` before the runner or immediately after the run directory is reserved. It waits for `metadata-pre-run.json` and anchors every frame to the runner's UTC start time.

The capture helper schedules:

- reference at 45 s;
- one-second rolling frames from 58-70 s;
- peak at 85 s;
- one-second rolling frames from 104-116 s;
- recovery settling at 122 s; and
- recovery steady candidate at 165 s.

The clearest valid early `spike_peak_32` frame is the default primary candidate. Select only a real frame from the invocation; never recreate a missed transition after the run.

## Integrity boundary

Do not claim `recovery_steady_4` is a steady 4-VU window from elapsed time alone. Confirm it later from timestamp-aligned Native k6 CSV `vus` samples. If actual VUs remain materially above four, preserve and classify that fact.
