# HW06 AI Audit Report

## Audit status

**Checkpoint report — incomplete for final submission.**

This report is generated from the repository's canonical AI-audit records. At the time of this report, the canonical interaction registry contains no captured AI interactions:

```text
work/registry/ai-interactions.json
interactions: []
```

The repository therefore does not contain the required verbatim prompt/output evidence for any AI interaction. No prompt, model output, timestamp, hash, or human verdict is reconstructed in this report.

## Assignment context

- Assignment: HW06-AI API Testing
- SUT: EShop backend API
- Confirmed APIs:
  - Pool A / FR-04: `PUT /api/users/me`
  - Pool B / FR-08: `POST /api/checkout`
  - Pool C / FR-15: `POST /api/products`
- Current phase: scoped API specifications are human verified; test generation has not started.

## AI interaction inventory

| Interaction ID | Tool | Kind | Task | Prompt evidence | Output evidence | Human review |
|---|---|---|---|---|---|---|
| None recorded | — | — | — | Not captured | Not captured | Not applicable |

## Evidence boundary

The following materials exist in the repository but are not AI interaction audit records:

- `work/selection/*-verified-spec.md`: source-anchored specification extracts, human verified.
- `docs/hw06-analysis/api-selection-proposal.md`: API candidate analysis and final selection rationale.
- `HANDOFF.md`: continuation state and workflow instructions.

These documents do not contain the verbatim prompt/output pair, tool metadata, timestamp, and hash required by ACT-AI-01. They are not presented as substitutes for an AI audit interaction record.

## Required completion action

Before final HW06 submission, every AI interaction that contributes to test generation, test review, implementation, bug analysis, reporting, or generator design must be captured using ACT-AI-01:

1. preserve the exact prompt and exact AI output as separate files;
2. register the interaction with `scripts/hw06/ai-audit.mjs capture`;
3. run interaction verification;
4. record the student's human review and corrections where required;
5. regenerate the audit ledger with `npm run hw06:derive`;
6. replace this checkpoint report with the complete evidence-backed audit report.

No test cases, bugs, execution evidence, CI runs, screenshots, GitHub Issues, or human reviews are claimed by this report.

## Declaration

This report intentionally reports missing audit evidence rather than fabricating it. The absence of captured interactions is a repository process gap that must be resolved before final submission.
