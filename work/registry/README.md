# HW06 Canonical Registries

These small JSON files are the canonical bookkeeping sources for HW06.

- `project.json` records student metadata, selected APIs, and Postman file paths.
- `test-cases.json` records immutable AI candidates and human-authored additions.
- `human-reviews.json` records student verdicts and corrections separately from AI candidates.
- `runs.json` records real local Newman runs and their evidence paths.
- `bugs.json` records only observed bug candidates and human publication decisions.
- `ci-runs.json` records the required real all-pass and intentional-single-failure CI runs.
- `postman-features.json` records used features and evidence.
- `evidence.json` indexes screenshots, reports, and other attributable evidence.
- `submission.json` defines the final fail-loudly submission checklist.

The official AI Audit Report is `out/ai-audit-report.md` and is updated only after an explicit human request.
Edit canonical records; regenerate summaries with `npm run hw06:derive`.
Never edit files under `work/generated/` as sources of truth.
