# HW06 Submission Workspace

This directory is reserved for reviewed, submission-ready HW06 artefacts only.

Expected final contents include the Postman collection and environment/data files, Newman HTML
reports and real execution evidence, Excel test cases and summary, bug-report evidence, CI/CD
report and real pass/fail run evidence, the AI Audit Report, AI Critique, generator diagram and
pseudocode, main report (Markdown and PDF), Git commit log, README self-assessment, and final ZIP.

The following APIs are human-confirmed for HW06. ACT-GEN-01 has produced 47 FR-04 AI-generated
candidates; execution artefacts and human review are not yet complete:

- Pool A / FR-04: `PUT /api/users/me`
- Pool B / FR-08: `POST /api/checkout`
- Pool C / FR-15: `POST /api/products`

The next gate is ACT-REV-01 human review of the FR-04 candidates. The AI Audit Report uses the
official template in `out/ai-audit-report.md` and is updated only after an explicit human request,
with one row per reviewed AI-generated artifact.

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
