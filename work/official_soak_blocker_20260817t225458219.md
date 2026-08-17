# Official Soak Execution Blocker — Run ID `20260817t225458219`

Status: **RESOLVED — HARNESS FIXED AND REVALIDATED — RUN ID STILL UNUSED**

Original status when first recorded: **BLOCKED BEFORE TRAFFIC — RUN ID STILL UNUSED**

No k6 process was started, no performance traffic was sent, and no measured artifact was
created. The original failure history below is preserved verbatim; the resolution is
recorded in the final section.

## What was completed successfully

- All eight frozen SHA-256 values in `work/official_soak_gui_handoff.md` matched exactly.
- The handoff's own SHA-256 matched the value recorded in `PREPARATION.md`
  (`D3D51892FC622407C873E0E0A1862612C16304E1D6DDAC2226076DD4DFC8EAE6`).
- Branch `hw05-performance` confirmed; reviewed implementation commit
  `bf018d50cecd9bb92b6fc521374ac295f483d430` exists.
- Reserved directory contained only legitimate `PREPARED — NOT EXECUTED` content.
- Backend restart/reseed gate executed: `./run.sh stop`, `./run.sh start`, `./run.sh status`.
- `http://localhost:3000/api/categories` returned HTTP 200.
- Port-3000 listener identified as `node.exe`, PID `23972`, start time
  `2026-08-17T23:07:42` local, path `C:\dev_env\nodejs\node.exe`.
- Resource pane started and placed; screenshot helper started and waiting correctly.

## The blocker

`work/run_official_soak.ps1` line 103 aborts unconditionally in this environment:

```powershell
if ($preparationText -notmatch 'PREPARED — NOT EXECUTED' -or $preparationText -notmatch [regex]::Escape($RunId)) {
    throw "Reserved Soak directory marker is invalid for Run ID $RunId"
}
```

Observed runner output:

```text
Reserved Soak directory marker is invalid for Run ID 20260817t225458219
```

### Root cause (measured, not inferred)

`work/run_official_soak.ps1` is stored as UTF-8 **without a BOM**
(first three bytes `70 61 72` = `par` of `param`). The only available shell is
Windows PowerShell 5.1, which parses a BOM-less `.ps1` file as Windows-1252, not UTF-8.

Character-code evidence:

| Source | Decoded characters for `PREPARED <dash> NOT EXECUTED` |
|---|---|
| String literal inside the runner, as parsed by PowerShell 5.1 | `... 68, 32, 226, 8364, 8221, 32, 78 ...` (three-character mojibake) |
| `PREPARATION.md`, read by `[IO.File]::ReadAllText` | `... 68, 32, 8212, 32, 78 ...` (single U+2014 em dash) |

The marker file is correct. The comparison fails because the runner's own em dash is
corrupted at parse time, so the pattern can never match. The failure is deterministic and
independent of Run ID, backend state, or GUI readiness.

### Confirmation that this is environmental, not evidence corruption

- `PREPARATION.md` SHA-256 `C15E0C85BB9DF14FFCF4CADF1406A8A579786B58DE34C12FD973AF6E71D4B575`, unmodified.
- PowerShell 7 (`pwsh`), which parses BOM-less `.ps1` as UTF-8, is **not installed**.
- `run_official_load.ps1`, `run_official_stress.ps1`, and `run_official_spike.ps1` use a
  differently named marker (`PREPARED-NOT-EXECUTED.md`) and contain no equivalent
  non-ASCII textual guard, so no previous official invocation exercised this code path.
  This is a latent defect surfacing on first Soak execution.

## Why execution stopped here

Every remaining option changes something that is explicitly frozen or would falsify
prepared evidence, so none was taken:

| Option | Why it was not taken |
|---|---|
| Add a UTF-8 BOM to `work/run_official_soak.ps1` | Changes the frozen raw SHA-256 listed in the handoff; the handoff requires STOP on any hash difference. |
| Rewrite `PREPARATION.md` to contain the mojibake sequence | Writes corrupted text into prepared reservation evidence to satisfy a defective comparison. |
| Delete the reserved directory so the guard block is skipped | Destroys the committed preparation reservation marker. |
| Re-parse the source via `[scriptblock]::Create` with an injected `$PSScriptRoot` | Changes scope, error-handling, and exit-code semantics of a reviewed runner without human review. |
| Install PowerShell 7 and run the frozen runner unchanged | Requires a human decision about modifying the machine; leaves every frozen artifact byte-identical. |

The last option is the only one that leaves all reviewed artifacts unmodified, but it is a
human decision, not an automatic one.

## Preservation status

- Run ID `20260817t225458219` is unused and remains available.
- No `raw-results.ndjson`, `summary.json`, resource CSV, metadata, screenshot, or database
  state file was created.
- All eight frozen hashes re-verified intact after the abort.
- Stress raw NDJSON (60,711,245 bytes) and Spike raw NDJSON (12,181,217 bytes) re-verified
  intact.
- `eshop-sut/backend/database.sqlite` changed only because of the authorized restart/reseed;
  it was not staged or committed.

## Side effects of the aborted attempt

- The backend was restarted and the database reseeded (PID `23972`). Any future official
  invocation must repeat its own immediate pre-traffic restart gate regardless.
- Task Manager was opened in Details view; it could not be repositioned programmatically
  (`MoveWindow` returned `ERROR_ACCESS_DENIED`, code 5 — integrity-level/UIPI block). It is
  nevertheless visible and usable on the right half of the screen. This is a GUI automation
  limitation, not a SUT defect.

No rerun was attempted. Human review is required before the official Soak invocation can proceed.

---

# Resolution — Pre-Run Harness Fix Milestone

Status: **FIXED AND REVALIDATED — STILL NOT EXECUTED**

Everything above is preserved as the original failure history and was not edited.

## Root cause confirmed from repository evidence

Confirmed by re-reading `work/run_official_soak.ps1`, the reserved `PREPARATION.md`, and by
byte-level measurement, not by conversational recall:

- `work/run_official_soak.ps1` was UTF-8 **without BOM**.
- Windows PowerShell 5.1 parses a BOM-less `.ps1` using the ANSI code page.
- The single U+2014 em dash in the reservation guard literal was therefore parsed as the
  three characters U+00E2, U+20AC, U+201D.
- `PREPARATION.md` decoded correctly to a single U+2014.
- The comparison could never match, so the guard threw before the port-3000 check, before
  the health request, before the read-only database capture, and before k6 launched.

A narrow audit of the Soak PowerShell helpers found exactly two non-ASCII characters:

| File | Line | Character | Role | Machine-critical |
|---|---:|---|---|---|
| `work/run_official_soak.ps1` | 103 | U+2014 | reservation marker comparison | **Yes — the blocker** |
| `work/soak_resource_monitor_pane.ps1` | 35 | U+2014 | on-screen pane header text | No — display only |

`work/capture_official_soak_frames.ps1` contained no non-ASCII characters. No other
Unicode-sensitive comparison, parse, filename, or protocol token was found.

## Exact fix

1. `work/run_official_soak.ps1` — the machine guard now compares an ASCII-only token:

```powershell
$preparationToken = 'PREPARED-NOT-EXECUTED'
if ($preparationText -notmatch [regex]::Escape($preparationToken) -or $preparationText -notmatch [regex]::Escape($RunId)) {
    throw "Reserved Soak directory marker is invalid for Run ID $RunId"
}
```

   `PREPARED-NOT-EXECUTED` was chosen because it is ASCII-only, whitespace-free, and matches
   the existing repository convention already used by the Load and Stress runners, whose
   reservation marker file is named `PREPARED-NOT-EXECUTED.md`.

2. `out/.../20260817t225458219/PREPARATION.md` — now carries an explicit
   `Machine status token: PREPARED-NOT-EXECUTED` line. Human-readable prose is kept separate
   from the machine guard, and the file still means prepared and not executed.

3. `work/soak_resource_monitor_pane.ps1` — the pane header em dash became an ASCII hyphen.
   This is display-only, but the corrupted glyph was rendering into every official Soak
   screenshot, so it was corrected as an evidence-legibility fix rather than a guard fix.

4. `work/run_official_soak.ps1` — the internal `$approvedHashes` pin for
   `soak_resource_monitor_pane.ps1` was updated to the new canonical hash so the runner's own
   frozen-artifact gate stays enforced rather than bypassed.

All three Soak PowerShell helpers are now byte-wise pure ASCII, so source encoding can no
longer change their parsed meaning under any Windows PowerShell host.

## Why the fix is safe

- The safety gate is not weakened. It still requires both a prepared-not-executed declaration
  and the exact reserved Run ID, and it still rejects an incorrect marker.
- The reviewed Soak workload is untouched. `out/23127179_Soak_20260817.js`,
  `out/user_workflow_data.csv`, `work/verify_soak_results.js`,
  `work/capture_soak_database_state.js`, and `work/capture_official_soak_frames.ps1` are all
  byte-identical to their reviewed versions.
- No rejected workaround was used: no mojibake was written into the marker, the guard was not
  disabled, the evidence directory was not deleted, hash checks were not bypassed, PowerShell 7
  was not installed, and the runner was not loaded through a different execution mechanism.

## Validation result

`work/validate_soak_preflight_marker.ps1` executes the guard from the runner's own source
bytes inside a fresh Windows PowerShell 5.1 process. All 14 checks passed:

| Check | Result |
|---|---|
| All three Soak PowerShell helpers contain zero non-ASCII bytes | PASS |
| Guard block extracted from the real runner source | PASS |
| Extracted guard source is ASCII-only | PASS |
| Real marker carries the ASCII token and the Run ID | PASS |
| Guard accepts the real prepared directory under PowerShell 5.1 | PASS |
| Guard still rejects a marker missing the token | PASS |
| Guard still rejects a marker for a different Run ID | PASS |
| A Unicode-dependent guard still fails, proving the test detects the original defect | PASS |
| Generated harnesses contain no HTTP or k6 reference | PASS |
| No k6 process started | PASS |
| Validation never invokes the official runner end to end | PASS |

The runner's own `$approvedHashes` gate was independently replayed against the seven pinned
artifacts and passes.

## Confirmation of state

- **No performance traffic occurred.** No `raw-results.ndjson`, `summary.json`, `stdout.log`,
  `stderr.log`, `process-resource.csv`, `system-resource.csv`, `metadata.json`,
  `metadata-pre-run.json`, `runtime-state.json`, `command.txt`, `hashes.sha256`,
  `database-state-*.json`, `soak-window-summary.md`, `completion-report.md`, or
  `screenshots/` exists. No k6 process ran.
- **Independent database proof:** a read-only capture reported `users=2` and `orders=0`, which
  are the seeded values. The workflow creates one account per iteration and one order per
  Checkout, so zero workflow traffic reached EShop.
- **Run ID `20260817t225458219` remains unused for performance traffic** and is still reserved.
  The reserved directory holds only `PREPARATION.md`, and no other directory anywhere under
  `out/` carries this ID.
- **The next execution is the first official Soak performance invocation, not a rerun.**
- **This is not an EShop defect.** The failure was entirely inside the test harness. No SUT
  behavior was measured, observed, or diagnosed.
- **This is not a performance rerun** and no replacement Run ID was allocated.

## Preserved evidence

- Stress raw NDJSON: 60,711,245 bytes, SHA-256 `ADDF2F5E0032F7977E48A78273BC16CD431C8C1175DA006AD4AA57A6128576BA` — verified intact.
- Spike raw NDJSON: 12,181,217 bytes, SHA-256 `D60B112DF3784CD448EDF12DE95ACE15E9159CDE30A308D0BFC7AFD21EF5AD8A` — verified intact.
- Completed Load, Stress, and Spike evidence was not touched.
- `eshop-sut/backend/database.sqlite` is runtime-modified by the authorized restart/reseed and
  is deliberately left unstaged and uncommitted.

Official Soak performance traffic still requires separate execution authorization.
