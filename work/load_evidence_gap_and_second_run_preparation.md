# Load Evidence Gap and Second-Run Preparation

## Assignment evidence requirements

The authoritative requirement is `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`.

- Line 93 requires executing all three scenarios and capturing, **for each run**, a screenshot of the performance tool together with backend resource usage in Task Manager, htop, Activity Monitor, or equivalent. It separately requires a hardware screenshot/specification and raw logs plus HTML report folders.
- Line 95 requires an unlisted demo video of at least six minutes total, which may be split by scenario, with the testing tool and resource monitor in the same frame and the student's own Vietnamese narration.
- Line 90 requires three distinct k6-equivalent report outputs across Load, Stress, and Spike.
- Lines 171-172 list the three raw logs, three HTML report folders, and resource/hardware screenshots as submission contents.

These are mandatory real-execution artifacts. Logs must not be converted into a synthetic screenshot, and an image taken after a run must not be attributed to that run.

## First official Load invocation

Run ID: `20260817t042311622`

- **Technical Load execution: VALID.** It completed 91 workflows and 819 requests with zero interrupted iterations, zero HTTP failures, 100% checks, 100% `workflow_success`, and all reviewed thresholds passing.
- **Submission evidence for Load: INCOMPLETE.** The mandatory same-run GUI screenshot was not captured.

The complete first-run directory remains unchanged at `out/23127179_Load_20260817_evidence/20260817t042311622/`. It must not be deleted, overwritten, or relabelled as a technically invalid run.

## Prepared second invocation

| Field | Prepared value |
|---|---|
| Status | `EXECUTED — evidence gap closed` (see `second-run-completion-report.md`) |
| Reserved K6_RUN_ID | `20260817t045341487` |
| Evidence directory | `out/23127179_Load_20260817_evidence/20260817t045341487/` |
| Approved script SHA-256 | `9B8E3B9DAC02B010AFC76D1C349450A707FEF391BB1E2874422FE951094C6704` |
| Approved CSV SHA-256 | `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1` |

The runner refuses to start if either approved hash changes or if the prepared directory already contains runtime markers. It also requires an explicitly documented backend restart/reseed before the run.

The workload, workflow, think-time, checks, runtime correlations, and thresholds are unchanged.

## Official k6 HTML report approach

An official native mechanism was found: the built-in k6 Web Dashboard can export a self-contained HTML report with `K6_WEB_DASHBOARD_EXPORT`.

Official documentation:

- <https://grafana.com/docs/k6/latest/results-output/web-dashboard/>
- <https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/>

The installed k6 v2.1.0 binary was validated locally with a four-second, zero-HTTP script. It exited `0` and generated a 165,252-byte HTML file. No third-party dependency was installed.

The second-run runner now sets:

```powershell
$env:K6_WEB_DASHBOARD = 'true'
$env:K6_WEB_DASHBOARD_OPEN = 'false'
$env:K6_WEB_DASHBOARD_PERIOD = '1s'
$env:K6_WEB_DASHBOARD_EXPORT = '<second-run-directory>\html-report\index.html'
```

This is a reporting-output change only. The approved Load script and all request behavior remain byte-identical. Raw NDJSON remains enabled independently and continues to come directly from k6.

The built-in Web Dashboard HTML is reserved as the Load scenario's human-readable report type. Stress and Spike must later use distinct k6-equivalent report outputs, but their strategies are intentionally not designed in this step.

## Prepared command

Current preparation state: the SUT is stopped. After the student has opened and arranged the GUI evidence tools, start the SUT once; this explicitly reseeds the database.

```powershell
bash ./run.sh start
& .\work\run_official_load.ps1 -RunId '20260817t045341487' -BackendRestartedBeforeRun $true
```

The runner preserves the exact expanded k6 command in the new invocation's `command.txt`. It generates raw NDJSON, summary JSON, console output, resource samples, metadata, and `html-report/index.html` in the reserved directory.

Do not run this command until the student is ready to capture the real desktop evidence.

## Outcome

The second invocation was executed on 2026-08-17 and completed successfully:
94 workflows, 846 requests, 0 HTTP failures, 3290/3290 checks passed, 100%
`workflow_success`, k6 exit code 0, all five reviewed thresholds passed.

The mandatory same-run GUI screenshot was captured during the four-VU plateau and
shows the backend `node.exe` (PID 25868) and `k6.exe` (PID 24148) recorded in this
run's `metadata.json`. The required hardware screenshot was also captured.

**Load submission evidence is now COMPLETE except for the demo video**, which
requires the student's own Vietnamese narration and cannot be produced by an
assistant. The first run `20260817t042311622` is retained unchanged for traceability.

Stress has not started.
