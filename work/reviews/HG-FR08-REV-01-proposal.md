# HG-FR08-REV-01 — AI review proposal for the FR-08 candidate suite (revision 2)

> **NON-CANONICAL.** Every verdict below is an AI recommendation only. No student verdict exists yet.
> Canonical human review lives in `work/registry/human-reviews.json`, which is unchanged and contains
> no FR-08 record.

- Selected API: `HW06-B-FR08-POST-CHECKOUT` — `POST /api/checkout`
- Candidates under review: `FR08-AI-001` … `FR08-AI-057` (57 AI-generated cases)
- Revision 2 supersedes revision 1 after the student rejected the `48 / 5 / 3` proposal and directed
  targeted repairs. Original candidates and their generation provenance are unchanged; `FR08-AI-057`
  is the only new candidate and carries fresh provenance from batch `FR08-GEN-B6`.
- Passes performed: generation, independent review, adversarial verification, mechanical checks, then
  a second full independent review across the complete set. All passes were separate passes inside a
  single Claude Code session (`claude-opus-5`); no independent agent identity is claimed.

## Revised recommendation summary

| Recommendation | Count | Cases |
|---|---:|---|
| VALID | 44 | all cases not listed below |
| INCOMPLETE | 8 | FR08-AI-010, FR08-AI-012, FR08-AI-022, FR08-AI-028, FR08-AI-035, FR08-AI-040, FR08-AI-043, FR08-AI-052 |
| INVALID | 5 | FR08-AI-024, FR08-AI-049, FR08-AI-050, FR08-AI-054, FR08-AI-056 |

If every recommendation is accepted, the usable AI-origin FR-08 suite is 52 cases, above the
assignment minimum of 35.

Change from revision 1: `FR08-AI-028`, `FR08-AI-040`, and `FR08-AI-052` moved VALID → INCOMPLETE;
`FR08-AI-054` and `FR08-AI-056` moved VALID → INVALID; `FR08-AI-010`'s correction was rewritten;
`FR08-AI-057` was generated and is recommended VALID.

## Mechanical check results (re-run over all 57)

| Check | Result |
|---|---|
| Invented HTTP status codes in an oracle | none |
| `SPEC GAP` marker present where behavior is undocumented | 57/57 |
| Duplicate titles | none |
| Vague request values (`very long`, `SQL-like`, `some`, …) | none |
| Read-back / observation stated in `setupReset` | 57/57 |
| Prospective provenance fields complete | 57/57 (`npm run hw06:validate` PASS, 0 errors) |
| Batch provenance consistency within each `generationBatchId` | PASS for B1–B6 |

---

## Batch FR08-GEN-B1 — contract / domain (18 cases)

Shared starting state unless stated otherwise: user `test@eshop.com` logged in; cart holds product
id 1, price 100000, quantity 2, confirmed by `GET /api/cart`; cart-derived total 200000.

| Case | Purpose | Input / starting state | Expected / observable oracle | Rec | Reason | Proposed correction | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|---|---|---|---|---|
| FR08-AI-001 | Baseline authorised checkout | Valid user JWT; `{total_amount: 200000, shipping_address: "123 Le Loi, TP.HCM"}` | Accepted; order created; persisted total = 200000 via `GET /api/orders/my-orders` | VALID | Only case establishing the reference happy path; single purpose; oracle is the documented cart-derived total | — | README FR-08; api_spec §4.3 | Success status and response schema undocumented |
| FR08-AI-002 | Under-stated forged total | Valid JWT; `total_amount: 1000` vs cart 200000 | Client value must not become the persisted total; persisted total = 200000 or request refused | VALID | Directly tests the explicit FR-08 rule; one fault; read-back proves persistence | — | README FR-08 "Backend phải tự tính lại tổng tiền" | Rejection status undocumented. `coverage` includes `security` although `requirementRefs` names no SEC rule — student may prefer `domain_partition` only |
| FR08-AI-003 | Over-stated forged total | Valid JWT; `total_amount: 9999000` | Same invariant as AI-002 in the opposite direction | VALID | Distinct partition (inflation vs deflation); different real-world risk | — | README FR-08 | Same coverage-tag note as AI-002 |
| FR08-AI-004 | Zero forged total | Valid JWT; `total_amount: 0` | A 200000 cart must not persist a total of 0 | VALID | Lower boundary of the amount partition; oracle limited to the documented invariant | — | README FR-08; verified extract boundaries | No documented status for zero |
| FR08-AI-005 | Negative forged total | Valid JWT; `total_amount: -200000` | Negative value must not become the persisted total | VALID | Distinct sign boundary; single fault | — | README FR-08; verified extract boundaries | No documented status for negative |
| FR08-AI-006 | `total_amount` omitted | Valid JWT; body has only `shipping_address` | Observe; any created order must still carry 200000 | VALID | Requiredness genuinely undocumented and the oracle does not assume rejection | — | api_spec §4.3 | Field requiredness undocumented |
| FR08-AI-007 | `total_amount` null | Valid JWT; `total_amount: null` | Observe; any created order must still carry 200000 | VALID | Null is a distinct partition from omission | — | verified extract Schema checks | Nullability undocumented |
| FR08-AI-008 | Numeric string total | Valid JWT; `total_amount: "200000"` | Observe coercion; persisted total must be the cart-derived 200000 | VALID | Parseable-string type partition; value deliberately equals the cart total so type is the only variable | — | api_spec §4.3 | Type contract undocumented |
| FR08-AI-009 | Non-numeric string total | Valid JWT; `total_amount: "abc"` | No corrupted total persisted; any order carries 200000 | VALID | Distinct from AI-008 (unparseable); single fault | — | api_spec §4.3 | Type contract undocumented |
| FR08-AI-010 | Fractional forged total | Valid JWT; `total_amount: 199999.99` vs cart 200000 | Client-supplied fractional value must not control the authoritative total; persisted total stays the cart-derived value | **INCOMPLETE** | The candidate frames itself as a "nearest-neighbour boundary of the mismatch partition", which restates AI-002's purpose; its real distinct risk is a *fractional* forged value | Retitle to "Fractional forged total must not control the authoritative cart-derived total"; oracle: the backend derives the total from cart state, `199999.99` must not control the persisted/order total, and the authoritative total remains the cart-derived value. **Do not** assert that fractional totals are forbidden or that totals must be integers — no source states that | README FR-08 recalculation rule | Whether the API accepts, rejects, or rounds a fractional client value is entirely `SPEC GAP` |
| FR08-AI-011 | Very large forged total | Valid JWT; `total_amount: 999999999999` | Persisted total = 200000; endpoint returns a structured HTTP response | VALID | Magnitude robustness partition distinct from AI-003's ordinary inflation | — | README FR-08; verified extract Unknowns | No documented numeric ceiling |
| FR08-AI-012 | Unicode address round-trip | Valid JWT; Vietnamese address value | Order created; address read back character-identical from `GET /api/orders/:id` | **INCOMPLETE** | Not executable exactly as written: the candidate says the value carries diacritics but the literal string recorded in `request` has none | Use the exact literal `12 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, Thành phố Hồ Chí Minh`; assert character-identical read-back where the order-detail endpoint returns the stored address, and record an evidence gap if it does not | api_spec §4.3 request body | Read-back exactness depends on `GET /api/orders/:id` exposing the address |
| FR08-AI-013 | Empty-string address | Valid JWT; `shipping_address: ""` | Observe; record whether an order persists with no delivery address | VALID | Undocumented partition handled without assuming rejection | — | verified extract partitions | No documented validation rule |
| FR08-AI-014 | Whitespace-only address | Valid JWT; `shipping_address: "   "` (3 spaces) | Observe trimming, blank storage, or rejection | VALID | Distinct from AI-013 because trimming may occur | — | verified extract partitions | Trimming behavior undocumented |
| FR08-AI-015 | Null address | Valid JWT; `shipping_address: null` | Observe whether a null address persists | VALID | Distinct from empty string and omission | — | verified extract Schema checks | Nullability undocumented |
| FR08-AI-016 | `shipping_address` omitted | Valid JWT; body has only `total_amount` | Observe whether an order persists with no address | VALID | Single missing field; diagnostically isolated | — | api_spec §4.3 | Requiredness undocumented |
| FR08-AI-017 | Numeric address | Valid JWT; `shipping_address: 12345` | Observe coercion, storage, or rejection via `GET /api/orders/:id` | VALID | Scalar wrong type; distinct from the structured wrong type in AI-045 | — | api_spec §4.3 | Type contract undocumented |
| FR08-AI-018 | 1000-character address | Valid JWT; `"A"` × 1000 | If an order is created, the stored address is returned at full 1000-character length with no silent truncation | VALID | Concrete, executable length-robustness case with a persistence oracle | — | verified extract robustness partitions | No documented length limit |

## Batch FR08-GEN-B2 — authorization / security (12 cases)

| Case | Purpose | Input / starting state | Expected / observable oracle | Rec | Reason | Proposed correction | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|---|---|---|---|---|
| FR08-AI-019 | No credential | Cart established with a valid token; checkout sent with **no** `Authorization` header | Refused; order count unchanged when read back with the genuine token | VALID | Directly tests the explicit FR-08 login rule and SEC-02; asserts a state invariant, not only a response | — | README FR-08; README SEC-02; api_spec §4 | Rejection status undocumented |
| FR08-AI-020 | Wrong auth scheme | `Authorization: Token abc123` | Refused; no order created | VALID | Distinct fault (scheme keyword) from a missing header | — | api_spec §4 header rule | Rejection status undocumented |
| FR08-AI-021 | Empty credential | `Authorization: Bearer` with no token | Refused; no order created | VALID | Distinct boundary between "no header" and "header with no value" | — | README SEC-02 | Rejection status undocumented |
| FR08-AI-022 | Tampered signature | Genuine JWT with its final signature character altered | Refused; no order created | **INCOMPLETE** | The mutation rule "replace the last character with X" is not deterministic when the signature already ends in `X`, so two runs could send different tokens | Make the mutation deterministic: replace the final signature character with `A`, or with `B` when it is already `A`; alternatively store one fixed tampered token as an environment constant so the input is byte-stable across runs | README SEC-02; verified extract authorization partitions | None once the mutation is fixed |
| FR08-AI-023 | Non-JWT credential | `Authorization: Bearer not-a-jwt` | Refused with a structured response; no order created | VALID | Structural-parse fault distinct from signature failure | — | README SEC-02 | Rejection status undocumented |
| FR08-AI-024 | Foreign-signed JWT | HS256 token with real claims signed with `wrong-secret-123` | Refused; no order created | **INVALID** | Duplicate diagnostic of AI-022: both fail at the same signature-verification step and assert the identical invariant, while this one additionally costs an offline HMAC construction. Re-confirmed in the second review pass | Drop AI-024 and keep AI-022 as the canonical invalid-signature diagnostic | README SEC-02 | A materially distinct token case would be an `alg: none` unsigned token; proposing one belongs to the ACT-EXT-01 gate, not to this review |
| FR08-AI-025 | Cross-user order attribution | Users A and B logged in; A checks out; B reads history | Order appears in A's history and not in B's | VALID | Ownership invariant derived from SEC-02 identity binding; distinct from AI-026 (no client tampering involved) | — | api_spec §4.4; README SEC-02 | Requires a second account via `POST /api/register` |
| FR08-AI-026 | Client `user_id` tampering | A's token; body carries `user_id` = B's id | Ownership follows the token, not the body; B's order count unchanged | VALID | Protected-field case with a persisted-state oracle on both histories | — | api_spec §4.3, §4.4; README SEC-02 | B's numeric id must be discoverable |
| FR08-AI-027 | Client `status` tampering | Valid token; body carries `status: "delivered"` | Read `GET /api/orders/:id` and record whether the client value was persisted | VALID | Server-owned state is a real risk; §4.6 shows status transitions belong to a dedicated endpoint; oracle records rather than invents a default | — | api_spec §4.3, §4.6 | No documented default status; observation only |
| FR08-AI-028 | HTML payload in the address | Valid token; `shipping_address: "<script>alert('xss')</script>123 Le Loi"` | API handles the request; `GET /api/orders/:id` returns the stored value | **INCOMPLETE** | The oracle is internally inconsistent: the title asserts the value is "stored and returned unchanged" while the body says API-side rejection is `SPEC GAP`. It also lists SEC-04 in `requirementRefs`, which reads as a SEC-04 conformance claim that API read-back cannot support | Limit the purpose explicitly to: *preserve the HTML-like value through the API and record that UI/display safety needs separate evidence*. Make the oracle conditional — if accepted, read-back is character-identical; if rejected, no order is created — and state in the case body that `API-side observation ≠ UI/display-boundary SEC-04 verification`, so SEC-04 conformance is never claimed from this case | README SEC-04; verified extract SEC-04 row | Explicit evidence gap: SEC-04 requires a separate UI observation outside this API suite |
| FR08-AI-029 | SQL metacharacters in the address | Valid token; `shipping_address: "1 Le Loi'); DROP TABLE orders; --"`; at least one earlier order exists | Structured HTTP response; `GET /api/orders/my-orders` still returns earlier orders, so no schema damage | VALID | Black-box-honest oracle: asserts persistence integrity, explicitly refuses to claim parameterized queries are proved | — | README SEC-05 | Explicit evidence gap: internal query construction is not observable |
| FR08-AI-030 | SQL metacharacters in `total_amount` | Valid token; `total_amount: "1 OR 1=1"` | Persisted total = 200000; order history still functions | VALID | Distinct injection vector (numeric field) with a different oracle emphasis from AI-029 | — | README SEC-05; README FR-08 | Request shape overlaps AI-009; the persistence-integrity oracle is what separates them |

## Batch FR08-GEN-B3 — state transition (10 cases)

| Case | Purpose | Input / starting state | Expected / observable oracle | Rec | Reason | Proposed correction | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|---|---|---|---|---|
| FR08-AI-031 | Cart cleared after success | Cart of 1×2 confirmed; successful checkout | `GET /api/cart` returns no lines afterwards | VALID | Tests the explicit FR-08 clearing rule with a direct read-back | — | README FR-08 clearing rule; api_spec §4.1 | Empty-cart response shape undocumented |
| FR08-AI-032 | Exactly one order created | Pre-count `N` captured; successful checkout | History count becomes `N+1` and the newest entry is the new order | VALID | Order-creation transition; count baseline captured rather than assumed | — | README FR-08; api_spec §4.4 | History paging behavior unknown |
| FR08-AI-033 | Multi-line total arithmetic | Cart: id 1 ×2 @100000 and id 2 ×3 @50000 | Persisted total = 350000 | VALID | Only case proving summation across lines | — | README FR-08; api_spec §4.5 | Depends on seeded product ids 1 and 2 |
| FR08-AI-034 | Aggregated-quantity total | Product id 1 added twice (qty 2 then 3) → one line of qty 5 | Persisted total = 500000 | VALID | Couples the FR-07 aggregation rule to the FR-08 derivation; distinct from AI-033 | — | README FR-07; README FR-08; api_spec §4.2 | If aggregation fails, that is an FR-07 observation, not an FR-08 verdict |
| FR08-AI-035 | Empty-cart checkout | Cart confirmed empty; `total_amount: 200000` | A worthless cart must not produce an order carrying 200000; record whether count stays at `N` | **INCOMPLETE** | The setup is not reliably executable: "use a session that has not added items" does not empty an existing cart, because implementation cart state is process memory keyed to the user rather than to the login session | Reach the empty state deterministically — preferably register a fresh user via `POST /api/register`, log in, and check out without ever calling `POST /api/cart`; restarting the backend immediately before the case is the fallback. Do not claim that logging in again clears the cart | verified extract State and setup; api_spec §1.1 | The empty-cart outcome itself stays exploratory; only the setup becomes deterministic |
| FR08-AI-036 | Second checkout after success | One successful checkout completed; cart and count observed | One cart must not yield two paid orders; record whether the count stays at `N+1` | VALID | The canonical repeat-checkout transition; retained in preference to AI-054 | — | README FR-08 clearing rule | Outcome depends on the cart-clearing result |
| FR08-AI-037 | Refused attempt leaves the cart intact | Cart of 1×2 confirmed; unauthenticated checkout | `GET /api/cart` still shows id 1 quantity 2 | VALID | Asserts a state invariant (cart not mutated) that AI-019 does not assert | — | README FR-08; api_spec §4.1 | Shares its request shape with AI-019; the student may prefer to merge them into one request carrying both assertions |
| FR08-AI-038 | Order retrievable by id | Successful checkout; identifier captured | `GET /api/orders/:id` returns the same order with total 200000 and the submitted address | VALID | Traceability invariant distinct from the count check in AI-032; states a fallback if no id is returned | — | api_spec §4.5 | Detail response schema undocumented |
| FR08-AI-039 | Cart isolation between users | A and B each hold the same cart; A checks out | B's cart still holds id 1 quantity 2 | VALID | Scoping invariant for the clearing rule; distinct from AI-025 (history) | — | README FR-08; api_spec §4.1; README SEC-02 | Requires a second account |
| FR08-AI-040 | Post-clearing rebuild | After a successful 200000 checkout, add id 2 ×1 @50000 and check out again | Second order total = 50000 with no residue of the first cart | **INCOMPLETE** | The purpose is genuinely distinct from AI-031 — a cart can *read* as empty while the checkout derivation still uses stale state — but the case is framed as cart usability (an FR-07 flavour) and never states how "no residue" is observed | Rewrite around the checkout-specific transition: successful checkout → cart empty → a newly added item establishes a new cart → the second order's server-derived total is exactly 50000 and purchased items do not reappear in it. State the observation explicitly: compare the second order's total via `GET /api/orders/:id`, and assert its item composition where the detail endpoint exposes items, otherwise record an evidence gap | README FR-08 clearing rule; api_spec §4.2, §4.5 | Whether order detail exposes line items is unverified; if it does not, only the total is assertable |

## Batch FR08-GEN-B4 — schema (10 cases)

| Case | Purpose | Input / starting state | Expected / observable oracle | Rec | Reason | Proposed correction | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|---|---|---|---|---|
| FR08-AI-041 | No request body | Valid token; `Content-Type: application/json`; zero body bytes | Structured HTTP response; any created order still carries 200000 | VALID | Distinct request shape from `{}` and malformed JSON | — | api_spec §4.3; verified extract Schema checks | Body requiredness undocumented |
| FR08-AI-042 | Empty JSON object | Valid token; body `{}` | Observe; any created order carries the cart-derived total | VALID | Both documented fields absent at once — distinct from the single omissions in AI-006 and AI-016 | — | api_spec §4.3 | Validation contract undocumented |
| FR08-AI-043 | Malformed JSON | Valid token; unparseable payload | Structured HTTP response; no order created from an unparseable payload | **INCOMPLETE** | The payload is described narratively rather than as exact bytes, so two testers could send different inputs | Send exactly the raw body `{"total_amount": 200000, "shipping_address":` (no closing quote or brace), and require the later Postman implementation to send that raw string without re-serialising it into valid JSON | api_spec §4.3 Body (JSON) | None once the bytes are fixed |
| FR08-AI-044 | Top-level array | Valid token; body `[{...}]` | Structured response; any created order carries 200000 | VALID | Valid JSON with the wrong top-level type — distinct from malformed JSON | — | api_spec §4.3 | Structural handling undocumented |
| FR08-AI-045 | Structured wrong type | `shipping_address: {street, city}` | Observe rejection, stringification, or storage via `GET /api/orders/:id` | VALID | Structured type distinct from the scalar type in AI-017 | — | api_spec §4.3 | Type contract undocumented |
| FR08-AI-046 | Boolean total | `total_amount: true` | Persisted total = 200000; no boolean or coerced `1` stored | VALID | Third distinct wrong-type partition after AI-008 and AI-009 | — | api_spec §4.3; README FR-08 | Type contract undocumented |
| FR08-AI-047 | Unknown property | Body adds `discount_code: "FREESHIP99"` | Unknown field must not change the cart-derived total of 200000 | VALID | Additional-property risk with a pricing oracle; distinct from AI-026/AI-027 whose extra fields target ownership and status | — | verified extract Schema checks | No additional-property rule documented |
| FR08-AI-048 | Wrong Content-Type | `Content-Type: text/plain` with a JSON payload | Observe parsing; any created order carries 200000 rather than a default/empty address | VALID | Envelope-level fault not covered by any body-shape case | — | api_spec §4.3 | No Content-Type rule documented |
| FR08-AI-049 | Record the success response shape | Identical request to AI-001 | Record status, Content-Type, and body fields | **INVALID** | The request is byte-identical to AI-001 and the case asserts no invariant — it only records an observation. Recording an undocumented response shape is evidence attached to an existing case, not a separate product case. Re-confirmed in the second review pass | Drop it; record the observed success status, Content-Type, and fields as part of AI-001's execution evidence | verified extract Response contract | If the student prefers an explicit schema-observation case for assignment optics, it can be kept as-is; schema coverage otherwise rests on AI-041 … AI-048 |
| FR08-AI-050 | Record the rejection response shape | Identical request to AI-019 | Record status and error body | **INVALID** | Same defect as AI-049: byte-identical request to AI-019, and the state invariant is already asserted there | Drop it; record the observed rejection shape as part of AI-019's execution evidence | verified extract Response contract | Same option as AI-049 |

## Batch FR08-GEN-B5 — closure / deduplication (6 cases)

| Case | Purpose | Input / starting state | Expected / observable oracle | Rec | Reason | Proposed correction | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|---|---|---|---|---|
| FR08-AI-051 | Minimum cart | Cart: id 1 ×1 @100000 | Persisted total exactly 100000 | VALID | Genuine lower boundary of a purchasable cart; every other derivation case uses quantity ≥ 2 | — | README FR-08; api_spec §4.2 | None |
| FR08-AI-052 | Large-quantity arithmetic | Cart: id 1 ×99 @100000 | Persisted total exactly 9900000 | **INCOMPLETE** | Structurally identical to AI-001 with a different quantity. 99 is not a documented boundary and is too small to exercise numeric-precision limits, so as written it risks being redundant coverage rather than a boundary test | Either anchor it to a real precision risk — for example quantity 99999 with the expected server-derived total 9999900000 stated explicitly, and assert no overflow, truncation, or rounding — or drop it and rely on AI-033/AI-034 for multi-unit arithmetic | README FR-08; api_spec §4.2 | No documented stock or quantity ceiling; the cart endpoint may cap quantity, in which case the observed cap is recorded and the expectation recomputed |
| FR08-AI-053 | Client-supplied cart price | Catalogue price read first; cart line added with `price: 1`; checkout with `total_amount: 1` | Record whether the persisted total follows the catalogue price or the client-supplied 1 | VALID | Strongest structural case in the suite: it probes whether the FR-08 recalculation rule is defeated one level upstream, which no other case touches | — | api_spec §4.2 (client-supplied `price`); README FR-08 | Whether cart prices are validated against the catalogue is undocumented |
| FR08-AI-054 | Duplicate back-to-back checkout | Cart of 1×2; two identical checkouts with no read in between | One cart must not yield two paid orders | **INVALID** | Duplicate of AI-036. Both execute the same state transition (checkout → checkout) and assert the same effective invariant; Newman runs sequentially, so omitting the intermediate read changes nothing on the server. Revision 1 called this "distinct"; that claim does not survive re-review | Drop it and keep AI-036. Do not relabel a sequential duplicate as a race-condition test | README FR-08; api_spec §4.4 | A genuine concurrency test would need parallel clients, which is outside the agreed Postman/Newman toolchain |
| FR08-AI-055 | Control characters in the address | `shipping_address: "123 Le Loi\r\n\tTP.HCM"` | Structured response; stored address preserved or consistently normalised, not truncated at the first control character | VALID | Distinct character-class risk from length, whitespace, HTML, and diacritics cases | — | api_spec §4.3 | No character-set rule documented |
| FR08-AI-056 | Admin token on a non-admin route | Admin logged in with a cart; ordinary checkout body | Order attributed to the admin with the cart-derived total | **INVALID** | No authoritative source defines whether admins may purchase, so there is no oracle beyond what AI-001 already proves. SEC-03 governs admin routes and the verified extract records it as not applicable to checkout, so this case claims SEC-03 coverage the selected API does not have | Drop it. Do not invent an authorization rule for an undocumented admin-as-customer scenario | README SEC-03; verified extract SEC applicability row | If the student wants a role dimension, it belongs to FR-15 `POST /api/products`, which has a documented role boundary |

## Batch FR08-GEN-B6 — authorization closure (1 case, new)

| Case | Purpose | Input / starting state | Expected / observable oracle | Rec | Reason | Proposed correction | Source anchor | Uncertainty / SPEC GAP |
|---|---|---|---|---|---|---|---|---|
| FR08-AI-057 | Expired but validly signed JWT | Cart of 1×2 and pre-count `N` captured with the genuine token; checkout sent with the fixture token `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJleHAiOjF9.zG2FX6zN5zhGtWdI1e0AHVMg7iJ1llIIRT9vZbKCKIs` (`exp = 1`, i.e. 1970-01-01T00:00:01Z) | Checkout is not authorised; order count read back with the genuine token remains `N`; cart still holds id 1 quantity 2 | VALID | Closes the `expired` partition named in the verified extract. The token verifies against the same secret the SUT uses for genuine logins, so it fails for expiry rather than for signature validity, which is exactly what separates it from AI-022 | — | README SEC-02; README FR-08; api_spec §4; verified extract authorization partitions | Rejection status undocumented. If the implementation ignores `exp` entirely, that is recorded from the run, not assumed here |

---

## Expired-token gap: correction of revision 1

Revision 1 recorded the `expired` partition as untestable because an expired token "cannot be minted
black-box". That claim was wrong for this repository and has been retracted. The FR-04 suite already
carries a reusable fixture at `work/postman/fr04/FR04-profile.postman_environment.json`
(`expiredToken`), and its signature verifies against the local SUT development secret while its `exp`
claim is `1`. The same fixture mechanism was re-minted for user id 2 and used for `FR08-AI-057`.

Boundary observed: the fixture is a **test input only**. No expectation in `FR08-AI-057` is derived
from implementation code; its oracle rests on SEC-02, the FR-08 logged-in rule, and state read-back.
The coverage ledger has been corrected accordingly.

## Second-review notes on cases left VALID

- `FR08-AI-002` / `FR08-AI-003` carry the `security` coverage tag while `requirementRefs` lists only
  `FR-08`. This affects how traceability groups them. Left VALID; the student may prefer to drop the
  tag.
- `FR08-AI-037` shares its request shape with `FR08-AI-019` but asserts a different state invariant
  (cart not mutated versus no order created), so it survives the same deduplication rule that
  removed `FR08-AI-049` and `FR08-AI-050`, which assert no invariant at all.
- `FR08-AI-030` overlaps `FR08-AI-009` in request shape; its persistence-integrity oracle is what
  keeps it distinct.
- No candidate was found to be compound (more than one injected fault) in the second pass.
- No cross-case state contamination was found beyond the ordering already handled by each case's
  captured baseline, except `FR08-AI-035`, whose setup defect is corrected above.
