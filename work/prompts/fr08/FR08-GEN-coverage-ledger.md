# FR-08 `POST /api/checkout` — AI generation coverage ledger

> Generation artifact for `ACT-GEN-01`. Candidates are AI-generated and unreviewed; verdicts belong to
> `work/registry/human-reviews.json` after the `HG-FR08-REV-01` student gate.

Batches: `FR08-GEN-B1` contract-domain (18), `FR08-GEN-B2` authorization-security (12),
`FR08-GEN-B3` state-transition (10), `FR08-GEN-B4` schema (10), `FR08-GEN-B5` closure-deduplication (6),
`FR08-GEN-B6` authorization-closure (1).
Total AI candidates: 57.

## Request parameters

| Item | Partitions/boundaries covered | Candidate IDs |
|---|---|---|
| `total_amount` — equal to cart total | valid reference value | FR08-AI-001, FR08-AI-033, FR08-AI-034, FR08-AI-051, FR08-AI-052 |
| `total_amount` — mismatch | lower, higher, fractional near-boundary | FR08-AI-002, FR08-AI-003, FR08-AI-010 |
| `total_amount` — numeric boundaries | zero, negative, very large | FR08-AI-004, FR08-AI-005, FR08-AI-011 |
| `total_amount` — absence/null | omitted key, explicit null | FR08-AI-006, FR08-AI-007 |
| `total_amount` — wrong type | numeric string, non-numeric string, boolean | FR08-AI-008, FR08-AI-009, FR08-AI-046 |
| `shipping_address` — valid | ASCII example value, Vietnamese diacritics | FR08-AI-001, FR08-AI-012 |
| `shipping_address` — blank forms | empty string, whitespace-only, null, omitted | FR08-AI-013, FR08-AI-014, FR08-AI-015, FR08-AI-016 |
| `shipping_address` — wrong type | scalar number, nested object | FR08-AI-017, FR08-AI-045 |
| `shipping_address` — robustness | 1000 characters, control characters, HTML payload, SQL metacharacters | FR08-AI-018, FR08-AI-055, FR08-AI-028, FR08-AI-029 |
| `Authorization` header | valid user, missing, non-Bearer scheme, empty credential, tampered signature, non-JWT string, foreign-signed JWT, validly signed but expired, admin identity | FR08-AI-001, FR08-AI-019, FR08-AI-020, FR08-AI-021, FR08-AI-022, FR08-AI-023, FR08-AI-024, FR08-AI-057, FR08-AI-056 |
| Undocumented extra body fields | `user_id`, `status`, `discount_code` | FR08-AI-026, FR08-AI-027, FR08-AI-047 |
| Upstream cart input `price` (§4.2) | client-supplied price below catalogue price | FR08-AI-053 |

## State transitions

| Starting state → action → next state | Read-back | Candidate IDs |
|---|---|---|
| Non-empty cart → successful checkout → cart cleared | `GET /api/cart` | FR08-AI-031 |
| Non-empty cart → successful checkout → one new order | `GET /api/orders/my-orders` | FR08-AI-032 |
| Multi-line cart → checkout → total equals sum of line amounts | `GET /api/orders/:id` | FR08-AI-033 |
| Aggregated-quantity cart (FR-07) → checkout → total reflects aggregation | `GET /api/orders/:id` | FR08-AI-034 |
| Empty cart → checkout → no order carrying the client value | `GET /api/orders/my-orders` | FR08-AI-035 |
| Post-checkout empty cart → second checkout → no additional paid order | `GET /api/orders/my-orders`, `GET /api/cart` | FR08-AI-036 |
| Non-empty cart → refused unauthenticated checkout → cart unchanged | `GET /api/cart` | FR08-AI-037 |
| Checkout → order retrievable by its own detail endpoint | `GET /api/orders/:id` | FR08-AI-038 |
| User A checkout → user B cart unchanged | `GET /api/cart` as user B | FR08-AI-039 |
| Cleared cart → rebuild and checkout again → independent total | `GET /api/cart`, `GET /api/orders/:id` | FR08-AI-040 |
| One cart → two back-to-back identical checkouts → at most one paid order | `GET /api/orders/my-orders` | FR08-AI-054 |
| Quantity boundaries 1 and 99 → checkout → exact arithmetic | `GET /api/orders/:id` | FR08-AI-051, FR08-AI-052 |
| Any refused request → no order created | `GET /api/orders/my-orders` | FR08-AI-019 … FR08-AI-024, FR08-AI-057 |
| Expired-token attempt → no order created and cart unchanged | `GET /api/orders/my-orders`, `GET /api/cart` | FR08-AI-057 |

## Applicable security rules

| SEC | Applicability | Candidate IDs | Evidence boundary |
|---|---|---|---|
| SEC-02 valid JWT required | Direct | FR08-AI-019 … FR08-AI-024, FR08-AI-037, FR08-AI-050, FR08-AI-057 | Fully observable at the API |
| SEC-04 escaping at display | Relevant to the stored address | FR08-AI-028 | API storage cannot prove UI escaping; a separate UI/display-boundary observation is required |
| SEC-05 parameterized queries | Relevant to order persistence | FR08-AI-029, FR08-AI-030 | A safe response is consistent with, but not proof of, parameterized queries |
| SEC-03 admin role check | Not directly applicable; checkout is not an admin route | FR08-AI-056 | Covered only as the role dimension of a non-admin route |
| SEC-01, SEC-06, SEC-07 | Not applicable to this operation | — | Marked non-applicable rather than padded with cases |
| Ownership/attribution | Derived from SEC-02 identity binding | FR08-AI-025, FR08-AI-026, FR08-AI-039 | Requires a second registered account |

## Schema rules

| Item | Candidate IDs | Note |
|---|---|---|
| Request envelope faults | FR08-AI-041, FR08-AI-042, FR08-AI-043, FR08-AI-044, FR08-AI-048 | No body, `{}`, malformed JSON, top-level array, `text/plain` Content-Type |
| Field type shape | FR08-AI-045, FR08-AI-046 | Structured wrong type and boolean |
| Additional properties | FR08-AI-047 | No documented additional-property rule |
| Success response shape | FR08-AI-049 | Status and schema undocumented; observation only |
| Rejection response shape | FR08-AI-050 | Error schema undocumented; observation only |

## Uncovered items and reasons

| Item | Reason not covered |
|---|---|
| Exact HTTP status codes for every negative case | The API specification documents no status or error schema for `POST /api/checkout`; asserting one would invent a contract (`SPEC GAP` recorded on every affected candidate). |
| Cart item removal before checkout | No cart-removal endpoint is documented in `eshop-sut/api_specification.md` §4, so such a case would not be executable as written. |
| `shipping_address` maximum length boundary pair (for example 255/256) | No maximum length is documented; the single 1000-character robustness case (FR08-AI-018) covers the risk without inventing a limit. |
| Order status lifecycle after creation | `PUT /api/orders/:id/cancel` (§4.6) is a separate operation outside the selected API; only client-supplied status at creation time is covered (FR08-AI-027). |
| Stock/inventory decrement on checkout | No FR or API-specification rule defines inventory behavior for checkout. |
| True parallel concurrency | Only back-to-back sequential submission is executable in Newman (FR08-AI-054); a genuine race would need a tool outside the agreed Postman/Newman toolchain. |
| SEC-04 UI escaping conformance | Requires a display-boundary observation outside this API suite; recorded as an explicit evidence gap on FR08-AI-028. |
| SEC-05 internal query construction | Not observable from black-box API responses; recorded as an explicit evidence gap on FR08-AI-029 and FR08-AI-030. |

## Correction after adversarial verification (revision 2)

The `expired` authorization partition was first recorded here as uncovered and untestable. That was
wrong for this repository: `work/postman/fr04/FR04-profile.postman_environment.json` already carries
a validly-signed-but-expired JWT fixture whose signature verifies against the local SUT development
secret and whose `exp` claim is `1`. The mechanism was re-minted for user id 2 and used to generate
`FR08-AI-057` in batch `FR08-GEN-B6`. The fixture is a test input only; no oracle in that candidate
is derived from implementation code.
