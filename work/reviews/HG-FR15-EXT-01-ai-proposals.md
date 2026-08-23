# HG-FR15-EXT-01 — AI-proposed human-extension ideas for FR-15

> **NON-CANONICAL AI PROPOSALS.** These ideas are not `origin=HUMAN` cases, have no
> `FR15-H-###` identifiers, and are not present in `work/registry/test-cases.json`. They become
> human-added cases only after the student explicitly selects or modifies them and supplies the
> approved rationale at the ACT-EXT-01 gate.

Baseline: 59 AI candidates reviewed by the student; 49 VALID, 5 corrected INCOMPLETE, 5 INVALID,
leaving 54 usable AI-origin cases. The shortlist below was checked against all 59 original candidates
and their approved corrections.

## A — Client-supplied product id must not overwrite an existing product

- **Risk / gap:** A create body may try to mass-assign the server-managed product identity and
  overwrite or alias an existing row.
- **Input / starting state:** Capture seeded product id 1 exactly. As admin, send a valid create body
  with a unique name, valid price, existing `category_id: 1`, and the additional property `id: 1`.
- **Observable oracle:** Seeded product id 1 must remain unchanged. If a new product is created, its
  identity must be distinct from id 1. Exact acceptance status and additional-property policy are
  `SPEC GAP`.
- **Source:** API specification §3.2 identifies products by server-visible id; §3.3 defines POST as
  create; verified extract permits an existing-product consistency check.
- **Why AI missed it:** `FR15-AI-052` uses harmless unknown field `stock_quantity`; it does not target
  a protected identity field. `FR15-AI-041` checks ordinary-create non-interference without attempting
  an overwrite.
- **Duplicate analysis:** Distinct from both cases because the injected `id` creates the risk and the
  existing-row oracle detects it.
- **AI strength:** **Strong.** High-impact state-integrity case with a direct read-back oracle.

## B — Validly signed JWT with no role claim

- **Risk / gap:** Authentication may succeed while authorization defaults a missing role to admin.
- **Input / starting state:** Build a validly signed, unexpired JWT for a known non-admin user with the
  `role` claim omitted. Submit an otherwise valid product body.
- **Observable oracle:** SEC-03 requires `role = 'admin'`, so no product with the unique name may be
  persisted. Exact rejection status and error schema are `SPEC GAP`.
- **Source:** README FR-12 and SEC-03; API specification §3.3 and §6.
- **Why AI missed it:** `FR15-AI-028` supplies an explicit ordinary-user role; `FR15-AI-031` has an
  invalid signature; `FR15-AI-032` is expired. None isolates absence of the authorization claim while
  retaining token validity.
- **Duplicate analysis:** Missing role is a separate claim partition from a present non-admin role.
- **AI strength:** **Strong.** Direct authorization-boundary coverage.

## C — Recently deleted category must not remain valid through stale state

- **Risk / gap:** Product creation may accept a category that existed earlier but was deleted, due to
  stale validation or cached category state.
- **Input / starting state:** Create a temporary category through the supporting category endpoint,
  confirm it exists, delete it, confirm it is absent, then submit a valid admin product create using
  that deleted category id.
- **Observable oracle:** FR-15 requires the category to exist at create time, so the product must not
  persist. Exact rejection status and error schema are `SPEC GAP`.
- **Source:** README FR-15; API specification §3.3 product create and §3.4 category lifecycle.
- **Why AI missed it:** `FR15-AI-017` uses an id that was never valid. It cannot detect stale acceptance
  of an id that transitioned from existing to nonexistent.
- **Duplicate analysis:** The temporal state transition is the diagnostic difference; it is not another
  arbitrary nonexistent numeric value.
- **AI strength:** **Strong.** Source-grounded state-transition check; cleanup must remove any accidental
  product and recreate nothing because the category is temporary.

## D — Valid admin create recovers after a refused non-admin attempt with the same name

- **Risk / gap:** A refused authorization attempt may reserve a name or leave partial product state that
  breaks the following authorized create.
- **Input / starting state:** With one run-unique name, first submit a valid product body using an
  ordinary-user JWT, then submit the identical body using a valid admin JWT.
- **Observable oracle:** The first attempt creates nothing; the second creates exactly one product with
  the unique name. Exact rejection and success statuses remain `SPEC GAP`.
- **Source:** README FR-12, SEC-03 and FR-15; API specification §3.1 read-back and §3.3 create.
- **Why AI missed it:** `FR15-AI-037` stops after checking non-admin non-interference. `FR15-AI-044`
  verifies recovery after invalid price, not after an authorization failure.
- **Duplicate analysis:** The composed authorization-recovery transition is not proved by either half.
- **AI strength:** **Medium-strong.** Useful partial-state check with deterministic cleanup.

## E — Name explicitly set to null

- **Risk / gap:** Explicit JSON null can follow a different validation path from a missing field or a
  wrong scalar type.
- **Input / starting state:** As admin, submit valid price and existing category with
  `name: null`; all other supplied fields are valid.
- **Observable oracle:** Name is a required string, so no nameless product should persist; exact status,
  error schema, and null-coercion behavior remain `SPEC GAP` under the verified extract.
- **Source:** README FR-15; API specification §3.3; verified extract request contract and exploratory
  null/wrong-type note.
- **Why AI missed it:** `FR15-AI-007` omits name, `FR15-AI-008` sends a number, and `FR15-AI-005`
  sends an empty string. None sends explicit null.
- **Duplicate analysis:** Null is a distinct JSON value and validation path, as already recognized for
  price and category in `FR15-AI-016` and `FR15-AI-059`.
- **AI strength:** **Medium-strong.** Clear missing partition, though exact server handling is unspecified.

## F — Unsigned `alg: none` token claiming admin

- **Risk / gap:** A structurally JWT-shaped token may claim the admin role while explicitly disabling
  signature protection.
- **Input / starting state:** Submit an otherwise valid product body with a deterministic JWT whose
  header is `{"alg":"none","typ":"JWT"}`, whose payload claims `role: "admin"`, and whose signature
  segment is empty.
- **Observable oracle:** SEC-02 requires a valid JWT, so no product with the unique name may persist.
  Exact rejection status and error schema are `SPEC GAP`.
- **Source:** README SEC-02 and SEC-03; README FR-12.
- **Why AI missed it:** `FR15-AI-030` is a non-JWT string and `FR15-AI-031` tampers an HMAC-signed token;
  neither exercises an explicit unsigned-algorithm downgrade attempt.
- **Duplicate analysis:** This is a named signature-bypass shape, but it remains close to the existing
  invalid-signature partition.
- **AI strength:** **Medium.** Security-relevant, but less distinct than A–E.

## Student selection gate

| Label | Concept | AI recommendation | Main distinction |
|---|---|---|---|
| A | Client-supplied id cannot overwrite an existing product | Select | Protected identity and state integrity |
| B | Valid JWT with missing role | Select | Authentication succeeds; authorization claim absent |
| C | Deleted category cannot be reused through stale state | Select | Existing → deleted → referenced transition |
| D | Authorized recovery after refused non-admin attempt | Select | Partial-state recovery across auth boundary |
| E | Explicit null name | Select | Missing JSON partition |
| F | Unsigned `alg: none` admin claim | Optional alternative | Close to existing invalid-signature coverage |

AI recommendation: select **A, B, C, D, and E**. This supplies five distinct human-extension cases
without padding. The student may replace any recommended idea with F or modify any request/oracle.

No selection has been inferred. ACT-EXT-01 remains at the human proposal gate.
