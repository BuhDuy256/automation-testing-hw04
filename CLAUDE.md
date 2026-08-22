# HW06 API Testing on EShop

## Project Context

- **Course:** Software Testing - HW06 API Testing (AI-first)
- **Student:** Nguyen Bao Duy - 23127179 - 23KTPM2
- **Active branch:** `hw06-api-testing`
- **Historical references:** `references/hw04/` and `references/hw05/` are frozen; do not modify them.
- **SUT:** EShop, a Vietnamese e-commerce demo application
- **HW06 requirement:** `docs/hw06-req/2026.HW06.API Testing_En.md`
- **Primary tools:** Postman + Newman (default), an AI tool, and GitHub Actions for CI/CD.

## Chat Language and Explanation Style

- Always respond in Vietnamese during chat sessions.
- Explain concepts as if the user is a complete beginner.
- Explain each idea in one short, simple sentence.
- This Vietnamese language rule applies only to chat responses.
- Write all project outputs, including code, filenames, comments, documentation, reports, and other artifacts, in English.

## Authoritative Inputs

| File | Purpose |
|---|---|
| `docs/hw06-req/2026.HW06.API Testing_En.md` | Full HW06 assignment specification |
| `eshop-sut/README.md` | SUT feature specifications |
| `eshop-sut/api_specification.md` | Backend API endpoints and validation rules |
| `eshop-sut/setup_guide.md` | How to run the SUT |
| `references/hw04/`, `references/hw05/` | Completed homework material for reference only |
| `references/hw2/` | Local HW02 material used only when needed for historical context |

## Selected HW06 APIs

No HW06 API selection has been made yet. Do not choose or implement API-specific tests until
the student confirms one API from each Pool A, Pool B, and Pool C, and the API specification
has been analysed for those selections.

## Repository Workflow

- `references/hw04/` and `references/hw05/` are frozen reference material. Do not add HW06 work there.
- `work/` contains intermediate plans, AI outputs, human audits, experiments, and execution preparation.
- `out/` contains only finalized files intended for the HW06 submission ZIP.
- `eshop-sut/` is the shared system under test and remains at the repository root.
- Keep required HW06 evidence (Postman collections, Newman reports, screenshots, CI evidence, test cases, and final reports) in `out/` once finalized; do not ignore it.

## HW06 Required Outputs

The root `out/` directory should contain, as applicable:

- One selected API from each of Pool A, Pool B, and Pool C, with at least 35 AI-generated cases per API.
- Human audit results (`VALID`, `INVALID`, or `INCOMPLETE`) and at least five human-added cases per API.
- Postman collection/environment/data files and Newman HTML execution reports.
- Evidence that every request includes `X-Student-Id: 23127179`.
- Genuine bug reports with GitHub Issue screenshots when bugs are found.
- CI/CD configuration plus real all-pass and intentional-one-failure run evidence.
- Excel test cases and summary, AI Audit Report, 200-300 word AI Critique, generator design/diagram/pseudocode, final report, README, and Git commit log.

## Running the SUT

```bash
./run.sh start    # boots backend :3000 + frontend-web :5173 + frontend-admin :5174
./run.sh status
./run.sh stop
```

The backend re-seeds the database on every start. Restarting it wipes users, orders, and admin-created products.

Test accounts:

- Admin: `admin@eshop.com` / `Admin123!`
- User: `test@eshop.com` / `Test1234!`

## Commit Discipline

- Keep HW04 unchanged and use `references/hw04/` only as a reference.
- Create a separate commit for each meaningful HW06 step, such as generation, audit, extension, execution, CI/CD, and final curation.
- Update `out/git-commit-log.txt` from the final HW06 branch history before submission.

## HW06 Automation Harness

- Treat `work/registry/*.json` as canonical bookkeeping; do not maintain duplicate counts by hand.
- Keep AI candidates in `test-cases.json` and student judgments in `human-reviews.json`; never auto-assign a review verdict.
- Capture every meaningful AI interaction immediately with `node scripts/hw06/ai-audit.mjs capture ...`; the command stores verbatim prompt/output files, hashes, tool, and time.
- Run `npm run hw06:validate` before each meaningful commit and `npm run hw06:derive` after registry changes.
- Use `node scripts/hw06/run-newman.mjs ...` for official local executions so raw JSON, HTML, console output, hashes, command arguments, and timestamps are captured together.
- Generated files under `work/generated/` are derived views, not sources of truth.
- Run strict validation and `scripts/hw06/build-submission.ps1` only during final curation; missing real evidence must fail the build.
