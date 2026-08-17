# Official Soak Screenshot Manifest

- Run ID: `20260818t000551547`
- Attribution anchor: actual k6 scenario-start marker
- The frame was a genuine same-run capture and was not reconstructed.

| File | Window | Target elapsed | Actual elapsed | Traffic active | Bytes | Status |
|---|---|---:|---:|---|---:|---|
| 01_middle_steady_elapsed0420s.png | middle_steady | 420 | 418.2 | True | 239294 | **EXCLUDED — PRIVATE / NO EVIDENTIARY VALUE** |

## Exclusion note

The single active screenshot fired at the correct anchor (418.2 s into `middle_steady`, within
the ~420 s target) and `capture-log.json` genuinely recorded real same-run backend/k6 PID and
memory data alongside it. However, the runner/resource pane were launched from a non-interactive
ConPTY tool shell with `MainWindowHandle = 0` — no top-level desktop window existed for either
process, so the resource pane and Task Manager were never actually visible on the desktop. The
captured frame shows only the foreground browser window (a private chat session) instead of the
required tool/resource evidence.

The image was deleted by the student on 2026-08-18 as private, unrelated content with no
performance evidentiary value. It is not reconstructed, restaged, or replaced. Per the HW05
requirement (`docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`, Section 6, Task 1),
the mandatory same-run tool+resource screenshot obligation is stated for the Load/Stress/Spike
scenario runs; the separate endurance/soak bullet does not carry the same screenshot mandate.
Soak screenshot evidence for this invocation is therefore **OPTIONAL / NOT REQUIRED FOR SOAK
COMPLETION**, and its absence does not invalidate the measured Soak evidence below.

This run's measured data (raw NDJSON, summary, resource CSV files, database before/after state,
window summary) is independent of this screenshot and remains complete.
