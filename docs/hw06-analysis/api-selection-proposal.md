# HW06 API Selection Proposal

Status: **SELECTION CONFIRMED BY HUMAN — FINAL FOR HW06**

This document records the prior candidate analysis for FR-04, FR-08, and FR-15 using the official HW06 requirement, the SUT API specification, the SUT system requirements, and implementation details where the specification leaves behaviour unclear. The human has now confirmed the three recommendations; the canonical selection is stored in `work/registry/project.json`.

## 1. Executive summary

The lowest-friction compliant proposals are:

| Pool | Feature | Proposed API | Why it is currently preferred |
| --- | --- | --- | --- |
| A | FR-04 Personal profile management | `PUT /api/users/me` | Multiple body fields, authentication, authorization and persistence/security checks provide enough meaningful cases with only login setup. |
| B | FR-08 Checkout | `POST /api/checkout` | It is the direct checkout operation, needs only an authenticated user and request data, and exposes high-value defects around total calculation, cart coupling and order creation. |
| C | FR-15 Product management (CRUD) | `POST /api/products` | It has the richest single-operation input domain in the CRUD feature, supports validation/schema/security testing, and can be isolated with create-then-clean-up data. |

These are **FINAL — HUMAN CONFIRMED**. They are recorded as individual operations, with prerequisite or cleanup calls used only to establish deterministic test state.

The main tradeoff is that the simplest candidates do not themselves implement every transition in their surrounding feature. HW06 requires relevant techniques, not artificial coverage: profile update and checkout have meaningful authentication/data/state checks, while full order-state-machine testing would belong to FR-10 or the admin order-status operation, not be forced into checkout.

## 2. HW06 selection constraints

| Constraint affecting selection | Selection consequence | Source |
| --- | --- | --- |
| Select three APIs, one from Pools A, B and C | Each proposal must map to one feature in the requested pool; supporting calls do not become additional selected APIs. | `docs/hw06-req/2026.HW06.API Testing_En.md`, §5 |
| Generate at least 35 test cases per API | Reject a technically executable operation whose input/state surface is too small to reach 35 meaningful cases. | Official requirement, §6 item 1 |
| Cover domain partitions on every parameter | Prefer operations with several documented body/query/path dimensions and explicit business constraints. | Official requirement, §6 item 1 |
| Cover relevant state transitions | Test real transitions caused by the operation; do not invent unrelated transitions. | Official requirement, §6 item 1; SUT requirements FR-08, FR-10 |
| Cover SEC-01–SEC-07 where applicable | Authentication, role, IDOR, injection, plaintext/OTP and field-tampering checks must be mapped to applicable candidates; not every SEC item applies equally to every endpoint. | Official requirement, §6 item 1 and SUT requirements §9 |
| Validate response schema | Select an operation with a stable documented success/error response that can be asserted in Newman. | Official requirement, §6 item 1 |
| Human audit and at least five human-added cases | Prefer a bounded domain that is easy to review and extend without duplicating cases. | Official requirement, §6 items 2–3 |
| Postman/Newman execution and real evidence | Prefer local, deterministic HTTP calls with short prerequisite chains and controllable data. | Official requirement, §6 item 4; §11 |
| Genuine bugs, CI and oral defense | High-value observable behaviour is preferable to opaque or infrastructure-heavy behaviour. | Official requirement, §6 item 5; §6 CI/CD paragraph; §13 |
| Every request carries `X-Student-Id` | The selected collection must add this header globally or through a pre-request script. | Official requirement, §6 item 4 |
| Time-boxed individual assignment | Among viable candidates, minimise setup, reset, flakiness, scripting and evidence effort. | Official requirement, §1 duration and §2 quality-over-completion principle |

## 3. Interpretation of “one API”

The assignment says to select three APIs and then instructs the student to consult the SUT specification for the endpoints behind each feature. Its examples include “an admin product or order operation with a state change,” which points to an individual HTTP operation rather than an entire business-feature graph. The SUT specification also lists each operation separately by method and path.

Therefore this proposal treats an API as one selectable HTTP method/path operation, for example `POST /api/products`. Related login, setup, read-back and cleanup calls are supporting requests, not additional selected APIs. This is especially important for FR-15: its “CRUD” feature is an endpoint group, but selecting the whole group would turn one Pool-C choice into several operations and would make the three-API workload ambiguous.

For FR-15, the CRUD group is still analysed as the candidate family. If the human later interprets “API” as a feature-level group, the group would be a separate decision and should not be silently substituted into the registry. The recommendation below remains the individual create operation because it is consistent with the assignment examples and provides the strongest single-operation test surface.

### Evidence boundary

The following are documented in the official API specification: method/path, example request shapes, nominal response examples, JWT requirements for user/cart/order APIs, and the admin grouping. The detailed business constraints and SEC mapping come from the SUT system requirements (`eshop-sut/README.md`), especially FR-04, FR-08, FR-12 and FR-15, and SEC-01–SEC-07.

The following are implementation inferences, not documented guarantees: product mutation routes in `backend/server.js` do not call `authenticateToken`; profile update accepts a client `role`; checkout inserts the client-supplied `total_amount` without reading the in-memory cart and does not clear it; cart data is process-memory state; product detail returns an empty 200 response for a missing ID and converts even product prices to strings. These are useful bug hypotheses, not requirements to assert as correct behaviour.

## 4. FR-04 — Personal profile management

### Candidate inventory

| Candidate | Method | Endpoint | Role/Auth | Main behaviour | State/dependencies | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| A4-1 | GET | `/api/users/me` | Authenticated user JWT; documented in user API section | Return the current user profile | Requires a valid user token; profile must already exist | Stable read and auth checks, but no request parameters and little state mutation. |
| A4-2 | PUT | `/api/users/me` | Authenticated user JWT; FR-04 requires the user to update only their own profile | Update `name`, `shipping_address`, and `phone` | Requires login; repeated calls mutate the same user and can be read back with A4-1 | `server.js` also accepts `role` if present; this is an implementation finding conflicting with FR-04/SEC-06. |

Documented/inferred request details for A4-2: JSON body contains `name`, `shipping_address`, `phone`; FR-04 requires a 10–11 digit phone beginning with `0`, preserves email, and forbids role changes. The API specification gives a successful `{message: "Profile updated"}` response but does not spell out validation/error schemas. The implementation updates all supplied fields without server-side validation and conditionally updates `role`.

Relevant security: SEC-02 (valid JWT), SEC-03 where an admin-only boundary is tested, SEC-04 for stored/displayed user input, SEC-05 for persistence queries, and SEC-06 (role tampering). SEC-01 and SEC-07 are not materially exercised by the profile update operation.

### Hard viability gate

| Candidate | G1 ≥35 | G2 partitions | G3 state | G4 security | G5 schema | G6 Newman | G7 full pipeline | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A4-1 GET profile | FAIL — almost no input combinations | FAIL — no parameters | PASS WITH LIMITATIONS — auth and profile existence only | PASS WITH LIMITATIONS — token and IDOR-style token checks | PASS | PASS | FAIL — case count would be padded artificially | **FAIL** |
| A4-2 PUT profile | PASS — fields, omissions, types, lengths and security variants | PASS | PASS WITH LIMITATIONS — authenticated update, persistence and repeated-update behaviour | PASS — JWT, role tampering, input/injection and own-user boundary | PASS WITH LIMITATIONS — success schema is documented; error schemas are not | PASS | PASS | **PASS** |

### Weighted comparison

Scores are 1–5; total is the weighted score out of 100. A failed gate is not eligible regardless of score.

| Candidate | HW06 25% | 35 cases 15% | Setup 12% | Execution 10% | Reset 10% | Postman 8% | Security 5% | Bugs 5% | Determinism 5% | Defense 5% | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A4-1 GET profile | 2 | 1 | 5 | 5 | 5 | 5 | 3 | 2 | 5 | 5 | 61 |
| A4-2 PUT profile | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | **88** |

### Recommended FR-04 API

**Confirmed candidate: `PUT /api/users/me` — FINAL — HUMAN CONFIRMED.**

It wins because it is the only FR-04 operation that can comfortably reach 35 meaningful cases without treating harmless repetitions as new tests. Partitions include valid/invalid phone boundaries (9, 10, 11 and 12 digits; wrong prefix; letters; empty/null), name empty/long/unicode/HTML/SQL-like values, address empty/long/unicode/HTML/SQL-like values, missing versus extra fields, wrong JSON types, repeated updates and persistence read-back.

State tests are limited but real: no token versus valid token, valid token for the wrong user ID (the route has no client ID and should remain self-scoped), update then GET, update then update again, and role-tampering attempts. Security opportunities are unusually strong for a small operation because the implementation exposes the `role` field even though FR-04 and SEC-06 forbid changing it. Schema assertions cover the exact success message and the profile shape returned by the supporting GET.

Required setup is one login request and a known user. Cleanup can be a final deterministic profile restore; the SQLite database need not be recreated for every case. Main weaknesses are undocumented validation/error schemas and limited genuine state-machine depth. Expected friction is **LOW–MEDIUM**: low for HTTP orchestration, medium for restoring profile data and separating expected bug findings from rubric assertions.

## 5. FR-08 — Checkout

### Candidate inventory

| Candidate | Method | Endpoint | Role/Auth | Main behaviour | State/dependencies | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| B8-1 | GET | `/api/cart` | Authenticated user JWT | Read the current cart | Cart is process-memory state; login and prior cart additions are needed for meaningful non-empty cases | Supporting FR-07 operation, not itself checkout. Too little input surface. |
| B8-2 | POST | `/api/cart` | Authenticated user JWT | Add the request body to the user cart | Requires login; cart is process-local and has no documented validation | Supporting operation; arbitrary body values and no quantity rules make a defensible 35-case suite weak. |
| B8-3 | POST | `/api/checkout` | Authenticated user JWT | Create a pending order from `total_amount` and `shipping_address` | Requires login; documented FR-08 says cart-derived total and cart clearing; implementation only inserts an order | Direct FR-08 operation and strongest candidate. |
| B8-4 | GET | `/api/orders/my-orders` | Authenticated user JWT | Return the current user’s order history | Requires an authenticated user and prior orders | Useful read-back/schema check, but few parameters and no mutation. |
| B8-5 | GET | `/api/orders/:id` | No auth in specification/implementation | Return an order by ID | Requires an existing order ID; implementation does not scope it to the caller | Security/IDOR finding is possible, but operation does not implement checkout itself. |
| B8-6 | PUT | `/api/orders/:id/cancel` | Authenticated user JWT | Cancel the user’s order if allowed | Requires an order and its status; meaningful state behaviour | Directly tests order cancellation/FR-10, not the FR-08 checkout operation. Implementation allows cancellation from `shipping`, contrary to SUT requirements. |

For B8-3, the specification documents `total_amount` and `shipping_address` and a success response `{message, orderId}`. The SUT requirements say the backend must recompute the total from the cart, reject client-only totals, require login, show purchased products, and clear the cart after success. The implementation inference is that checkout accepts and persists the supplied total, does not inspect `userCarts`, and leaves cart state unchanged. This is a high-value genuine-bug hypothesis.

Relevant security: SEC-02 applies directly; SEC-04/SEC-05 apply to address and persistence handling; SEC-03 is not directly relevant because checkout is not an admin operation; SEC-01 and SEC-07 are not checkout concerns. IDOR belongs more naturally to order reads/cancellation and should not be fabricated as a checkout parameter.

### Hard viability gate

| Candidate | G1 ≥35 | G2 partitions | G3 state | G4 security | G5 schema | G6 Newman | G7 full pipeline | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B8-1 GET cart | FAIL — no request parameters | FAIL | PASS WITH LIMITATIONS | PASS WITH LIMITATIONS — JWT | PASS | PASS | FAIL — would require padding | **FAIL** |
| B8-2 POST cart | PASS WITH LIMITATIONS — arbitrary body types can become artificial | FAIL — spec gives no validation/domain rules | PASS WITH LIMITATIONS — add/read cart | PASS WITH LIMITATIONS | PASS WITH LIMITATIONS | PASS | FAIL — meaningful count is doubtful | **FAIL** |
| B8-3 POST checkout | PASS — amounts, address, body omissions/types, auth and derived-state variants | PASS | PASS — authenticated checkout creates pending order and should clear cart | PASS WITH LIMITATIONS — auth/input/injection; admin/OTP items are out of scope | PASS | PASS | PASS | **PASS** |
| B8-4 GET my-orders | FAIL — only auth and existing-data variation | FAIL | PASS WITH LIMITATIONS | PASS — own-user isolation | PASS | PASS | FAIL | **FAIL** |
| B8-5 GET order detail | FAIL — only ID/auth variants | PASS WITH LIMITATIONS — existing/missing/other-user order | PASS — strong IDOR opportunity | PASS | PASS | FAIL — insufficient domain surface | **FAIL** |
| B8-6 PUT cancel | PASS WITH LIMITATIONS — statuses and IDs provide cases | PASS | PASS — actual order state transitions | PASS — JWT and ownership | PASS | PASS WITH LIMITATIONS — ordered seeded state required | PASS WITH LIMITATIONS | **PASS WITH LIMITATIONS** |

### Weighted comparison

| Candidate | HW06 25% | 35 cases 15% | Setup 12% | Execution 10% | Reset 10% | Postman 8% | Security 5% | Bugs 5% | Determinism 5% | Defense 5% | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B8-3 POST checkout | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 5 | 3 | 5 | **81** |
| B8-6 PUT cancel | 4 | 4 | 2 | 3 | 2 | 3 | 5 | 5 | 2 | 4 | 69 |

### Recommended FR-08 API

**Confirmed candidate: `POST /api/checkout` — FINAL — HUMAN CONFIRMED.**

It is the direct FR-08 operation and has much lower setup cost than cancellation/state-machine testing. A meaningful 35-case plan can partition authenticated/unauthenticated/malformed JWT requests; `total_amount` zero, negative, decimal, very large, string, null, omitted and mismatched-to-cart values; address empty, boundary-length, unicode, HTML-like, SQL-like and wrong-type values; empty/non-empty cart; repeated checkout; and response/order persistence. These cases expose the documented contract rather than forcing unrelated order transitions.

The minimum realistic chain is login → add a known product to the cart → checkout with a derived amount → read cart and order history → reset/restart the backend when an isolated cart is required. Because the implementation stores cart state in memory and does not clear it, deterministic runs need either a one-user/one-run discipline or a server restart/reset between stateful examples. Database pollution comes from created orders; it is manageable with a reset after a suite or unique test user. Friction is **MEDIUM**.

The main weakness is that the documented request exposes `total_amount` even though the business requirement says the server must calculate it. The proposal should therefore distinguish contract-negative tests from implementation observations and report a bug if the server accepts a forged total. B8-6 is academically richer for transitions but requires order IDs, admin/user sequencing and resets, so its higher complexity does not materially improve the FR-08 selection.

## 6. FR-15 — Product management CRUD

### Candidate inventory

| Candidate | Method | Endpoint | Role/Auth | Main behaviour | State/dependencies | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| C15-1 | GET | `/api/products` | Public in API specification | List all products or search by name | Seed products are available; search is query-only | Read/list is part of the broader product domain, but not the strongest admin-management candidate. Search is string-interpolated in implementation. |
| C15-2 | GET | `/api/products/:id` | Public in API specification | Read one product | Requires existing/non-existing ID | Supports read CRUD semantics, but has only one path parameter. Implementation returns 200 `{}` for missing products and changes price type for even IDs. |
| C15-3 | POST | `/api/products` | Spec labels product add/edit/delete as Admin; FR-12 requires valid admin JWT | Create a product from `name`, `price`, `description`, `imageUrl`, `category_id` | Needs a valid category and unique test data; cleanup requires DELETE or reset | Richest single mutation input surface. Implementation has no auth guard or field validation. |
| C15-4 | PUT | `/api/products/:id` | Same documented admin expectation as C15-3 | Replace the selected product fields | Requires existing product and category; must restore or delete test data | Good isolation/immutability cases, but requires a stable fixture and has fewer independent dimensions than create. |
| C15-5 | DELETE | `/api/products/:id` | Same documented admin expectation as C15-3 | Delete a product | Requires an existing product; cleanup is irreversible without database reset | Strong authorization/ID handling, but too few parameters for 35 meaningful cases. |

Documented FR-15 rules are: admin can add/view/edit/delete; name is required and at most 255 characters; price is required and positive; category is required and must exist; updating one product must not change others. The API specification documents the mutation body and nominal messages but does not include field validation/error schemas. The SUT requirements additionally tie product mutations to valid admin JWT and `role = 'admin'`.

Implementation findings: C15-3/C15-4/C15-5 do not call `authenticateToken`, so unauthenticated and ordinary-user requests may succeed; no positive-price/name/category validation is visible; create/update can pollute the SQLite database. These are implementation discrepancies to test and report, not reasons to relax the requirements.

Relevant security: SEC-02 and SEC-03 are central; SEC-04 applies to product text if displayed; SEC-05 applies to product search and mutation persistence; SEC-06 is profile-specific and SEC-01/SEC-07 are not directly applicable. Product create also offers useful authorization and injection test opportunities.

### Hard viability gate

| Candidate | G1 ≥35 | G2 partitions | G3 state | G4 security | G5 schema | G6 Newman | G7 full pipeline | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C15-1 GET list/search | PASS WITH LIMITATIONS — search/error/security variants can reach 35 | PASS WITH LIMITATIONS — one optional query | FAIL — no meaningful mutation state | PASS WITH LIMITATIONS — SQL injection/auth is relevant, admin auth is not | PASS | PASS | FAIL — weak FR-15 management/state coverage | **FAIL** |
| C15-2 GET detail | FAIL — one path parameter | FAIL | PASS WITH LIMITATIONS — existing/missing IDs | PASS — ID exposure/type | PASS | PASS | FAIL | **FAIL** |
| C15-3 POST create | PASS — five fields, validation, auth, persistence and negative cases | PASS | PASS WITH LIMITATIONS — create/read-back/duplicate/cleanup | PASS — JWT/role/injection | PASS | PASS WITH LIMITATIONS — cleanup required | PASS | **PASS** |
| C15-4 PUT update | PASS WITH LIMITATIONS — body plus ID and immutability cases | PASS | PASS — update/read-back/other-record invariance | PASS — JWT/role/ID handling | PASS | PASS WITH LIMITATIONS — fixture/reset required | PASS WITH LIMITATIONS | **PASS** |
| C15-5 DELETE | FAIL — one ID and auth variants are insufficient | FAIL | PASS — delete/read-back | PASS — JWT/role/IDOR | PASS | PASS | FAIL — would pad the suite | **FAIL** |

### Weighted comparison

| Candidate | HW06 25% | 35 cases 15% | Setup 12% | Execution 10% | Reset 10% | Postman 8% | Security 5% | Bugs 5% | Determinism 5% | Defense 5% | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C15-3 POST create | 5 | 5 | 3 | 4 | 3 | 4 | 5 | 5 | 3 | 4 | **84** |
| C15-4 PUT update | 5 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 2 | 4 | 71 |

### Recommended FR-15 API

**Confirmed candidate: `POST /api/products` — FINAL — HUMAN CONFIRMED.**

Create has the best single-operation balance. Its five body fields support partitions for required/omitted/null/wrong-type values, name length 0/1/255/256, price 0/positive/negative/decimal/string/large, image URL forms, description boundaries and existing/missing/invalid category IDs. Security cases cover missing, malformed, user and admin JWTs, role escalation attempts, SQL-like text, duplicate/unique data and response leakage. State cases cover create → read-back, repeated create, failed create not leaving a record, cleanup, and whether unrelated seeded products remain unchanged. The success `{message, id}` response and read-back product schema make schema validation meaningful.

Setup is login as admin plus a known category; cleanup is DELETE for each created ID or a database reset after the run. The implementation currently lacks the expected admin guard and validation, creating strong genuine-bug potential but also means expected failures must be documented carefully. Database pollution and concurrency make the friction **MEDIUM–HIGH** unless generated names and a fixed cleanup list are used. Newman ordering is straightforward: create cases first, capture IDs, read back, then clean up. C15-4 is the closest alternative, but it needs a stable existing record, must restore it after every mutation, and offers fewer independent ways to reach 35 cases. C15-3 is easier to explain orally as “validate authorization and input before creating a record.”

## 7. Cross-FR comparison

| FR | Proposed API | Requirement coverage | ≥35 feasibility | Setup | Dependencies | Reset friction | Newman difficulty | Bug potential | Oral defense | Weighted score |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| FR-04 | `PUT /api/users/me` | 5/5 | 5/5 | 4/5 | Login only | 4/5 | 4/5 | 5/5 | 5/5 | **88** |
| FR-08 | `POST /api/checkout` | 5/5 | 4/5 | 4/5 | Login, cart/order state | 3/5 | 4/5 | 5/5 | 5/5 | **81** |
| FR-15 | `POST /api/products` | 5/5 | 5/5 | 3/5 | Login, category, created-data cleanup | 3/5 | 4/5 | 5/5 | 4/5 | **84** |

The scores are advisory after the hard gate. FR-04 is the lowest-friction choice; FR-08 is direct and bug-rich but has process-memory cart and order pollution; FR-15 has the best CRUD input surface but requires strict cleanup and authorization setup.

## 8. Estimated workflow friction

### FR-04 — `PUT /api/users/me`

Chain: `login → store user JWT → PUT profile candidate → GET profile for persistence/schema assertions → restore baseline profile`.

Estimated friction: **LOW–MEDIUM**. There is one prerequisite request, no foreign-key setup, no order/cart state, and cleanup is a final profile restore. Newman scripting is mainly token extraction, request data variables and response assertions.

### FR-08 — `POST /api/checkout`

Chain: `login → store user JWT → POST cart with a known product (when testing documented cart coupling) → GET cart → POST checkout → GET my-orders → verify cart/order outcome → restart/reset backend for isolated stateful runs`.

Estimated friction: **MEDIUM**. The database order remains after each successful checkout, while the cart is in process memory. The suite needs unique or resettable data and deliberate ordering; the implementation’s failure to clear the cart must be captured as a bug, not used to create accidental follow-on state.

### FR-15 — `POST /api/products`

Chain: `login as admin → store admin JWT → GET categories → POST product with generated unique name → GET product/list for schema and persistence → DELETE created product or reset database`.

Estimated friction: **MEDIUM–HIGH**. A category is needed, product IDs must be captured, and cleanup must occur even after negative/partial cases. Repeated Newman runs need unique names and a reliable cleanup phase. Because the implementation does not enforce admin authorization, both unauthenticated and authenticated-negative cases should run against a controlled reset rather than a shared persistent database.

## 9. Final recommendation

### Pool A / FR-04

Recommended candidate: **`PUT /api/users/me`** — **PROPOSED — NOT YET CONFIRMED BY HUMAN**

- Why choose it: richest meaningful FR-04 input and security surface; easy login/setup; direct persistence evidence.
- Why not the closest alternative: `GET /api/users/me` has insufficient parameters and mutation/state surface for 35 cases.
- Main risk: the API specification does not define detailed validation/error schemas, and the implementation accepts `role`.
- Expected friction: LOW–MEDIUM.
- Confidence: HIGH.

### Pool B / FR-08

Recommended candidate: **`POST /api/checkout`** — **PROPOSED — NOT YET CONFIRMED BY HUMAN**

- Why choose it: direct implementation of FR-08, only one required authentication setup, strong total/cart/order assertions, and likely genuine bug discovery.
- Why not the closest alternative: `PUT /api/orders/:id/cancel` has richer transitions but belongs primarily to FR-10 and requires significantly more ordered state/reset work.
- Main risk: cart is process memory and checkout currently trusts client total; deterministic isolation needs resets or disciplined ordering.
- Expected friction: MEDIUM.
- Confidence: HIGH.

### Pool C / FR-15

Recommended candidate: **`POST /api/products`** — **PROPOSED — NOT YET CONFIRMED BY HUMAN**

- Why choose it: the largest single-operation domain in FR-15, strong validation/auth/schema coverage, and straightforward create/read-back/cleanup.
- Why not the closest alternative: `PUT /api/products/:id` needs a stable fixture and restoration for every mutation and offers less case diversity; DELETE fails the 35-case gate.
- Main risk: missing admin enforcement and validation in the implementation may produce many expected failures and create data pollution.
- Expected friction: MEDIUM–HIGH.
- Confidence: MEDIUM–HIGH.

## 10. Human decision required

The working interpretation is one HTTP method/path operation, while FR-15 is analysed as a CRUD family. Group-duplication constraints among classmates remain an external check; no group-member allocations were available in the inspected materials.

No selection has been written to the canonical HW06 registry.

ACT-SEL-01 must not run until the human explicitly approves these recommendations.
