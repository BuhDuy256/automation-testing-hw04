# Official Spike Execution Completion Record

- Run ID: `20260817t134816776`
- Started UTC: `2026-08-17T14:19:57.5310384Z`
- Ended UTC: `2026-08-17T14:23:58.3573547Z`
- Elapsed seconds: `240.826`
- k6 exit code: `0`
- Threshold exit: `False`
- Raw NDJSON exists: `True`
- Summary JSON exists: `True`
- Native k6 CSV metrics output exists: `True`
- Process-resource samples: `352`
- System-resource samples: `176`
- Screenshot verification: completed; 30 real same-run frames reviewed and catalogued in `screenshot-manifest.md`
- Result interpretation: not performed by this execution record

Bad performance and failed correctness thresholds remain evidence. This factual record does not automatically declare Spike failure, recovery success, or authorize a rerun.

## Post-Run Verification Completion

Added after review of this invocation's real outputs. Full detail is in `post-run-verification-notes.md`.

- Native k6 CSV metrics output: `spike-metrics.csv`, 6,977,717 bytes, 37,931 lines, 227 s span, verified present and non-empty.
- Completed workflows: `176`; interrupted iterations: `0`; cross-phase iterations: `76`.
- Total HTTP requests: `1584` = exactly 9.0 per completed workflow; Checkout requests: `176`.
- HTTP failures: `0` of `1584`; checks: `6160` passed / `0` failed; `workflow_success`: `176` of `176`.
- Global `http_req_duration`: p95 `14.26 ms`, p99 `18.70 ms`, max `578.87 ms`.
- `vus_max`: `32`; peak actual VUs observed in native `vus` samples: `32`.
- Actual VUs during the intended recovery window (scenario elapsed 137-197 s): exactly `4` in all 60 samples, so `recovery_steady_4` is a verified steady four-VU recovery baseline.
- Phase observations: `pre_spike_steady_4` recorded 108 requests (avg `5.59 ms`, p95 `13.14 ms`, max `18.38 ms`); `spike_peak_32` recorded 965 requests (avg `5.74 ms`, p95 `14.27 ms`, max `23.61 ms`); `recovery_settling_4` recorded 196 requests (avg `5.48 ms`, p95 `14.94 ms`, max `28.50 ms`); and `recovery_steady_4` recorded 166 requests (avg `4.73 ms`, p95 `12.14 ms`, max `16.12 ms`).
- The global `578.87 ms` maximum was the first Register observation in `warmup_4`, not a `spike_peak_32` sample.
- Raw NDJSON: `raw-results.ndjson`, 12,181,217 bytes, SHA-256 `D60B112DF3784CD448EDF12DE95ACE15E9159CDE30A308D0BFC7AFD21EF5AD8A`; preserved under `out/` but intentionally excluded from this completion commit to avoid Git bloat.
- Designated native CSV: `spike-metrics.csv`, SHA-256 `70B97EAD74F5D27AE4AECDD1445423B8899233B19D4AB257A261ECDDF6288F39`; retained as the distinct Spike report output.
- Screenshots: `30` real frames, none zero-byte; primary frame `screenshots/14_spike_peak_32_elapsed0085s.png`.
- Recorded evidence constraints: the runner's own `started_at_utc` precedes the k6 scenario start by about 11.5 s, which shifts the externally-labelled `spike_phase` columns and the rolling capture schedule but not the in-test k6 tags; and Task Manager could not be repositioned or re-columned because it runs elevated. Neither is a SUT defect.
- Technical validity: VALID. Submission-evidence completeness: COMPLETE for Spike Task 1. No rerun occurred and no lockout was observed.
