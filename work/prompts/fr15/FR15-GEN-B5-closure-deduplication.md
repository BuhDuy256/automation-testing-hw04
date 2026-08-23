# HW06 AI Generation Prompt — HW06-C-FR15-POST-PRODUCTS / FR15-GEN-B5

## Batch identity

- Generation batch ID: `FR15-GEN-B5`
- Coverage stage: `closure-deduplication`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` FR-15 and FR-12
  - `eshop-sut/api_specification.md` §3.1 to §3.4

## Existing cases to avoid duplicating

- `FR15-AI-001` … `FR15-AI-026` (`FR15-GEN-B1`): field partitions and boundaries.
- `FR15-AI-027` … `FR15-AI-038` (`FR15-GEN-B2`): authorization and security.
- `FR15-AI-039` … `FR15-AI-046` (`FR15-GEN-B3`): catalogue state transitions.
- `FR15-AI-047` … `FR15-AI-054` (`FR15-GEN-B4`): request envelope and body shape.

## Coverage slice for this batch

- Required technique/category: closure of the coverage ledger. Add only meaningful cases for risks the
  four earlier batches leave uncovered, and add nothing that merely restates an existing case.
- Parameters/states/SEC/schema rules in scope: the lower boundary of the category identifier space,
  numeric magnitude of the price, name trimming, and imageUrl length robustness.
- Explicit exclusions: any risk already covered by `FR15-GEN-B1` through `FR15-GEN-B4`; filler cases;
  setup or cleanup operations presented as product cases.

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
