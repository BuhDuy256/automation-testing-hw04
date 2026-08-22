# Official Soak Post-Run Verification Notes

Status: **HUMAN FACTUAL REVIEW RECORDED (post-execution consolidation)**

## Classification

- Technical validity: **VALID**. k6 exit code `0`, threshold exit `False`, actual scenario-start
  marker captured (`2026-08-17T17:26:06.157Z`), 120-second recovery completed, runner and k6
  stayed alive for the entire invocation.
- Measured-data completeness: **COMPLETE**. Raw NDJSON, summary, resource CSV files (944 process
  rows / 472 system rows), metadata, database before/after state, and the factual window summary
  are all present and were independently re-derived from the raw files during this review (see
  `completion-report.md`).
- Screenshot evidence: **EXCLUDED — private/unrelated content, no evidentiary value.** The single
  active frame was captured at the correct anchor but shows a private browser window, not the
  tool/resource panes, because the runner/resource pane ran under a non-interactive ConPTY shell
  with no desktop window (`MainWindowHandle = 0`). Per the HW05 requirement, the mandatory
  same-run screenshot obligation is stated for Load/Stress/Spike; Soak's separate endurance
  bullet does not carry the same mandate, so this exclusion does not affect Soak completion.

## Mid-run GUI/read-side observations

- **Resource-pane transient read-side sharing violation (~elapsed 488.5 s).** The pane's
  `Get-Content` call on `runtime-state.json` hit a non-terminating `IOException`/sharing
  violation for a single display tick. This is a reader without retry logic, not the runner's
  writer. It self-recovered on the next 1-second poll; the pane process (verified alive
  throughout, CPU time monotonically increasing) never exited or hung.
- **Runner remained alive throughout.** The official runner process (PID `5256`) and k6 (PID
  `10312`) both ran uninterrupted from scenario start through confirmed traffic end and the full
  120-second recovery; `runtime-state.json` kept advancing on its 2-second cadence across the
  observed sharing-violation tick, confirmed by direct before/after reads during the run.
- **Atomic writer fix held for the full invocation.** `Publish-SoakRuntimeState`
  (`work/soak_runtime_state_io.ps1`, temp-file write + `System.IO.File.Replace`/`Move` +
  bounded retry) produced no writer failures and no partial/invalid published documents for the
  entire ~944-second runner lifetime, consistent with the pre-traffic 15-second regression
  (`published=227, writer_failures=0, reader_invalid_documents=0`).
- **ConPTY caused no visible desktop HWND for pane or runner.** Both processes had
  `MainWindowHandle = 0`; no top-level window existed to bring to the foreground. This is a test
  harness / GUI automation limitation of how the processes were launched from a tool shell, not
  a defect in the pane script, the runner, or the SUT.
- **This GUI limitation did not affect timestamped measured data.** All k6 metrics, resource
  samples, and runtime-state timestamps are independent of screen visibility; they come from the
  k6 process and `Get-Process`/`Get-Counter` sampling, not from anything rendered on screen.
- **No live runner modification occurred.** All mid-run checks performed during the invocation
  were read-only (`Get-Process`, reading `runtime-state.json`, `FindWindow`/`IsWindowVisible`
  inspection). No file the runner writes to was edited, and no process was restarted, while
  traffic was active.
- **No rerun occurred for `20260818t000551547`.** This is the only official Soak invocation for
  this Run ID; it ran exactly once from preflight through 120-second recovery.
