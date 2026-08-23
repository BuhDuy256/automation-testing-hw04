# HW06 AI Generation Prompt — HW06-B-FR08-POST-CHECKOUT / FR08-GEN-B3

## Batch identity

- Generation batch ID: `FR08-GEN-B3`
- Coverage stage: `state-transition`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`, sections
  `State and setup` and `Unknowns requiring runtime verification`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` FR-08 rules "the total is calculated automatically from the cart" and
    "after a successful checkout the cart is cleared"
  - `eshop-sut/README.md` FR-07 rule "adding the same product again increases its quantity"
  - `eshop-sut/api_specification.md` §4.1 get cart, §4.2 add to cart, §4.4 order history, §4.5 order detail

## Existing cases to avoid duplicating

- `FR08-AI-001` … `FR08-AI-018` (batch `FR08-GEN-B1`): value partitions and boundaries.
- `FR08-AI-019` … `FR08-AI-030` (batch `FR08-GEN-B2`): authentication, ownership, protected fields,
  and security payloads.

## Coverage slice for this batch

- Required technique/category: state-transition testing with an explicit starting state, action,
  expected next state, authoritative read-back, and reset plan.
- Parameters/states/SEC/schema rules in scope: cart cleared after a successful checkout, order
  created and visible in the personal order history, the total derived from real cart contents
  including multi-item and aggregated-quantity carts, empty-cart checkout, repeated checkout, and
  cart isolation between users.
- Explicit exclusions: value partitions already covered by `FR08-GEN-B1`, authentication and security
  payloads already covered by `FR08-GEN-B2`, request/response body-shape faults, concurrency.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Every case must state the exact starting cart/order state, the exact read-back call used to observe
  the next state, and the reset needed because implementation cart state is process memory while
  orders persist in SQLite.
- Use `SPEC GAP` instead of inventing an expected status or schema that the authoritative sources do
  not define.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
