# Official Stress Execution Completion Report

## Invocation and classification

- Test plan: `23127179_Stress_20260817`
- `K6_RUN_ID`: `20260817t115158688`
- Evidence directory:
  `out/23127179_Stress_20260817_evidence/20260817t115158688/`
- Execution commit: `9dd90f705b38c8fd05696259062f15fc66303fc8`
- Started UTC: `2026-08-17T12:08:09.7497025Z`
- Ended UTC: `2026-08-17T12:27:18.8101299Z`
- Elapsed: `1149.06 s`
- Backend PID: `11520`
- k6 PID: `7724`
- k6 exit code: `0`
- Threshold exit: `false`
- Technical validity: **VALID**
- Stress Task 1 submission completeness: **COMPLETE**

The backend was restarted and SQLite was reseeded before traffic. The backend stayed
available through completion, and no SUT restart or reseed occurred during traffic.
The implementation and CSV hashes matched the reviewed values.

## Workflow and correctness observations

| Observation | Verified result |
|---|---:|
| Completed workflows / iterations | 1,016 |
| HTTP requests | 9,144 |
| Requests per completed workflow | 9 exactly |
| Checkout requests | 1,016 |
| Interrupted iterations | 0 |
| `vus_max` | 24 |
| HTTP failures | 0 / 9,144 (0.00%) |
| Checks | 35,560 / 35,560 (100.00%) |
| `workflow_success` | 1,016 / 1,016 (100.00%) |

Raw request points independently confirm `9144 / 1016 = 9` and exactly one Checkout
request per completed workflow. All three correctness thresholds passed.

The positive workflow used one correct-password Login per unique registered account.
No lockout occurred, no Login retry was issued, and no lockout reset was needed.

## Global latency observations

| Metric | Result |
|---|---:|
| HTTP p50 | 3.90 ms |
| HTTP p90 | 16.69 ms |
| HTTP p95 | 19.43 ms |
| HTTP p99 | 41.36 ms |
| HTTP maximum | 485.55 ms |
| Iteration p95, including think-time | 15.70 s |

## Measurement plateau overview

These values are direct k6 stage aggregates, except request rates, which are the
documented deterministic derivation from direct stage request counters and observed
plateau seconds.

| Stage | VUs | Requests | Derived req/s | Completed workflows | HTTP p95 ms | HTTP p99 ms | Correctness |
|---|---:|---:|---:|---:|---:|---:|---|
| `baseline_4` | 4 | 323 | 2.692 | 35 | 24.61 | 46.25 | 100% |
| `anchor_8` | 8 | 633 | 5.275 | 70 | 22.47 | 48.03 | 100% |
| `level_12` | 12 | 958 | 7.983 | 106 | 19.08 | 23.84 | 100% |
| `level_16` | 16 | 1,261 | 10.508 | 139 | 33.50 | 49.83 | 100% |
| `level_20` | 20 | 1,588 | 13.233 | 178 | 18.64 | 23.87 | 100% |
| `maximum_24` | 24 | 1,914 | 15.950 | 212 | 17.80 | 21.85 | 100% |
| `recovery_4` | 4 | 327 | 2.725 | 38 | 17.07 | 18.83 | 100% |

Factual Stress finding: **no meaningful breaking point was observed within the
reviewed range up to 24 VUs**. Correctness remained intact, throughput continued to
increase, latency did not degrade monotonically, and recovery at 4 VUs was not worse
than the opening 4-VU plateau. This is not a production-capacity claim and does not
support a claim beyond the tested maximum of 24 VUs.

## Resource observations

`process-resource.csv` contains 1,116 rows: 558 backend and 558 k6 samples. All process
samples report availability, and coverage spans
`2026-08-17T12:08:10.3986100Z` through `2026-08-17T12:27:16.7731971Z` with the frozen
stage labels. `system-resource.csv` contains 558 aligned samples across every stage.

Across the measurement plateaus, backend average total-machine CPU rose from 0.116%
at `baseline_4` to 0.556% at `maximum_24`; its plateau working set stayed roughly
49.9-57.7 MB. k6 average total-machine CPU stayed at or below 0.277% at the plateaus,
with a roughly 61.4-66.7 MB working set. No process-unavailable sample, backend
saturation signal, or generator-saturation signal occurred.

Whole-machine CPU averaged 21.831% and peaked at 73.418%. Committed memory averaged
91.995% and peaked at 95.681%. Whole-machine activity includes unrelated processes and
must not be attributed solely to EShop or k6; the high committed-memory context is a
limitation to retain when interpreting results later.

## GUI evidence and primary screenshot

Eight real same-run PNG files exist: one run-start context frame and seven planned
plateau capture attempts. Six of the seven plateau frames are valid. The
`level_16` frame at approximately 540 seconds is genuine but invalid for visual use
because the Claude Code window occluded the runner, monitor, and Task Manager. It was
not recreated or replaced.

The `level_16` plateau remains fully covered by raw stage-tagged samples, direct
Markdown stage metrics, 58 backend/k6 process sample pairs, and 58 system samples. The
valid `level_20` frame also retains same-run runner scrollback containing the preceding
`level_16` markers.

Primary Stress screenshot:
`screenshots/06_maximum_24_elapsed0840s.png`. It is the clearest valid maximum-load
frame and shows `maximum_24`, 24/24 VUs, the run ID, timestamp, backend PID 11520, k6
PID 7724, CPU/memory context, runner output, resource monitor, and Task Manager in the
same frame. Since no meaningful degradation stage was observed, this selection follows
the reviewed screenshot rule.

The assignment requires one screenshot per run showing the tool with backend resource
usage. The valid maximum-24 frame satisfies that requirement. The missing valid
`level_16` frame affects the stronger internal multi-stage capture plan only, so it
does not make the Stress run submission-incomplete and does not justify a rerun.
The shared same-machine hardware screenshot remains at
`out/23127179_Load_20260817_evidence/20260817t045341487/screenshots/hardware-dxdiag.png`,
and this invocation also preserves `hardware_observation.json`.

## Evidence paths and integrity

- Raw evidence: `raw-results.ndjson`
  - bytes: `60,711,245`
  - SHA-256: `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA`
- Machine summary: `summary.json`
- Designated report: `stress-stage-summary.md`
- Console: `stdout.log`, `stderr.log` (`stderr.log` is valid and zero bytes)
- Resources: `process-resource.csv`, `system-resource.csv`
- Run identity: `metadata-pre-run.json`, `metadata.json`, `command.txt`, `hashes.sha256`
- GUI attribution: `capture-log.json`, `screenshot-manifest.md`, `screenshots/`
- Verification notes: `post-run-verification-notes.md`

The raw NDJSON is retained in the final submission artifact tree but intentionally
excluded from Git history because its approximately 60 MB size would materially bloat
the repository. Its exact byte size and SHA-256 are recorded above so the local
submission copy remains independently verifiable. All smaller attributable evidence
is suitable for the Stress milestone commit.

## No-rerun decision and limitations

No reviewed invalid-run condition occurred. The obstructed `level_16` screenshot, the
absence of a breaking point, and stable behavior at 24 VUs are not rerun reasons.
Another Stress invocation would require a genuine invalid-execution reason or a newly
reviewed experimental design.

Limitations retained for later analysis: 24 VUs is only a bounded synthetic maximum;
the SUT and generator shared one Windows machine; whole-machine samples include
unrelated activity; one planned plateau frame is visually invalid; and this report
does not perform HW05 Task 2 analysis or infer production capacity.
