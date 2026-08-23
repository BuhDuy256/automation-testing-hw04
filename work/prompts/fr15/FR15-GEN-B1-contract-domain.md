# HW06 AI Generation Prompt — HW06-C-FR15-POST-PRODUCTS / FR15-GEN-B1

## Batch identity

- Generation batch ID: `FR15-GEN-B1`
- Coverage stage: `contract-domain`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` FR-15 (name required and at most 255 characters, price greater than zero,
    category must exist) and FR-12 (admin-only product data changes)
  - `eshop-sut/api_specification.md` §3.3 Add/Edit/Delete products, request body example
  - `eshop-sut/api_specification.md` §3.1/§3.2 product listing and detail, §3.4 categories

## Known runtime fixtures

- Seeded categories: `1` Dien thoai, `2` Laptop, `3` Phu kien.
- Seeded products exist, so created products must use unique names for repeatable runs.

## Existing cases to avoid duplicating

- No FR-15 cases exist yet in `work/registry/test-cases.json`.

## Coverage slice for this batch

- Required technique/category: equivalence partitioning and boundary value analysis over the
  documented request fields of `POST /api/products`.
- Parameters/states/SEC/schema rules in scope: `name` (required, 1..255, boundaries 0/1/255/256),
  `price` (must be greater than zero, boundaries 0 and smallest positive), `category_id` (must be an
  existing category), and the exploratory partitions of `description` and `imageUrl`.
- Explicit exclusions: authentication and role enforcement, injection and display-boundary payloads,
  persistence/read-back state transitions, request-envelope and response-schema faults, and
  deduplication closure. Those belong to batches B2, B3, B4, and B5.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- FR-15 documents real validation rules, so a documented invalid value must assert the documented
  invariant that it is not persisted as a product. The exact rejection status and error schema remain
  `SPEC GAP`.
- Every creating case must state the unique product name it uses and the cleanup that removes any
  created product.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
