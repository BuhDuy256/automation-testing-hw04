# Second Official Load Run — GUI Capture Handoff

## Purpose and status

This handoff coordinates a real second Load invocation solely to close the submission-evidence gap from the technically valid first run.

- Reserved K6_RUN_ID: `20260817t045341487`
- Evidence directory: `out/23127179_Load_20260817_evidence/20260817t045341487/`
- Current status: **PREPARED — NOT EXECUTED**

This is not permission to fabricate, reconstruct, or stage evidence after execution.

## Before starting traffic

1. Open PowerShell at the repository root.
2. Open Windows Task Manager and select a view that shows process name, PID, CPU, and memory.
3. Arrange PowerShell and Task Manager side by side in the same visible desktop frame.
4. Make sure the backend `node.exe` process will be visible after startup.
5. Preferably keep `k6.exe` visible in Task Manager too.
6. If contributing this run to the demo video, start a real screen recording before traffic and prepare to narrate in Vietnamese using the student's own voice.
7. Open `dxdiag` or an equivalent hardware view separately and ensure hostname/device identity plus hardware context are visible for the hardware screenshot.
8. Only after the windows and capture tools are ready, start the SUT:

   ```powershell
   bash ./run.sh start
   ```

9. Verify that the backend is listening on port 3000 and record that this startup reseeded the database.

## Exact prepared execution command

Run this exactly once:

```powershell
& .\work\run_official_load.ps1 -RunId '20260817t045341487' -BackendRestartedBeforeRun $true
```

The runner verifies the approved script and CSV hashes, prints the run ID and exact k6 command, streams real k6 progress lines into the visible PowerShell window, samples backend/k6/system resources, preserves raw NDJSON, and exports the native k6 HTML dashboard report.

## Required screenshot during the run

The primary screenshot must be taken during the four-VU steady plateau, after PowerShell reports:

```text
phase=steady_4vu
```

The same screenshot frame must show:

- the active official k6 Load execution in PowerShell;
- Task Manager or an equivalent resource monitor;
- backend `node.exe` resource usage;
- enough context to establish that the monitor and test belong to the active invocation;
- preferably the `k6.exe` process and the system clock.

Save the primary image as:

```text
out/23127179_Load_20260817_evidence/20260817t045341487/screenshots/load-steady-primary.png
```

Optional supporting images may be saved as:

```text
screenshots/load-ramp-up.png
screenshots/load-steady-secondary.png
screenshots/load-ramp-down.png
```

Do not use an image from calibration or the first invocation. Do not take the primary image after k6 has finished.

## Hardware evidence

Capture a real `dxdiag` or equivalent screen with hostname/device identity and hardware context visible. Save it as:

```text
out/23127179_Load_20260817_evidence/20260817t045341487/screenshots/hardware-dxdiag.png
```

The existing JSON hardware specification is supporting data; it does not replace the required visual hardware evidence.

## Demo video note

The assignment requires at least six minutes total, allows separate scenario clips, and requires the testing tool plus resource monitor in the same frame with the student's own Vietnamese narration. This second Load run may contribute the Load segment. An assistant must not generate or imitate the student's narration.

## After execution

1. Let the run finish even if a reviewed threshold fails; do not automatically rerun.
2. Confirm that the screenshot files really exist and show the active invocation.
3. Preserve `raw-results.ndjson`, `summary.json`, console files, resources, HTML report, metadata, and screenshots without rewriting them.
4. Identify this second invocation as the complete Load submission-evidence run only after all technical and visual checks pass.
5. Keep the first run for traceability.

If the desktop-capable assistant cannot operate or capture the GUI, it must stop and guide the student interactively instead of claiming evidence exists.
