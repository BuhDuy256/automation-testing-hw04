# FR-08 reviewed suite — coverage reconciliation after ACT-REV-01 and ACT-EXT-01

Derived view, not a source of truth. Canonical state is `work/registry/test-cases.json` and
`work/registry/human-reviews.json`; generation provenance stays in
`work/prompts/fr08/FR08-GEN-coverage-ledger.md`, which deliberately still lists the rejected cases.

## Accounting

```text
57 original AI-generated candidates   (batches FR08-GEN-B1 … B6, unchanged)
40 VALID
11 INCOMPLETE with approved corrections
 6 INVALID   (FR08-AI-024, 049, 050, 052, 054, 056 — excluded from execution)
51 reviewed-usable AI-origin cases
 5 HUMAN extension cases              (FR08-H-001 … FR08-H-005)
56 total usable FR-08 cases
```

`npm run hw06:derive` independently computes `executable = 56` for `HW06-B-FR08-POST-CHECKOUT`.

## Coverage of the required dimensions

| Dimension | Covered by | Note |
|---|---|---|
| Equivalence / domain partitions | AI-002 … AI-009, AI-011, AI-013 … AI-017, AI-046 | `total_amount` and `shipping_address` valid, invalid, absent, null, and wrong-type partitions |
| Boundary / robustness partitions | AI-004, AI-005, AI-010 (corrected), AI-011, AI-018 (corrected), AI-051, AI-055 (corrected) | Zero, negative, fractional, very large, 1000-character, minimum cart, control characters |
| State transitions | AI-031 … AI-040 (AI-035 and AI-040 corrected), H-001, H-003, H-005 | Clearing, order creation, multi-line and aggregated derivation, empty cart, repeat checkout, refusal without mutation, order retrieval, cross-user cart isolation, post-clearing rebuild |
| Cart-derived total calculation | AI-001, AI-002, AI-003, AI-033, AI-034, AI-051, AI-053 (corrected), H-001, H-002, H-004 | Includes the upstream client-supplied cart price and the stale-total ordering risk |
| Cart clearing | AI-031, AI-036, AI-039, AI-040 (corrected), H-005 | Clearing, its scope, and its effect on the next checkout |
| Authentication / SEC-02 | AI-019, AI-020, AI-021, AI-022 (corrected), AI-023, AI-037, AI-057, H-003 | Missing, wrong scheme, empty credential, tampered signature, non-JWT, expired |
| Expired JWT | AI-057 | Validly signed with `exp = 1`; fails for expiry, not for signature |
| Ownership / isolation | AI-025, AI-026, AI-039, H-002 | History attribution, client `user_id` tampering, cart isolation, derivation isolation |
| SEC-04 with UI/display evidence limitation | AI-028 (corrected) | Case is limited to API-side preservation; SEC-04 conformance explicitly requires separate UI evidence |
| SEC-05 with black-box evidence limitation | AI-029, AI-030 | Persistence-integrity oracle only; a safe response never claimed as proof of parameterized queries |
| Schema / request-shape exploration | AI-041 … AI-048 (AI-043 and AI-048 corrected), AI-006, AI-007, AI-015, AI-016 | Absent body, `{}`, malformed raw JSON, top-level array, structured wrong type, boolean, unknown property, `text/plain` |

## Explicit non-claims

- **SEC-03 is not claimed** for `POST /api/checkout`. The verified extract records it as not directly
  applicable, and `FR08-AI-056`, the only case that touched the role dimension, is INVALID.
- SEC-01, SEC-06, and SEC-07 remain marked non-applicable to this operation.
- No setup, cleanup, login, registration, cart-population, or read-back request is counted as a
  product test case; those are supporting requests only.
- Exact HTTP statuses and response schemas remain `SPEC GAP` throughout, since the API specification
  documents none for this endpoint.

## Adversarial duplicate check of the five HUMAN cases against the 51 usable AI cases

| Case | Nearest AI cases | Verdict | Distinguishing diagnostic |
|---|---|---|---|
| FR08-H-001 | AI-002, AI-003, AI-010, AI-034 | distinct | All AI mismatch cases forge a total against a cart that never moved; AI-034 mutates the cart but submits the matching total. Only H-001 combines a mutation with a stale client total |
| FR08-H-002 | AI-039, AI-025, AI-026 | distinct | Those assert clearing scope, history attribution, and body tampering; none asserts which cart the persisted total was computed from while a different foreign cart exists |
| FR08-H-003 | AI-037, AI-019, AI-001 | distinct | AI-037 stops at the cart read-back after a refusal; no AI case performs a subsequent authorised checkout to prove the derivation survived the refusal |
| FR08-H-004 | AI-053 | distinct | AI-053 manipulates the price of a real product; only H-004 submits a cart line for a product that does not exist |
| FR08-H-005 | AI-032, AI-040 (corrected) | distinct | AI-032 asserts only the count and AI-040 only the second order total; only H-005 re-reads the first order after the second checkout and asserts address separation |

No true duplicate was found, so no conflict needed to be raised. Mechanical title and request
collision checks against all 51 usable AI cases returned none.

Noted overlaps that do not amount to duplication: `FR08-H-003` gains its value from composing a
refusal with a following valid checkout, and `FR08-H-005` shares the checkout → rebuild → checkout
sequence with the corrected `FR08-AI-040` while asserting a different invariant.
