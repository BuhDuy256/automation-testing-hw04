# Official Spike Pre-Run Checklist

Status: **PREPARED — NOT EXECUTED**

## Preparation Verified

- [x] Branch is `hw05-performance`.
- [x] Reserved `K6_RUN_ID` is `20260817t134816776`, matches `^[a-z0-9]{8,20}$`, and has no known collision.
- [x] Evidence path is reserved without measured artifacts.
- [x] Spike script SHA-256 is `CC01F02F8F06064E14D7C1241CE2C4908808BD2B3CDA2E7A597C538DFFD08AE6`.
- [x] CSV SHA-256 is `1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1`.
- [x] Runner SHA-256 is `789A93B475A98BA415A15EA66DAC937BB345DAF3AB6A97B6DDFCF6D85A7BB9DD`.
- [x] Rolling-capture helper SHA-256 is `0076CA8DA90B5297DB38680539D6506AFA2D031F6F04755C14CBDA9B09778F43`.
- [x] Resource-pane helper SHA-256 is `6066C45AFEF2DC659C11DFD08BB9D54E3B2E8A5E16408F417259A38A34A87213`.
- [x] Visual instructions SHA-256 is `BC8E2ADC8B3BB80B0411D7FD62562C4407C156178D6CB8CF469E823874A0A287`.
- [x] Invocation-specific GUI handoff SHA-256 is `45B4E59D901BA48C19940B354BAF3A42D5E0353849F19F3E0F2F1DD0BDE7E9FA`.
- [x] Report registry is unique: Load HTML `USED`; Stress Markdown `USED`; Spike Native k6 CSV `ASSIGNED / USED-FOR-DESIGN`.
- [x] Installed k6 v2.1.0 supports simultaneous `--out json=...`, `--out csv=...`, and `--summary-export`.
- [x] Native CSV tag/timestamp/`vus` semantics were validated with the approved no-network fixture.
- [x] Rolling capture helper is anchored to the runner-created `metadata-pre-run.json.started_at_utc`.
- [x] Resource pane and timestamped process/system sampling are prepared.
- [x] Target VUs and actual active VUs are understood as separate evidence.
- [x] Recovery steady status requires timestamp-aligned native `vus` inspection.
- [x] Windows Task Manager/UAC contingency is documented.
- [x] Stress raw NDJSON SHA-256 remains `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`.
- [x] `eshop-sut/backend/database.sqlite` is excluded from the preparation commit.

## Must Be Completed Immediately Before Traffic

- [ ] Obtain explicit authorization to execute the official Spike.
- [ ] Run `bash ./run.sh stop`.
- [ ] Run `bash ./run.sh start` and confirm database reseed.
- [ ] Run `bash ./run.sh status`.
- [ ] Confirm `http://localhost:3000/api/categories` returns HTTP 200.
- [ ] Identify the new `node.exe` PID that owns the TCP port-3000 listener.
- [ ] Confirm the shared machine is stable and the generator will not be the dominant bottleneck.
- [ ] Arrange runner, resource pane, Task Manager, and wall-clock visibility.
- [ ] Resolve only the minimum manual Task Manager action if UAC blocks automation.
- [ ] Start the rolling capture helper and leave it waiting for real metadata.
- [ ] Confirm the resource pane uses the verified backend PID.
- [ ] Recalculate and match all frozen hashes above.
- [ ] Confirm the evidence directory still contains no measured/runtime artifact collision.
- [ ] Confirm native CSV, raw NDJSON, summary, logs, metadata, resource, and screenshot destinations are ready.
- [ ] Set `BackendRestartedBeforeRun=$true` only after the real restart/reseed.
- [ ] Set `GuiCaptureReady=$true` only after the GUI and rolling capture are actually ready.

## Exact Runner Command After All Gates Pass

```powershell
& .\work\run_official_spike.ps1 `
  -RunId '20260817t134816776' `
  -BackendRestartedBeforeRun $true `
  -GuiCaptureReady $true
```

Do not automatically rerun for poor performance, threshold failure, slow recovery, or interrupted iterations. Preserve unexpected authentication behavior without credential retries. Never fabricate or reconstruct measured evidence.
