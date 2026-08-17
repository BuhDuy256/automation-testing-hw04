# Soak Evidence Submission Exclusion List

This index lists what must **not** be treated as, or copied into, the official Soak submission
evidence. It does not authorize deleting anything not already listed here.

## 1. Historical invalid Soak invocation

`out/23127179_Soak_20260817_evidence/20260817t225458219/`

- Status: **historical / debug / audit history only.** Not an official successful Soak result.
- Reason: the reviewed runner died at ~51 s during real traffic due to a `runtime-state.json`
  sharing/contention defect (root-caused and fixed; see `work/soak_test_implementation_validation.md`
  and the regression at `work/validate_soak_runtime_state_contention.ps1`).
- Do not present this run's raw results, thresholds, or metrics as the official Soak outcome.
- Do not mix its data into official Run ID `20260818t000551547`'s evidence.
- The raw NDJSON, summary, logs, and resource evidence in this directory are preserved as
  harness-failure history and must not be deleted without separate, explicit student
  authorization.

## 2. Private/excluded screenshots

- `out/23127179_Soak_20260817_evidence/20260817t225458219/screenshots/02_middle_steady_elapsed0420s.png`
  and `.../03_late_steady_elapsed0720s.png` — private third-party content, no evidentiary value.
  Deleted by the student on 2026-08-18. See that directory's own `SUBMISSION-EXCLUSIONS.md`.
- `out/23127179_Soak_20260817_evidence/20260817t225458219/screenshots/01_early_steady_elapsed0090s.png`
  — remains as historical evidence of the invalid invocation only; must not be reused as official
  evidence for any later Run ID.
- `out/23127179_Soak_20260817_evidence/20260818t000551547/screenshots/01_middle_steady_elapsed0420s.png`
  — private browser-window content, no evidentiary value. Deleted by the student on 2026-08-18.
  See `20260818t000551547/screenshot-manifest.md` for the full exclusion note. Not required for
  Soak completion (HW05 Section 6, Task 1 mandates the same-run tool+resource screenshot for the
  Load/Stress/Spike runs; the separate endurance/soak bullet carries no such mandate).

## 3. Runtime database file

`eshop-sut/backend/database.sqlite` — a runtime file mutated by every test run (backend re-seed
and live traffic). Do not stage or submit it as evidence unless the assignment explicitly
requires it; it currently does not.

## 4. What is NOT excluded (do not accidentally drop this)

The following remain valid, complete official Soak submission evidence for Run ID
`20260818t000551547` and must be included:

- `raw-results.ndjson` (32,397,207 bytes, SHA-256
  `ADE9394117219D4BB1B4983915C612DE10D92A37FC8E5740EC0184B4059D93F0`)
- `summary.json`, `stdout.log`, `stderr.log`
- `process-resource.csv` (944 rows), `system-resource.csv` (472 rows)
- `metadata-pre-run.json`, `metadata.json`, `runtime-state.json`, `command.txt`, `hashes.sha256`
- `database-state-before.json`, `database-state-after.json`
- `soak-window-summary.md`, `completion-report.md`, `post-run-verification-notes.md`
- `capture-log.json`, `screenshot-manifest.md` (documents the screenshot exclusion truthfully)

## 5. Large raw-file Git policy

Consistent with Load/Stress/Spike, large raw NDJSON files are preserved on disk as submission
evidence but are not automatically committed to Git if they would materially bloat the
repository. Record exact size/hash instead (already done above). This applies to:

- Stress raw NDJSON
- Spike raw NDJSON
- Invalid Soak raw NDJSON (`20260817t225458219`)
- Valid Soak raw NDJSON (`20260818t000551547`)

None of these four files are deleted or altered by this exclusion policy.
