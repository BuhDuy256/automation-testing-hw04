# HG-FR15-REV-01 — AI review proposal for the FR-15 candidate suite

> **NON-CANONICAL.** Every verdict below is an AI recommendation only. No student verdict exists yet.
> Canonical human review lives in `work/registry/human-reviews.json`, which is unchanged and contains
> no FR-15 record.

- Selected API: `HW06-C-FR15-POST-PRODUCTS` — `POST /api/products`
- Candidates under review: `FR15-AI-001` … `FR15-AI-058` (58 AI-generated cases)
- Passes performed: generation, independent review, adversarial verification, and mechanical checks.
  All were separate passes inside one Claude Code session (`claude-opus-5`); no independent agent
  identity is claimed.
- Standards carried over from the FR-08 audit and applied here deliberately: no invented status or
  schema, no invented validation rule where the specification is silent, exact executable values, one
  diagnostic fault per negative case, SEC-04 limited to an API-side observation, and no
  response-shape-only cases.

## Recommendation summary

| Recommendation | Count | Cases |
|---|---:|---|
| VALID | 52 | all cases not listed below |
| INCOMPLETE | 4 | FR15-AI-002, FR15-AI-046, FR15-AI-049, FR15-AI-056 |
| INVALID | 2 | FR15-AI-038, FR15-AI-045 |

If every recommendation is accepted, the usable AI-origin FR-15 suite is 56 cases, above the
assignment minimum of 35.

## Mechanical check results (all 58)

| Check | Result |
|---|---|
| Invented HTTP status codes in an oracle | none |
| `SPEC GAP` present where behaviour is undocumented | 58/58 |
| Duplicate titles | none |
| Read-back stated in `setupReset` | 58/58 |
| Cleanup/reset stated in `setupReset` | 58/58 |
| Prospective provenance fields complete | 58/58 (`npm run hw06:validate` PASS, 0 errors) |

## Cases recommended as not VALID

| Case | Purpose | Rec | Reason | Proposed correction | Source anchor | Uncertainty |
|---|---|---|---|---|---|---|
| FR15-AI-002 | Name at the documented maximum of 255 characters | **INCOMPLETE** | FR-15 documents that 255 is allowed, so the case may assert acceptance. It additionally asserts that the stored name is preserved at full length, which no source requires — the same over-assertion the student corrected on `FR08-AI-018` | Keep the 255-character input. Assert only that the product is created, since 255 is inside the documented limit; record the stored name and its length through the read-back; do not treat truncation or normalisation as a contract violation without an authoritative rule; exact storage behaviour remains `SPEC GAP` | README FR-15 name maximum 255 characters | If the stored name is shorter, that is an observation, not an automatic defect |
| FR15-AI-046 | A create must not modify the category list | **INCOMPLETE** | No source states that creating a product leaves categories untouched. The inference is reasonable because §3.4 defines separate category endpoints, but as written the case asserts an undocumented rule | Narrow the oracle to side-effect containment that follows from §3.4 having its own category endpoints: assert that no category is added or removed by a product create, and record any other difference such as a rename as an observation rather than a failure; state the inference explicitly | api_specification §3.4 Danh muc; §3.3 create | The containment inference is mine, not a quoted rule; the student may prefer to drop the case |
| FR15-AI-049 | Malformed JSON body | **INCOMPLETE** | The malformed payload is described narratively rather than as exact bytes, so two testers could send different inputs — the same defect the student corrected on `FR08-AI-043` | Send exactly the raw body `{"name": "FR15 AI 049", "price":` with no value, closing quote or brace, and require the Postman implementation to send it without re-serialising it into valid JSON | api_specification §3.3 Body (JSON) | None once the bytes are fixed |
| FR15-AI-056 | Extremely large price | **INCOMPLETE** | FR-15 only requires the price to be greater than zero. Asserting that `999999999999999` is stored exactly invents a precision requirement, the same over-assertion pattern corrected on `FR08-AI-018` | Keep the input. Assert only the documented invariant that any created product has a price greater than zero, then record the stored value and flag overflow, truncation or rounding as an observation; exact numeric behaviour remains `SPEC GAP` | README FR-15 price greater than zero | No documented numeric ceiling or precision rule exists |
| FR15-AI-038 | Admin token reused for two sequential creates | **INVALID** | The case is `FR15-AI-001` executed twice. No source documents a single-use token or a per-session create limit, so it tests an invented risk, and independent persistence of multiple products is already covered by `FR15-AI-040` (count) and `FR15-AI-041` (existing rows unchanged) | Drop it. Do not keep a repeated baseline create for count optics | README FR-12 admin-only product changes | If the student wants a multi-create persistence case, `FR15-AI-040` and `FR15-AI-041` already carry that invariant |
| FR15-AI-045 | Product created against the third seeded category | **INVALID** | Duplicate diagnostic of `FR15-AI-020`. Both assert that the submitted `category_id` is stored rather than defaulted; using a third category adds no new partition, only another arbitrary value — the same redundancy the student rejected on `FR08-AI-052` | Drop it and keep `FR15-AI-020` as the non-defaulting category case | README FR-15 category must exist | If category-specific behaviour is later observed at runtime, it can be treated separately |

## Cases recommended VALID

Every row below carries the same recommendation (VALID) and the same reason: executable as written
from a stated starting state, one injected fault, an oracle anchored to FR-15, FR-12, a SEC rule or
the API specification with undocumented behaviour kept as `SPEC GAP`, a real read-back, a cleanup,
and no duplication of another case. Only purpose, anchor, and remaining uncertainty differ.

### Batch FR15-GEN-B1 — contract/domain

| Case | Purpose | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|
| FR15-AI-001 | Baseline valid create with all documented fields | README FR-15; api_spec §3.3 | Success status and response schema undocumented |
| FR15-AI-003 | Name one character above the documented maximum | README FR-15 (255 limit) | Rejection status undocumented |
| FR15-AI-004 | Name of exactly one character | README FR-15 required name | Read-back uses the created id to avoid name collisions |
| FR15-AI-005 | Empty-string name | README FR-15 required name | Rejection status undocumented |
| FR15-AI-006 | Whitespace-only name | README FR-15; verified extract | Whether blank counts as empty is undocumented |
| FR15-AI-007 | Name omitted | README FR-15; api_spec §3.3 | Rejection status undocumented |
| FR15-AI-008 | Name sent as a number | api_spec §3.3 | Type contract undocumented |
| FR15-AI-009 | Price zero — nearest invalid boundary | README FR-15 price greater than zero | Rejection status undocumented |
| FR15-AI-010 | Negative price | README FR-15 | Rejection status undocumented |
| FR15-AI-011 | Smallest positive price | README FR-15 | Assumes integer currency; fractional covered separately |
| FR15-AI-012 | Fractional positive price | README FR-15 | No precision rule; rounding recorded, not judged |
| FR15-AI-013 | Price as a numeric string | api_spec §3.3; README FR-15 | Coercion rule undocumented |
| FR15-AI-014 | Price as a non-numeric string | README FR-15 | Rejection status undocumented |
| FR15-AI-015 | Price omitted | README FR-15; api_spec §3.3 | Distinct from null |
| FR15-AI-016 | Price null | README FR-15 | Nullability undocumented |
| FR15-AI-017 | Nonexistent category 9999 | README FR-15 category must exist | Verifies absence at run time |
| FR15-AI-018 | Category omitted | README FR-15; api_spec §3.3 | Distinct from nonexistent and null |
| FR15-AI-019 | Category as a non-numeric string | README FR-15 | Rejection status undocumented |
| FR15-AI-020 | Product stored against seeded category 2 | README FR-15; api_spec §3.4 | Proves the category is not silently defaulted |
| FR15-AI-021 | Empty description | verified extract; api_spec §3.3 | No documented description rule |
| FR15-AI-022 | Description omitted | verified extract Schema checks | Optionality unspecified |
| FR15-AI-023 | Description of 5000 characters | verified extract robustness partitions | Truncation recorded, not judged |
| FR15-AI-024 | Malformed imageUrl | verified extract; api_spec §3.3 | No URL-validation rule |
| FR15-AI-025 | imageUrl omitted | verified extract Schema checks | Optionality unspecified |
| FR15-AI-026 | Vietnamese Unicode name round-trip | README FR-15; api_spec §3.3 | Round-trip fidelity follows the standard the student endorsed on FR08-AI-012 |

### Batch FR15-GEN-B2 — authorization/security

| Case | Purpose | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|
| FR15-AI-027 | No Authorization header | README FR-12, SEC-02; api_spec §3.3 | Rejection status undocumented |
| FR15-AI-028 | Valid ordinary-user token on an admin-only create | README SEC-03, FR-12 | The direct SEC-03 case; this endpoint genuinely has a documented role boundary |
| FR15-AI-029 | Non-Bearer authorization scheme | api_spec §2 header rule; SEC-02 | Rejection status undocumented |
| FR15-AI-030 | Structurally invalid token | README SEC-02 | Rejection status undocumented |
| FR15-AI-031 | Admin token with a deterministically tampered signature | README SEC-02 | Mutation rule fixed in advance, as corrected on FR08-AI-022 |
| FR15-AI-032 | Validly signed but expired admin token | README SEC-02; verified extract | Fails for expiry, not signature; fixture is a test input only |
| FR15-AI-033 | Client-supplied `role: admin` with a user token | README SEC-03; api_spec §3.3 | Distinct from FR15-AI-028: the fault is the body-borne claim |
| FR15-AI-034 | HTML payload preserved through the API | README SEC-04 | Explicit evidence gap: API storage never proves UI escaping |
| FR15-AI-035 | SQL metacharacters in the name | README SEC-05 | Explicit evidence gap: internal query construction is not observable |
| FR15-AI-036 | SQL metacharacters in the category reference | README SEC-05; FR-15 | Request shape overlaps FR15-AI-019; the persistence-integrity oracle separates them |
| FR15-AI-037 | Refused non-admin create leaves the catalogue untouched | README FR-12; api_spec §3.1 | Asserts existing rows, which FR15-AI-028 does not |

### Batch FR15-GEN-B3 — state transition

| Case | Purpose | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|
| FR15-AI-039 | Created product retrievable by its own id | api_spec §3.2, §3.3 | Falls back to the name lookup if no id is returned |
| FR15-AI-040 | Catalogue grows by exactly one | api_spec §3.1 | Paging behaviour unknown |
| FR15-AI-041 | Existing products unchanged after a create | verified extract State and setup | The extract explicitly allows this supplemental check |
| FR15-AI-042 | Created product findable by the documented name search | api_spec §3.1 `?search=` | Search semantics beyond name matching are undocumented |
| FR15-AI-043 | Two products created with an identical name | verified extract Unknowns | Duplicate-name behaviour undocumented; observational by design |
| FR15-AI-044 | Valid create succeeds after a rejected invalid one | README FR-15; api_spec §3.1 | Adds the recovery transition FR15-AI-010 does not cover |

### Batch FR15-GEN-B4 — schema

| Case | Purpose | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|
| FR15-AI-047 | No request body | README FR-15 required fields | Rejection status undocumented |
| FR15-AI-048 | Empty JSON object | README FR-15; api_spec §3.3 | All three required fields absent at once |
| FR15-AI-050 | Top-level JSON array | api_spec §3.3 | Structural handling undocumented |
| FR15-AI-051 | Description as a nested object | api_spec §3.3 | Structured wrong type, distinct from FR15-AI-008 |
| FR15-AI-052 | Unknown additional property `stock_quantity` | verified extract Schema checks | No additional-property rule |
| FR15-AI-053 | `text/plain` Content-Type with a JSON payload | api_spec §3.3 | No Content-Type rule; oracle compares product fields only |
| FR15-AI-054 | imageUrl as a boolean | api_spec §3.3 | Type contract undocumented |

### Batch FR15-GEN-B5 — closure/deduplication

| Case | Purpose | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|
| FR15-AI-055 | Category id zero | README FR-15 category must exist | Closes the lower boundary of the identifier space |
| FR15-AI-057 | Name padded with leading and trailing spaces | README FR-15; verified extract | Trimming behaviour recorded, not judged |
| FR15-AI-058 | imageUrl of 2000 characters | verified extract robustness partitions | Truncation recorded, not judged |

## Notes carried from the FR-08 audit and applied during generation

- No response-shape-only case was generated, because the student ruled at the FR-08 gate that a case
  whose request duplicates another case and which asserts no invariant is evidence, not a test case.
- Every tampering case fixes its mutation deterministically in advance.
- The Vietnamese case carries real diacritics in the literal value rather than describing them.
- SEC-04 is scoped to API-side preservation with the UI evidence gap stated inside the case.
- SEC-03 is claimed here, unlike FR-08, because `POST /api/products` has a documented admin-only role
  boundary in README FR-12 and SEC-03.
