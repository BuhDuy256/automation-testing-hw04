# HW06 API Testing — Continuation Handoff

## 1. Current objective

The HW06 automation setup is complete and frozen. Actual homework execution is now underway: the human has confirmed the API selection, the canonical registry is synchronized, and scoped API-spec extracts have been prepared. No test generation, Postman implementation, Newman execution, bug publication, or CI execution has started.

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

The three ACT-SPEC-01 extracts are stored in:

- `work/selection/HW06-A-FR04-PUT-USERS-ME-verified-spec.md`
- `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`
- `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`

Each extract is source-anchored and explicitly marked `UNVERIFIED`. The official sources remain authoritative:

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

## 7. Standard actions already available

The authoritative action procedures are in `docs/hw06-standard-actions.md`. Likely next actions are:

`ACT-SPEC-01` → `ACT-GEN-01` → `ACT-REV-01` → `ACT-EXT-01` → `ACT-PM-01` → `ACT-RUN-01` → `ACT-RUN-02` → `ACT-EVID-01` → `ACT-BUG-01` → `ACT-BUG-02` → `ACT-BUG-03` → `ACT-DERIVE-01` → `ACT-GIT-01`.

Other available actions include `ACT-RUN-02`, `ACT-CI-01`, `ACT-PM-02`, `ACT-AUDIT-01`, `ACT-GIT-02`, `ACT-SUB-01`, and `ACT-SUB-02`. Use the catalog and existing registries; do not create another workflow abstraction.

## 8. Automation/tool interfaces

Important existing commands:

```text
npm run hw06:validate
npm run hw06:derive
npm run hw06:git-log
```

Relevant existing scripts include `scripts/hw06/validate.mjs`, `derive.mjs`, `ai-audit.mjs`, `run-newman.mjs`, `capture-screenshot.mjs`, `capture-ci-run.mjs`, `publish-bug.mjs`, and `export-git-log.ps1`.

**DO NOT redesign the automation harness.** Edit canonical registries and use the established derivation/validation mechanisms.

## 9. Evidence rules

Never fabricate Newman execution, HTTP request/response data, bugs, screenshots, GitHub Issues, CI runs, commit SHAs, human reviews, or other evidence. Use real execution and attributable evidence only. The `X-Student-Id: 23127179` header is required on every eventual test request.

## 10. Current repository state

- Branch: `hw06-api-testing`
- Latest existing commit before this task: `adc2bd08315ae91009fbf3ec47c49dbf25ffb06a` (`feat(hw06): standardize recurring agent actions`)
- Validation: `npm run hw06:validate` passed with 0 errors and 0 warnings after selection persistence.
- Derivation: `npm run hw06:derive` completed and regenerated factual summaries showing 3 selected APIs and 0 cases executed.
- Runtime-only modification: `eshop-sut/backend/database.sqlite` is modified in the working tree and is intentionally excluded from this work.
- This task’s intended files: `work/registry/project.json`, `work/selection/` (three extracts), `docs/hw06-analysis/api-selection-proposal.md`, `out/README.md`, and `HANDOFF.md`; derived `work/generated/` outputs were regenerated by command and are not hand-edited.

## 11. Completed in this session

- ACT-SEL-01 completed: the three human-confirmed APIs were persisted in `work/registry/project.json` with real confirmation metadata.
- ACT-SPEC-01 extract creation completed for all three selected operations, but human verification is still pending; therefore the extracts remain `UNVERIFIED`.
- The former API-selection proposal status was updated to reflect final human confirmation.
- `out/README.md` was updated from “no API selection” to the confirmed selection and next gate.
- `npm run hw06:validate` passed.
- `npm run hw06:derive` completed.
- No test cases were generated and no ACT-GEN-01 work was started.
- `HANDOFF.md` was created.

## 12. Next action

First obtain human verification of the three `work/selection/*-verified-spec.md` extracts, resolving any source/contract corrections. Then run `ACT-GEN-01` for the first selected API.

Recommended generation order, not a new selection decision:

```text
FR-04 PUT /api/users/me
→ FR-15 POST /api/products
→ FR-08 POST /api/checkout
```

This order minimizes early state friction; checkout should be handled after the simpler profile and product setup patterns are established.

## 13. Important unresolved blockers

- Human verification of the three ACT-SPEC-01 extracts is required before ACT-GEN-01.
- Group-level API duplication among classmates has not been externally checked; no group allocation data was available in the repository.
- CI workflow and real execution evidence are intentionally not created yet.
