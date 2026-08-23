# HW06 AI Generation Prompt — HW06-B-FR08-POST-CHECKOUT / FR08-GEN-B4

## Batch identity

- Generation batch ID: `FR08-GEN-B4`
- Coverage stage: `schema`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md`, sections
  `Response contract`, `Schema checks`, and `Unknowns requiring runtime verification`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/api_specification.md` §4.3 Checkout request body
  - `eshop-sut/api_specification.md` §4.4 order history and §4.5 order detail as read-back mechanisms

## Existing cases to avoid duplicating

- `FR08-AI-001` … `FR08-AI-018` (`FR08-GEN-B1`): field value partitions, boundaries, and scalar wrong
  types for `total_amount` and `shipping_address`.
- `FR08-AI-019` … `FR08-AI-030` (`FR08-GEN-B2`): authentication, ownership, protected extra fields,
  and security payloads.
- `FR08-AI-031` … `FR08-AI-040` (`FR08-GEN-B3`): cart and order state transitions.

## Coverage slice for this batch

- Required technique/category: request envelope and body-shape faults, plus response-shape
  observation where the specification defines no exact schema.
- Parameters/states/SEC/schema rules in scope: absent body, empty JSON object, malformed JSON, wrong
  top-level JSON type, structured wrong type for a documented field, unknown additional properties,
  request Content-Type handling, and observation of the actual success response shape.
- Explicit exclusions: scalar value partitions from `FR08-GEN-B1`, authentication and injection cases
  from `FR08-GEN-B2`, cart/order state transitions from `FR08-GEN-B3`, concurrency.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- The specification documents no response status or error schema for this endpoint, so no case may
  assert a specific status code. Assert only the FR-08 invariants plus a structured HTTP response,
  and mark the exact status and body `SPEC GAP`.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
