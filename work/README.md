# HW06 Working Files

Use this directory for non-final HW06 material. Keep each item attributable to a requirement,
an AI interaction, a human review, or a real execution.

- `registry/` — canonical structured records used to derive counts, traceability, reports, and validation results.
- `selection/` — Pool A/B/C API selection and API-spec analysis after the student decides the APIs.
- `api-1/`, `api-2/`, `api-3/` — generated candidates, human audits, additions, and execution preparation for the selected APIs.
- `ci/` — CI/CD design notes and links/screenshots captured from real runs.
- `generator/` — the API test-generator design rationale and pseudocode drafts; the final diagram must be self-drawn by the student.
- `reporting/` — report drafts, AI-critique drafts, and final-curation checklists.
- `generated/` — deterministic outputs from `npm run hw06:derive`; never edit these as source data.
- `runs/` — raw Newman output captured by the execution wrapper.
- `ai-audit/interactions/` — immutable prompt/output pairs captured incrementally.

Do not record invented requests, responses, bugs, screenshots, CI runs, or AI interactions.
Only move reviewed, submission-ready artefacts into `out/`.

Common commands:

```text
npm run hw06:validate
npm run hw06:derive
node scripts/hw06/ai-audit.mjs capture --tool Codex --task "..." --prompt-file ... --output-file ...
node scripts/hw06/run-newman.mjs --collection ... --label ... --hostname localhost:3000
powershell -File scripts/hw06/build-submission.ps1 -Grade 090
```
