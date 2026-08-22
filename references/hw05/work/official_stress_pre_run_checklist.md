# Official Stress Pre-Run Checklist

Reserved invocation: `20260817t115158688`

Evidence directory:
`out/23127179_Stress_20260817_evidence/20260817t115158688/`

## Package verification completed

- [x] Branch is `hw05-performance`.
- [x] Official script SHA-256 is
  `822F0D7A37A620E37CB8DCA9F8C99CCD1C20118335E8A8FC118C81D35E65C198`.
- [x] Stress report helper SHA-256 is
  `56542BED0A17AE8A87C31623D86248F52FAD833082F1FEFDD80ED9E0C2BFF865`.
- [x] CSV SHA-256 is
  `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1`.
- [x] The Stress report is distinct from the Load Web Dashboard report.
- [x] Spike's designated report remains `UNASSIGNED`.
- [x] `K6_RUN_ID=20260817t115158688` matches `^[a-z0-9]{8,20}$` and had no
  repository or evidence-path collision when reserved.
- [x] The reserved evidence directory contains preparation records only.
- [x] The exact backend restart/reseed and health-check procedure is documented.
- [x] The runner's stage markers match the frozen 1,140-second schedule.
- [x] Resource monitoring is configured for backend, k6, and whole-machine samples
  with UTC timestamps and `stress_level` labels.
- [x] The invocation-specific Markdown, raw NDJSON, and summary paths are configured
  by the runner.
- [x] `eshop-sut/backend/database.sqlite` is excluded from this preparation commit.

## Execution gate — complete immediately before starting the runner

- [ ] Stop and start the SUT with the repository-approved `run.sh` commands so the
  backend and SQLite data are clean/reseeded.
- [ ] Confirm `GET http://localhost:3000/api/categories` returns HTTP 200.
- [ ] Identify the new backend port-3000 `node.exe` PID.
- [ ] Open Task Manager Details and show PID, CPU, and memory columns.
- [ ] Place Task Manager, the visible runner PowerShell window, and system clock for
  same-frame capture.
- [ ] Confirm the reserved evidence directory still contains no execution artifacts.
- [ ] Run exactly:
  `& .\work\run_official_stress.ps1 -RunId '20260817t115158688' -BackendRestartedBeforeRun $true`

Do not check the execution-gate items without observing them in the execution session.
Do not start traffic if an approved hash differs or the run ID/evidence path collides.
