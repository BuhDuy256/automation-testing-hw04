# HW06 AI Generation Prompt — <API-ID> / <BATCH-ID>

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

- Temporary candidate title
- Preconditions/setup
- Request inputs
- Expected status and response assertions derived from the specification
- Coverage tags
- Requirement/source references
- Assumptions or missing information

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
