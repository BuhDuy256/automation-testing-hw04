# HW06 API Testing — Continuation Handoff

## 1. Current objective

The HW06 automation setup is complete and frozen. API selection and scoped specification are complete. FR-04 generation, human review cleanup, and human extension are complete. No API execution, Postman implementation, Newman execution, bug publication, or CI execution has started.

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
