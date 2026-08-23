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

FR-04 generation, human audit and extension, canonical execution, published bug reporting, Postman
feature evidence, and CI integration are curated under `out/fr04/` and the root factual reports,
including the attested canonical-full-suite CI screenshot. The strict CI wording requiring an
all-API-test green run remains a documented limitation because the authoritative suite retains
confirmed SUT defects.

FR-08 is curated under `out/fr08/`: the reviewed Postman collection, environment and data file, the
Postman Desktop manual-import copies, the canonical Newman run with its original exit code, the CI
workflow, and the attested evidence. Its accounting is 57 AI-generated candidates, 5 student-selected
extensions, 56 executable and executed cases, 37 passed and 19 failed, with every failure mapped to
the two published GitHub Issues #15 and #16. The passed count must not be read as proof that checkout
recalculates the total; that limitation is recorded in `out/fr08/test-summary.md`. Three manual
Postman Desktop screenshots stay under `work/evidence/` until the student attests them.

FR-15 generation is complete with 58 AI candidates, but it is paused at its human review gate and no
FR-15 verdict has been recorded, so no FR-15 artefact is curated here yet. The final submission ZIP,
main report, Excel export, PDF outputs, AI critique, generator deliverables, and final Git log must
not be claimed complete yet. The AI Audit Report remains human-triggered under the repository policy.

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
