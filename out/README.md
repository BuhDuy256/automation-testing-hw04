# HW06 Submission Workspace

This directory is reserved for reviewed, submission-ready HW06 artefacts only.

Expected final contents include the Postman collection and environment/data files, Newman HTML
reports and real execution evidence, Excel test cases and summary, bug-report evidence, CI/CD
report and real pass/fail run evidence, the AI Audit Report, AI Critique, generator diagram and
pseudocode, main report (Markdown and PDF), Git commit log, README self-assessment, and final ZIP.

The following APIs are human-confirmed for HW06:

- Pool A / FR-04: `PUT /api/users/me`
- Pool B / FR-08: `POST /api/checkout`
- Pool C / FR-15: `POST /api/products`

FR-04 generation, human audit/extension, canonical execution, published bug reporting, Postman
feature evidence, and CI integration have been curated under `out/fr04/` and the root factual
reports. The new canonical-full-suite CI screenshot still requires explicit human attestation and
therefore remains under `work/evidence/`. The strict CI wording requiring an all-API-test green run
remains a documented limitation because the authoritative suite retains confirmed SUT defects.

FR-08 and FR-15 are not started. The final submission ZIP, main report, Excel export, PDF outputs,
AI critique, generator deliverables, and final Git log must not be claimed complete yet. The AI
Audit Report remains human-triggered under the repository policy.

Expected stable names used by the submission validator:

- `main-report.md` and `main-report.pdf`
- `test-cases.xlsx`
- `postman-features.md`
- `ci-cd-report.md`
- `bug-report.md`
- `generator/pseudocode.md`
- `ai-audit-report.md` and `ai-audit-report.pdf`
- `ai-critique.md`
- `git-commit-log.txt`
- `github-repo-link.txt`

The final ZIP is created only after strict validation succeeds.
