# HW06 API Testing — Continuation Handoff

## 1. Current objective

FR-04 generation, human review, extension, Postman/Newman execution, genuine-bug publication, and CI evidence are complete at the latest checkpoint below, subject to the documented unresolved limitations. The internal Codex operating protocol and the separate section 7 API Test Generator Skill are now installed. The next major phase is FR-08, but it has not started. When older narrative in this cumulative handoff conflicts with a later numbered checkpoint, the latest checkpoint and canonical evidence win.

## 2. Human-confirmed API selection

Status: **FINAL — HUMAN CONFIRMED**

| Pool | Feature | Selected operation |
|---|---|---|
| A | FR-04 Personal profile management | `PUT /api/users/me` |
| B | FR-08 Checkout | `POST /api/checkout` |
| C | FR-15 Product management | `POST /api/products` |

The selection prioritizes assignment compliance, at least 35 meaningful cases per API, low implementation friction, and fast Postman/Newman execution. Do not rerank or reopen this decision unless a genuine implementation blocker is discovered later.

## 3. Interpretation used

The working interpretation is:

```text
one selected API = one HTTP method/path operation
```

Supporting requests such as login, GET verification, setup, and cleanup may be used without becoming additional selected APIs. This follows the HW06 wording and examples that refer to APIs, endpoints, and operations. FR-15 is a CRUD feature family, but the selected API is its create operation.

## 4. Canonical state

The confirmed selection is stored in:

- `work/registry/project.json`

Checkpoint:

```text
ACT-SEL-01
COMPLETED — HUMAN CONFIRMED

ACT-SPEC-01
COMPLETED — HUMAN VERIFIED
```

The three human-verified ACT-SPEC-01 extracts are stored in:

- `work/selection/HW06-A-FR04-PUT-USERS-ME-verified-spec.md`
- `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`
- `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`

All three are marked `VERIFIED — HUMAN CONFIRMED`. They are the controlled scoped inputs for test generation; the official SUT sources remain authoritative.

Each extract is source-anchored and explicitly marked `VERIFIED — HUMAN CONFIRMED`. The official sources remain authoritative:

- `docs/hw06-req/2026.HW06.API Testing_En.md`
- `eshop-sut/api_specification.md`
- `eshop-sut/README.md` for business/security rules

## 5. Selected API quick reference

### FR-04 — `PUT /api/users/me`

- Requires an authenticated user JWT.
- Main body fields: `name`, `shipping_address`, `phone`.
- FR-04 requires a phone beginning with `0` and containing 10–11 digits; email must not change; role must not be client-controlled.
- Setup: login with a known user and capture the baseline profile.
- Cleanup: restore the baseline profile; use `GET /api/users/me` for read-back/schema verification.
- Important dimensions: phone boundaries, missing/wrong-type fields, persistence, JWT failures, input escaping, parameterized persistence, and SEC-06 role tampering.

### FR-08 — `POST /api/checkout`

- Requires an authenticated user JWT.
- Body fields: `total_amount`, `shipping_address`.
- FR-08 requires the backend to calculate the total from cart state, reject a client-forged total, and clear the cart after successful checkout.
- Setup: login, establish a known cart when testing cart-derived behavior, then capture order/cart state.
- State/reset concerns: orders persist in SQLite; implementation cart state is process memory, so isolated runs may require disciplined ordering or a backend reset.
- Important dimensions: auth, amount mismatch/partitions, address input, empty/non-empty cart, order creation, cart clearing, schema, SEC-02/04/05.

### FR-15 — `POST /api/products`

- Expected authorization: valid JWT with `role = 'admin'`.
- Body fields: `name`, `price`, `description`, `imageUrl`, `category_id`.
- FR-15 requires non-empty name up to 255 characters, positive price, and an existing category.
- Setup: login as admin and obtain a known category.
- Cleanup: generate unique product names, capture created IDs, and delete created products or reset the seeded SQLite database.
- Important dimensions: field boundaries/types, category dependency, admin versus user/no token, response/schema, persistence, SEC-02/03/04/05.

## 6. Known implementation observations

These are **BUG HYPOTHESIS — NOT YET CONFIRMED**. They must become bugs only after real execution, reproduction, evidence capture, and human review:

- `PUT /api/users/me`: implementation appears to accept a client-supplied `role` field.
- `POST /api/checkout`: implementation appears to trust client `total_amount` rather than recomputing from cart state.
- `POST /api/checkout`: implementation appears not to clear the in-memory cart after checkout.
- `POST /api/products`: implementation appears to lack authentication/authorization middleware and server-side validation.

Do not convert these observations into expected behavior or final bug reports before execution.

## 7. Important test-design boundary

Do not invent expected validation behavior where the official specification is silent. Separate:

- official contract;
- exploratory/robustness cases;
- implementation observations;
- confirmed bugs.

SEC-04 HTML/XSS-like input is not automatically expected to be rejected by the API; SEC-04 concerns safe escaping at display/output boundaries. SEC-05 black-box injection tests can reveal vulnerabilities, but a safe API response alone does not prove that parameterized queries are used internally.

## 8. Standard actions already available

The authoritative action procedures are in `docs/hw06-standard-actions.md`. Likely next actions are:

`ACT-GEN-01` → `ACT-REV-01` → `ACT-EXT-01` → `ACT-PM-01` → `ACT-RUN-01` → `ACT-RUN-02` → `ACT-EVID-01` → `ACT-BUG-01` → `ACT-BUG-02` → `ACT-BUG-03` → `ACT-DERIVE-01` → `ACT-GIT-01`.

Other available actions include `ACT-RUN-02`, `ACT-CI-01`, `ACT-PM-02`, `ACT-AUDIT-01`, `ACT-GIT-02`, `ACT-SUB-01`, and `ACT-SUB-02`. Use the catalog and existing registries; do not create another workflow abstraction.

## 9. Automation/tool interfaces

Important existing commands:

```text
npm run hw06:validate
npm run hw06:derive
npm run hw06:git-log
```

Relevant existing scripts include `scripts/hw06/validate.mjs`, `derive.mjs`, `run-newman.mjs`, `capture-screenshot.mjs`, `capture-ci-run.mjs`, `publish-bug.mjs`, and `export-git-log.ps1`.

**DO NOT redesign the automation harness.** Edit canonical registries and use the established derivation/validation mechanisms.

## 10. Evidence rules

Never fabricate Newman execution, HTTP request/response data, bugs, screenshots, GitHub Issues, CI runs, commit SHAs, human reviews, or other evidence. Use real execution and attributable evidence only. The `X-Student-Id: 23127179` header is required on every eventual test request.

## 11. Current repository state

- Branch: `hw06-api-testing`
- Latest existing commit before this task: `adc2bd08315ae91009fbf3ec47c49dbf25ffb06a` (`feat(hw06): standardize recurring agent actions`)
- Validation: `npm run hw06:validate` passed with 0 errors and 0 warnings after selection persistence.
- Derivation: `npm run hw06:derive` completed and regenerated factual summaries showing 3 selected APIs, 47 FR-04 AI-generated cases, and 7 human-added extension cases.
- Runtime-only modification: `eshop-sut/backend/database.sqlite` is modified in the working tree and is intentionally excluded from this work.
- This checkpoint’s intended files: `work/registry/test-cases.json` and `HANDOFF.md`; derived `work/generated/` outputs were regenerated by command and are not hand-edited.

## 12. Completed in this session

- ACT-SEL-01 completed: the three human-confirmed APIs were persisted in `work/registry/project.json` with real confirmation metadata.
- ACT-SPEC-01 completed for all three selected operations: the human verified the corrected extracts, and all three now carry `VERIFIED — HUMAN CONFIRMED` metadata.
- The former API-selection proposal status was updated to reflect final human confirmation.
- `out/README.md` was updated from “no API selection” to the confirmed selection and next gate.
- `npm run hw06:validate` passed.
- `npm run hw06:derive` completed.
- ACT-GEN-01 completed for FR-04 with 47 AI-generated candidates.
- The AI Audit operating model was corrected: `out/ai-audit-report.md` is authoritative, rows are artifact-level, and report updates are explicitly human-triggered.
- Obsolete interaction-level logging files, registry, script, and derived ledger were removed.
- Each candidate retains concise artifact-level generation context and tool information; no interaction IDs remain.
- ACT-REV-01 completed for all 47 FR-04 AI-generated candidates; verdicts and corrections are stored in `work/registry/human-reviews.json`.
- Human review result: 21 VALID, 16 INCOMPLETE corrected, 10 INVALID rejected, 37 usable AI-origin cases.
- The original 47 AI artifacts in `work/registry/test-cases.json` remain unchanged and preserved for the later AI Audit Report.
- ACT-EXT-01 completed for FR-04 with seven human-authored extension cases: `FR04-H-001` through `FR04-H-007`.
- FR-04 HUMAN EXTEND corrective update completed: `FR04-H-003` is explicitly single-fault isolation, and `FR04-H-004` is the distinct empty-string phone partition.
- Total usable FR-04 cases are 44: 37 usable AI-origin cases plus 7 extension cases.
- `npm run hw06:validate` passed with 0 errors and 0 warnings after generation.
- `npm run hw06:derive` regenerated the factual summaries after review cleanup and extension recording.
- `out/ai-audit-report.md` was updated after the explicit request `Ghi AI Audit Report`; it now contains 47 artifact-level AI rows with 21 VALID, 16 INCOMPLETE, and 10 INVALID verdicts.
- `HANDOFF.md` is the single continuation entry point.

## 13. Next action

FR-04 HUMAN EXTEND remains complete. This checkpoint does not advance into the Postman phase; `ACT-PM-01`, execution, bug work, and CI remain not started.

The AI Audit Report is now updated from the confirmed review data. It uses one row per reviewed AI-generated artifact and the five official template fields. The exact standalone generation prompt was not separately captured, so each row identifies the preserved artifact-level generation context and Codex tool without reconstructing a prompt.

The next session should:

1. read `./HANDOFF.md`;
2. read `work/selection/HW06-A-FR04-PUT-USERS-ME-verified-spec.md`;
3. inspect the ACT-PM-01 standard;
4. build the FR-04 Postman collection using the 44 usable FR-04 cases;
5. validate the collection before any execution.

Do not execute the API, confirm bugs, publish GitHub Issues, or create CI/CD evidence before the Postman implementation is complete and validated.

Human review summary:

```text
AI originally generated: 47
VALID as-is: 21
INCOMPLETE corrected: 16
INVALID/rejected: 10
Reviewed usable AI-origin suite: 37
Extension cases: 7
Total usable FR-04 cases: 44
```

The AI Audit Report has been updated after the explicit human instruction `Ghi AI Audit Report`. No runtime result, bug confirmation, or unsupported citation is claimed in the report.

Recommended generation order, not a new selection decision:

```text
FR-04 PUT /api/users/me
→ FR-15 POST /api/products
→ FR-08 POST /api/checkout
```

This order minimizes early state friction; checkout should be handled after the simpler profile and product setup patterns are established.

## 14. Important unresolved blockers

- Group-level API duplication among classmates has not been externally checked; no group allocation data was available in the repository.
- CI workflow and real execution evidence are intentionally not created yet.

## 15. Latest checkpoint — FR-04 Postman build

The FR-04 executable Postman suite is now built and statically validated. This phase did not start the SUT, run Newman, confirm bugs, publish issues, update the AI Audit Report, or create execution evidence.

Status:

```text
FR-04

AI GENERATE       COMPLETE
HUMAN REVIEW      COMPLETE
HUMAN EXTEND      COMPLETE
POSTMAN BUILD     COMPLETE
EXECUTE           NOT STARTED
BUG               NOT STARTED
```

Canonical working artifacts:

- `work/postman/fr04/FR04-profile.postman_collection.json`
- `work/postman/fr04/FR04-profile.postman_environment.json`
- `work/postman/fr04/FR04-cases.postman_data.json`
- `work/postman/fr04/README.md`

The data file contains exactly 44 rows: 37 reviewed-usable AI cases and 7 HUMAN extension cases. The 10 AI cases with final `INVALID` verdicts are excluded. The collection uses setup/login, baseline capture, temporary second-user registration for `FR04-H-005`, data-driven execution of `PUT /api/users/me`, read-back helpers, and API-level baseline restoration. A collection pre-request script injects `X-Student-Id: 23127179` into every request, including supporting requests and asynchronous helper calls.

The verified endpoint contract does not define exact PUT response statuses or schemas, so the collection avoids invented status/body assertions. Persisted email/role invariants, authenticated read-back, invalid-phone non-persistence, and cross-user isolation are asserted where the reviewed case defines them. The display-boundary limitation of SEC-04 remains documented as an observation boundary; the API suite does not claim that an API read-back proves UI escaping.

Deterministic checks passed:

```text
44 canonical data rows; 47 original AI; 37 usable AI; 7 HUMAN; 10 INVALID excluded
Postman JSON parsing passed for collection, environment, and data
npm run hw06:derive — passed
npm run hw06:validate — passed (0 errors, 0 warnings)
```

The next permitted phase is ACT-RUN-01 after this implementation is committed and the SUT is intentionally prepared. Do not execute Newman in the current checkpoint.

## 16. Latest checkpoint — corrected FR-04 Postman build

The student identified harness defects before approving Newman. The FR-04 Postman implementation was corrected without changing API selection, scoped specification, the 47 AI artifacts, human verdicts, or the seven HUMAN extensions.

Corrected working artifacts:

- `work/postman/fr04/FR04-profile.postman_collection.json` — 41 input-partition cases driven by `FR04-cases.postman_data.json`.
- `work/postman/fr04/FR04-profile-stateful.postman_collection.json` — dedicated real sequences for `FR04-AI-031`, `FR04-AI-046`, and `FR04-H-005`.
- `work/postman/fr04/FR04-profile.postman_environment.json` — exact baseline and validly signed expired-token inputs.
- `work/postman/fr04/FR04-cases.postman_data.json` — 41 unique data rows.
- `work/postman/fr04/README.md` — execution separation and cleanup limitations.

Correction results:

- Mapper branches use explicit braces; `FR04-AI-021` null address, `FR04-H-003` array address, `FR04-AI-024` HTML-like values, and ordinary addresses remain distinct.
- Baseline snapshots preserve JSON `null` values and restore using the captured value instead of `|| ''` normalization.
- `FR04-AI-019` sends Vietnamese Unicode name/address and compares exact read-back values.
- `FR04-AI-041` sends an actual `unexpected_property` while leaving documented fields valid.
- `FR04-AI-031` performs real PUT V2 → PUT V3 → GET final V3 → restore → exact cleanup verification.
- `FR04-AI-046` performs two real identical PUTs → GET stable state → restore → exact cleanup verification.
- Negative-authentication cases verify that a valid-token read-back remains equal to the exact baseline; no undocumented status/schema is asserted.
- `FR04-AI-009` uses a validly HMAC-signed JWT with `exp=1`; deterministic local preflight confirmed signature equality and expiration payload. The signing secret is not committed.
- `FR04-H-005` creates user B only inside its dedicated flow, compares A's mutation and all five B baseline fields including `null`, then restores and verifies A.
- `FR04-H-007` reads the profile after the empty-body request and checks all five baseline fields before cleanup.
- Cleanup verifies persisted state after restoration. If a protected field cannot legally be restored through the documented PUT contract, the suite exposes that limitation instead of claiming cleanup success.
- `FR04-AI-024` marks API read-back as insufficient for SEC-04 UI escaping and leaves the display-boundary check for separate manual/UI verification.

Accounting and deterministic validation:

```text
47 original AI; 21 VALID; 16 INCOMPLETE; 10 INVALID
37 usable AI-origin; 7 HUMAN; 44 represented; 44 unique
41 data-driven rows + 3 dedicated stateful cases
Canonical test-cases.json and human-reviews.json unchanged
Collection/environment/data JSON parse: PASS
Postman script syntax preflight: PASS (16 scripts)
Valid expired-token signature/exp preflight: PASS
npm run hw06:derive: PASS
npm run hw06:validate: PASS (0 errors, 0 warnings)
```

No SUT start, Newman run, execution evidence, bug confirmation, GitHub Issue, screenshot, CI run, or Newman report was created. The next checkpoint remains before ACT-RUN-01 until the corrected implementation is committed and separately approved for execution.

The authorized AI Audit Report update is complete in `out/ai-audit-report.md`. It preserves the original 47 artifact rows and summary, then adds one separate addendum for this correction interaction. No earlier missing prompt/output was reconstructed; the exact prompt time was not separately captured.

## 17. Latest checkpoint — FR-04 real execution

FR-04 execution was performed against a freshly started and reseeded local SUT. The initial sandbox attempt failed before Newman could spawn (`spawnSync ... node.exe EPERM`) and produced no report; it is not registered as a real run. The official harness was then executed with the approved local process capability.

SUT readiness:

- `bash ./run.sh stop` cleared stale dead PID entries before startup.
- `bash ./run.sh start` started the backend on `localhost:3000` and both frontends on `5173`/`5174`.
- Direct checks returned `backend=200 web=200 admin=200`.
- Backend startup reseeded the SQLite database before the official run.

Official commands:

```text
node scripts/hw06/run-newman.mjs --collection work/postman/fr04/FR04-profile.postman_collection.json --environment work/postman/fr04/FR04-profile.postman_environment.json --data work/postman/fr04/FR04-cases.postman_data.json --label fr04-input --hostname localhost:3000
node scripts/hw06/run-newman.mjs --collection work/postman/fr04/FR04-profile-stateful.postman_collection.json --environment work/postman/fr04/FR04-profile.postman_environment.json --label fr04-stateful --hostname localhost:3000
```

Real run IDs:

- `RUN-20260822062948963-fr04-input` — 41 data-driven cases, exit code 1.
- `RUN-20260822063250172-fr04-stateful` — `FR04-AI-031`, `FR04-AI-046`, and `FR04-H-005`, exit code 0.

The harness runtime reports prove `X-Student-Id: 23127179` on every captured request: 263/263 for the input run and 20/20 for the stateful run. All reported hostnames were `localhost:3000`.

Execution accounting:

```text
Usable cases expected: 44
Executed: 44
Passed: 34
Failed: 10
Blocked execution: 0
Manual/UI follow-up overlay: FR04-AI-024 SEC-04 display escaping remains pending; its API portion passed.
```

Failure triage:

| Case IDs | Category | Finding |
|---|---|---|
| `FR04-AI-013`, `FR04-AI-014`, `FR04-AI-015`, `FR04-AI-016`, `FR04-AI-017`, `FR04-H-004` | `BUG-CANDIDATE` | Correctly stimulated invalid phone values were observed as persisted values instead of the captured baseline. Candidate: `BUG-CANDIDATE-FR04-PHONE-FORMAT`. |
| `FR04-AI-026` | `BUG-CANDIDATE` | Correctly stimulated `role=admin` changed the persisted role from `user` to `admin`; cleanup also exposed that the protected field could not be restored through the documented PUT. Candidate: `BUG-CANDIDATE-FR04-ROLE-TAMPERING`. |
| `FR04-H-001`, `FR04-H-002` | `HARNESS` | The collection mapper sent the default valid string phone instead of the reviewed numeric/null stimuli. No SUT bug is claimed. |
| `FR04-H-007` | `SPEC-GAP` | Empty-body behavior and mutation semantics are undocumented; the observed null fields are retained as evidence but not classified as a product bug. |

Canonical case mappings are stored in `work/registry/runs.json`; candidate records are stored in `work/registry/bugs.json`. No human-confirmed bug, GitHub Issue, screenshot, CI run, or AI Audit Report update was created.

Current status:

```text
FR-04

AI GENERATE        COMPLETE
HUMAN REVIEW       COMPLETE
HUMAN EXTEND       COMPLETE
POSTMAN BUILD      COMPLETE
EXECUTE            COMPLETE
BUG REVIEW         NEXT — two candidate records await human review
```

The next session must review the ten failures and the two candidate records before any confirmation or publication. Do not begin FR-15, FR-08, GitHub Issue publication, or CI/CD work from this checkpoint.

## 18. Latest checkpoint — FR-04 targeted bug review and correction

The student human-reviewed the original FR-04 Newman evidence and authorized targeted correction/rerun only. The original runs remain preserved:

- `RUN-20260822062948963-fr04-input`
- `RUN-20260822063250172-fr04-stateful`

The current phase corrected only the executable mapping/oracle for `FR04-H-001`, `FR04-H-002`, and `FR04-H-003`. Canonical test cases, human extension rationales, origins, and IDs were not changed. The official AI Audit Report was not updated.

Corrected runtime stimulus was captured in `stdout.log`:

- H-001 sent JSON number `1234567890`; the API returned 200 and persisted the value as string `"1234567890"`. This remains an exploratory wrong-type observation, not a confirmed bug.
- H-002 sent JSON `null`; the API returned 200 and persisted `null`. This remains an exploratory wrong-type observation, not a confirmed bug.
- H-003 sent `shipping_address: ["wrong", "type"]` with valid name and phone; the API returned 200 and the read-back represented the value as `"[object Object]"`. This remains an exploratory wrong-type observation, not a confirmed bug.

Targeted corrected runs:

| Run | Scope | Exit | Runtime header proof | Result |
|---|---|---:|---:|---|
| `RUN-20260823022303042-fr04-harness-corrected` | H-001/H-002/H-003 | 0 | 21/21 | 3 PASS exploratory observations |
| `RUN-20260823022316955-fr04-phone-corrected` | AI-013/H-004 | 1 | 14/14 | both FAIL verified phone-contract violation |
| `RUN-20260823022329715-fr04-role-corrected` | AI-026 | 1 | 7/7 | FAIL; clean baseline role=user became admin |
| `RUN-20260823022342040-fr04-ai027-corrected` | AI-027 | 1 | 7/7 | FAIL; independent clean rerun, no contamination from AI-026 |
| `RUN-20260823022618165-fr04-ai009-provenance` | AI-009 | 0 | 5/5 | PASS; validly signed expired JWT |

Each targeted run uses the official `scripts/hw06/run-newman.mjs` harness and has separate JSON, HTML, stdout, stderr, and metadata evidence under `work/runs/<RUN-ID>/`. Each group was preceded by `bash ./run.sh stop` and `bash ./run.sh start`; backend startup reseeded the SQLite database. The role and AI-027 groups therefore both proved baseline `role=user` through authenticated GET before mutation.

The local SUT source confirms the expired-token environment value uses the configured local signing key: verification fails with `TokenExpiredError`, not invalid-signature error, and its decoded `exp=1` is expired. The secret is not copied into any report or committed artifact.

Canonical bookkeeping now includes the targeted run mappings in `work/registry/runs.json` and the new evidence paths/clean-state findings in `work/registry/bugs.json`. Both bug records remain `status=candidate` with notes `READY FOR HUMAN CONFIRMATION`; neither is `human-confirmed` or published. The role candidate groups `FR04-AI-026` and the independently reproduced `FR04-AI-027` under the existing single candidate.

Corrected FR-04 accounting:

```text
PASS: 35
FAIL — VERIFIED CONTRACT VIOLATION: 8
  phone: AI-013, AI-014, AI-015, AI-016, AI-017, H-004
  role: AI-026, AI-027
HARNESS: 0 remaining after corrected targeted rerun
SPEC-GAP / IMPLEMENTATION OBSERVATION: H-007
MANUAL/UI FOLLOW-UP: AI-024 SEC-04 display escaping remains pending
EVIDENCE LIMITATION: AI-009 resolved; validly signed expired JWT reproduced
Total represented: 44
```

The original 44-case run is not rewritten; its historical AI-027 PASS and H-001/H-002/H-003 outcomes remain in the original run record. The corrected accounting above uses targeted evidence to replace contaminated or harness-invalid interpretations.

Current status:

```text
FR-04

AI GENERATE        COMPLETE
HUMAN REVIEW       COMPLETE
HUMAN EXTEND      COMPLETE
POSTMAN BUILD      COMPLETE
EXECUTE            COMPLETE
BUG REVIEW         COMPLETE — targeted evidence prepared
BUG CONFIRMATION   WAITING FOR HUMAN
```

Do not publish GitHub Issues, create CI evidence, start FR-08/FR-15, or update `out/ai-audit-report.md` until the student makes the next explicit decision.

## 19. Latest checkpoint — FR-04 human bug confirmation

The student explicitly confirmed both existing FR-04 bug candidates after reviewing the original and targeted Newman evidence. No historical run was rewritten, no duplicate bug was created, and the official AI Audit Report was not updated.

Confirmed canonical bug records:

| Bug ID | Registry status | Scope | Human confirmation |
|---|---|---|---|
| `BUG-CANDIDATE-FR04-PHONE-FORMAT` | `human-confirmed` | One phone-validation defect covering AI-013, AI-014, AI-015, AI-016, AI-017, and H-004 | Explicit chat confirmation after clean AI-013/H-004 reproduction |
| `BUG-CANDIDATE-FR04-ROLE-TAMPERING` | `human-confirmed` | One protected-account-field mutation defect covering AI-026 role mutation and independent AI-027 email/role mutation | Explicit chat confirmation after clean AI-026 and AI-027 evidence |

The existing Newman JSON/HTML/stdout evidence paths remain attached in `work/registry/bugs.json`, including the original `RUN-20260822062948963-fr04-input` evidence and targeted runs `RUN-20260823022316955-fr04-phone-corrected`, `RUN-20260823022329715-fr04-role-corrected`, and `RUN-20260823022342040-fr04-ai027-corrected`. No screenshot, GitHub Issue URL, issue number, or publication timestamp is claimed.

Remaining reviewed distinctions are preserved:

- `FR04-H-002` and `FR04-H-003` remain exploratory wrong-type observations, not confirmed bugs.
- `FR04-H-007` remains `SPEC-GAP / IMPLEMENTATION OBSERVATION`.
- `FR04-AI-024` has an API-side result, but SEC-04 UI/display-boundary verification still needs real manual evidence.
- `FR04-AI-009` retains its validly signed and expired JWT provenance evidence.

Current status:

```text
FR-04

AI GENERATE        COMPLETE
HUMAN REVIEW       COMPLETE
HUMAN EXTEND       COMPLETE
POSTMAN BUILD      COMPLETE
EXECUTE            COMPLETE
BUG REVIEW         COMPLETE
BUG CONFIRMATION   COMPLETE
```

The next permitted FR-04 action is ACT-EVID-01 screenshot capture/attestation for the confirmed bugs, followed by ACT-BUG-03 preview/publication only after a separate explicit external-publication instruction. Do not begin FR-08, FR-15, CI/CD, final submission curation, or AI Audit Report updates from this checkpoint.

## 20. Latest checkpoint — ACT-EVID-01 partial

Real screenshot evidence was prepared from the existing Newman HTML reports without rerunning the SUT or changing test outcomes:

- `work/evidence/screenshots/EVID-FR04-PHONE-FAILURE.png` — expanded real Newman failure tab for `FR04-AI-013` and `FR04-H-004`, sourced from `RUN-20260823022316955-fr04-phone-corrected`.
- `work/evidence/screenshots/EVID-FR04-ROLE-TAMPERING.png` — expanded real Newman failure tab for `FR04-AI-026`, with `FR04-AI-027` retained as supporting evidence, sourced from `RUN-20260823022329715-fr04-role-corrected` and `RUN-20260823022342040-fr04-ai027-corrected`.
- `EVID-FR04-PHONE-REPORT.png` and `EVID-FR04-ROLE-REPORT.png` — real Newman summary views retained as supplementary run-level screenshots.

The canonical evidence registry is `work/registry/evidence.json`; screenshot metadata includes source run IDs, canonical case IDs, confirmed bug IDs, hashes, capture method, and the explicit `humanAttestation=false` state. The two bug screenshots have been visually inspected by the agent but are not yet human-attested.

ACT-EVID-01 remains **PARTIAL** because the required real Postman Console screenshot showing `X-Student-Id: 23127179` is not available in this environment. No mock, generated, or Newman screenshot is being substituted for that Postman-specific requirement. Human capture and attestation remain pending. No GitHub Issue, publication URL, or AI Audit Report update was created.

## 21. Latest checkpoint — Postman Console evidence captured

The student manually captured and supplied the real Postman Desktop Console screenshot:

- `work/evidence/screenshots/EVID-FR04-POSTMAN-CONSOLE.png`
- Supporting request: `Login user A` — `POST /api/login`
- Visible proof: `200` response and `X-Student-Id: 23127179` under `Request Headers`.
- Capture method: manual Postman Desktop Console capture.
- Human attestation: recorded for `Nguyen Bao Duy`.

The evidence registry and screenshot metadata now contain the manual-capture provenance and requirement mapping. ACT-EVID-01 remains **PARTIAL** only because the previously created Newman bug screenshots have not yet received explicit human attestation. No API rerun, collection change, GitHub Issue, or AI Audit Report update was made in this step.

## 22. Latest checkpoint — ACT-EVID-01 complete

The student explicitly confirmed that the four Newman screenshots are genuine execution evidence and visually correct. The standard attestation command recorded human attestation under `Nguyen Bao Duy` for:

- `EVID-FR04-PHONE-REPORT`
- `EVID-FR04-PHONE-FAILURE`
- `EVID-FR04-ROLE-REPORT`
- `EVID-FR04-ROLE-TAMPERING`

Together with the already-attested `EVID-FR04-POSTMAN-CONSOLE`, all screenshot evidence required for the current ACT-EVID-01 scope now has explicit human attestation. ACT-EVID-01 is **COMPLETE**. No API was rerun, no collection was changed, no GitHub Issue was published, and no AI Audit Report update was made.
## 23. Latest checkpoint — FR-04 GitHub Issue publication complete

The student explicitly authorized publication of exactly two FR-04 GitHub Issues after reviewing the corrected drafts. The publication helper performed the final registry/evidence checks, created both Issues, and verified their returned URLs and open-page content.

Published Issues:

- `BUG-CANDIDATE-FR04-PHONE-FORMAT` → Issue #13: https://github.com/BuhDuy256/automation-testing-hw04/issues/13
- `BUG-CANDIDATE-FR04-ROLE-TAMPERING` → Issue #14: https://github.com/BuhDuy256/automation-testing-hw04/issues/14

Public titles:

- `[HW06][FR-04] PUT /api/users/me persists phone values outside the documented format`
- `[HW06][FR-04][SEC-06] PUT /api/users/me allows a client to persist role=admin`

Issue B is intentionally limited to the protected role mutation: baseline `role=user`, client payload `role=admin`, persisted result `role=admin`, primary case `FR04-AI-026`, and clean run `RUN-20260823022329715-fr04-role-corrected`. The internal `FR04-AI-027` email observation remains in canonical records but is not part of the public Issue finding.

Real GitHub Issue-page screenshots were captured without rerunning the SUT:

- `EVID-FR04-PHONE-ISSUE` → `work/evidence/screenshots/EVID-FR04-PHONE-ISSUE.png`
- `EVID-FR04-ROLE-ISSUE` → `work/evidence/screenshots/EVID-FR04-ROLE-ISSUE.png`

Both screenshots visibly show the public repository, Issue title/number, and embedded Newman evidence. Human attestation is intentionally pending for both; the student must inspect and attest them.

The canonical bug registry now records both bugs as `published` with real Issue numbers/URLs and the publication commit SHA. The generated factual report is `work/generated/bug-report.md`; it contains only real published bug data and Issue URLs.

Validation after publication passed with 0 errors and 2 expected warnings for the pending human attestation of the two new GitHub Issue-page screenshots. FR-04 publication is complete; the next gate is human inspection/attestation of `EVID-FR04-PHONE-ISSUE` and `EVID-FR04-ROLE-ISSUE`. FR-08, FR-15, CI/CD, and final submission curation remain not started.

## 24. Latest checkpoint — GitHub Issue screenshot attestation complete

The student explicitly inspected and attested the two real published GitHub Issue-page screenshots. ACT-EVID-01 attestation was recorded under `Nguyen Bao Duy` for:

- `EVID-FR04-PHONE-ISSUE`
- `EVID-FR04-ROLE-ISSUE`

Their registry and metadata records now have `humanAttestation=true` with real attestation timestamps. `npm run hw06:derive` completed, `npm run hw06:validate` passed with 0 errors and 0 warnings, and `git diff --check` passed. FR-04 bug publication evidence is complete. The next work is the fresh FR-04 closure audit and CI/CD requirement; FR-08 remains not started.

## 25. Latest checkpoint — FR-04 closure audit and real CI runs complete; CI attestation pending

The current collection/run audit did not reuse the stale historical full run. The final official FR-04 primary execution is `RUN-20260823040227192-fr04-canonical-input`, using collection SHA-256 `35d8ef322af899bd42ae9399c1f31c46145287e4a35622f7a37f2a9001a3551f`, environment SHA-256 `c7709dfbb133ae0d4328e191b8aee9ca8247ee9390f41f5fd5d1a89e29e4a76a`, and data SHA-256 `905c5448170c40746565300360d3840865a643ca5a7249b1c25580dffc72eb14`. It captured Newman JSON, HTML, stdout, metadata, and `264/264` requests carrying `X-Student-Id`. The official supporting runs are recorded in `project.json`: the clean stateful run, H-006/H-007 closure run, and isolated AI-027 run. Two accidentally overlapping local runs remain preserved but explicitly excluded as harness-concurrency evidence; they contribute no canonical case results.

The derived-summary defect was real. Historical PASS and FAIL observations for the same case were accumulated independently, producing unreconciled totals. `derive.mjs` now selects the latest canonical result per case, while `validate.mjs` independently checks duplicate mappings and `passed + failed = executed`. The reconciled FR-04 totals are:

- 47 AI-generated cases; 7 human-added cases.
- 44 executable and 44 executed cases.
- 35 passed and 9 failed cases.
- 8 failures map to the two published bugs.
- 1 failure (`FR04-H-007`) remains a `SPEC-GAP-OBSERVATION`; the missing body produced persisted `name=null`, while exact missing-body behavior is undocumented.

Eight genuinely exercised Postman features are registered and derived: collections; environments/environment variables; collection pre-request scripts; test scripts/assertions; data-driven Newman iterations; `pm.sendRequest` helper requests; Newman CLI with JSON/HTML reporters; and Postman Console.

The real CI workflow is `.github/workflows/hw06-fr04-ci.yml`. It runs the explicitly identified stable canonical sample `FR04-AI-001` and does not replace or weaken the complete 44-case suite. It starts the backend on GitHub-hosted Ubuntu, waits for health, runs Newman with the student header, and uploads JSON/HTML/stdout/backend artifacts.

Verified sample runs:

- All-pass commit `d8670c47fd18ede663f4da11410d46ed598de891`; run `32617199599`; https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617199599; success; 5 Newman request executions, 6 assertions, 0 failed assertions.
- Intentional-failure commit `84f837f95c44f928add2d719d0a5669688d45350`; run `32617321761`; https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32617321761; failure; 5 Newman request executions, 6 assertions, exactly 1 failed assertion named `FR04-AI-001 [CI-DEMO] intentional single failure`.
- Restore commit `3f520db154443fbf34b126cf8c3cdce4c3698525` returned the branch sample to all-pass mode; its follow-up run `32617663218` succeeded. No required sample commit was rewritten or squashed.

CI evidence is registered with real run IDs, URLs, commit SHAs, Newman artifacts, and screenshots:

- `EVID-CI-FR04-ALL-PASS` — `work/evidence/screenshots/EVID-CI-FR04-ALL-PASS.png`
- `EVID-CI-FR04-INTENTIONAL-FAILURE` — `work/evidence/screenshots/EVID-CI-FR04-INTENTIONAL-FAILURE.png`

Both CI screenshots intentionally remain `humanAttestation=false`; these two warnings are the next human gate. Derived/finalized reports are `work/generated/ci-cd-report.md`, `out/ci-cd-report.md`, `work/generated/bug-report.md`, `out/bug-report.md`, `work/generated/postman-features.md`, and `out/postman-features.md`. Promoted official FR-04 Postman/Newman artifacts and provenance are under `out/fr04/`.

FR-04 must not yet be labeled CLOSED. Remaining gates are: human visual attestation of the two CI screenshots; real UI/display-boundary verification for `FR04-AI-024` under SEC-04; and explicit disposition of the documented `FR04-H-007` specification-gap observation if closure policy requires more than retaining it as an exploratory non-bug failure. FR-08, Agent Skill/generator work, and unrelated external publication have not started.

## 26. Latest checkpoint — canonical FR-04 suite integrated in CI; new screenshot attestation pending

The student explicitly inspected and attested the two existing CI mechanism screenshots under `Nguyen Bao Duy`:

- `EVID-CI-FR04-ALL-PASS`
- `EVID-CI-FR04-INTENTIONAL-FAILURE`

Their evidence registry, metadata, and CI registry states now record completed human attestation. Validation immediately after attestation passed with 0 errors and 0 warnings. The two finalized PNGs are promoted under `out/fr04/evidence/`.

The existing smoke workflow and real runs remain unchanged. They use only stable canonical case `FR04-AI-001` to demonstrate one genuine green CI state and one transparent intentional failure named `FR04-AI-001 [CI-DEMO] intentional single failure`. They do not prove that all 44 canonical FR-04 cases pass and are not described as full-suite evidence.

A separate frozen-before-execution workflow now integrates the complete canonical FR-04 suite:

- Workflow: `.github/workflows/hw06-fr04-canonical-full-suite.yml`
- Freeze commit: `f34b71b24f368c819140fa077ce8942b76893470`
- Real run: `32618732832` — https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32618732832
- Result: `failure`, exposed after the complete artifact bundle was uploaded.
- Verified logical results: 44/44 executed, 35 PASS, 9 FAIL, 8 published-bug failures, and 1 `FR04-H-007` specification-gap observation.
- Runtime header proof: 305/305 Newman requests carried `X-Student-Id: 23127179`.
- Main collection/data hashes exactly match the official local canonical execution, and all 44 CI case results match latest canonical local results.

The run repeats the four official execution groups from `project.json` with a freshly restarted/reseeded backend for each independent group. It preserves every canonical oracle, uploads JSON/HTML/stdout/copied inputs/exit codes/backend logs, and leaves the job red through the final result step. No expected result, known-bug case, or SUT behavior was changed to manufacture a green result.

Canonical CI evidence is recorded as `CI-32618732832-canonical-full-suite`. Its real screenshot is:

- `EVID-CI-FR04-CANONICAL-FULL-SUITE` — `work/evidence/screenshots/EVID-CI-FR04-CANONICAL-FULL-SUITE.png`

This new screenshot intentionally remains `humanAttestation=false` and is not promoted to `out/`. It is the next human evidence gate.

The derived `out/ci-cd-report.md` now states the strict CI status as **PARTIAL / documented limitation due to confirmed SUT defects**. It separates authoritative full-suite integration from the smoke behavior demonstration and explicitly says that the green smoke run does not satisfy or prove “all API test cases passing.”

Finalized FR-04 submission material under `out/` now includes the canonical Postman inputs, official local Newman JSON/HTML/stdout/metadata, stateful Newman evidence, test summary, Postman feature report, bug report, all attested bug/Issue/header screenshots, both attested CI demo screenshots, and copies of both CI workflow configurations. The full-suite CI raw artifact bundle remains canonical working provenance under `work/ci/runs/`; duplication of that bundle into `out/` is unnecessary. Its screenshot remains under `work/` specifically because human attestation is pending.

Current status:

```text
FR-04 GENERATE/AUDIT/EXTEND       COMPLETE
FR-04 CANONICAL EXECUTION          COMPLETE
FR-04 BUG REPORTING                COMPLETE
POSTMAN FEATURES                   COMPLETE
CI SMOKE BEHAVIOR EVIDENCE         COMPLETE
CI FULL-SUITE INTEGRATION          IMPLEMENTED AND VERIFIED
STRICT ALL-API-TESTS GREEN RUN     PARTIAL — CONFIRMED SUT DEFECT LIMITATION
NEW FULL-SUITE CI SCREENSHOT       WAITING FOR HUMAN ATTESTATION
```

FR-04 is still not CLOSED. After the new CI screenshot gate, `FR04-AI-024` still requires real SEC-04 UI/display-boundary evidence. `FR04-H-007` remains a documented non-bug specification-gap observation and needs explicit disposition only if closure policy requires a separate human decision. FR-08 and Agent Skill/generator work remain not started.

## 27. Clean checkpoint — canonical full-suite CI evidence attested

Repository state at this checkpoint:

- Active branch: `hw06-api-testing`.
- Latest completed implementation/report commit entering this checkpoint: `86e750c178c0a155588deaefa17fcdd8262191a4` (`docs(hw06): finalize honest FR04 CI curation`).
- The closure/handoff checkpoint itself is the current branch `HEAD` containing this section; verify it with `git log -1` in a new session.
- The checkpoint procedure requires local `HEAD` and `origin/hw06-api-testing` to match after the normal push.
- `eshop-sut/backend/database.sqlite` remains a runtime-only local modification and must not be committed.

The student explicitly inspected and attested `EVID-CI-FR04-CANONICAL-FULL-SUITE` under the existing identity `Nguyen Bao Duy`. Its canonical evidence record and metadata contain the real attestation timestamp and provenance. The corresponding CI registry record now also reports completed screenshot attestation. Derivation promotes the human-attested screenshot to `out/fr04/evidence/EVID-CI-FR04-CANONICAL-FULL-SUITE.png` while retaining the canonical source and provenance under `work/evidence/` and `work/ci/runs/`.

Verified FR-04 state remains:

- 47 AI-generated cases and 7 human-added cases.
- 44 executable cases; 44 executed; 35 PASS; 9 FAIL.
- 8 failures map to the two genuine bugs published as GitHub Issues.
- 1 failure, `FR04-H-007`, remains a specification-gap observation.
- The canonical local and canonical GitHub Actions executions reconcile case-for-case.
- Postman Console/header evidence, bug screenshots, GitHub Issue-page screenshots, both smoke CI screenshots, and the canonical full-suite CI screenshot are human-attested.
- Finalized FR-04 Postman inputs, official Newman reports, reports, workflows, and attested screenshots are curated under `out/`; canonical registries and raw provenance remain under `work/`.

Status at this checkpoint:

```text
FR-04 GENERATE/AUDIT/EXTEND       COMPLETE
FR-04 CANONICAL EXECUTION          COMPLETE
FR-04 BUG REPORTING                COMPLETE
POSTMAN FEATURES                   COMPLETE
CI SMOKE BEHAVIOR EVIDENCE         COMPLETE
CI FULL-SUITE INTEGRATION          IMPLEMENTED AND VERIFIED
CI EVIDENCE ATTESTATION            COMPLETE
STRICT ALL-API-TESTS GREEN RUN     PARTIAL — DOCUMENTED LIMITATION DUE TO CONFIRMED SUT DEFECTS
FR-04 OVERALL                      NOT CLOSED
```

The CI limitation is unchanged by screenshot attestation. The complete canonical suite genuinely runs all 44 executable cases in GitHub Actions and remains red because its unchanged oracles expose confirmed SUT defects plus the documented specification-gap observation. The separate green and intentional-one-failure `FR04-AI-001` smoke runs demonstrate CI behavior only; they do not prove that all 44 canonical cases pass.

Unresolved or intentionally deferred FR-04 items:

- `FR04-AI-024`: SEC-04 UI/display-boundary verification remains pending and must not be inferred from its API-side result.
- `FR04-H-007`: the non-bug specification-gap observation still needs final disposition only if closure policy requires one.
- Strict CI wording “all API test cases passing”: `PARTIAL / documented limitation due to confirmed SUT defects`; do not manufacture compliance by weakening tests, deleting bug cases, suppressing failures, or changing the SUT solely for a green run.

Authoritative locations for the next session:

- Project contract: `AGENTS.md`.
- Assignment: `docs/hw06-req/2026.HW06.API Testing_En.md`.
- Standard procedures: `docs/hw06-standard-actions.md`.
- Canonical state: `work/registry/*.json` and `work/registry/runs/`.
- Canonical/raw execution and CI provenance: `work/runs/`, `work/ci/runs/`, and `work/evidence/`.
- Finalized FR-04 bundle: `out/fr04/`.
- Final reports: `out/ci-cd-report.md`, `out/bug-report.md`, and `out/postman-features.md`.
- CI workflows: `.github/workflows/hw06-fr04-ci.yml` and `.github/workflows/hw06-fr04-canonical-full-suite.yml`.

Next-phase intent for a new Codex chat:

- Do not immediately implement FR-08.
- First design a reusable HW06 agent/orchestration system learned from FR-04, with `Main Codex = orchestrator`.
- Consider specialized sub-agents/skills for requirement analysis, test generation, AI review, adversarial verification, execution/evidence verification, reporting/curation, and human-gate preparation.
- The intended pre-review loop is `generate → review → adversarially verify → repair → validate`, ending in a compact human-review packet and using human gates only where genuinely required.
- Sub-agents may independently review and recommend approval, but AI review must remain distinct from real student attestation.
- Only the student's explicit approval may set `humanAttestation=true`, `HUMAN-APPROVED`, or an equivalent canonical human-verification state.
- Design this system before using FR-08 as its first real reuse/validation case. Do not implement the architecture as part of this checkpoint.

## 28. Corrected orchestration boundary and API generator Skill installed

The architecture requested after FR-04 is complete. It deliberately separates internal project operation from the assignment-facing generator:

### Internal workflow

- Main Codex is the orchestrator.
- Its single operating procedure is `HW06_ORCHESTRATOR.md`.
- No orchestration Skill, orchestration registry, proxy-human status taxonomy, or separate workflow state machine is used.
- Cross-session state remains in this `HANDOFF.md`; structured test/evidence truth remains in `work/registry/*.json`; recurring mechanics remain in `docs/hw06-standard-actions.md`.
- Normal semantic flow is analyze, produce/delegate, independent review, adversarial verification, automatic repair, evidence verification, deterministic validation, and then continue or stop at a genuine human gate.
- Native independent sub-agents are used when available. Otherwise the main session performs clearly separated passes without inventing agent identities.
- Human gates are limited to real assignment/student actions, unresolved authoritative ambiguity, visual attestation, external publication approval, the student-designed generator diagram, and final submission approval.
- AI may make a clearly labelled recommendation but may not set `humanAttestation=true`, write a human verdict, claim student authorship, or impersonate the student.

### Assignment-facing Skill

- Codex location: `.codex/skills/hw06-api-test-generator/SKILL.md`.
- Claude mirror: `.claude/skills/hw06-api-test-generator/SKILL.md`.
- Purpose: accept a selected API plus API/FR/SEC/state/schema sources and generate at least 35 meaningful structured API test candidates with source anchors and a coverage ledger.
- Boundary: generation only. The Skill does not perform human review, execute tests, attest evidence, publish Issues, or curate the assignment.
- FR-08 will be its first real reuse; FR-15 will be the next reuse/refinement opportunity.
- The section 7 pseudocode and student-designed diagram remain separate submission artifacts. This internal workflow document is not presented as the G9.5 deliverable.

### FR-04 read-only design validation

FR-04 was used only to refine generator assumptions. Historical candidates, reviews, runtime evidence, and attestations were not rewritten or reopened.

The generator now directly addresses observed FR-04 review problems: duplicate or compound cases, vague inputs, cleanup counted as a case, invented status/schema oracles, weak mutation verification, missing source anchors, and insufficient audit provenance. For every mutating negative/protected-field case, it requires baseline capture, authoritative read-back, and a persisted-state assertion or an explicit evidence gap.

FR-04 status remains unchanged:

- 44 executable and executed cases: 35 PASS, 9 FAIL.
- 8 failures map to two published genuine bugs.
- `FR04-AI-024` still lacks real SEC-04 UI/display-boundary evidence.
- `FR04-H-007` remains a non-bug specification-gap observation.
- Strict all-tests-green CI remains `PARTIAL / documented limitation due to confirmed SUT defects`.
- FR-04 overall remains not closed; the architecture correction does not manufacture closure.

### Validation

- Generator Skill validation: PASS for both `.codex` and `.claude` copies.
- Skill inventory and byte-content parity: PASS.
- Independent SOP review: PASS after resolving ACT-GEN routing and new-interaction audit provenance.
- Independent generator forward-test against FR-04 history: PASS after strengthening persisted-state and executability rules.
- `npm run hw06:derive`: PASS.
- `npm run hw06:validate`: PASS with 0 errors and 0 warnings.
- `git diff --check`: PASS.

### Exact next action

Start FR-08 using `HW06_ORCHESTRATOR.md` and the new API Test Generator Skill. Do not reopen FR-04 and do not begin FR-15 first.

## 29. Final workflow correction before FR-08

The reusable action catalog now contains action mechanics rather than historical project status. ACT-REV-01 uses one complete-set AI pre-review and adversarial verification pass followed by one compact student audit gate; canonical `human-reviews.json` records are written only after the student's explicit batch approval or overrides. ACT-EXT-01 similarly uses an adversarially filtered AI shortlist followed by one student selection/modification gate; only selected designs may become `origin=HUMAN` cases with student-approved rationales.

For new FR-08 and FR-15 AI cases, ACT-GEN-01 uses bounded contract/domain, authorization/security, state-transition, schema, and closure/deduplication interactions. Each interaction must preserve its actual available tool/model identity, completion time, verbatim prompt, batch ID, source anchors, coverage slice, and candidate output boundary at generation time. The validator enforces these prospective fields and within-batch provenance consistency while leaving historical FR-04 records unchanged. Official AI Audit Report updates remain explicitly human-triggered and use this preserved provenance later; no second audit or orchestration registry was added.

FR-08 remains unstarted. The next action is to begin FR-08 under `HW06_ORCHESTRATOR.md` with the `hw06-api-test-generator` Skill. This cumulative handoff is becoming long; after FR-08 starts, a non-blocking cleanup may reduce it to current state plus the latest checkpoint and move older checkpoints to a non-authoritative history file.

## 30. Checkpoint — FR-08 generation complete, student review gate open

FR-08 `POST /api/checkout` generation (`ACT-GEN-01`) is complete and is the first real reuse of both
`HW06_ORCHESTRATOR.md` and the `hw06-api-test-generator` Skill. FR-04 was not reopened.

Work performed in this session, by Claude Code (`claude-opus-5`):

- Five bounded generation batches, each with its verbatim prompt stored under `work/prompts/fr08/`:
  `FR08-GEN-B1` contract-domain (18), `FR08-GEN-B2` authorization-security (12),
  `FR08-GEN-B3` state-transition (10), `FR08-GEN-B4` schema (10), `FR08-GEN-B5` closure-deduplication (6).
- 56 AI candidates `FR08-AI-001` … `FR08-AI-056` appended to `work/registry/test-cases.json`, each
  stamped at write time with `generationBatchId`, `generationTool`, verbatim `generationPrompt`,
  real `generatedAt`, `generationContext`, and `sourceAnchors`.
- Coverage ledger: `work/prompts/fr08/FR08-GEN-coverage-ledger.md`.
- Independent review, adversarial verification, and mechanical checks were performed as separate
  passes inside one Claude Code session; no independent agent identity is claimed.
- Non-canonical review proposal: `work/reviews/HG-FR08-REV-01-proposal.md`.

Mechanical check results: no candidate asserts a bare HTTP status code, every candidate marks the
undocumented behavior `SPEC GAP`, no duplicate titles, no vague request values, every candidate
states a read-back. `npm run hw06:validate` PASS (0 errors, 0 warnings); `npm run hw06:derive` run.

AI recommendation awaiting the student at `HG-FR08-REV-01`: 48 VALID, 5 INCOMPLETE
(`FR08-AI-010`, `FR08-AI-012`, `FR08-AI-022`, `FR08-AI-035`, `FR08-AI-043`), 3 INVALID
(`FR08-AI-024`, `FR08-AI-049`, `FR08-AI-050`, all duplicate diagnostics). If accepted in full, the
usable AI-origin FR-08 suite is 53 cases.

Adversarial verification found one authoritative coverage gap: the expired-JWT partition named in
the verified spec extract has no candidate, because an expired token cannot be minted black-box and
any foreign-signed token fails signature verification first. It is recorded as uncovered in the
coverage ledger; no look-alike or fabricated case was added.

Commits on `hw06-api-testing`:

```text
42eb5f0 feat(hw06): generate FR-08 checkout AI test candidates
518122d docs(hw06): prepare FR-08 AI review proposal for the student gate
```

Status:

```text
FR-08 ACT-GEN-01                   COMPLETE
FR-08 ACT-REV-01                   BLOCKED — awaiting the student response to HG-FR08-REV-01
FR-08 ACT-EXT-01 and later         NOT STARTED
FR-15                              NOT STARTED
```

`work/registry/human-reviews.json` is unchanged and contains no FR-08 record. Nothing may be written
there until the student answers `HG-FR08-REV-01` explicitly. The next action after that response is
to write only the approved or overridden verdicts, then run `ACT-EXT-01` for at least five
human-added FR-08 cases.

## 31. Checkpoint — FR-08 generation/review repaired, gate reopened

The student rejected the revision-1 `48 VALID / 5 INCOMPLETE / 3 INVALID` proposal and directed
targeted repairs before any human verdict is recorded. This checkpoint completes those repairs.

Corrections made:

- The revision-1 claim that the `expired` JWT partition cannot be tested black-box was **wrong** and
  is retracted. `work/postman/fr04/FR04-profile.postman_environment.json` already carries a
  validly-signed-but-expired fixture (`exp = 1`) whose signature verifies against the local SUT
  development secret. The mechanism was re-minted for user id 2 and used as a **test input only**.
- New bounded batch `FR08-GEN-B6` (authorization-closure) generated `FR08-AI-057`, the expired-token
  case, with fresh prospective provenance. FR-08 AI candidates are now 57.
- All original `FR08-AI-001` … `FR08-AI-056` candidates, prompts, and timestamps are unchanged.
- `work/reviews/HG-FR08-REV-01-proposal.md` was rebuilt at full audit detail for every case: purpose,
  input/starting state, oracle, recommendation, reason, correction, source anchor, and uncertainty.
- `work/prompts/fr08/FR08-GEN-coverage-ledger.md` corrected: the expired partition is covered, and
  the retracted reasoning is recorded in a revision-2 note.

Revised AI recommendation (still **not** a student verdict): 44 VALID, 8 INCOMPLETE, 5 INVALID.

```text
INCOMPLETE  FR08-AI-010 FR08-AI-012 FR08-AI-022 FR08-AI-028
            FR08-AI-035 FR08-AI-040 FR08-AI-043 FR08-AI-052
INVALID     FR08-AI-024 FR08-AI-049 FR08-AI-050 FR08-AI-054 FR08-AI-056
```

Changes from revision 1: `FR08-AI-010`'s correction no longer invents an integer-total rule and keeps
the forged-total invariant; `FR08-AI-028` limited to an API-side observation that never claims SEC-04
conformance; `FR08-AI-040` kept but sharpened to a checkout-specific transition; `FR08-AI-052`
questioned as redundant unless anchored to a real precision boundary; `FR08-AI-054` and
`FR08-AI-056` reclassified as duplicates. If accepted in full, the usable AI-origin suite is 52.

Five ACT-EXT-01 ideas are prepared in `work/reviews/HG-FR08-EXT-01-ai-proposals.md` as explicitly
non-canonical AI proposals with no `FR08-H-###` identifiers. Two of the student's suggested
directions were already covered and were replaced (`B′` cart-to-total isolation across two users,
`D′` cart line for a nonexistent product).

Validation: `npm run hw06:derive` PASS, `npm run hw06:validate` PASS (0 errors, 0 warnings),
`git diff --check` clean. Commit `4e48655`. `out/` is untouched by this checkpoint.

Status:

```text
FR-08 ACT-GEN-01                   COMPLETE (57 candidates, batches B1-B6)
FR-08 ACT-REV-01                   BLOCKED — awaiting the student response to HG-FR08-REV-01
FR-08 ACT-EXT-01                   AI proposals prepared; awaiting student selection
FR-15                              NOT STARTED
```

`work/registry/human-reviews.json` still holds 0 FR-08 records. Nothing may be written there, and no
`origin=HUMAN` FR-08 case may be created, until the student responds explicitly.

## 32. Checkpoint — FR-08 audited, extended, implemented, executed; bug confirmation gate open

Both FR-08 human gates are closed and execution has completed. `out/` is untouched so far.

ACT-REV-01 (student decision recorded at `2026-08-23T07:33:31.094Z`):

```text
57 AI candidates -> 40 VALID, 11 INCOMPLETE with approved corrections, 6 INVALID
INVALID     FR08-AI-024 FR08-AI-049 FR08-AI-050 FR08-AI-052 FR08-AI-054 FR08-AI-056
INCOMPLETE  FR08-AI-010 FR08-AI-012 FR08-AI-018 FR08-AI-022 FR08-AI-028 FR08-AI-035
            FR08-AI-040 FR08-AI-043 FR08-AI-048 FR08-AI-053 FR08-AI-055
51 reviewed-usable AI-origin cases
```

ACT-EXT-01: the student reviewed the AI-proposed shortlist and selected all five ideas without
modification. Materialised as `FR08-H-001` stale client total after cart mutation, `FR08-H-002`
cross-user cart-to-total derivation isolation, `FR08-H-003` valid checkout after a rejected attempt,
`FR08-H-004` cart line for a nonexistent product, `FR08-H-005` independent persistence of two
completed orders. Each rationale records truthfully that the idea was AI-proposed and student-selected.
An adversarial duplicate check against the 51 usable AI cases found no true duplicate.

Total usable FR-08 cases: **56**. `npm run hw06:derive` computes `executable = 56` independently.

ACT-PM-01: `work/postman/fr08/` holds one data-driven collection covering all 56 cases, its
environment, the generated data file, `build-data.mjs`, and a README of the harness decisions. It was
committed in `ec6db5d` **before** execution. Key harness decisions: a fresh registered user per case
because cart state is process memory with append-only writes and no clearing endpoint; expected totals
derived at run time from the cart the server itself reports immediately before each checkout; no
status or schema oracle anywhere; `X-Student-Id` upserted collection-wide and asserted per checkout.

ACT-RUN-01 / ACT-RUN-02: `RUN-20260823080014785-fr08-canonical-full-suite`, local Newman, hostname
`localhost:3000` verified on every request, exit code 1 preserved.

```text
56 iterations | 438 requests | 422 assertions | 19 failed
37 PASS | 19 FAIL, mapped case-by-case from the raw JSON
X-Student-Id proven on 438/438 executed requests
```

Triage (`work/reviews/FR08-run-triage.md`): all 19 failures are genuine; 0 harness defects, 0 state
contamination, 0 blocked cases, 0 SPEC GAP cases converted into failures. Nothing was repaired or
rerun and no oracle was changed after results were seen.

ACT-BUG-01: two candidates registered with `status=candidate`.

```text
BUG-CANDIDATE-FR08-CLIENT-TOTAL        16 cases directly + 2 combined
BUG-CANDIDATE-FR08-CART-NOT-CLEARED     1 case directly + 2 combined
```

Recorded evidence limitation: because no derivation happens at all, cases whose client value happens
to equal the cart-derived total pass without proving derivation occurred. The 37 PASS count must not
be read as proof that checkout computes the total from the cart.

Commits on `hw06-api-testing`: `732f16a`, `ec6db5d`, `d52736a`.
`eshop-sut/backend/database.sqlite` remains an uncommitted runtime-only modification.

Status:

```text
FR-08 ACT-REV-01 / ACT-EXT-01      COMPLETE (student decisions recorded)
FR-08 ACT-PM-01                    COMPLETE (committed before execution)
FR-08 ACT-RUN-01 / ACT-RUN-02      COMPLETE
FR-08 ACT-BUG-01                   COMPLETE (candidates only)
FR-08 ACT-BUG-02                   BLOCKED — needs the student's genuine-bug confirmation
FR-08 ACT-EVID-01 / ACT-BUG-03     NOT STARTED (screenshot attestation, Issue publication)
FR-08 CI                           NOT STARTED
FR-15                              NOT STARTED
```

Next genuine human gate: `HG-FR08-BUG-02`. No GitHub Issue may be created, no screenshot may be
attested, and the official AI Audit Report may not be updated without a separate explicit request.

## 33. Checkpoint — FR-08 bugs human-confirmed, evidence prepared, attestation gate open

ACT-BUG-02 is complete. The student explicitly confirmed both candidates as genuine product bugs and
directed that failing partitions stay grouped under their single root-defect record:

```text
BUG-CANDIDATE-FR08-CLIENT-TOTAL        human-confirmed
BUG-CANDIDATE-FR08-CART-NOT-CLEARED    human-confirmed
```

The canonical run `RUN-20260823080014785-fr08-canonical-full-suite` is unchanged: 56 executed, 37
PASS, 19 FAIL, 0 harness defects, 0 contamination, 0 blocked, 438/438 requests carrying
`X-Student-Id`, original exit code 1. The suite was not rerun and no oracle was modified. Derivation
now maps all 19 failures to the two confirmed bugs (`knownBugFailures = 19`, `otherFailures = 0`).

The recorded evidence limitation stands: cases whose client-supplied total happened to equal the
cart-derived total pass without proving that the backend recalculates anything, so the 37 PASS count
must never be presented as proof of server-side derivation.

ACT-EVID-01 produced three screenshots from that same run, all with `humanAttestation = false`:

```text
EVID-FR08-RUN-SUMMARY        dashboard: 56 iterations, 422 assertions, 19 failures, 0 skipped
EVID-FR08-CLIENT-TOTAL       iteration 2  (FR08-AI-002) forged total 1000 vs derived 200000
EVID-FR08-CART-NOT-CLEARED   iteration 30 (FR08-AI-031) cart still holds the purchased line
```

Capture note: `scripts/hw06/capture-screenshot.mjs` cannot click, so
`work/evidence/capture-fr08-report-cards.mjs` performs the same clicks a human reviewer performs on
the unmodified report and the PNGs are recorded through the `register` fallback with that method
stated. Iteration numbers are data-file row positions, not case-id suffixes, because the six INVALID
cases were excluded; a first capture at iteration 31 actually showed FR08-AI-032 and was removed and
recaptured at iteration 30.

Harness repair: the deriver printed `Issue #undefined` for confirmed but unpublished bugs; it now
states that the bug is not published yet.

Validation: `npm run hw06:derive` PASS, `npm run hw06:validate` PASS with 0 errors and exactly the 3
expected "no explicit human attestation" warnings, `git diff --check` clean. Commit `a44ce44`.

Status:

```text
FR-08 ACT-BUG-02                   COMPLETE
FR-08 ACT-EVID-01                  SCREENSHOTS PREPARED — awaiting student visual attestation
FR-08 ACT-BUG-03                   NOT STARTED — no GitHub Issue created; needs separate approval
FR-08 CI                           NOT STARTED
AI Audit Report                    UNCHANGED (human-triggered only)
FR-15                              NOT STARTED
```

Next genuine human gate: `HG-FR08-EVID-01`, the student's visual inspection and attestation of the
three screenshots. Only after that may external publication be requested separately.
