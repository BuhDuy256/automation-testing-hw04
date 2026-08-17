# Official Soak Invocation Reservation

Status: **PREPARED - NOT EXECUTED**

- Machine status token: `PREPARED-NOT-EXECUTED`
- Reserved `K6_RUN_ID`: `20260817t225458219`
- Evidence directory: `out/23127179_Soak_20260817_evidence/20260817t225458219/`
- Official performance traffic sent: **No**
- Backend restarted/reseeded during preparation: **No**
- Backend restarted/reseeded during the aborted preflight attempt: **Yes**
- Measured result artifacts created: **None**
- Invocation handoff: `work/official_soak_gui_handoff.md`
- Invocation handoff SHA-256: `07C6B7D9FB0D3728DF6F9BB14AFCE5A06B49D4711A7271C0933322FA7D8B55AD`
- Prepared runner SHA-256: `CF74B3F977E99A03861A0874606D5110BB201EFD66FBCDE63928242E61B1F2A3`

This marker reserves the collision-safe directory. It is not execution evidence and must not
be interpreted as a completed or attempted Soak run. The official runner may populate this
directory only after separate execution authorization and all pre-traffic gates pass.

The line above beginning `Machine status token` is the machine-critical value the runner
compares. It is ASCII-only on purpose: Windows PowerShell 5.1 parses a UTF-8-without-BOM
`.ps1` using the ANSI code page, so a Unicode em dash inside a runner string literal is
corrupted at parse time and can never match this file. Human-readable prose may use richer
punctuation; the machine token must not.

## Preflight attempt history

- On 2026-08-17 a prepared preflight attempt aborted **before any k6 performance traffic**.
- Cause: the reservation guard compared against a Unicode em dash (see
  `work/official_soak_blocker_20260817t225458219.md`).
- No `raw-results.ndjson`, `summary.json`, resource CSV, metadata, screenshot, or database
  state file was produced. Database counts remained at the seeded `users=2`, `orders=0`.
- The blocker was fixed, revalidated, and the invocation hashes were re-frozen.
- Because no performance traffic was ever sent, `20260817t225458219` remains unused and the
  next execution is the **first** official Soak performance invocation, not a rerun.
