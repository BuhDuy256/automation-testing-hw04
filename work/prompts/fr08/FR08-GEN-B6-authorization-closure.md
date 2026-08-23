# HW06 AI Generation Prompt — HW06-B-FR08-POST-CHECKOUT / FR08-GEN-B6

## Batch identity

- Generation batch ID: `FR08-GEN-B6`
- Coverage stage: `authorization-closure`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Why this batch exists

Adversarial verification of batch `FR08-GEN-B2` found the `expired` authorization partition named in
the verified spec extract uncovered. The earlier assumption that an expired token cannot be produced
was checked against the repository and is wrong: the FR-04 suite already carries a reusable
validly-signed-but-expired JWT fixture in
`work/postman/fr04/FR04-profile.postman_environment.json` (`expiredToken`), whose signature verifies
against the local SUT development secret and whose `exp` claim is `1` (1970-01-01T00:00:01Z).

The same local fixture mechanism is reused here for the FR-08 ordinary test user. This is a
test-input fixture only. No product oracle may be derived from implementation code.

## Authoritative input

- Verified spec extract: `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`, Authorization
  row of `Domain partitions and boundaries` (valid token versus missing, malformed, expired, invalid
  signature) and the SEC-02 row of `Applicable security requirements`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` SEC-02 and FR-08 logged-in-user rule
  - `eshop-sut/api_specification.md` §4 Authorization header rule, §4.1 get cart, §4.4 order history

## Existing cases to avoid duplicating

- `FR08-AI-019` missing header, `FR08-AI-020` non-Bearer scheme, `FR08-AI-021` empty credential,
  `FR08-AI-022` tampered signature, `FR08-AI-023` non-JWT string, `FR08-AI-024` foreign-signed token.
- The new case must fail for expiry rather than for signature validity, so its token must verify
  against the same secret the SUT uses to sign genuine logins.

## Coverage slice for this batch

- Required technique/category: the single uncovered `expired` authorization partition.
- Parameters/states/SEC/schema rules in scope: SEC-02 valid-token requirement, the FR-08 logged-in
  rule, absence of order creation, and absence of cart mutation.
- Explicit exclusions: every other authorization partition, all value partitions, all schema faults,
  and all state transitions already covered by batches `FR08-GEN-B1` through `FR08-GEN-B5`.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- The oracle must be limited to authoritative security invariants: checkout is not authorized, no new
  order is created, and protected checkout state is not mutated. The exact rejection status and error
  schema remain `SPEC GAP`.
- The candidate must state the exact token string used, so the case is executable and deterministic.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
