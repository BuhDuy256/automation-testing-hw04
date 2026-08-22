# HW06-B-FR08-POST-CHECKOUT Verified Specification Extract

> Status: UNVERIFIED. This extract is a source-anchored navigation aid; the official specification remains authoritative. Human verification is required before test generation.

## Identity

- Pool: B
- Feature ID: FR-08 — Checkout
- Method and path: `POST /api/checkout`
- Source headings: `eshop-sut/api_specification.md`, §4.3 Checkout; `eshop-sut/README.md`, FR-08 and SEC-02/SEC-04/SEC-05

## Request contract

| Input | Location | Type | Required | Documented rule | Source reference |
|---|---|---|---|---|---|
| Authorization | Header | Bearer JWT | Yes | Cart/order APIs require a token; checkout is for logged-in users | API specification §4; README FR-08/SEC-02 |
| total_amount | JSON body | Number in example | Body field shown in API spec | Business requirement says backend must calculate it from cart and not trust client value | API specification §4.3; README FR-08 |
| shipping_address | JSON body | String | Body field shown in API spec | Shipping address for the order | API specification §4.3; README FR-08/SEC-04 |

## Response contract

| Condition | Status | Schema/fields | Source reference |
|---|---:|---|---|
| Successful checkout | 200 OK | `{ "message": "Checkout successful", "orderId": number }` | API specification §4.3 |
| Authentication failure | Not explicitly stated in API specification | Error schema/status is unspecified in the API specification | Implementation observation only; do not treat as official contract |

## Domain partitions and boundaries

| Input | Valid partitions | Invalid partitions | Boundaries | Source reference |
|---|---|---|---|---|
| total_amount | Server-derived cart total | Client-forged, zero, negative, wrong type, null, omitted, mismatched total | Zero and mismatch with cart-derived total | README FR-08; request example API specification §4.3 |
| shipping_address | Normal/Unicode address | Empty, wrong type or unsafe display input | Empty and long values; exact maximum unknown | API specification §4.3; README FR-08/SEC-04 |
| cart state | Authenticated user with intended cart | Empty cart, stale cart, repeated checkout | Empty/non-empty and post-success clearing | README FR-07/FR-08; implementation state is runtime-observed |
| Authorization | Valid user token | Missing, malformed, expired, invalid signature | Token validity boundary | README SEC-02; API specification §4 |

## State and setup

- Preconditions: registered user, successful login, and a known cart/product setup when verifying the documented cart-derived total.
- Allowed transitions: authenticated cart state → successful order creation; successful checkout should clear the cart.
- Forbidden transitions: unauthenticated checkout; accepting a total that differs from the cart-derived amount.
- Persistent side effects: order creation with pending status is documented/inferred from the API and implementation; cart clearing is required by FR-08.
- Reset/setup needs: isolate the user cart, capture created order IDs, verify cart and order history, and reset/restart as needed because implementation cart state is process memory and orders persist in SQLite.

## Applicable security requirements

| SEC ID | Applicability | Expected enforcement | Source reference |
|---|---|---|---|
| SEC-02 | Direct | Require valid JWT | README SEC-02; API specification §4 |
| SEC-04 | Relevant to address display | Escape user-controlled address at display boundaries | README SEC-04 |
| SEC-05 | Relevant to order persistence | Use parameterized queries | README SEC-05 |
| SEC-03 | Not directly applicable | Checkout is not an admin route | README SEC-03 |
| SEC-01 | Not directly exercised | Password storage is outside this operation | README SEC-01 |
| SEC-06 | Not directly applicable | Profile role field is outside this operation | README SEC-06 |
| SEC-07 | Not directly applicable | OTP is outside this operation | README SEC-07 |

## Schema checks

- Required fields: Body shape is shown, but exact validation/error contract is not fully documented.
- Types/formats: `total_amount` is numeric in the example; `shipping_address` is text.
- Nullable/optional fields: Not documented.
- Additional-property rule, if documented: Not documented.

## Unknowns requiring runtime verification

- Whether checkout actually reads cart contents and recomputes total.
- Exact empty-cart, invalid-total, and validation statuses/schemas.
- Whether success clears the cart and how order status is represented.

## Human verification

- Verified by: Pending human verification
- Verified at: Pending
- Verification notes: Confirm the distinction between official FR-08 rules and runtime bug hypotheses before ACT-GEN-01.
