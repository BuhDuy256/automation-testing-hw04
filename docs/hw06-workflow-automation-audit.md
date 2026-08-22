# HW06 Workflow Automation Audit

> Direction clarification: this document inventories friction and supporting data mechanics. The
> authoritative behavior for recurring agent operations is now the compact standard-action catalog
> in `docs/hw06-standard-actions.md`.

## Scope and authority

This audit uses the official HW06 requirement as the assignment authority, the repository
governance files as operating authority, and the frozen HW05 archive as historical evidence of
the previous operating model. It does not select APIs, generate test cases, or claim execution.

## Complete lifecycle

```text
Official requirement
  -> student confirms one non-duplicated API from each Pool A/B/C
  -> endpoint/spec and SEC-01..SEC-07 extraction
  -> per-API test-design plan
  -> stepwise AI candidate generation (>=35/API)
  -> incremental AI interaction capture
  -> student audit (VALID/INVALID/INCOMPLETE + reasoning + correction)
  -> student extension (>=5/API + why AI missed each class)
  -> canonical final-case set
  -> Postman collection/environment/data implementation
  -> static collection checks and student-header preparation
  -> real Newman execution
  -> raw JSON/HTML/console evidence capture
  -> case-result mapping and defect-vs-test-defect review
  -> student confirms genuine bugs
  -> GitHub Issue publication with screenshot
  -> CI workflow and real all-pass run
  -> intentional one-test-failure commit and real CI run
  -> Postman feature inventory
  -> derived summaries, traceability, bug table, and AI ledger
  -> student writes AI critique and self-drawn generator diagram
  -> main Markdown/PDF, Excel, README, and self-assessment curation
  -> commit-log export
  -> strict pre-submission validation
  -> ZIP + SHA-256 manifest
```

## Friction inventory

Time savings are estimates per assignment. Token savings compare future agent work with repeatedly
loading or reconstructing the same facts.

| ID | Stage | Current friction and failure mode | Frequency | Human judgment? | Automation / mechanism | Time saving | Token saving | Risk | Priority |
|---|---|---|---:|---|---|---:|---:|---|---|
| F-01 | Requirement | Agents can repeatedly reload the full requirement and forget a clause. | Many turns | No | Stable requirement paths plus compact project registry and validator rules. | 10-20 min | High | A compact index can become lossy; official file remains authority. | P0 |
| F-02 | API selection | Pool, feature, endpoint, and group-duplication decisions can be scattered in chat. | Once + reuse | Yes | `project.json.selectedApis` stores only student-confirmed selections with confirmer/time. | 10 min | High | Automation must not choose APIs. | P0 |
| F-03 | Spec extraction | Endpoint facts and SEC mappings may be rediscovered or copied inconsistently. | 3 APIs, many cases | Partly | Persist verified per-API extraction after selection; defer extraction until student selection. | 30-60 min | High | Premature extraction could imply selection or become an unreliable summary. | P1 deferred until selection |
| F-04 | Test IDs/names | IDs and names can diverge across JSON, Postman, Excel, reports, and bugs. | 120+ cases | No | Canonical case IDs in `test-cases.json`; all other records reference IDs. | 30 min | High | Renaming after execution breaks traceability. | P0 |
| F-05 | AI generation | Repeated prompts may lose scope, coverage, or attribution. | Many interactions | Partly | Capture each meaningful prompt/output pair with task/tool/time/hash. | 30-90 min | High | Capture is not automatic at chat transport level. | P0 |
| F-06 | AI audit reconstruction | Tool/time/prompt/output are reconstructed at the end and may be invented or omitted. | Every interaction | Review only | Incremental `ai-audit` capture; derived full-text ledger. | 1-3 h | Very high | Capture time is not identical to interaction time unless recorded immediately. | P0 |
| F-07 | AI log size | Full prompts/outputs duplicated in one JSON ledger make routine context huge. | Every interaction | No | Ledger stores metadata and hashes; full text lives in per-interaction files loaded only when needed. | 10 min | Very high | File links must remain valid and hashes unchanged. | P0 |
| F-08 | Human case audit | Agent could silently classify cases or overwrite original AI candidates. | >=105 cases | Yes | Separate `human-reviews.json`; validator never supplies verdicts and requires corrections. | 20-40 min mechanical | Medium | Student must make and attest every verdict. | P0 |
| F-09 | Audit counts | VALID/INVALID/INCOMPLETE totals can be miscounted. | Per API + final | No | Derived summaries from reviews. | 15 min | Medium | Incorrect schemas would produce incorrect counts. | P1 |
| F-10 | Human extensions | Added cases may be mistaken for AI output or lack “why AI missed it”. | >=15 cases | Yes | `origin=HUMAN` plus mandatory `humanExtensionRationale`. | 15 min | Medium | Rationale quality remains academic judgment. | P0 |
| F-11 | Coverage tracking | Domain/state/security/schema coverage can be claimed without case-level links. | 120+ cases | Partly | Controlled coverage values and requirement references per case. | 20 min | High | Tags do not prove quality; student reviews content. | P0 |
| F-12 | Postman implementation | Test facts are copied manually from cases into collection scripts. | 120+ cases | Partly | Canonical IDs and later generator/importer after real collection structure exists. | 1-2 h | Medium | Premature generator could encode wrong Postman design. | P1 deferred until selected APIs |
| F-13 | Student header | Header can be absent from some requests, and screenshot can be forgotten. | Every request/run | No + screenshot manual | Strict static collection scan plus mandatory evidence type. | 15 min | Low | Static presence does not prove runtime transmission. | P0 |
| F-14 | Environment startup | SUT start/status/reset commands are repeated and stateful. | Many runs | No | Retain `run.sh`; do not add another launcher. | Existing saving | Low | Restart reseeds database and can erase test setup. | KEEP |
| F-15 | Newman commands | Flags, reporters, data files, paths, and timestamps can vary by run. | Many runs | No | One Newman wrapper captures command, hashes, JSON, HTML, stdout/stderr, and metadata. | 30-60 min | Medium | Wrapper requires installed reporter and cannot infer case mapping safely. | P1 |
| F-16 | Run provenance | A report may not identify collection/environment/data versions or hostname. | Every run | No | SHA-256 and repository-relative input paths in run metadata. | 20 min | Medium | Environment files may contain secrets; hashes avoid copying values. | P0 |
| F-17 | Result mapping | Pass/fail totals are manually copied and can refer to wrong test versions. | Every run/case | Human check initially | Run registry references case IDs; importer deferred until actual Newman JSON is observed. | 30 min now | High | Guessing reporter schema would be brittle. | P1 partial |
| F-18 | Raw report reading | Agents repeatedly load huge Newman JSON/HTML. | Many analyses | No | Store raw evidence separately and derive small summaries/traceability. | 20-40 min | Very high | Summary must link back to raw source. | P0 |
| F-19 | Defect classification | A failed test may be published as a product bug without investigation. | Every failure | Yes | Bug lifecycle `candidate -> human-confirmed -> published`; issue form requires confirmation. | 10 min mechanical | Medium | Automation cannot make the defect-vs-test-defect judgment. | P0 |
| F-20 | Bug duplication | Bug details are rewritten in Markdown, GitHub, README, and report. | Per bug | Confirmation only | Canonical bug record derives bug table and GitHub issue body. | 20 min/bug | Medium | GitHub screenshot upload and final publication remain human-controlled. | P1 |
| F-21 | Screenshot capture | Screenshots are ad hoc, unnamed, or detached from runs/issues. | Many evidence points | Often | Evidence registry, required types, capture time, description, attestation. | 15 min | Low | UI authenticity and self-drawn work cannot be inferred programmatically. | P0 registry; P2 capture automation |
| F-22 | GitHub Issue fields | Issues can omit case IDs, commit, run, expected/actual, or screenshot. | Per bug | Publish decision | GitHub Issue Form with required traceability fields and screenshot upload. | 10 min/bug | Low | Form schema is public preview; validate when pushed. | P1 |
| F-23 | CI design | Agents may re-invent install/start/run/upload steps or forget raw artefacts. | Two required runs | Partly | Add workflow only after collection paths and real command are known; upload raw reports as artifacts. | 30 min later | Medium | A placeholder workflow would fail or claim unverified behavior. | P0 decision; implementation deferred |
| F-24 | CI evidence | Pass/fail screenshots, URLs, commit SHAs, and exact one-failure count may diverge. | Two runs | Yes for intentional case choice | `ci-runs.json` and strict validator require both purposes and exact failure count. | 20 min | Medium | Registry cannot prove GitHub page authenticity. | P0 |
| F-25 | Postman features | Feature list is reconstructed late without evidence. | Throughout | Yes which features are meaningful | Incremental feature registry with usage and evidence paths. | 15 min | Medium | Do not add unused features only to inflate the list. | P0 |
| F-26 | Excel/report sync | Counts and rows are copied manually into Excel, Markdown, README, and summary. | Several final outputs | No | Registries feed derived factual views; XLSX export deferred until schema has real cases. | 1-2 h later | High | XLSX formatting dependency adds maintenance. | P1 partial |
| F-27 | Traceability | Requirement -> AI -> review -> run -> bug -> issue links are manually reconstructed. | 120+ cases | No | Derived traceability matrix keyed by case ID. | 45-90 min | Very high | Missing links must remain visibly missing. | P0 |
| F-28 | AI critique | Factual AI error counts must be recopied into a human-written critique. | Once | Yes | Derive facts; student writes the 200-300 word critique. | 10 min | Medium | Automating critique text undermines the assignment intent. | P0 boundary |
| F-29 | Generator diagram | Agent could generate a diagram and falsely label it self-drawn. | Once | Yes | Evidence type plus human attestation; agent may provide checklist/pseudocode critique only. | Reliability only | Low | Attestation cannot prove authorship. | P0 boundary |
| F-30 | Git commit log | Final log can be stale or copied with inconsistent format. | Many commits + final | No | Deterministic export during derive/package. | 10 min | Low | Uncommitted work is intentionally absent. | P1 |
| F-31 | README/self-assessment | Counts drift from cases/runs/bugs. | Final + revisions | Grade judgment only | Derived summary supplies factual counts; student supplies grade/rationale. | 30 min | High | Do not auto-award marks. | P1 |
| F-32 | PDF export | Markdown and PDF can diverge after late edits. | Several reports | Mechanical | Validate both exist; deterministic export deferred because Pandoc is unavailable. | None now | Low | Installing a PDF tool only for placeholders costs more than current value. | P2 |
| F-33 | Required files | One missing deliverable causes zero but is easy to overlook. | Final | No | `submission.json` plus strict fail-loudly validator. | 30-60 min | Medium | Presence alone does not prove quality. | P0 |
| F-34 | ZIP assembly | Files are manually selected, ZIP can overwrite itself, naming/hash can be wrong. | Final revisions | No | Strict validator, fixed naming, staging copy, SHA-256 manifest, no overwrite. | 20-40 min/run | Low | Windows PowerShell-specific. | P1 |
| F-35 | Historical context | Agents may load frozen HW05 evidence for routine HW06 work. | Many turns | No | Keep HW05 frozen and reference only selected reusable patterns; current registries are compact. | 10 min/turn | Very high | Historical evidence remains available when explicitly needed. | P0 |
| F-36 | Commit boundaries | Agents invent commit messages or mix generation/audit/execution. | Many steps | Partly | Stable phase convention in governance; no auto-commit helper. | 5 min | Low | Automated commits could capture incomplete or unrelated work. | P3 |

## Single sources of truth

| Canonical artefact | Owns | Derived consumers |
|---|---|---|
| Official HW06 requirement | Assignment obligations | Validator checklist, workflow audit |
| `eshop-sut/api_specification.md` | Documented API contract | Verified per-API extraction after selection |
| `project.json` | Student metadata, branch, selected APIs, Postman paths | Validation, summaries, collection checks |
| `ai-interactions.json` + captured files | AI tool/time/task and immutable prompt/output content | AI ledger and final audit input |
| `test-cases.json` | AI candidate and human-added case definitions | Postman mapping, Excel, summaries, traceability |
| `human-reviews.json` | Student verdict/reasoning/correction | Final cases, audit counts, traceability |
| `runs.json` + raw run directories | Execution provenance and case results | Execution summary, README counts, bug analysis |
| `bugs.json` | Bug lifecycle and factual details | Markdown bug report, issue body, README count |
| `ci-runs.json` | Required CI run links/commits/results | CI report and submission validation |
| `evidence.json` | Evidence path/type/time/attestation | Submission checklist and traceability |
| `postman-features.json` | Actually used Postman features | Final feature list |
| `submission.json` | Required output contract | Strict validator and package builder |

## Automation boundaries

### Fully automatable

- Validate schemas, IDs, counts, links, file presence, branch, naming, and hashes.
- Derive factual counts, traceability, bug tables, audit ledger, and commit log.
- Capture Newman command inputs/outputs and build a validated ZIP.
- Detect missing required evidence without inventing it.

### Automatable after human decision

- Persist a student-confirmed API selection.
- Persist VALID/INVALID/INCOMPLETE decisions and corrections.
- Convert a human-confirmed bug record into a GitHub-ready body.
- Record chosen Postman features and the intentional failing CI test.
- Assemble final reports after student prose and diagram are supplied.

### Must remain manual

- API choice and group non-duplication confirmation.
- Test-case human verdicts, extension rationale, and defect-vs-test-defect decisions.
- Genuine bug confirmation and GitHub publication.
- Authentic UI screenshots and verification of what they visibly prove.
- The self-drawn generator diagram and its design decisions.
- The 200-300 word AI critique and self-assessed grade.
- Oral-defense preparation and Moodle submission.

## Skills and configuration audit

| Component | Previous role | Finding | Decision |
|---|---|---|---|
| `AGENTS.md` / `CLAUDE.md` | Repository operating rules | Correct lifecycle, but no canonical-registry or capture commands. | UPDATE with short harness rules; keep byte-identical. |
| `ai-audit-report` skill | Build/validate a report from existing evidence | Evidence-safe, but cannot automatically capture the live chat transport. | KEEP; add project capture script before the skill is used. |
| `karpathy-guidelines` skill | Limit over-engineering | Appropriate for selecting a small harness. | KEEP unchanged. |
| `performance-testing-lifecycle` skill | HW05 performance methodology | Valuable historical reference but wrong technique for HW06. | KEEP in shared inventory; do not invoke for API testing. |
| `test-automation-design` skill | Convert frozen UI test cases into Playwright automation | Assumes a different workflow and commit-before-first-run model. | KEEP unchanged; not used for HW06 API generation. |
| Jira skills | Task decomposition/publication | HW06 requires GitHub Issues, not Jira. | KEEP unchanged; not used. |
| HW05 k6 scripts/workflow | Performance execution and evidence | Technique-specific and already archived/retired. | REPLACE with Newman wrapper only after real collection exists. |
| `run.sh` | Start/status/stop EShop | Already solves repeatable SUT startup. | KEEP; no duplicate launcher. |
| HW06 canonical registries | Missing | Needed to prevent cross-format divergence. | ADD. |
| HW06 validator/deriver | Missing | Needed for fail-loudly completeness and factual aggregation. | ADD. |
| Issue Form | Missing | Needed to standardize human-confirmed GitHub bugs. | ADD. |

## Token optimization

- Routine agents load small registries rather than raw Newman HTML/JSON or frozen HW05 evidence.
- AI prompt/output bodies are stored once in per-interaction files; the small ledger stores paths and hashes.
- Traceability and totals are generated, so rationales and counts are not regenerated in chat.
- API-specific extracts will be created only after selection, avoiding a premature full-spec summary.
- Generated views explicitly point back to canonical records and can be omitted from normal task context.

## Deferred choices

- No API-spec index is generated before API selection because the source is small and selection is human-owned.
- No Newman JSON importer is written until a real report reveals the exact stable structure used by this collection.
- No CI workflow is created before collection paths and a locally verified Newman command exist.
- No XLSX generator is added before the real test-case schema is exercised; CSV-only output would not satisfy the requirement.
- No screenshot browser automation is added because UI authenticity, login state, and visible evidence need human verification.
- No commit helper auto-stages or commits; meaningful completion remains a human/agent judgment.
- No PDF dependency is installed because the current machine has no Pandoc and PDF content does not yet exist.

## External tooling decisions

- [Postman: Install and run Newman](https://learning.postman.com/docs/reference/newman-cli/installing-running-newman/)
  documents Newman as a Node-based collection runner whose exit code can gate CI; the
  harness therefore installs Newman locally and preserves its exit code.
- [Postman: built-in reporters](https://learning.postman.com/latest-v-12/docs/reference/newman-cli/newman-built-in-reporters)
  and [external reporters](https://learning.postman.com/docs/reference/newman-cli/newman-custom-reporters/)
  document JSON as built-in and HTML as external; the harness
  uses JSON for machine-readable evidence and `newman-reporter-htmlextra` for HTML because the
  legacy `newman-reporter-html` package declares an incompatible Newman 4 peer dependency.
- [GitHub Issue Form syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
  documents forms under `.github/ISSUE_TEMPLATE`; the repository form uses required
  traceability fields and leaves publication and screenshot attachment to the student.
- [GitHub workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)
  documents artifacts as the mechanism for retaining logs and test results; the
  future CI workflow should upload raw Newman JSON, HTML, and console logs after local execution
  has established the exact command.

### Dependency security constraint

`npm audit` reports 19 advisories in the current Newman/reporter transitive tree (8 moderate,
10 high, and 1 critical). The suggested automated fix downgrades Newman to 2.1.2 and is not a
safe non-breaking repair. The lockfile is retained because Newman is the assignment-default
runner, but it must be used only with the trusted local HW06 collection, trusted local reporter
template, and localhost SUT. Do not run untrusted collections or templates through this toolchain.
Re-run `npm audit` before official execution and prefer a compatible patched release if one exists.

## Success criteria for this setup

- Workspace validation passes with an explicit warning that APIs are not selected.
- Submission validation fails loudly while real artefacts/evidence are absent.
- A fixture AI interaction can be captured, hash-validated, reviewed, and derived without claiming a real assignment interaction.
- Generated empty-state summaries report zero rather than inventing activity.
- `AGENTS.md` and `CLAUDE.md` remain byte-identical.
- The only unrelated working-tree change remains the runtime database.
