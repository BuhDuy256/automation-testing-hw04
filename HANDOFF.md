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
