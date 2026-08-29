# Generator Skill Video Demo

This harness prepares a disposable workspace for demonstrating the reusable
`hw06-api-test-generator` Skill against one API operation.

It never writes generated candidates to `out/`, `work/registry/`, or the official test suites.

## Prepare a demo run

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File work/generator-skill-demo/prepare-demo.ps1
```

The script prints the path of a generated `RUN_PROMPT.md` under:

```text
work/trash/generator-skill-demo/<run-id>/
```

Open a fresh Codex or Claude session at the repository root, paste the complete generated prompt,
and record the session. The prompt explicitly invokes the Skill and confines all generated files to
that disposable run directory.

## Expected demonstration result

The AI session should create only these result files inside the run's `output/` folder:

- `candidate-test-cases.json`
- `coverage-ledger.md`
- `demo-summary.md`

The result is a demonstration artifact, not reviewed submission data. Do not copy it into `out/` or
the canonical registries.

## Reset

Delete the individual run directory under `work/trash/generator-skill-demo/`. The directory is
ignored by Git.
