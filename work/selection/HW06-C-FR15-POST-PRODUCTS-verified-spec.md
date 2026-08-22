# HW06-C-FR15-POST-PRODUCTS Verified Specification Extract

> Status: UNVERIFIED. This extract is a source-anchored navigation aid; the official specification remains authoritative. Human verification is required before test generation.

## Identity

- Pool: C
- Feature ID: FR-15 — Product management (CRUD)
- Method and path: `POST /api/products`
- Source headings: `eshop-sut/api_specification.md`, §3.3 Add/Edit/Delete Products; `eshop-sut/README.md`, FR-12/FR-15 and SEC-02/SEC-03/SEC-04/SEC-05

## Request contract

| Input | Location | Type | Required | Documented rule | Source reference |
|---|---|---|---|---|---|
| Authorization | Header | Bearer admin JWT | Yes | Product data-changing APIs require valid JWT and admin role | README FR-12; API specification §3.3 and §6 |
| name | JSON body | String | Yes | Required, maximum 255 characters | README FR-15 |
| price | JSON body | Positive number | Yes | Must be greater than zero | README FR-15 |
| description | JSON body | String | Not explicitly stated | Product description | API specification §3.3 |
| imageUrl | JSON body | String/URL | Not explicitly stated | Product image URL field | API specification §3.3 |
| category_id | JSON body | Existing category ID | Yes | Must select an existing category | README FR-15; API specification §3.3 |

## Response contract

| Condition | Status | Schema/fields | Source reference |
|---|---:|---|---|
| Successful create | Not explicitly stated in API specification | `{ "message": "Product created", "id": number }` | Implementation observation `backend/server.js`; API specification gives body but not response example |
| Validation/authorization failure | Not explicitly stated | Error schema/status is unspecified in the API specification | README FR-12/FR-15 defines expected rule; exact response unknown |

## Domain partitions and boundaries

| Input | Valid partitions | Invalid partitions | Boundaries | Source reference |
|---|---|---|---|---|
| name | Non-empty text up to 255 characters | Empty, null, wrong type, overlong, unsafe text | 0/1/255/256 characters | README FR-15; SEC-04 |
| price | Positive numeric value | Zero, negative, null, wrong type | 0 and smallest positive value | README FR-15 |
| description | Normal/Unicode text | Wrong type or unsafe text | Empty/long values; exact limit unknown | API specification §3.3; SEC-04 |
| imageUrl | Normal URL/text | Wrong type or malformed URL | Empty/long values; exact URL rule unknown | API specification §3.3 |
| category_id | Existing category | Missing, null, wrong type, nonexistent ID | Existing versus nonexistent category | README FR-15 |
| Authorization | Valid admin token | Missing, malformed, user-role, invalid signature | Role and token boundary | README FR-12; SEC-02/SEC-03 |

## State and setup

- Preconditions: known category and valid admin login; use unique product names for repeatable runs.
- Allowed transitions: no product → created product; successful create can be read back with supporting GET.
- Forbidden transitions: unauthenticated/non-admin create; invalid data creating a persistent record.
- Persistent side effects: new product row; database pollution unless deleted or database reset.
- Reset/setup needs: capture created IDs and delete them after each case/suite, or reset the seeded SQLite database. Verify unrelated products remain unchanged.

## Applicable security requirements

| SEC ID | Applicability | Expected enforcement | Source reference |
|---|---|---|---|
| SEC-02 | Direct | Require valid JWT | README SEC-02; FR-12 |
| SEC-03 | Direct | Require `role = 'admin'`, not merely a valid token | README SEC-03; FR-12 |
| SEC-04 | Relevant to product text/display | Escape user-controlled fields at display boundaries | README SEC-04 |
| SEC-05 | Direct | Use parameterized persistence queries | README SEC-05 |
| SEC-01 | Not directly exercised | Password storage is outside this operation | README SEC-01 |
| SEC-06 | Not directly applicable | Profile role update is outside this operation | README SEC-06 |
| SEC-07 | Not directly applicable | OTP is outside this operation | README SEC-07 |

## Schema checks

- Required fields: `name`, `price`, and `category_id` are required by FR-15; exact server error schema is unknown.
- Types/formats: name/description/imageUrl text; price positive number; category_id existing ID.
- Nullable/optional fields: description and imageUrl are present in the API example but optionality is not specified.
- Additional-property rule, if documented: Not documented.

## Unknowns requiring runtime verification

- Exact status/error schema for invalid input and non-admin requests.
- Whether the endpoint enforces admin authorization and the documented validation rules.
- Whether duplicate names are allowed and whether category foreign-key existence is enforced.

## Human verification

- Verified by: Pending human verification
- Verified at: Pending
- Verification notes: Confirm the admin authorization source and response contract before ACT-GEN-01.
