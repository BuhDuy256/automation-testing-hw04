# HW06-AI API Testing Submission

Student: Nguyen Bao Duy

Student ID: 23127179

Class: 23KTPM2

Self-assessed grade: **100/100**

Public repository: <https://github.com/BuhDuy256/automation-testing-hw04>

This directory is the standalone submission entry point. The three selected operations are:

- Pool A / FR-04: `PUT /api/users/me`
- Pool B / FR-08: `POST /api/checkout`
- Pool C / FR-15: `POST /api/products`

## Result summary

| API | AI generated | Human added | Executed | Pass | Fail | Spec-gap observations | Published bugs |
|---|---:|---:|---:|---:|---:|---:|---:|
| FR-04 | 47 | 7 | 44 | 35 | 9 | 1 of the nine failures | 2 |
| FR-08 | 57 | 5 | 56 | 37 | 19 | Passing total-match cases have a documented evidence limitation | 2 |
| FR-15 | 59 | 5 | 59 | 16 authoritative | 28 | 15 PASS-shaped observations | 2 |
| **Total** | **163** | **17** | **159** | **88 authoritative plus 15 FR-15 observations** | **56** | **See feature summaries** | **6** |

FR-04 is in [fr04/](fr04/), FR-08 is in [fr08/](fr08/), and FR-15 is in [fr15/](fr15/). Each folder contains its Postman inputs, real Newman evidence, screenshots, CI run evidence, and a feature summary. The exact workflow configurations remain verifiable through public GitHub links in the CI/CD report.

## Deliverable index

- Main report: [main-report.md](main-report.md)
- Excel test cases and summary: [test-cases.xlsx](test-cases.xlsx)
- Requirement self-assessment: [submission-checklist.md](submission-checklist.md)
- Bug report and Issue links: [bug-report.md](bug-report.md)
- CI/CD report and run links: [ci-cd-report.md](ci-cd-report.md)
- Postman features used: [postman-features.md](postman-features.md)
- AI generator package and pseudocode: [generator/](generator/)
- AI Audit Report: [ai-audit-report.md](ai-audit-report.md)
- AI Critique: [ai-critique.md](ai-critique.md)
- Selected Git workflow evidence: [git-commit-log.txt](git-commit-log.txt)
- Deterministic validation record: [validation-report.txt](validation-report.txt)
- Public repository pointer: [github-repo-link.txt](github-repo-link.txt)
- Canonical audit provenance: [provenance/](provenance/)
- Authoritative source snapshots: [sources/](sources/)

## Bugs and CI/CD

Six genuine defects were confirmed and published as GitHub Issues [#13](https://github.com/BuhDuy256/automation-testing-hw04/issues/13), [#14](https://github.com/BuhDuy256/automation-testing-hw04/issues/14), [#15](https://github.com/BuhDuy256/automation-testing-hw04/issues/15), [#16](https://github.com/BuhDuy256/automation-testing-hw04/issues/16), [#17](https://github.com/BuhDuy256/automation-testing-hw04/issues/17), and [#18](https://github.com/BuhDuy256/automation-testing-hw04/issues/18).

The selected CI design includes real all-pass and intentional-single-failure demonstrations, documented with commit hashes, GitHub Actions links, and screenshots in [ci-cd-report.md](ci-cd-report.md). The separate canonical FR-04 regression run also proves that the pipeline detects the confirmed SUT defects without weakening test oracles.

## Submission integrity

The Newman files are genuine execution artifacts. Submission copies remove only accidental local-machine path prefixes where necessary; request/response results, assertion outcomes, localhost hostnames, and evidence identities remain unchanged. No runtime `database.sqlite` file is included.

The generator diagram is provided as a submission-ready [PNG](generator/ai-driven-api-test-generator.png) with its editable [Draw.io XML source](generator/ai-driven-api-test-generator.drawio.xml). Peer verification confirmed that the three-API selection is not duplicated within the group.

YouTube demonstration video:
https://youtu.be/vokd7GEmAAk
