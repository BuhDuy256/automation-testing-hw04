# Faculty of Information Technology (FIT) – Ho Chi Minh City University of Science (HCMUS)

## CS423 / CSC13003 – Software Testing (AI-augmented · 2026)

# AI Audit Report — HW06-AI API Testing

## 1. Student Information

| Field | Value |
|---|---|
| **Student name (printed):** | Nguyen Bao Duy |
| **Student ID:** | 23127179 |
| **Class / Cohort:** | 23KTPM2 |
| **Assignment ID:** | HW06-AI |
| **Assignment date:** | 22/08/2026 |
| **AI tool(s) used:** | Codex |
| **AI tool(s) used:** | [x] Yes  [ ] No |

## 2. Instructions and audit evidence status

This report follows the FIT@HCMUS AI Audit Report template. It requires one row per AI-generated artifact, the verbatim prompt, verbatim AI output, a VALID/INVALID/INCOMPLETE verdict, reasoning supported by a course or technical reference, and the student's correction.

At this checkpoint, ACT-GEN-01 is complete for FR-04 with 47 AI-generated candidates in the canonical test-case registry, but ACT-REV-01 has not started:

```text
work/registry/test-cases.json
AI candidates: 47
work/registry/human-reviews.json
human reviews: 0
```

Therefore, no audit row is added or reconstructed here. The official report is artifact-level: one row per AI-generated test case, populated only after the student supplies the human verdict, reasoning, and student fix. The report is updated only after an explicit request such as “Ghi AI Audit Report”.

## 3. Audit Table — one row per artifact

No auditable AI-generated artifact is currently recorded. The row below is intentionally not presented as a fabricated artifact.

| (1) Prompt + Tool | (2) AI Output | (3) Verdict | (4) Reasoning (ISTQB) | (5) Student Fix |
|---|---|---|---|---|
| No reviewed AI-generated artifact is ready for report entry. | Pending explicit human audit request and artifact-level source context. | — | ACT-REV-01 has not supplied a verdict or reasoning. | Complete human review first; then explicitly request the AI Audit Report update. |

## 4. Summary of AI Accuracy

| Metric | Count | Percentage |
|---|---:|---:|
| **Total AI-generated artifacts audited** | 0 | 0% |
| **VALID (correct, accepted as-is)** | 0 | 0% |
| **INVALID (wrong; rejected)** | 0 | 0% |
| **INCOMPLETE (acceptable after edits)** | 0 | 0% |

These counts describe reviewed artifact rows in this report. They do not claim that no AI-generated candidates exist; the 47 FR-04 candidates remain pending ACT-REV-01.

## 5. Conclusion — When should AI be used (or not)?

AI is useful for decomposing an authoritative API specification into candidate partitions, state checks, security ideas, and schema assertions. However, it must remain an auditable assistant rather than an undocumented source of requirements. AI should not be used to invent HTTP statuses, validation rules, response schemas, or confirmed bugs when the specification is silent. Every generated artifact should be preserved with its exact prompt and output, then reviewed against the official requirement and relevant testing principles. Human review is especially important for distinguishing official contract cases from exploratory robustness cases and implementation bug hypotheses. In this checkpoint, the missing captured interaction evidence means the report is not yet complete for final submission.

## 6. Mandatory Disclosure

> API-selection analysis, scoped API-specification documentation, and FR-04 test candidates were generated with assistance from Codex; I reviewed and modified the documents against the official HW06 requirement, the official EShop API specification, and the EShop README. The detailed AI Audit Report remains pending human review and an explicit report-writing request. I confirm I did not use AI to generate any artifact listed in the prohibited category.

### Signature

| Field | Value |
|---|---|
| **Student name (printed):** | Nguyen Bao Duy |
| **Student ID:** | 23127179 |
| **Class / Cohort:** | 23KTPM2 |
| **Course:** | CS423 / CSC13003 – Software Testing |
| **Instructor:** | |
| **Date:** | 22/08/2026 |
| **Signature:** | |

## References

- `[AI-02] - FIT@HCMUS - AI Audit Report_En.docx (2).md`, FIT@HCMUS AI Policy Templates — 2026 v1.0.
- Official HW06 requirement: `docs/hw06-req/2026.HW06.API Testing_En.md`.
- Official SUT API specification: `eshop-sut/api_specification.md`.
- EShop requirements and security requirements: `eshop-sut/README.md`.
- ISTQB Foundation Level Syllabus, latest version.
- Hardman, P. (2025). *A Post-AI Learning Taxonomy.*

## Completion note

Before final submission, each reviewed AI-generated test case, script, report section, or other AI-assisted artifact must be added as an artifact-level row with its prompt/context and tool, original AI output, human verdict, reasoning, and student correction. Update this report only after an explicit human request; do not create automatic interaction logs or a derived interaction ledger.
