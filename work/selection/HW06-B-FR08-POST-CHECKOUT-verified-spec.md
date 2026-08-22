# HW06-B-FR08-POST-CHECKOUT Verified Specification Extract

> Status: VERIFIED — HUMAN CONFIRMED. This extract is a source-anchored navigation aid; the official specification remains authoritative.

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
| Successful checkout | Not documented | Not documented | API specification §4.3 defines the endpoint and request body only |
| Current implementation observation | Runtime-dependent | May return `{ "message": "Checkout successful", "orderId": number }` | Implementation observation `backend/server.js`; not an official contract |
| Authentication failure | Not explicitly stated in API specification | Error schema/status is unspecified in the API specification | Implementation observation only; do not treat as official contract |

## Domain partitions and boundaries

| Input | Valid partitions | Invalid partitions | Boundaries | Source reference |
|---|---|---|---|---|
| total_amount | Client value is ignored; persisted total is calculated from cart | No official status expectation is defined for zero, negative, wrong type, null or omitted client values | Correct, lower, higher, zero and negative client values must not control the final total | README FR-08; request example API specification §4.3 |
| shipping_address | String value as shown in the example | No official invalid partition is defined | Empty, null, wrong type, very long and HTML-like values are exploratory/robustness partitions | API specification §4.3; README FR-08/SEC-04 |
| cart state | Authenticated user with intended cart | Empty cart, stale cart and repeated checkout are exploratory unless runtime evidence establishes a rule | Empty/non-empty and post-success clearing | README FR-07/FR-08; implementation state is runtime-observed |
| Authorization | Valid user token | Missing, malformed, expired, invalid signature | Token validity boundary | README SEC-02; API specification §4 |

## State and setup

- Preconditions: registered user, successful login, and a known cart/product setup when verifying the documented cart-derived total.
- State transitions: authenticated cart state → checkout → order creation; successful checkout → cart cleared.
- Authorization/business invariants: unauthenticated checkout is forbidden; the client value must not control the persisted total.
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

- Verified by: Human reviewer
- Verified at: 2026-08-22T04:24:19.5178372Z
- Verification notes: Human confirmed the corrected extract. Response status/schema are undocumented; total tests must assert server-derived final total rather than assume every malformed client value must return 400; empty-cart and validation outcomes remain exploratory.
