# HW06 CI/CD Report (Derived)

> Generated from `provenance/ci-runs.json` and registered evidence. Screenshot attestation is reported independently from run verification.

## Compliance status

- CI infrastructure and complete canonical FR-04 integration: implemented.
- Existing all-pass and intentional-single-failure smoke demonstration: complete as CI behavior evidence.
- Strict assignment requirement that one pipeline run show "all API test cases passing": **PARTIAL / documented limitation due to confirmed SUT defects**.
- The smoke all-pass result must not be interpreted as all 44 canonical FR-04 cases passing.

## Complete canonical FR-04 suite integration

- Workflow: `https://github.com/BuhDuy256/automation-testing-hw04/blob/hw06-api-testing/.github/workflows/hw06-fr04-canonical-full-suite.yml` (`HW06 FR-04 Canonical Full Suite`).
- The job installs locked dependencies, starts and reseeds the EShop backend for each independent execution group, and runs the current canonical collections/environment/data with Newman.
- Newman JSON, HTML, stdout, copied inputs, canonical summary, exit codes, and backend logs are uploaded as `hw06-fr04-canonical-full-suite` before the final step exposes the genuine suite result.
- Commit: f34b71b24f368c819140fa077ce8942b76893470
- GitHub Actions run: https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32618732832
- Result: failure
- Canonical logical cases: 44/44 executed; 35 passed; 9 failed.
- Failure classification: 8 known-bug failures; 1 other/specification-gap failure.
- Required-header runtime proof: 305/305 requests.
- Main collection SHA-256: 35d8ef322af899bd42ae9399c1f31c46145287e4a35622f7a37f2a9001a3551f
- Main data SHA-256: 905c5448170c40746565300360d3840865a643ca5a7249b1c25580dffc72eb14
- Canonical summary: provenance/ci-index.md (CI-32618732832-canonical-full-suite)
- Screenshot: EVID-CI-FR04-CANONICAL-FULL-SUITE (fr04/evidence/EVID-CI-FR04-CANONICAL-FULL-SUITE.png; human attestation complete)

The complete canonical FR-04 suite is retained as the authoritative API test suite and is executed in CI without weakening its test oracles. Because the suite currently exposes confirmed SUT defects, its real full-suite CI execution is expected to fail. Changing the expected results, suppressing the confirmed bug cases, or modifying the SUT solely to obtain a green pipeline would invalidate the testing evidence. Therefore, the separate stable-case runs are retained only to demonstrate an all-pass CI state and an intentional single-failure state, while the canonical full-suite CI run demonstrates that the complete FR-04 suite is genuinely integrated into the pipeline.

## CI behavior demonstration

- Workflow: `https://github.com/BuhDuy256/automation-testing-hw04/blob/hw06-api-testing/.github/workflows/hw06-fr04-ci.yml` (`HW06 FR-04 Newman CI Sample`).
- This workflow uses only the explicitly identified stable canonical case `FR04-AI-001` to demonstrate CI mechanics.
- It injects `X-Student-Id: 23127179`, runs Newman, and uploads JSON/HTML/backend evidence as `hw06-fr04-ci-newman`.

## All-pass sample

- Commit: d8670c47fd18ede663f4da11410d46ed598de891
- GitHub Actions run: https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617199599
- Result: success
- Newman request executions: 5
- Assertions: 6 total, 0 failed
- Failed logical test cases: 0
- Newman JSON: provenance/ci-index.md (CI-32617199599-all-pass)
- Screenshot: EVID-CI-FR04-ALL-PASS (fr04/evidence/EVID-CI-FR04-ALL-PASS.png; human attestation complete)

## Intentional single-failure sample

- Commit: 84f837f95c44f928add2d719d0a5669688d45350
- GitHub Actions run: https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617321761
- Result: failure
- Newman request executions: 5
- Assertions: 6 total, 1 failed
- Failed logical test cases: 1
- Newman JSON: provenance/ci-index.md (CI-32617321761-intentional-single-failure)
- Screenshot: EVID-CI-FR04-INTENTIONAL-FAILURE (fr04/evidence/EVID-CI-FR04-INTENTIONAL-FAILURE.png; human attestation complete)

## Demonstration integrity note

The intentional sample adds one transparent assertion named `FR04-AI-001 [CI-DEMO] intentional single failure`; it is not classified as an SUT bug. These two smoke runs demonstrate green/red CI behavior only and do not replace the complete canonical suite or prove that all 44 FR-04 cases pass.

## All recorded CI runs and screenshots

This table covers every recorded CI run across the three selected APIs, including the FR-08 and FR-15 demonstrations. Paths are relative to this submission folder.

| Run ID | Purpose | Commit | Conclusion | GitHub Actions run | Screenshot | Human attestation |
|---|---|---|---|---|---|---|
| CI-32617199599-all-pass | all-pass | d8670c47fd18ede663f4da11410d46ed598de891 | success | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617199599 | fr04/evidence/EVID-CI-FR04-ALL-PASS.png | complete |
| CI-32617321761-intentional-single-failure | intentional-single-failure | 84f837f95c44f928add2d719d0a5669688d45350 | failure | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617321761 | fr04/evidence/EVID-CI-FR04-INTENTIONAL-FAILURE.png | complete |
| CI-32618732832-canonical-full-suite | canonical-full-suite | f34b71b24f368c819140fa077ce8942b76893470 | failure | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32618732832 | fr04/evidence/EVID-CI-FR04-CANONICAL-FULL-SUITE.png | complete |
| CI-32629097098-all-pass | all-pass | a1f21880889d326ce506a3621c63699996c25099 | success | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32629097098 | fr08/evidence/EVID-CI-FR08-ALL-PASS.png | complete |
| CI-32629191161-intentional-single-failure | intentional-single-failure | 87054fd9cfe88caf3cb06212caf3eb3005d3d545 | failure | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32629191161 | fr08/evidence/EVID-CI-FR08-SINGLE-FAILURE.png | complete |
| CI-32636054520-all-pass | all-pass | 60639072dc11d2ea4085df7e6bcacdc644c968cb | success | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32636054520 | fr15/evidence/EVID-CI-FR15-ALL-PASS.png | complete |
| CI-32636132200-intentional-single-failure | intentional-single-failure | 50fb45139427fb6981c9c41cfecd530dccb643df | failure | https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32636132200 | fr15/evidence/EVID-CI-FR15-SINGLE-FAILURE.png | complete |
