# HW06 AI Generation Prompt — HW06-B-FR08-POST-CHECKOUT / FR08-GEN-B5

## Batch identity

- Generation batch ID: `FR08-GEN-B5`
- Coverage stage: `closure-deduplication`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` FR-08 and SEC-02/SEC-03
  - `eshop-sut/api_specification.md` §4.2 add to cart, whose body carries a client-supplied `price`
  - `eshop-sut/api_specification.md` §4.3 Checkout, §4.4 order history, §4.5 order detail

## Existing cases to avoid duplicating

- `FR08-AI-001` … `FR08-AI-018` (`FR08-GEN-B1`): field partitions and boundaries.
- `FR08-AI-019` … `FR08-AI-030` (`FR08-GEN-B2`): authentication, ownership, protected fields, SEC payloads.
- `FR08-AI-031` … `FR08-AI-040` (`FR08-GEN-B3`): cart and order state transitions.
- `FR08-AI-041` … `FR08-AI-050` (`FR08-GEN-B4`): request envelope, body shape, and response-shape observation.

## Coverage slice for this batch

- Required technique/category: closure of the coverage ledger. Add only meaningful cases for risks the
  four earlier batches leave uncovered, and add nothing that merely restates an existing case.
- Parameters/states/SEC/schema rules in scope: cart-quantity arithmetic boundaries, the client-supplied
  `price` field of the add-to-cart body as an input to the FR-08 recalculated total, duplicate
  submission of the same checkout, control characters inside the address, and an admin-role token used
  on a non-admin route.
- Explicit exclusions: any risk already covered by `FR08-GEN-B1` through `FR08-GEN-B4`; filler cases;
  setup or cleanup steps presented as product cases.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Every candidate must name the specific risk it closes and why no earlier batch covers it.
- Use `SPEC GAP` instead of inventing an expected status or schema that the authoritative sources do
  not define.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
