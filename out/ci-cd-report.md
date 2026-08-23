# HW06 CI/CD Report (Derived)

> Generated from `work/registry/ci-runs.json` and registered evidence. Screenshot attestation is reported independently from run verification.

## Workflow

- Configuration: `.github/workflows/hw06-fr04-ci.yml`
- The Ubuntu job installs the locked root and backend dependencies, starts the EShop backend, waits for its health endpoint, and runs Newman.
- The CI sample is the explicitly identified stable canonical case `FR04-AI-001`; it does not replace the complete 44-case FR-04 execution and does not weaken the confirmed bug-revealing assertions.
- The CI collection injects `X-Student-Id: 23127179` into every request and Newman determines the job result.
- Newman JSON, HTML, stdout, and backend logs are uploaded as the `hw06-fr04-ci-newman` artifact.

## All-pass sample

- Commit: d8670c47fd18ede663f4da11410d46ed598de891
- GitHub Actions run: https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617199599
- Result: success
- Newman request executions: 5
- Assertions: 6 total, 0 failed
- Failed logical test cases: 0
- Newman JSON: work/ci/runs/CI-32617199599-all-pass/artifacts/ci-artifacts/newman-report.json
- Screenshot: EVID-CI-FR04-ALL-PASS (work/evidence/screenshots/EVID-CI-FR04-ALL-PASS.png; human attestation pending)

## Intentional single-failure sample

- Commit: 84f837f95c44f928add2d719d0a5669688d45350
- GitHub Actions run: https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617321761
- Result: failure
- Newman request executions: 5
- Assertions: 6 total, 1 failed
- Failed logical test cases: 1
- Newman JSON: work/ci/runs/CI-32617321761-intentional-single-failure/artifacts/ci-artifacts/newman-report.json
- Screenshot: EVID-CI-FR04-INTENTIONAL-FAILURE (work/evidence/screenshots/EVID-CI-FR04-INTENTIONAL-FAILURE.png; human attestation pending)

## Integrity note

The intentional sample adds one transparent assertion named `FR04-AI-001 [CI-DEMO] intentional single failure`; it is not classified as an SUT bug. The separate complete FR-04 execution retains the genuine phone-format and protected-role failures.
