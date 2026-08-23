# HW06 AI Generation Prompt — <API-ID> / <BATCH-ID>

## Batch identity

- Generation batch ID: `<BATCH-ID>`
- Coverage stage: `<contract-domain | authorization-security | state-transition | schema | closure-deduplication>`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `<repository-relative-path>`
- Exact source sections to consult if the extract is insufficient:

## Existing cases to avoid duplicating

- Existing case IDs/titles or a compact generated index:

## Coverage slice for this batch

- Required technique/category:
- Parameters/states/SEC/schema rules in scope:
- Explicit exclusions:

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
