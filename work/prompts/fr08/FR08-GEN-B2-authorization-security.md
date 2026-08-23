# HW06 AI Generation Prompt — HW06-B-FR08-POST-CHECKOUT / FR08-GEN-B2

## Batch identity

- Generation batch ID: `FR08-GEN-B2`
- Coverage stage: `authorization-security`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` SEC-02, SEC-04, SEC-05 and the explicit non-applicability of SEC-01/03/06/07
  - `eshop-sut/api_specification.md` §4 header rule `Authorization: Bearer <token>` and §4.3 Checkout
  - `eshop-sut/api_specification.md` §4.4 order history and §4.5 order detail as read-back mechanisms

## Existing cases to avoid duplicating

- `FR08-AI-001` … `FR08-AI-018` from batch `FR08-GEN-B1` already cover `total_amount` and
  `shipping_address` equivalence partitions, boundaries, wrong scalar types, and the
  cart-derived-total invariant for an authenticated user.

## Coverage slice for this batch

- Required technique/category: authentication boundary, ownership/attribution, client-controlled
  protected fields, and source-defined security rules.
- Parameters/states/SEC/schema rules in scope: SEC-02 valid-JWT requirement, SEC-04 display-boundary
  handling of the user-supplied address, SEC-05 parameterized-query expectation around order
  persistence, order ownership/attribution across two users, and extra client-supplied body fields
  that must not control server-owned order state.
- Explicit exclusions: value partitions and boundaries already covered by `FR08-GEN-B1`, cart
  clearing and other state transitions, malformed-JSON and body-shape schema faults, concurrency.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Use `SPEC GAP` instead of inventing an expected status or schema that the authoritative sources do
  not define.
- For every SEC case, state exactly what the API-level observation can and cannot prove; a safe API
  response must not be presented as proof of internal parameterized queries or of safe UI escaping.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
