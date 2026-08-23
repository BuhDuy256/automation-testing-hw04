# HW06 AI Generation Prompt — HW06-C-FR15-POST-PRODUCTS / FR15-GEN-B4

## Batch identity

- Generation batch ID: `FR15-GEN-B4`
- Coverage stage: `schema`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`, sections
  `Response contract`, `Schema checks`, and `Unknowns requiring runtime verification`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/api_specification.md` §3.3 request body
  - `eshop-sut/api_specification.md` §3.1 product list as the read-back mechanism

## Existing cases to avoid duplicating

- `FR15-AI-001` … `FR15-AI-026` (`FR15-GEN-B1`): field value partitions and scalar wrong types.
- `FR15-AI-027` … `FR15-AI-038` (`FR15-GEN-B2`): authorization and security payloads.
- `FR15-AI-039` … `FR15-AI-046` (`FR15-GEN-B3`): catalogue state transitions.

## Coverage slice for this batch

- Required technique/category: request envelope and body-shape faults.
- Parameters/states/SEC/schema rules in scope: absent body, empty JSON object, malformed JSON, wrong
  top-level JSON type, structured wrong type for a documented field, unknown additional properties,
  and request Content-Type handling.
- Explicit exclusions: scalar value partitions from `FR15-GEN-B1`, authorization from `FR15-GEN-B2`,
  state transitions from `FR15-GEN-B3`, and any case whose only purpose is to record an undocumented
  response shape for a request another case already sends. Response-shape recording belongs to the
  execution evidence of the case that owns that request.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Where FR-15 defines a real rule, assert the documented invariant that an invalid product is not
  persisted; where it does not, record the observation and mark the exact behaviour `SPEC GAP`.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
