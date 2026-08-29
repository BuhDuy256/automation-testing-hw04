# HW06 Submission Checklist and Self-Assessment

Statuses use the required vocabulary: `COMPLETE`, `INCOMPLETE`, `MISSING`, `HUMAN-ONLY PENDING`, and `NOT APPLICABLE`.

| Requirement | Status | Artifact | Evidence / note |
|---|---|---|---|
| Select three APIs from Pools A, B, and C | COMPLETE | [README.md](README.md) | FR-04 `PUT /api/users/me`, FR-08 `POST /api/checkout`, and FR-15 `POST /api/products` are human-confirmed. |
| Ensure the three-API selection is not duplicated within the group | HUMAN-ONLY PENDING | [README.md](README.md) | No group allocation source exists in the repository; the student must confirm this externally. |
| At least 35 AI-generated cases per API | COMPLETE | [test-cases.xlsx](test-cases.xlsx), [provenance/test-cases.json](provenance/test-cases.json) | FR-04: 47; FR-08: 57; FR-15: 59. |
| Domain partitions, state, security, and schema coverage | COMPLETE | [test-cases.xlsx](test-cases.xlsx), feature folders | Coverage is source-grounded; non-applicable or unspecified rules remain explicit instead of being padded. |
| Human audit of every AI case with VALID / INVALID / INCOMPLETE and corrections | COMPLETE | [test-cases.xlsx](test-cases.xlsx), [provenance/human-reviews.json](provenance/human-reviews.json), [ai-audit-report.md](ai-audit-report.md) | All 163 AI candidates have recorded human verdicts; rejected cases remain preserved for audit. |
| At least five student-added cases per API with rationale | COMPLETE | [test-cases.xlsx](test-cases.xlsx) | FR-04: 7; FR-08: 5; FR-15: 5. |
| Execute with Postman/Newman | COMPLETE | [fr04/](fr04/), [fr08/](fr08/), [fr15/](fr15/) | All 159 executable cases have registered results and genuine Newman bundles. |
| `X-Student-Id: 23127179` on every request | COMPLETE | [FR-04 console screenshot](fr04/evidence/EVID-FR04-POSTMAN-CONSOLE.png), collections and Newman evidence | Static injection exists; runtime coverage is recorded, including 305/305 canonical FR-04 CI requests and 485/485 FR-15 requests. |
| Newman raw output and HTML reports | COMPLETE | [fr04/newman/](fr04/newman/), [fr08/newman/](fr08/newman/), [fr15/newman/](fr15/newman/) | Real JSON, HTML, stdout, and metadata bundles are included. |
| Genuine bugs in report and GitHub Issues with screenshots | COMPLETE | [bug-report.md](bug-report.md), feature evidence folders | Six published Issues: #13 through #18. |
| List Postman features used | COMPLETE | [postman-features.md](postman-features.md) | Only features with recorded evidence are listed. |
| CI/CD configuration and short report | COMPLETE | [ci-cd-report.md](ci-cd-report.md), feature CI/evidence folders | Configuration, public run links, screenshots, and limitations are documented. |
| One all-pass CI sample and one intentional-one-failure sample | COMPLETE | [ci-cd-report.md](ci-cd-report.md) | FR-04 commits `d8670c4...` and `84f837f...` provide the required green/red pair; FR-08 and FR-15 add further samples. |
| AI-driven API test generator Agent Skill | COMPLETE | [generator/agent-skill/SKILL.md](generator/agent-skill/SKILL.md) | Reusable generator used for bounded FR-08 and FR-15 candidate generation. |
| Generator pseudocode | COMPLETE | [generator/pseudocode.md](generator/pseudocode.md) | Design mirrors the source-grounded generation method and human-control boundaries. |
| Student-designed/self-drawn generator diagram | COMPLETE | [PNG](generator/ai-driven-api-test-generator.png), [Draw.io XML](generator/ai-driven-api-test-generator.drawio.xml) | Student-supplied workflow diagram and editable source are included. |
| Generator demonstration video | COMPLETE | [README.md](README.md) | The YouTube demonstration URL is provided in the root README. |
| AI Audit Report, Markdown and PDF | COMPLETE | [ai-audit-report.md](ai-audit-report.md), [ai-audit-report.pdf](ai-audit-report.pdf) | Existing supported rows are preserved; final-submission AI artifacts are appended with actual provenance. |
| AI Critique, 200–300 words, Markdown and PDF | COMPLETE | [ai-critique.md](ai-critique.md), [ai-critique.pdf](ai-critique.pdf) | Project-specific critique; deterministic word-count validation is applied. |
| Excel test cases and summary | COMPLETE | [test-cases.xlsx](test-cases.xlsx) | Contains summary and case-detail worksheets generated from canonical registries. |
| Main report, Markdown and PDF | COMPLETE | [main-report.md](main-report.md), [main-report.pdf](main-report.pdf) | Submission narrative maps requirements to evidence and discloses limitations. |
| Public repository link | COMPLETE | [github-repo-link.txt](github-repo-link.txt) | Public repository and HW06 branch are listed. |
| Meaningful Git commit log | COMPLETE | [git-commit-log.txt](git-commit-log.txt) | Selected real hashes/messages map to specification, generation, review, extension, implementation, execution, bugs, evidence, CI, and curation. |
| No forbidden runtime database in submission | COMPLETE | Entire `out/` tree | Deterministic check rejects `database.sqlite`, `*.db`, and `*.sqlite` files. |
| Final ZIP naming and package | INCOMPLETE | Not built | The diagram is supplied and registered; the ZIP remains unbuilt pending final submission approval. |
| Optional OpenAPI conversion | NOT APPLICABLE | None | Section 14 marks this artifact optional. |
| Oral defense | NOT APPLICABLE | None | Selection for oral defense occurs after submission and is not a submission artifact. |

## Official assessment template

| No. | Criteria | Available grade | Self-assessed grade | Basis |
|---:|---|---:|---:|---|
| 1 | API 1 — full pipeline | 30 | 30 | FR-04 pipeline and evidence are complete. |
| 2 | API 2 — full pipeline | 30 | 30 | FR-08 pipeline and evidence are complete. |
| 3 | API 3 — full pipeline | 30 | 30 | FR-15 pipeline and evidence are complete. |
| 4 | Agent Skills — AI-driven test generator | 10 | 10 | Full credit is included in the student's self-assessment. |
| | **Total** | **100** | **100** | Student-confirmed self-assessment; package name grade component is `100`. |
