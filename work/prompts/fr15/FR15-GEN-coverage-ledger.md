# FR-15 `POST /api/products` — AI generation coverage ledger

> Generation artifact for `ACT-GEN-01`. Candidates are AI-generated and unreviewed; verdicts belong to
> `work/registry/human-reviews.json` after the `HG-FR15-REV-01` student gate.

Batches: `FR15-GEN-B1` contract-domain (26), `FR15-GEN-B2` authorization-security (12),
`FR15-GEN-B3` state-transition (8), `FR15-GEN-B4` schema (8), `FR15-GEN-B5` closure-deduplication (4),
and `FR15-GEN-B6` category-null-closure (1). Total AI candidates: 59.

Runtime fixtures used: seeded categories `1` Dien thoai, `2` Laptop, `3` Phu kien; five seeded
products; admin `admin@eshop.com`; ordinary user `test@eshop.com`; the FR-04 validly-signed-but-expired
JWT fixture, used as a test input only.

## Request parameters

| Item | Partitions/boundaries covered | Candidate IDs |
|---|---|---|
| `name` — valid | ordinary value, 1 character, 255 characters, Vietnamese Unicode | FR15-AI-001, FR15-AI-004, FR15-AI-002, FR15-AI-026 |
| `name` — documented invalid | empty, 256 characters | FR15-AI-005, FR15-AI-003 |
| `name` — exploratory | whitespace-only, omitted, numeric type, padded with spaces | FR15-AI-006, FR15-AI-007, FR15-AI-008, FR15-AI-057 |
| `price` — documented invalid | zero, negative, non-numeric string, omitted, null | FR15-AI-009, FR15-AI-010, FR15-AI-014, FR15-AI-015, FR15-AI-016 |
| `price` — valid and boundary | smallest positive 1, fractional 0.5, very large magnitude | FR15-AI-011, FR15-AI-012, FR15-AI-056 |
| `price` — type coercion | numeric string | FR15-AI-013 |
| `category_id` — valid | seeded 1, 2, 3 | FR15-AI-001, FR15-AI-020, FR15-AI-045 |
| `category_id` — invalid | nonexistent 9999, zero, omitted, non-numeric string, null | FR15-AI-017, FR15-AI-055, FR15-AI-018, FR15-AI-019, FR15-AI-059 |
| `description` — exploratory | empty, omitted, 5000 characters, structured object | FR15-AI-021, FR15-AI-022, FR15-AI-023, FR15-AI-051 |
| `imageUrl` — exploratory | malformed value, omitted, boolean, 2000 characters | FR15-AI-024, FR15-AI-025, FR15-AI-054, FR15-AI-058 |
| `Authorization` | valid admin, missing, non-Bearer scheme, non-JWT string, tampered signature, validly signed but expired, valid ordinary-user token | FR15-AI-001, FR15-AI-027, FR15-AI-029, FR15-AI-030, FR15-AI-031, FR15-AI-032, FR15-AI-028 |
| Undocumented extra body fields | `role`, `stock_quantity` | FR15-AI-033, FR15-AI-052 |

## State transitions

| Starting state → action → next state | Read-back | Candidate IDs |
|---|---|---|
| Catalogue → valid create → product retrievable by its own id | `GET /api/products/:id` | FR15-AI-039 |
| Catalogue of N → valid create → exactly N+1 | `GET /api/products` | FR15-AI-040 |
| Existing products → valid create → existing rows unchanged | `GET /api/products` | FR15-AI-041 |
| Valid create → product findable by documented name search | `GET /api/products?search=` | FR15-AI-042 |
| Product exists → identical second create → duplicate-name behaviour recorded | `GET /api/products` | FR15-AI-043 |
| Rejected invalid create → following valid create → exactly one product persists | `GET /api/products` | FR15-AI-044 |
| Valid create → category association stored as submitted | `GET /api/products` | FR15-AI-020, FR15-AI-045 |
| Valid create → category list unchanged | `GET /api/categories` | FR15-AI-046 |
| Refused create → no product created and existing rows untouched | `GET /api/products` | FR15-AI-027 … FR15-AI-033, FR15-AI-037 |
| Admin session → two sequential creates → both persist independently | `GET /api/products` | FR15-AI-038 |

## Applicable security rules

| SEC | Applicability | Candidate IDs | Evidence boundary |
|---|---|---|---|
| SEC-02 valid JWT required | Direct | FR15-AI-027, FR15-AI-029, FR15-AI-030, FR15-AI-031, FR15-AI-032 | Fully observable at the API |
| SEC-03 admin role required | Direct — this endpoint has a documented role boundary | FR15-AI-028, FR15-AI-033, FR15-AI-037 | Fully observable; FR15-AI-028 is the direct SEC-03 case |
| SEC-04 escaping at display | Relevant to stored product text | FR15-AI-034 | API storage cannot prove UI escaping; a separate display-boundary observation is required |
| SEC-05 parameterized queries | Direct | FR15-AI-035, FR15-AI-036 | A safe response is consistent with, but not proof of, parameterized queries |
| SEC-01, SEC-06, SEC-07 | Not applicable to this operation | — | Marked non-applicable rather than padded with cases |

## Schema rules

| Item | Candidate IDs | Note |
|---|---|---|
| Request envelope faults | FR15-AI-047, FR15-AI-048, FR15-AI-049, FR15-AI-050, FR15-AI-053 | No body, `{}`, malformed JSON, top-level array, `text/plain` |
| Structured wrong type | FR15-AI-051 | Description as an object |
| Additional properties | FR15-AI-052 | No documented additional-property rule |
| Required-field enforcement | FR15-AI-007, FR15-AI-015, FR15-AI-018, FR15-AI-048, FR15-AI-059 | Each required field individually, all three at once, and explicit null category |

## Uncovered items and reasons

| Item | Reason not covered |
|---|---|
| Exact HTTP status codes and error schemas | The API specification documents none for `POST /api/products`; asserting one would invent a contract (`SPEC GAP` recorded on every affected candidate). |
| Response-shape-only observation cases | Deliberately not generated. At the FR-08 audit the student ruled that a case whose request duplicates another case and which asserts no invariant is not a product test case; observed response shapes belong to the owning case's execution evidence. |
| Product update and delete operations | `PUT /api/products/:id` and `DELETE /api/products/:id` are separate operations outside the selected API; delete is used only as cleanup. |
| The FR-12 "other products remain unchanged" rule for updates | The verified extract records that this requirement targets product update; for create it is covered only as the supplemental non-interference check FR15-AI-041. |
| Stock or inventory fields | No FR or API-specification rule defines inventory behaviour for product creation. |
| SEC-04 UI escaping conformance | Requires a display-boundary observation outside this API suite; recorded as an explicit evidence gap on FR15-AI-034. |
| SEC-05 internal query construction | Not observable from black-box API responses; recorded as an explicit evidence gap on FR15-AI-035 and FR15-AI-036. |
