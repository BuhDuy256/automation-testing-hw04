# HW06-AI API Testing Report

## Student and submission

| Field | Value |
|---|---|
| Student | Nguyen Bao Duy |
| Student ID | 23127179 |
| Class | 23KTPM2 |
| Assignment | HW06-AI — API Testing |
| Public repository | <https://github.com/BuhDuy256/automation-testing-hw04> |
| Branch | `hw06-api-testing` |
| Self-assessed grade | 100/100 |

## Scope and method

The submission tests one operation from each required pool: FR-04 `PUT /api/users/me`, FR-08 `POST /api/checkout`, and FR-15 `POST /api/products`. For each operation, AI-generated, source-anchored candidates were produced in bounded coverage batches. Every candidate was reviewed; unsuitable cases were corrected or rejected; at least five extensions were selected; and the executable Postman design, Newman evidence, confirmed defects, and external Issue publications were reviewed and approved. Test oracles use documented state invariants and read-back evidence instead of invented status codes or schemas.

## Test accounting

| API | AI generated | Human added | Audited | Executable | Executed | Result |
|---|---:|---:|---:|---:|---:|---|
| FR-04 | 47 | 7 | 47 | 44 | 44 | Complete execution; two confirmed defects published |
| FR-08 | 57 | 5 | 57 | 56 | 56 | Complete execution; two confirmed defects published |
| FR-15 | 59 | 5 | 59 | 59 | 59 | Complete execution; two confirmed defects published |
| **Total** | **163** | **17** | **163** | **159** | **159** | **100% executed; six confirmed defects published** |

The detailed cases, original AI output, human verdicts, corrections, execution classifications, and summary worksheets are in [test-cases.xlsx](test-cases.xlsx). Canonical source data is included under [provenance/](provenance/).

## FR-04 — Personal profile management

The suite covers editable profile partitions, phone boundaries, authentication, protected email/role behavior, persistence, stateful repeated updates, Unicode and input-handling observations. The canonical executions preserve genuine failures. Invalid phone values persisted, and an ordinary user could persist `role=admin`. These root defects were published as Issues [#13](https://github.com/BuhDuy256/automation-testing-hw04/issues/13) and [#14](https://github.com/BuhDuy256/automation-testing-hw04/issues/14). Artifacts are under [fr04/](fr04/).

## FR-08 — Checkout

The suite creates isolated users and cart states, derives the expected total from the server-reported cart, checks order persistence, exercises authentication and malformed inputs, and observes cart state after checkout. Its independent server-side read-back oracles exposed that the backend trusted client `total_amount` and did not clear the cart; Issues [#15](https://github.com/BuhDuy256/automation-testing-hw04/issues/15) and [#16](https://github.com/BuhDuy256/automation-testing-hw04/issues/16) preserve the reproducible evidence. Artifacts are under [fr08/](fr08/).

## FR-15 — Product creation

The suite covers name, price, category, body shape, admin authorization, invalid JWT contexts, persistence, duplicate/cleanup observations, and security boundaries. Product creation succeeded without a valid admin context and accepted documented-invalid product data; Issues [#17](https://github.com/BuhDuy256/automation-testing-hw04/issues/17) and [#18](https://github.com/BuhDuy256/automation-testing-hw04/issues/18) record the two root defects. Fifteen assertion-clean results remain SPEC-GAP observations because the official contract does not define the exact behavior needed for a stronger verdict. Artifacts are under [fr15/](fr15/).

## Postman and Newman

The collections use environments, variables, data-driven iterations, pre-request scripts, test scripts, `pm.sendRequest` read-back/cleanup helpers, and Newman JSON/HTML reporters. Every collection injects `X-Student-Id: 23127179`; the attested console screenshot is available [here](fr04/evidence/EVID-FR04-POSTMAN-CONSOLE.png). The complete feature list and evidence mapping are in [postman-features.md](postman-features.md).

## Bugs

Six genuine defects are documented in [bug-report.md](bug-report.md). Each published Issue has a public URL and an included attested screenshot. Exact undocumented error statuses are not claimed; persistence and state observations form the primary bug oracles.

## CI/CD

A dual-purpose CI design was selected. The required all-pass and intentional-one-failure samples demonstrate both GitHub Actions outcomes with real commits, runs, and uploaded evidence. A separate canonical FR-04 regression workflow executes the complete suite without suppressing confirmed defects; its red result is expected evidence that CI correctly detects the known SUT issues. See [ci-cd-report.md](ci-cd-report.md).

## AI-driven test generator

The reusable Agent Skill is packaged at [generator/agent-skill/SKILL.md](generator/agent-skill/SKILL.md), and its design is expressed as submission-facing [pseudocode](generator/pseudocode.md). It separates contract extraction, domain partitions, state, security, schema, deduplication, source-grounded oracles, and provenance stamping from the later human-controlled workflow. The workflow diagram is included as a [PNG](generator/ai-driven-api-test-generator.png) with its editable [Draw.io XML source](generator/ai-driven-api-test-generator.drawio.xml).

## AI use, critique, and audit

The project-specific 200–300 word critique is [ai-critique.md](ai-critique.md). The complete AI declaration and artifact-level audit are supplied as [Markdown](ai-audit-report.md). The audit distinguishes preserved prompts from historical context fallbacks and records review verdicts separately from AI output.

## Completion and verification

- SEC-04 and SEC-05 are covered at the API-observable boundary appropriate to this black-box assignment; implementation-level source-code verification is outside the selected API-testing scope.
- Peer verification confirmed that the FR-04, FR-08, and FR-15 combination is not duplicated within the group.
- The selected CI strategy and resulting runs were reviewed, with the canonical defect-detection workflow retained as evidence of effective regression testing.
- The generator diagram and YouTube generator demonstration are both linked from [README.md](README.md).

## Submission map

The complete requirement classification and official 100-point self-assessment are in [submission-checklist.md](submission-checklist.md). Real Git workflow evidence is in [git-commit-log.txt](git-commit-log.txt). All local links in this submission are checked to remain inside this directory, and no runtime database or active secret is included.
