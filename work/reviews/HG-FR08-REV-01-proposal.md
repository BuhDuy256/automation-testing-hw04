# HG-FR08-REV-01 — AI review proposal for the FR-08 candidate suite

> **NON-CANONICAL.** This file is an AI recommendation only. No verdict here is a student verdict.
> Canonical human review lives in `work/registry/human-reviews.json` and is written only after the
> student's explicit approval or overrides.

- Selected API: `HW06-B-FR08-POST-CHECKOUT` — `POST /api/checkout`
- Candidates under review: `FR08-AI-001` … `FR08-AI-056` (56 AI-generated cases)
- Passes performed: one generation pass, one independent review pass, one adversarial verification
  pass, and one mechanical check pass. All four were separate passes inside a single Claude Code
  session; no independent agent identity is claimed.
- Mechanical checks: no candidate asserts a bare HTTP status code, every candidate marks the
  undocumented behavior `SPEC GAP`, no duplicate titles, no vague request values, every candidate
  states a read-back.

## Recommendation summary

| Recommendation | Count | Cases |
|---|---:|---|
| VALID | 48 | all except those listed below |
| INCOMPLETE | 5 | FR08-AI-010, FR08-AI-012, FR08-AI-022, FR08-AI-035, FR08-AI-043 |
| INVALID | 3 | FR08-AI-024, FR08-AI-049, FR08-AI-050 |

If every recommendation is accepted, the usable AI-origin FR-08 suite is 53 cases, above the
assignment minimum of 35.

## Cases recommended as not VALID

| Case | Purpose | AI recommendation | Reason | Proposed correction | Source anchor | Uncertainty |
|---|---|---|---|---|---|---|
| FR08-AI-010 | Fractional client total 199999.99 against a 200000 cart | INCOMPLETE | Its stated purpose ("just below the cart total") is the same mismatch purpose as FR08-AI-002; the distinct risk is fractional precision, not mismatch magnitude | Retitle to "Fractional client total must not introduce a decimal into the persisted cart-derived total" and assert that the persisted total is exactly 200000 with no fractional component | `eshop-sut/README.md` FR-08 recalculation rule | Fractional precision is not a partition named by any authoritative source; it is an exploratory robustness risk |
| FR08-AI-012 | Vietnamese diacritics round-trip through the stored address | INCOMPLETE | The candidate says the value carries diacritics but the literal value written in the request has none, so it is not executable exactly as written | Replace the request value with the exact literal `12 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, Thành phố Hồ Chí Minh` and assert a character-identical read-back from `GET /api/orders/:id` | `eshop-sut/api_specification.md` §4.3 request body | None |
| FR08-AI-022 | JWT with a tampered signature | INCOMPLETE | "Replace the last character with X" is not deterministic when the signature already ends in `X` | State the mutation deterministically: replace the final signature character with `A`, or with `B` when it already is `A` | `eshop-sut/README.md` SEC-02 | None |
| FR08-AI-035 | Checkout with an empty cart | INCOMPLETE | The setup step "use a session that has not added items" does not empty an existing cart, because implementation cart state is process memory keyed to the user, not to the login session | Reach the empty-cart state deterministically: either restart the backend immediately before the case, or register a fresh user with `POST /api/register`, log in, and check out without ever calling `POST /api/cart` | `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md` State and setup; `eshop-sut/api_specification.md` §1.1 | The empty-cart outcome itself stays exploratory; only the setup becomes deterministic |
| FR08-AI-043 | Malformed JSON body | INCOMPLETE | The malformed payload is described narratively rather than as exact bytes, so two testers could send different payloads | Send exactly the raw body `{"total_amount": 200000, "shipping_address":` with no closing quote or brace, and disable any client-side re-serialisation | `eshop-sut/api_specification.md` §4.3 Body (JSON) | None |
| FR08-AI-024 | JWT signed with a foreign secret | INVALID | Duplicate diagnostic of FR08-AI-022: both fail at the same signature-verification step and assert the same invariant, while this one costs an offline HMAC-SHA256 construction | Drop FR08-AI-024 and keep the cheaper FR08-AI-022. If the student prefers an explicit forgery narrative, keep FR08-AI-024 and drop FR08-AI-022 instead — but not both | `eshop-sut/README.md` SEC-02 | A genuinely distinct token case would be an `alg: none` unsigned token; proposing it belongs to the ACT-EXT-01 human-extension gate, not to this review |
| FR08-AI-049 | Observe the success response shape | INVALID | The request is byte-identical to FR08-AI-001 and the case adds no independent invariant; recording an undocumented response shape is evidence attached to an existing case, not a separate product case | Drop it and record the observed success status, Content-Type, and body fields as part of the FR08-AI-001 execution evidence | `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md` Response contract | If the student prefers an explicit schema-observation case for assignment coverage optics, it can be kept as-is; the suite already has FR08-AI-041 … FR08-AI-048 for schema |
| FR08-AI-050 | Observe the rejection response shape | INVALID | Same defect as FR08-AI-049: the request is byte-identical to FR08-AI-019 and the state invariant is already asserted there | Drop it and record the observed rejection status and error body as part of the FR08-AI-019 execution evidence | `work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md` Response contract | Same option as FR08-AI-049 |

## Cases recommended VALID

Grouped by generation batch. Every row below carries the same recommendation (VALID), the same
reason (executable as written, single diagnostic fault, oracle anchored to an authoritative source
with undocumented behavior marked `SPEC GAP`, and no duplicate of another candidate), so only the
purpose, anchor, and remaining uncertainty differ.

### Batch FR08-GEN-B1 — contract/domain

| Case | Purpose | Source anchor | Uncertainty |
|---|---|---|---|
| FR08-AI-001 | Baseline checkout with the client total equal to the cart total | README FR-08; api_specification §4.3 | Success status and schema are undocumented |
| FR08-AI-002 | Client total below the cart total must not control the persisted total | README FR-08 | None |
| FR08-AI-003 | Client total above the cart total must not control the persisted total | README FR-08 | None |
| FR08-AI-004 | Zero client total against a non-empty cart | README FR-08; verified extract boundaries | No documented status for zero |
| FR08-AI-005 | Negative client total | README FR-08; verified extract boundaries | No documented status for negative |
| FR08-AI-006 | `total_amount` omitted | api_specification §4.3 | Requiredness undocumented |
| FR08-AI-007 | `total_amount` explicitly null | verified extract Schema checks | Nullability undocumented |
| FR08-AI-008 | `total_amount` as a numeric string | api_specification §4.3 | Type contract undocumented |
| FR08-AI-009 | `total_amount` as a non-numeric string | api_specification §4.3 | Type contract undocumented |
| FR08-AI-011 | Extremely large client total | verified extract Unknowns | No documented numeric ceiling |
| FR08-AI-013 | Empty-string shipping address | verified extract partitions | No documented validation |
| FR08-AI-014 | Whitespace-only shipping address | verified extract partitions | Trimming behavior undocumented |
| FR08-AI-015 | Null shipping address | verified extract Schema checks | Nullability undocumented |
| FR08-AI-016 | `shipping_address` omitted | api_specification §4.3 | Requiredness undocumented |
| FR08-AI-017 | `shipping_address` as a number | api_specification §4.3 | Type contract undocumented |
| FR08-AI-018 | 1000-character shipping address | verified extract robustness partitions | No documented length limit |

### Batch FR08-GEN-B2 — authorization/security

| Case | Purpose | Source anchor | Uncertainty |
|---|---|---|---|
| FR08-AI-019 | No Authorization header | README FR-08 login rule; README SEC-02; api_specification §4 | Rejection status undocumented |
| FR08-AI-020 | Non-Bearer authorization scheme | api_specification §4 header rule | Rejection status undocumented |
| FR08-AI-021 | Bearer prefix with an empty credential | README SEC-02 | Rejection status undocumented |
| FR08-AI-023 | Structurally invalid token string | README SEC-02 | Rejection status undocumented |
| FR08-AI-025 | Order must not appear in another user's history | api_specification §4.4; README SEC-02 | Needs a second account created with `POST /api/register` |
| FR08-AI-026 | Client `user_id` must not redirect ownership | api_specification §4.3, §4.4; README SEC-02 | The foreign user id must be discoverable |
| FR08-AI-027 | Client `status` must not control server-owned order state | api_specification §4.3, §4.6 | No documented default status; observation only |
| FR08-AI-028 | HTML payload stored in the address | README SEC-04 | Explicit evidence gap: API storage cannot prove UI escaping |
| FR08-AI-029 | SQL metacharacters in the address must not damage persistence | README SEC-05 | Explicit evidence gap: internal query construction is not observable |
| FR08-AI-030 | SQL metacharacters in `total_amount` | README SEC-05; README FR-08 | Request shape overlaps FR08-AI-009; the oracle differs (persistence integrity) |

### Batch FR08-GEN-B3 — state transition

| Case | Purpose | Source anchor | Uncertainty |
|---|---|---|---|
| FR08-AI-031 | Cart is cleared after a successful checkout | README FR-08; api_specification §4.1 | Empty-cart response shape undocumented |
| FR08-AI-032 | Exactly one new order appears in the personal history | README FR-08; api_specification §4.4 | History paging behavior unknown |
| FR08-AI-033 | Two-product cart total equals the sum of the line amounts | README FR-08; api_specification §4.5 | Depends on seeded product ids 1 and 2 |
| FR08-AI-034 | Aggregated-quantity cart total | README FR-07, FR-08; api_specification §4.2 | If aggregation fails, that is an FR-07 observation |
| FR08-AI-036 | Second checkout right after a successful one | README FR-08 cart-clearing rule | Outcome depends on the cart-clearing result |
| FR08-AI-037 | A refused unauthenticated attempt must not modify the cart | README FR-08; README SEC-02; api_specification §4.1 | None |
| FR08-AI-038 | Created order is retrievable by its own detail endpoint | api_specification §4.5 | Falls back to the newest history entry if no id is returned |
| FR08-AI-039 | One user's checkout must not clear another user's cart | README FR-08; api_specification §4.1 | Needs a second account |
| FR08-AI-040 | Cart is usable again after being cleared | README FR-08; api_specification §4.2 | Depends on seeded product id 2 |

### Batch FR08-GEN-B4 — schema

| Case | Purpose | Source anchor | Uncertainty |
|---|---|---|---|
| FR08-AI-041 | No request body at all | api_specification §4.3; verified extract Schema checks | Body requiredness undocumented |
| FR08-AI-042 | Empty JSON object body | api_specification §4.3 | Both fields absent at once, distinct from single omissions |
| FR08-AI-044 | Top-level JSON array instead of an object | api_specification §4.3 | Structural handling undocumented |
| FR08-AI-045 | `shipping_address` as a nested object | api_specification §4.3 | Structured wrong type, distinct from FR08-AI-017 |
| FR08-AI-046 | `total_amount` as a boolean | api_specification §4.3; README FR-08 | Type contract undocumented |
| FR08-AI-047 | Unknown additional property `discount_code` | verified extract Schema checks | No additional-property rule documented |
| FR08-AI-048 | `text/plain` Content-Type with a JSON payload | api_specification §4.3 | No Content-Type rule documented |

### Batch FR08-GEN-B5 — closure/deduplication

| Case | Purpose | Source anchor | Uncertainty |
|---|---|---|---|
| FR08-AI-051 | Minimum cart of one unit | README FR-08; api_specification §4.2 | None |
| FR08-AI-052 | Large quantity 99 arithmetic | README FR-08; api_specification §4.2 | No documented stock ceiling |
| FR08-AI-053 | Client-supplied cart `price` as an upstream input to the total | api_specification §4.2; README FR-08 | Whether cart prices are validated against the catalogue is undocumented |
| FR08-AI-054 | Duplicate back-to-back checkout submission | README FR-08; api_specification §4.4 | Newman runs sequentially, so this is duplicate submission, not a true race |
| FR08-AI-055 | Control characters in the address | api_specification §4.3 | No character-set rule documented |
| FR08-AI-056 | Admin-role token on a non-admin route | README SEC-02, SEC-03; verified extract SEC applicability | Whether admins are meant to purchase at all is undocumented |

## Coverage gap found by adversarial verification

The verified spec extract names four invalid authorization partitions: missing, malformed, expired,
and invalid signature. **Expired** has no candidate. Minting an expired token needs the server
signing secret, which is not available black-box; any token signed with a different secret fails
signature verification first and is therefore indistinguishable from FR08-AI-022. This is recorded
as an uncovered authoritative partition in `work/prompts/fr08/FR08-GEN-coverage-ledger.md` rather
than covered by a look-alike case. No fabricated case was added.
