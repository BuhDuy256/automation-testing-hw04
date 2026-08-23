# HW06 AI Generation Prompt — HW06-B-FR08-POST-CHECKOUT / FR08-GEN-B1

## Batch identity

- Generation batch ID: `FR08-GEN-B1`
- Coverage stage: `contract-domain`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/api_specification.md` §4 Cart & Orders header rule and §4.3 Checkout request body
  - `eshop-sut/README.md` FR-08 Checkout business rules
  - `eshop-sut/api_specification.md` §4.2 Add to cart (setup mechanism)

## Existing cases to avoid duplicating

- No FR-08 cases exist yet in `work/registry/test-cases.json`; FR-04 cases target `PUT /api/users/me` only.

## Coverage slice for this batch

- Required technique/category: equivalence partitioning and boundary value analysis on the two
  documented body fields of `POST /api/checkout`, plus the documented cart-derived-total invariant.
- Parameters/states/SEC/schema rules in scope: `total_amount` partitions and boundaries,
  `shipping_address` partitions and boundaries, FR-08 rule "backend recalculates the total and does
  not accept the client `total_amount`".
- Explicit exclusions: authentication/authorization failures, injection and display-boundary payloads,
  cart-state transitions and cart clearing, request/response schema shape faults, concurrency.
  Those belong to batches B2, B3, B4, and B5.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Use `SPEC GAP` instead of inventing an expected status or schema that the authoritative sources do
  not define.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
