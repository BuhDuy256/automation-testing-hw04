# HW06 AI Generation Prompt — HW06-C-FR15-POST-PRODUCTS / FR15-GEN-B3

## Batch identity

- Generation batch ID: `FR15-GEN-B3`
- Coverage stage: `state-transition`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`, section
  `State and setup`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` FR-15 and FR-12
  - `eshop-sut/api_specification.md` §3.1 product list, §3.2 product detail, §3.3 create, §3.4 categories

## Known runtime fixtures

- Seeded categories `1`, `2`, `3`; five seeded products exist.
- Created products must use run-unique names and must be deleted afterwards or the database reset.

## Existing cases to avoid duplicating

- `FR15-AI-001` … `FR15-AI-026` (`FR15-GEN-B1`): field partitions and boundaries.
- `FR15-AI-027` … `FR15-AI-038` (`FR15-GEN-B2`): authentication, role enforcement, SEC payloads.

## Coverage slice for this batch

- Required technique/category: state-transition testing with an explicit starting state, action,
  expected next state, authoritative read-back, and reset plan.
- Parameters/states/SEC/schema rules in scope: creation persistence and retrievability, catalogue
  count, non-interference with existing products and categories, category association, duplicate
  names, and recovery after a rejected create.
- Explicit exclusions: field partitions from `FR15-GEN-B1`, authorization from `FR15-GEN-B2`,
  request-envelope and response-shape faults, deduplication closure.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Every case must state the exact starting catalogue snapshot, the read-back call used to observe the
  next state, and the cleanup that removes created products.
- Do not turn a supporting delete or list call into a product test case of its own.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
