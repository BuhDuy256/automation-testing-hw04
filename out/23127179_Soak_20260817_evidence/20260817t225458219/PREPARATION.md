# Official Soak Invocation Record

Status: **EXECUTED - TECHNICALLY INVALID**

This directory is no longer a preparation-only reservation. The first official Soak
performance invocation ran here on 2026-08-17 and is classified technically invalid.

- Reserved `K6_RUN_ID`: `20260817t225458219`
- Evidence directory: `out/23127179_Soak_20260817_evidence/20260817t225458219/`
- Official performance traffic sent: **Yes**
- Backend restarted/reseeded immediately before traffic: **Yes** (backend PID `7668`)
- k6 PID: `31100`; k6 exited normally at `2026-08-17T16:53:15Z`
- Actual k6 scenario start: `2026-08-17T16:39:40.897Z` (epoch `1786984780897`)
- Runner process died: `2026-08-17T16:40:32Z`, about 51 seconds into the run
- Invocation handoff: `work/official_soak_gui_handoff.md`
- Invalidity report: `work/official_soak_invalid_execution_20260817t225458219.md`

## Why this invocation is invalid

The reviewed runner writes `runtime-state.json` every two seconds with no contention
handling, while the reviewed resource pane reads the same file every second and the
screenshot helper reads it as well. A file-sharing violation therefore terminated the
runner during `warmup_entry`:

```text
Set-Content: The process cannot access the file '...runtime-state.json'
because it is being used by another process.
```

k6 was launched as an independent process and was unaffected. It completed the full frozen
schedule and exited normally, so the raw stream and k6 summary are genuine and complete.
Everything owned by the runner's sampling loop was lost: both resource CSV files,
`metadata.json`, confirmed traffic end, the 120-second recovery observation and its
screenshot, the runner-produced database after-state, the factual verifier output,
`soak-window-summary.md`, and `completion-report.md`.

This was a test-harness defect. It was **not** an EShop defect and **not** a consequence of
poor performance: correctness was perfect, with zero HTTP failures, 23,800/23,800 checks,
and 680/680 successful workflows.

## Important cautions for anyone reading this directory

- `runtime-state.json` is frozen at elapsed 48.1 seconds. It does **not** describe end-of-run
  state.
- Screenshots 02 and 03 are genuine same-run captures at the correct 420 s and 720 s anchors,
  but they were taken after the runner died, so the runner and resource panes visible inside
  them are frozen at `ELAPSED=48.1` and do not describe the moment of capture.
- `database-state-after-manual.json` was captured by hand with the reviewed read-only helper
  after the runner died. It is deliberately not named `database-state-after.json` because the
  runner did not produce it.
- No missing artifact was fabricated, no frame was reconstructed, and no replacement run was
  launched.

## Run ID status

`20260817t225458219` is now **consumed by real performance traffic** and must not be reused.
Any future Soak execution requires a new reserved Run ID and a human-reviewed fix to the
runner's `runtime-state.json` write path.
