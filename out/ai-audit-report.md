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

At this checkpoint, the repository contains no captured ACT-AI-01 interaction records:

```text
work/registry/ai-interactions.json
interactions: []
```

Therefore, no verbatim prompt/output pair is reproduced or reconstructed here. The HW06 API-selection analysis and scoped specification extracts exist, but they are not a substitute for captured AI interaction evidence. Test generation has not started.

## 3. Audit Table — one row per artifact

No auditable AI-generated artifact is currently recorded. The row below is intentionally not presented as a fabricated artifact.

| (1) Prompt + Tool | (2) AI Output | (3) Verdict | (4) Reasoning (ISTQB) | (5) Student Fix |
|---|---|---|---|---|
| No captured artifact. Tool/prompt/time are unavailable in the canonical audit registry. | No captured verbatim output. | — | A VALID/INVALID/INCOMPLETE verdict cannot be assigned without the artifact and its source evidence. | Capture the exact prompt and output with ACT-AI-01 before using the artifact as HW06 evidence. |

## 4. Summary of AI Accuracy

| Metric | Count | Percentage |
|---|---:|---:|
| **Total AI-generated artifacts audited** | 0 | 0% |
| **VALID (correct, accepted as-is)** | 0 | 0% |
| **INVALID (wrong; rejected)** | 0 | 0% |
| **INCOMPLETE (acceptable after edits)** | 0 | 0% |

These counts describe the captured audit registry at this checkpoint. They do not claim that no AI assistance occurred outside the registry; they indicate that no interaction is currently auditable under the repository's evidence rules.

## 5. Conclusion — When should AI be used (or not)?

AI is useful for decomposing an authoritative API specification into candidate partitions, state checks, security ideas, and schema assertions. However, it must remain an auditable assistant rather than an undocumented source of requirements. AI should not be used to invent HTTP statuses, validation rules, response schemas, or confirmed bugs when the specification is silent. Every generated artifact should be preserved with its exact prompt and output, then reviewed against the official requirement and relevant testing principles. Human review is especially important for distinguishing official contract cases from exploratory robustness cases and implementation bug hypotheses. In this checkpoint, the missing captured interaction evidence means the report is not yet complete for final submission.

## 6. Mandatory Disclosure

> API-selection analysis and scoped API-specification documentation were initially generated with assistance from Codex; I reviewed and modified the documents against the official HW06 requirement, the official EShop API specification, and the EShop README. Test cases have not yet been generated. The detailed AI Audit Report is attached as Appendix A. I confirm I did not use AI to generate any artifact listed in the prohibited category.

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

Before final submission, each AI-generated test case, script, report section, or other AI-assisted artifact must be added as an auditable row with its verbatim prompt/output, verdict, technical reasoning, and student correction. Capture future interactions through ACT-AI-01 and regenerate the audit ledger with `npm run hw06:derive`.
