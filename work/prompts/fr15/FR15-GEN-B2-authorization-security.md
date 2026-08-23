# HW06 AI Generation Prompt — HW06-C-FR15-POST-PRODUCTS / FR15-GEN-B2

## Batch identity

- Generation batch ID: `FR15-GEN-B2`
- Coverage stage: `authorization-security`
- The invoking session records the actual tool/model and completion time immediately after the response.

## Task boundary

Generate candidate API test cases only for the coverage slice stated below. Do not claim execution,
observed responses, or product bugs.

## Authoritative input

- Verified spec extract: `work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md`, the
  `Applicable security requirements` table and the Authorization row of `Domain partitions`
- Exact source sections to consult if the extract is insufficient:
  - `eshop-sut/README.md` FR-12 (admin-only product data changes), SEC-02, SEC-03, SEC-04, SEC-05
  - `eshop-sut/api_specification.md` §3.3 admin product endpoints and §6 authorization notes
  - `eshop-sut/api_specification.md` §3.1 product listing as the read-back mechanism

## Known runtime fixtures

- Admin account `admin@eshop.com` / `Admin123!`; ordinary user `test@eshop.com` / `Test1234!`.
- A validly signed but expired JWT fixture exists in
  `work/postman/fr04/FR04-profile.postman_environment.json`; it is a test input only and no product
  expectation may be derived from implementation code.
- Seeded categories: `1`, `2`, `3`.

## Existing cases to avoid duplicating

- `FR15-AI-001` … `FR15-AI-026` from batch `FR15-GEN-B1` cover field partitions and boundaries under a
  valid admin token.

## Coverage slice for this batch

- Required technique/category: authentication boundary, role enforcement, and source-defined security
  rules.
- Parameters/states/SEC/schema rules in scope: SEC-02 valid-JWT requirement, SEC-03 admin-role
  requirement including a valid non-admin token, FR-12 admin-only product changes, SEC-04
  display-boundary handling of product text, and SEC-05 parameterized persistence.
- Explicit exclusions: field partitions already covered by `FR15-GEN-B1`, persistence and read-back
  state transitions, request-envelope and response-schema faults, deduplication closure.

## Required candidate fields

- All candidate fields required by `hw06-api-test-generator`, including a stable temporary ID,
  concrete request, observable oracle, basis, coverage tags, requirement references, exact source
  anchors, setup/reset, assumptions, and generation context.
- Every refused case must assert the persisted-state invariant that no product was created, read back
  through `GET /api/products`.
- For every SEC case, state exactly what the API-level observation can and cannot prove. A safe API
  response must never be presented as proof of parameterized queries or of safe UI escaping.
- Repeat the supplied generation batch ID. The invoking session stamps the actual tool/model,
  verbatim prompt, and completion time immediately after the response.

## Output rule

Return candidates only. Do not label them VALID, do not silently correct the specification, and do
not invent runtime evidence. State `SPEC GAP` where the authoritative inputs do not define an oracle.
