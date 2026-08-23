# HG-FR15-BUG-02 — FR-15 Genuine-Bug Confirmation Proposal

This packet is a non-canonical review aid. It does not record a student verdict, attest
screenshots, publish a GitHub Issue, or change either candidate from `candidate` status.

## Execution basis

The reviewed FR-15 suite contains 59 executable cases: 54 reviewed-usable AI-origin cases and five
student-selected HUMAN extensions. The canonical run executed all 59 cases. It produced 16
authoritative passes, 28 authoritative-oracle failures, and 15 observational SPEC-GAP outcomes,
with no harness or blocked result.

| Run | Scope | Result | Student header | Harness/setup |
|---|---|---:|---:|---:|
| `RUN-20260823102155874-fr15-canonical-full-suite` | 59 canonical cases | 28 failed case oracles | 485/485 requests | 0 |
| `RUN-20260823102829114-fr15-auth-reproduction` | 5 representative authorization cases | 5/5 failed | 40/40 requests | 0 |
| `RUN-20260823102841701-fr15-validation-reproduction` | 6 representative validation cases | 6/6 failed | 52/52 requests | 0 |

The response status and error shape were observational wherever the specification does not define
them. Candidate grouping is based on persistent state, not on an assumed HTTP status.

## Candidate 1 — authorization enforcement

**ID:** `BUG-CANDIDATE-FR15-AUTHORIZATION`

**Proposed title:** `[HW06][FR-15][SEC-02/SEC-03] POST /api/products permits creation without a valid admin authorization context`

**Authoritative expectation:** README FR-12, SEC-02, and SEC-03 require a valid JWT carrying
`role = admin` for product changes. A request without that authorization context must not create a
persistent product. The exact rejection status and error schema are SPEC GAP.

**Observed result:** A run-unique product persisted for every covered invalid authorization
context: missing Authorization, ordinary-user JWT, non-Bearer scheme, malformed token, tampered
signature, expired admin token, body-borne role with a user token, and a validly signed unexpired
non-admin token with no role claim. The recovery/state cases also showed persistence after the
supposedly refused phase.

**Affected canonical cases (10):** `FR15-AI-027`, `FR15-AI-028`, `FR15-AI-029`,
`FR15-AI-030`, `FR15-AI-031`, `FR15-AI-032`, `FR15-AI-033`, `FR15-AI-037`, `FR15-H-002`,
`FR15-H-004`.

**Independent reproduction:** Five representative contexts reproduced as 5/5 persistence-oracle
failures in `RUN-20260823102829114-fr15-auth-reproduction`. Cleanup completed, every request carried
the student header, and no harness/setup failure occurred.

**AI recommendation:** Confirm as a genuine product bug because a required security precondition
was violated in persistent state across distinct token partitions and an independent targeted run.
Human confirmation is still required.

## Candidate 2 — product field and category validation

**ID:** `BUG-CANDIDATE-FR15-VALIDATION`

**Proposed title:** `[HW06][FR-15] POST /api/products persists products that violate documented name, price, and category rules`

**Authoritative expectation:** README FR-15 requires a non-empty name of at most 255 characters, a
positive numeric price, and an existing category. Invalid input must not become a persistent valid
product. The exact rejection status, error schema, and undocumented coercion behavior are SPEC GAP.

**Observed result:** New rows persisted for invalid or absent name values, invalid or absent price
values, invalid, absent, null, or deleted category references, and no-body/empty-object requests.
The stale-category sequence confirmed that the temporary category no longer existed before product
creation was attempted.

**Affected canonical cases (18):** `FR15-AI-003`, `FR15-AI-005`, `FR15-AI-007`,
`FR15-AI-009`, `FR15-AI-010`, `FR15-AI-014`, `FR15-AI-015`, `FR15-AI-016`, `FR15-AI-017`,
`FR15-AI-018`, `FR15-AI-019`, `FR15-AI-036`, `FR15-AI-044`, `FR15-AI-047`, `FR15-AI-048`,
`FR15-AI-059`, `FR15-H-003`, `FR15-H-005`.

**Independent reproduction:** Six representative partitions reproduced as 6/6 persistence-oracle
failures in `RUN-20260823102841701-fr15-validation-reproduction`. Cleanup completed, every request
carried the student header, and no harness/setup failure occurred.

**AI recommendation:** Confirm as a genuine product bug because documented FR-15 constraints were
violated in persistent state across multiple independent input partitions and a targeted rerun.
Human confirmation is still required.

## Decision required

Record an explicit decision for each candidate:

1. Confirm or reject `BUG-CANDIDATE-FR15-AUTHORIZATION` as a genuine bug.
2. Confirm or reject `BUG-CANDIDATE-FR15-VALIDATION` as a genuine bug.

Rejecting or regrouping a candidate does not authorize substitution, screenshot attestation, or
GitHub Issue publication. Issue publication requires a separate explicit authorization.
