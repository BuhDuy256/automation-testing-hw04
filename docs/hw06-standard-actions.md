# HW06 Standard Action Catalog

## Purpose

This catalog defines one repeatable behavior for each recurring HW06 action. Agents must route
through the matching action instead of inventing a new procedure. The official assignment remains
authoritative for academic requirements; this catalog is authoritative for repository mechanics.

Status meanings:

- `READY`: the trigger, procedure, mechanism, outputs, validation, and fallback are defined and usable.
- `PARTIAL`: the standard is defined, but a real prerequisite such as selected APIs or a CI workflow does not yet exist.
- `MISSING`: no reliable standard exists.
- `OVERBUILT`: existing machinery costs more than the recurring action warrants.

## Catalog summary

| Action | Name | Baseline | Current | Preferred mechanism |
|---|---|---|---|---|
| ACT-AI-01 | Record an AI-generated artifact in the official audit report | PARTIAL | READY | Human-triggered update of `out/ai-audit-report.md` |
| ACT-SEL-01 | Record confirmed API selection | PARTIAL | READY | `project.json` + validator |
| ACT-SPEC-01 | Produce a verified API-spec extract | MISSING | PARTIAL | Human-verified Markdown extract |
| ACT-GEN-01 | Run an AI test-generation session | MISSING | PARTIAL | Guided generation + `test-cases.json` |
| ACT-REV-01 | Record human review and correction | PARTIAL | PARTIAL | `human-reviews.json` + validator |
| ACT-EXT-01 | Record a human-added case | PARTIAL | PARTIAL | `test-cases.json` + validator |
| ACT-PM-01 | Update the Postman implementation | MISSING | PARTIAL | Postman collection v2 JSON + validation |
| ACT-RUN-01 | Execute Newman and capture run evidence | PARTIAL | READY | `run-newman.mjs` |
| ACT-RUN-02 | Map Newman results to canonical cases | PARTIAL | PARTIAL | Raw JSON review + `runs.json` |
| ACT-EVID-01 | Capture and attest screenshot evidence | MISSING | READY | Playwright headless + `capture-screenshot.mjs` |
| ACT-BUG-01 | Register a bug candidate | PARTIAL | PARTIAL | `bugs.json` + evidence references |
| ACT-BUG-02 | Record genuine-bug confirmation | PARTIAL | PARTIAL | Human decision + `bugs.json` |
| ACT-BUG-03 | Publish and link a confirmed GitHub Issue | MISSING | READY | `publish-bug.mjs` + GitHub CLI |
| ACT-CI-01 | Capture a completed CI run | MISSING | PARTIAL | `capture-ci-run.mjs` + GitHub CLI |
| ACT-PM-02 | Record a used Postman feature | PARTIAL | PARTIAL | `postman-features.json` + evidence |
| ACT-DERIVE-01 | Regenerate factual reports | READY | READY | `npm run hw06:derive` |
| ACT-AUDIT-01 | Build the AI Audit Report | PARTIAL | READY | Official `out/ai-audit-report.md` template + human reviews |
| ACT-GIT-01 | Commit a meaningful procedure step | PARTIAL | READY | Git + workspace validation |
| ACT-GIT-02 | Export Git history | READY | READY | `npm run hw06:git-log` |
| ACT-SUB-01 | Validate submission readiness | READY | READY | Strict validator |
| ACT-SUB-02 | Build the final ZIP | READY | READY | `build-submission.ps1` |

No action is classified `OVERBUILT` after this pass. The existing registries remain supporting
bookkeeping, while this catalog—not additional schemas—is the behavioral routing layer.

## Action standards

### ACT-AI-01 — Record an AI-generated artifact in the official audit report

- **Trigger:** The human explicitly asks to write, record, or update the AI Audit Report, for example “Ghi AI Audit Report”.
- **Human decision required:** The student's VALID / INVALID / INCOMPLETE verdict, reasoning, and correction.
- **Preconditions:** `out/ai-audit-report.md` exists; the artifact and the student's review are available.
- **Inputs:** One AI-generated artifact, its prompt/context and tool, the original output, and the separate human review record.
- **Procedure:** Add or update one official-template row per AI-generated artifact; never create rows for ordinary reasoning, commands, or intermediate conversations.
- **Outputs/storage:** The official report under `out/`; canonical candidates remain in `work/registry/test-cases.json` and reviews in `human-reviews.json`.
- **Validation:** Preserve the five template fields and leave missing human decisions pending; never invent verdicts, reasoning, or student fixes.
- **Fallback:** Leave the report unchanged and record the missing human input.
- **Official source:** The official AI Audit Report template under `out/` and HW06 section 9.
- **Implementation:** Official template plus `ai-audit-report` skill when explicitly requested.

### ACT-SEL-01 — Record confirmed API selection

- **Trigger:** The student explicitly confirms one API from each Pool A/B/C and group uniqueness.
- **Human decision required:** All selection decisions.
- **Preconditions:** Three confirmed APIs and their feature/pool/endpoint identities.
- **Inputs:** API ID, pool, feature ID, name, method, path, confirmer, and confirmation time.
- **Preferred mechanism:** Update only `project.json.selectedApis`.
- **Procedure:** Record all three confirmations together; run validation; commit selection separately.
- **Outputs/storage:** `work/registry/project.json`.
- **Validation:** Workspace validation requires exactly A/B/C and complete confirmation fields.
- **Fallback:** If any decision is missing, keep `selectedApis` empty and stop API-specific work.
- **Official source:** Official HW06 requirement, sections 4–6.
- **Implementation:** Registry plus `validate.mjs`.

### ACT-SPEC-01 — Produce a verified API-spec extract

- **Trigger:** Immediately after ACT-SEL-01, once per selected API.
- **Human decision required:** Confirmation that each extracted rule matches the authoritative spec.
- **Preconditions:** Confirmed API selection and access to `eshop-sut/api_specification.md`.
- **Inputs:** Selected endpoint, related feature rules, parameters, schemas, states, and SEC-01–SEC-07.
- **Preferred mechanism:** Instantiate `work/templates/verified-api-spec.md` and point to exact source headings.
- **Procedure:** Read only relevant spec sections; extract without inventing behavior; add source anchors;
  record unknowns; have the student mark the extract verified before generation.
- **Outputs/storage:** `work/selection/<api-id>-verified-spec.md`.
- **Validation:** Endpoint matches `project.json`; every rule has a source reference; unknowns remain explicit.
- **Fallback:** Return to the full specification; never treat an unverified summary as authority.
- **Official source:** Official HW06 requirement and the repository API specification.
- **Implementation:** `work/templates/verified-api-spec.md`; waits for API selection.

### ACT-GEN-01 — Run an AI test-generation session

- **Trigger:** A verified spec extract exists and a bounded generation batch is planned.
- **Human decision required:** Batch scope and later case verdicts.
- **Preconditions:** ACT-SPEC-01 complete; target API and coverage slice identified.
- **Inputs:** Verified extract, existing case IDs, coverage gap, and explicit requested output structure.
- **Preferred mechanism:** Instantiate `work/templates/ai-generation-prompt.md` for focused slices and write candidates to `test-cases.json`.
- **Procedure:** Generate stepwise; preserve candidates unchanged; assign stable IDs; record concise source context on each artifact when useful; validate before starting another batch.
- **Outputs/storage:** Candidates in `test-cases.json` with `origin=AI`; no automatic interaction archive is required.
- **Validation:** Unique IDs, coverage, requirement references, and artifact-level source context where needed for later report writing.
- **Fallback:** Narrow the batch or clarify the spec; never use one generic prompt for all APIs.
- **Official source:** Official HW06 requirement, guiding principles and section 6.1.
- **Implementation:** Prompt template, canonical case registry, and validator; waits for API selection.

### ACT-REV-01 — Record human review and correction

- **Trigger:** An AI candidate is ready for student review.
- **Human decision required:** Verdict, reasoning, and correction.
- **Preconditions:** Immutable AI candidate exists.
- **Inputs:** Case ID, VALID/INVALID/INCOMPLETE, reasoning, correction, reviewer, and time.
- **Preferred mechanism:** Append a separate record to `human-reviews.json`; do not overwrite the candidate.
- **Procedure:** Student states judgment; agent records it verbatim; correction is mandatory for INVALID or
  INCOMPLETE; regenerate counts and traceability.
- **Outputs/storage:** `work/registry/human-reviews.json`.
- **Validation:** Exactly one review per AI case and attributable reviewer/time.
- **Fallback:** Leave the case unreviewed; never infer or auto-assign a verdict.
- **Official source:** Official HW06 requirement, sections 2 and 6.2.
- **Implementation:** Registry, deriver, and validator; cases do not exist yet.

### ACT-EXT-01 — Record a human-added case

- **Trigger:** The student identifies a test missed by AI.
- **Human decision required:** Case design and why AI missed it.
- **Preconditions:** Selected API and verified spec.
- **Inputs:** Case fields, requirement/coverage references, and extension rationale.
- **Preferred mechanism:** Append to `test-cases.json` with `origin=HUMAN`.
- **Procedure:** Record the student-authored case; preserve attribution; validate; regenerate summaries.
- **Outputs/storage:** `work/registry/test-cases.json`.
- **Validation:** Rationale is non-empty; case counts remain derived.
- **Fallback:** Keep it as a working note until the student supplies the missing rationale.
- **Official source:** Official HW06 requirement, section 6.3.
- **Implementation:** Registry, deriver, and validator; cases do not exist yet.

### ACT-PM-01 — Update the Postman implementation

- **Trigger:** A reviewed correction or human-added case changes the executable suite.
- **Human decision required:** Expected behavior and final test oracle.
- **Preconditions:** Reviewed canonical case exists.
- **Inputs:** Case ID, request data, setup/state, expected response/schema/security behavior.
- **Preferred mechanism:** Postman collection v2 JSON; include the canonical case ID in the request/test name.
- **Procedure:** Update the smallest collection section; set `X-Student-Id: 23127179` globally via a
  collection pre-request script or explicitly on every request; update project Postman paths; validate;
  commit implementation before official execution.
- **Outputs/storage:** Working collection/environment/data under `work/`; curated copies later under `out/`.
- **Validation:** JSON parses, case IDs are traceable, student header passes static preflight.
- **Fallback:** Use Postman UI, export v2 JSON, inspect the diff, then run the same validation.
- **Official source:** Postman collection/Newman documentation and official HW06 section 6.4.
- **Implementation:** Validator and Newman preflight; waits for selected APIs/cases.

### ACT-RUN-01 — Execute Newman and capture run evidence

- **Trigger:** Reviewed Postman files are committed and the SUT is in the intended state.
- **Human decision required:** Run purpose and readiness; not command mechanics.
- **Preconditions:** SUT status checked; collection passes ACT-PM-01; inputs are repository files.
- **Inputs:** Collection, optional environment/data, deterministic label, expected localhost hostname,
  and optional positive iteration count.
- **Preferred mechanism:** `node scripts/hw06/run-newman.mjs ...` using the locked local Newman binary.
- **Procedure:** Preflight header; run without suppressing the exit code or bailing early; capture CLI, JSON,
  HTML, stderr, timestamps, arguments, hashes, stats, and actual hostnames; register only structurally valid runs.
- **Outputs/storage:** `work/runs/<RUN-ID>/` and `runs.json`.
- **Validation:** JSON/HTML exist and parse; reported hostnames exactly match the expected host; process exit
  code is preserved; failed tests remain failures.
- **Fallback:** Preserve console files from a failed invocation, correct setup, and rerun with a new run ID.
- **Official source:** Postman Newman command reference and reporter documentation.
- **Implementation:** `scripts/hw06/run-newman.mjs`.

### ACT-RUN-02 — Map Newman results to canonical cases

- **Trigger:** ACT-RUN-01 produces a structurally valid run.
- **Human decision required:** Resolve ambiguous item-to-case mappings and classify failures.
- **Preconditions:** Raw Newman JSON and stable case IDs in Postman names.
- **Inputs:** `newman-report.json`, collection hash, case registry.
- **Preferred mechanism:** Read raw JSON once, map stable IDs into that run's `caseResults`, and retain the raw link.
- **Procedure:** Extract IDs; reject unknown/duplicate mappings; student reviews failed mappings; update run;
  validate and derive traceability.
- **Outputs/storage:** `runs.json.caseResults` linked to the immutable raw report.
- **Validation:** Every mapped ID exists and result is PASS/FAIL; submission mode catches unexecuted cases.
- **Fallback:** Record mapping as pending and inspect raw JSON; never infer from aggregate totals.
- **Official source:** Newman JSON reporter documentation.
- **Implementation:** Current registry/validator; importer intentionally waits for the first real report.

### ACT-EVID-01 — Capture and attest screenshot evidence

- **Trigger:** A stable browser-visible state proves a requirement, bug, Issue, or CI run.
- **Human decision required:** What the screenshot proves and visual acceptance after capture.
- **Preconditions:** Target URL/state is ready; secrets are absent or masked; authentication state is available if needed.
- **Inputs:** Evidence ID/type/description, URL, viewport, and viewport/full-page/element mode.
- **Preferred mechanism:** Playwright headless Chromium using `capture-screenshot.mjs capture`; PNG is mandatory.
- **Procedure:** Capture to deterministic path without overwrite; validate PNG and dimensions; record hash and
  source/final URL; student inspects image; agent records attestation with the same script.
- **Outputs/storage:** `work/evidence/screenshots/<EVID-ID>.png`, metadata, and `evidence.json`.
- **Validation:** PNG signature/dimensions/hash plus explicit human attestation.
- **Fallback:** For Postman desktop/native UI or blocked authentication, capture manually as PNG, use
  `capture-screenshot.mjs register --method ...`, then attest it; do not claim automated capture. GitHub upload remains a separate publication step.
- **Official source:** Playwright screenshot documentation.
- **Implementation:** `scripts/hw06/capture-screenshot.mjs`.

### ACT-BUG-01 — Register a bug candidate

- **Trigger:** A real run shows unexpected behavior after initial test-script checking.
- **Human decision required:** None yet; this is explicitly not a genuine-bug claim.
- **Preconditions:** Real run, case ID, expected/actual observations, and raw evidence exist.
- **Inputs:** Bug ID/title, case IDs, run ID, expected, actual, reproduction, and evidence paths.
- **Preferred mechanism:** Append `status=candidate` to `bugs.json`.
- **Procedure:** Link evidence; keep uncertainty explicit; derive the candidate report; investigate before confirmation.
- **Outputs/storage:** `work/registry/bugs.json`.
- **Validation:** Case/evidence references resolve; reports label it candidate.
- **Fallback:** Classify as test defect/unknown in working notes; do not publish.
- **Official source:** Official HW06 requirement, section 6.5 and anti-fabrication constraints.
- **Implementation:** Registry, deriver, and validator; no real failures exist yet.

### ACT-BUG-02 — Record genuine-bug confirmation

- **Trigger:** The student concludes a candidate is a genuine product bug.
- **Human decision required:** The genuine-bug judgment.
- **Preconditions:** Reproduction repeated; test oracle checked; evidence reviewed.
- **Inputs:** Candidate ID, confirmation statement, confirmer/time, final expected/actual/reproduction, screenshots.
- **Preferred mechanism:** Agent mechanically updates the candidate to `human-confirmed`.
- **Procedure:** Record the student's decision; verify evidence and screenshot attestation; preview ACT-BUG-03.
- **Outputs/storage:** Updated `bugs.json` and derived issue preview.
- **Validation:** Required confirmation fields and evidence exist.
- **Fallback:** Keep `candidate`; never publish uncertainty as a bug.
- **Official source:** Official HW06 human-review and bug-reporting requirements.
- **Implementation:** Registry, validator, and `publish-bug.mjs preview`.

### ACT-BUG-03 — Publish and link a confirmed GitHub Issue

- **Trigger:** Bug is `human-confirmed`, screenshots are attested, and no Issue URL exists.
- **Human decision required:** Explicit authorization to create the external Issue.
- **Preconditions:** Evidence screenshots are committed and the commit is available on GitHub; `gh` is authenticated.
- **Inputs:** Bug ID, canonical bug record, screenshot paths, repository, and confirmation token.
- **Preferred mechanism:** Preview, then `publish-bug.mjs publish --confirm <BUG-ID>` using `gh issue create
  --body-file`; embed committed images; verify with `gh issue view --json`.
- **Procedure:** Validate record/evidence; preview exact body; obtain user approval; verify pushed evidence commit;
  create Issue; read returned URL; fetch Issue JSON; validate bug/case IDs and image Markdown; persist real number/URL.
- **Outputs/storage:** Real GitHub Issue and updated `bugs.json`.
- **Validation:** GitHub returns an open Issue whose title/body match the canonical bug; local traceability validates.
- **Fallback:** Use the Issue Form/web UI to upload the PNG, then run `publish-bug.mjs link --issue-url ...` to
  verify and persist the real reference. Never fabricate a URL after a failed create.
- **Official source:** GitHub Issue creation, CLI create/view, image embedding, and attachment documentation.
- **Implementation:** `scripts/hw06/publish-bug.mjs` and the existing Issue Form.

### ACT-CI-01 — Capture a completed CI run

- **Trigger:** A required all-pass or intentional-single-failure GitHub Actions run is completed.
- **Human decision required:** Which test is intentionally broken and visual screenshot acceptance.
- **Preconditions:** CI workflow uploads a Newman artifact; run URL/ID exists; screenshot is captured and attested.
- **Inputs:** Run ID/URL, purpose, artifact name, screenshot evidence ID, and repository.
- **Preferred mechanism:** `capture-ci-run.mjs capture` with `gh run view` and `gh run download`.
- **Procedure:** Query real run JSON; require completed status; download the named artifact; parse Newman JSON;
  verify success/zero failures or failure/exactly one failed execution; store URL/SHA/results/evidence.
- **Outputs/storage:** `work/ci/runs/<CI-ID>/` and `ci-runs.json`.
- **Validation:** Remote conclusion, head SHA, Newman report, failure count, screenshot attestation, and URL agree.
- **Fallback:** Download artifact through GitHub UI, retain run URL and screenshot, then record only after the same
  report checks; never enter counts from the screenshot alone.
- **Official source:** GitHub workflow artifact, artifact download, and GitHub CLI run-view documentation.
- **Implementation:** `scripts/hw06/capture-ci-run.mjs`; real use waits for CI workflow.

### ACT-PM-02 — Record a used Postman feature

- **Trigger:** A Postman feature is actually used and evidence exists.
- **Human decision required:** Whether the use is meaningful for the report.
- **Preconditions:** Real use, not a planned feature.
- **Inputs:** Feature name, concrete usage, and evidence paths.
- **Preferred mechanism:** Append once to `postman-features.json`.
- **Procedure:** Record after first verified use; reuse the entry thereafter; derive the final feature list.
- **Outputs/storage:** `work/registry/postman-features.json`.
- **Validation:** Evidence paths resolve; no unused feature is listed.
- **Fallback:** Omit the feature until real evidence exists.
- **Official source:** Official HW06 technical requirements.
- **Implementation:** Registry and validator; no features have been exercised yet.

### ACT-DERIVE-01 — Regenerate factual reports

- **Trigger:** Any canonical registry changes.
- **Human decision required:** None; derived facts are mechanical.
- **Preconditions:** Registries validate structurally.
- **Inputs:** `work/registry/*.json` and referenced evidence.
- **Preferred mechanism:** `npm run hw06:derive`.
- **Procedure:** Generate all views together; never hand-edit them; review missing links rather than filling them speculatively.
- **Outputs/storage:** `work/generated/`.
- **Validation:** Run workspace validation and inspect generated status/traceability.
- **Fallback:** Fix canonical input; do not patch generated output.
- **Official source:** Repository operating model.
- **Implementation:** `scripts/hw06/derive.mjs`.

### ACT-AUDIT-01 — Build the AI Audit Report

- **Trigger:** The student explicitly requests the AI Audit Report.
- **Human decision required:** Review classifications, corrections, and final critique.
- **Preconditions:** The official template, generated artifacts, and available human review data exist.
- **Inputs:** `test-cases.json`, `human-reviews.json`, source context, and the official template.
- **Preferred mechanism:** The `ai-audit-report` skill against `out/ai-audit-report.md`.
- **Procedure:** Create one row per AI-generated artifact; use the actual artifact-level prompt/context and output; preserve pending fields when human review is missing.
- **Outputs/storage:** Curated report under `out/`; derived factual summaries remain under `work/generated/`.
- **Validation:** One row per artifact with the five official fields; verdicts, reasoning, and student fixes must be attributable to human review.
- **Fallback:** Leave unresolved rows pending; never invent missing evidence or human decisions.
- **Official source:** Official HW06 section 9.
- **Implementation:** Official template, canonical case/review registries, and existing skill.

### ACT-GIT-01 — Commit a meaningful procedure step

- **Trigger:** One generation/audit/extension/implementation/execution/CI/reporting step is complete.
- **Human decision required:** Whether the step is genuinely complete and meaningful.
- **Preconditions:** Relevant files validate; unrelated runtime state is excluded.
- **Inputs:** Intended file set and phase-oriented commit message.
- **Preferred mechanism:** Inspect diff/status; run validation; stage exact paths; inspect staged diff; commit.
- **Procedure:** Never mix API phases or unrelated database state; record real work only; report resulting SHA.
- **Outputs/storage:** Git commit on `hw06-api-testing`.
- **Validation:** `git show --stat --oneline HEAD` and `git status --short`.
- **Fallback:** Leave work uncommitted until the boundary is meaningful; do not create filler commits.
- **Official source:** Official HW06 section 12.
- **Implementation:** Git and repository commit discipline.

### ACT-GIT-02 — Export Git history

- **Trigger:** Final curation or after history changes relevant to a report draft.
- **Human decision required:** None.
- **Preconditions:** Required commits exist.
- **Inputs:** Current branch history and output path.
- **Preferred mechanism:** `npm run hw06:git-log` for working output; submission builder writes the final log.
- **Procedure:** Export full SHA, ISO time, and subject; never edit exported lines.
- **Outputs/storage:** `work/generated/git-commit-log.txt` or `out/git-commit-log.txt`.
- **Validation:** Compare first exported SHA with `git rev-parse HEAD`.
- **Fallback:** Run the documented `git log --date=iso-strict` format manually.
- **Official source:** Official HW06 section 12.
- **Implementation:** `scripts/hw06/export-git-log.ps1`.

### ACT-SUB-01 — Validate submission readiness

- **Trigger:** Before final export/package and after any final artefact change.
- **Human decision required:** Qualitative content acceptance remains separate.
- **Preconditions:** Derived factual files are current.
- **Inputs:** Registries, required files, evidence, CI/Issue links, and collection.
- **Preferred mechanism:** `npm run hw06:derive`, then `npm run hw06:validate:submission`.
- **Procedure:** Treat every error as blocking; fix canonical sources or supply real evidence; rerun until clean.
- **Outputs/storage:** Console validation result; no fabricated placeholder files.
- **Validation:** Exit code zero.
- **Fallback:** Use `submission.json` manually only to diagnose tool failure; do not bypass strict validation.
- **Official source:** Official HW06 submission regulations.
- **Implementation:** `scripts/hw06/validate.mjs`.

### ACT-SUB-02 — Build the final ZIP

- **Trigger:** ACT-SUB-01 passes and the student confirms the three-digit grade.
- **Human decision required:** Self-assessed grade and final submission approval.
- **Preconditions:** Final curated `out/`, clean strict validation, and no existing target ZIP.
- **Inputs:** Grade and `out/` contents.
- **Preferred mechanism:** `powershell -File scripts/hw06/build-submission.ps1 -Grade NNN`.
- **Procedure:** Derive; export Git log; strict validate; hash files; stage in a temporary directory; create fixed-name
  ZIP without overwrite; print ZIP hash.
- **Outputs/storage:** `out/23127179_HW06_AI_API_NNN.zip` and SHA-256 manifest.
- **Validation:** Builder exit code zero, exact name, readable ZIP, printed hash.
- **Fallback:** Fix the failing prerequisite; never manually bypass or fill missing artefacts.
- **Official source:** Official HW06 section 14.
- **Implementation:** `scripts/hw06/build-submission.ps1`.

## Official external behavior sources

- OpenAI Codex Hooks: <https://learn.chatgpt.com/docs/hooks>
- OpenAI Codex configuration reference: <https://learn.chatgpt.com/docs/config-file/config-reference>
- Claude Code Hooks: <https://code.claude.com/docs/en/hooks>
- Postman Newman command reference: <https://learning.postman.com/docs/collections/using-newman-cli/newman-options>
- Postman Newman built-in reporters: <https://learning.postman.com/latest-v-12/docs/reference/newman-cli/newman-built-in-reporters>
- Postman external reporters: <https://learning.postman.com/docs/reference/newman-cli/newman-custom-reporters/>
- Playwright screenshots: <https://playwright.dev/docs/screenshots>
- GitHub Issue creation: <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue>
- GitHub CLI issue create/view: <https://cli.github.com/manual/gh_issue_create> and <https://cli.github.com/manual/gh_issue_view>
- GitHub image embedding and file attachment: <https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax> and <https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files>
- GitHub workflow artifacts: <https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts>
- GitHub artifact download: <https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts>
- GitHub CLI run view: <https://cli.github.com/manual/gh_run_view>
