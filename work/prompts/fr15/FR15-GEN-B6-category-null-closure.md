# HW06 AI Generation Prompt — HW06-C-FR15-POST-PRODUCTS / FR15-GEN-B6

## Batch identity

- Generation batch ID: `FR15-GEN-B6`
- Coverage stage: `category-null-closure`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate exactly one candidate API test case for the coverage slice below. Do not modify or duplicate
`FR15-AI-001` through `FR15-AI-058`. Do not claim execution, observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`
- `eshop-sut/README.md` FR-15: the selected category must exist.
- `eshop-sut/api_specification.md` §3.3: `category_id` is part of the create-product JSON body.

## Existing cases to avoid duplicating

- `FR15-AI-017`: concrete nonexistent category id `9999`.
- `FR15-AI-018`: omitted `category_id`.
- `FR15-AI-019`: non-numeric string `category_id`.
- `FR15-AI-055`: category id `0`, proposed INVALID as a duplicate nonexistent-category value.

## Coverage slice for this batch

- Generate the next immutable candidate id `FR15-AI-059`.
- Send `category_id: null` with a valid admin JWT, a unique valid name, and a valid positive price.
- Treat null as the missing invalid category partition named by the verified extract.
- Observable oracle: invalid data must not create a persistent product; verify the unique name is absent
  through `GET /api/products`.
- Exact HTTP status and error schema remain `SPEC GAP`.

## Required candidate fields

- Include every field required by `hw06-api-test-generator`.
- Keep one diagnostic fault: only `category_id` is invalid.
- Include setup, read-back, and cleanup for accidental persistence.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return exactly one candidate only. Do not assign a human verdict, claim execution, or invent runtime evidence.
