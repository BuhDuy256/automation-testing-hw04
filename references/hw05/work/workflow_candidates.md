# Alternative E2E Performance Workflow Candidates

## Candidate 1 — New Customer Onboarding and First Order

**Ordered steps and API endpoints used**

| # | Step | API endpoint | Classification |
|---|---|---|---|
| 1 | Register a unique customer account | `POST /api/register` | Auth-heavy |
| 2 | Log in with the new account | `POST /api/login` | Auth-heavy |
| 3 | Read the new customer's profile | `GET /api/users/me` | Read-heavy |
| 4 | Add the customer's phone and default shipping address | `PUT /api/users/me` | Transactional |
| 5 | Read the available categories | `GET /api/categories` | Read-heavy |
| 6 | Read products, optionally filtered with `?search=keyword` | `GET /api/products` | Read-heavy |
| 7 | Read the selected product | `GET /api/products/:id` | Read-heavy |
| 8 | Add the selected product to the new customer's cart | `POST /api/cart` | Transactional |
| 9 | Submit the first order using the saved shipping address | `POST /api/checkout` | Transactional |

**Why the steps logically belong to the same workflow**

A new customer creates an account, completes the profile information needed for delivery, selects a product from the catalog, and places the first order. The registration credentials feed Login; the JWT feeds profile, cart, and checkout requests; the selected product feeds the cart; and the saved address feeds Checkout.

**Technical risk or missing API contract**

- Every iteration needs a unique email because registration requires email uniqueness; repeated performance runs will also grow the user table.
- The response schemas for profile, category list, product list, product detail, cart, and checkout are not documented, so exact correlation paths are unknown.
- The documents do not explicitly say that Checkout automatically reads `shipping_address` from the profile; the address may need to be extracted from `GET /api/users/me` and sent explicitly.
- The API document includes `total_amount` in the Checkout body, while the README says the backend must ignore the client value and recalculate it from the cart.

## Candidate 2 — Password Recovery Followed by Order Cancellation

**Ordered steps and API endpoints used**

| # | Step | API endpoint | Classification |
|---|---|---|---|
| 1 | Request a password-reset OTP for an existing customer | `POST /api/forgot-password` | Auth-heavy |
| 2 | Reset the password with the returned OTP | `POST /api/reset-password` | Auth-heavy |
| 3 | Log in with the new password | `POST /api/login` | Auth-heavy |
| 4 | Read the customer's order history | `GET /api/orders/my-orders` | Read-heavy |
| 5 | Read one eligible order in detail | `GET /api/orders/:id` | Read-heavy |
| 6 | Cancel that order | `PUT /api/orders/:id/cancel` | Transactional |
| 7 | Read the same order again to observe its final state | `GET /api/orders/:id` | Read-heavy |

**Why the steps logically belong to the same workflow**

A returning customer who cannot access the account resets the password, signs in, finds a pending or confirmed order, inspects it, cancels it, and reloads it to observe the resulting state. The OTP feeds Password Reset; the new password feeds Login; the JWT feeds all order requests; and the selected order ID feeds Detail and Cancel.

**Technical risk or missing API contract**

- Each account must already own an order in `pending` or `confirmed`; the README prohibits user cancellation once an order reaches `shipping`.
- A successful cancellation is destructive test data: the same order cannot be canceled again, so concurrent virtual users need separate eligible orders or controlled reseeding.
- The order-history and order-detail response schemas are not documented, including the exact paths for order ID and status.
- The reset-password success response and OTP lifetime are not documented; repeatedly resetting one account can also make concurrent iterations invalidate one another's credentials.

## Candidate 3 — Repeat Purchase from Order History

**Ordered steps and API endpoints used**

| # | Step | API endpoint | Classification |
|---|---|---|---|
| 1 | Log in as a returning customer | `POST /api/login` | Auth-heavy |
| 2 | Read the customer's previous orders | `GET /api/orders/my-orders` | Read-heavy |
| 3 | Read one previous order in detail | `GET /api/orders/:id` | Read-heavy |
| 4 | Read the detail of a product from that previous order | `GET /api/products/:id` | Read-heavy |
| 5 | Add that product to the current cart | `POST /api/cart` | Transactional |
| 6 | Read the current cart to verify the repeated item | `GET /api/cart` | Read-heavy |
| 7 | Checkout the repeat purchase | `POST /api/checkout` | Transactional |

**Why the steps logically belong to the same workflow**

A returning customer uses purchase history to choose an item to buy again, verifies that product is still available, adds it to the current cart, checks the cart, and submits the repeat order. The prior order ID feeds Order Detail; a product ID from that order should feed Product Detail and Cart; and the authenticated cart feeds Checkout.

**Technical risk or missing API contract**

- The documents do not define the order-detail response or guarantee that it exposes product IDs. This workflow is correlatable only if runtime contract evidence confirms that field; otherwise product IDs must be supplied as controlled data and the link to the historical order becomes weaker.
- The cart and checkout response schemas and success status codes are not documented.
- The test customer needs at least one existing order, and the referenced product must still exist.
- Checkout clears the cart and creates data, so repeated and concurrent runs require isolated users or a deliberate data-reset strategy.
- The `total_amount` conflict between the API example and the README's server-side recalculation rule remains unresolved.

## Candidate 4 — Admin Catalog Publication and Customer-Facing Verification

**Ordered steps and API endpoints used**

| # | Step | API endpoint | Classification |
|---|---|---|---|
| 1 | Log in as an administrator | `POST /api/login` | Auth-heavy |
| 2 | Read existing categories | `GET /api/categories` | Read-heavy |
| 3 | Create a uniquely named category | `POST /api/categories` | Transactional |
| 4 | Read categories again and locate the new category | `GET /api/categories` | Read-heavy |
| 5 | Create a product in the new category | `POST /api/products` | Transactional |
| 6 | Search for the newly published product by its unique name | `GET /api/products?search=<keyword>` | Read-heavy |
| 7 | Read the published product in detail | `GET /api/products/:id` | Read-heavy |

**Why the steps logically belong to the same workflow**

An administrator prepares a category, publishes a product into it, then verifies through the public catalog APIs that the product can be discovered and viewed. The admin JWT authorizes both create operations; the new category ID feeds Product Creation; and the created product ID feeds Product Detail.

**Technical risk or missing API contract**

- The category-create and product-create response schemas are not documented, so IDs may need to be correlated by rereading lists with unique names.
- Category and product response schemas are not documented, including the exact collection wrappers and ID fields.
- Each iteration needs unique category and product names, and the workflow continually grows the catalog because cleanup is not included.
- The API specification does not state authentication beside category mutation endpoints, but README FR-12 explicitly requires a valid admin JWT for `POST/PUT/DELETE /api/categories` and products.
- Concurrent creation and search can introduce data collisions or eventual visibility assumptions that are not defined by the documents.

## Candidate 5 — Admin Order Fulfillment State Progression

**Ordered steps and API endpoints used**

| # | Step | API endpoint | Classification |
|---|---|---|---|
| 1 | Log in as an administrator | `POST /api/login` | Auth-heavy |
| 2 | Read all orders and select one in `pending` | `GET /api/admin/orders` | Read-heavy |
| 3 | Confirm the selected order | `PUT /api/admin/orders/:id/status` with `{"status":"confirmed"}` | Transactional |
| 4 | Read all orders and observe the confirmed state | `GET /api/admin/orders` | Read-heavy |
| 5 | Move the same order to shipping | `PUT /api/admin/orders/:id/status` with `{"status":"shipping"}` | Transactional |
| 6 | Read all orders and observe the shipping state | `GET /api/admin/orders` | Read-heavy |
| 7 | Mark the same order as delivered | `PUT /api/admin/orders/:id/status` with `{"status":"delivered"}` | Transactional |
| 8 | Read all orders and observe the delivered final state | `GET /api/admin/orders` | Read-heavy |

**Why the steps logically belong to the same workflow**

An administrator processes one order through the documented state machine from `pending` to `confirmed`, `shipping`, and `delivered`, reading the order collection after each transition. The admin JWT authorizes every request, and the selected order ID is reused throughout the same fulfillment lifecycle.

**Technical risk or missing API contract**

- Each order can traverse this path only once; concurrent virtual users cannot safely share an order ID, and every iteration needs a separate pending order.
- The admin-order-list response schema and update response schema are not documented, including exact order ID and status paths.
- The workflow requires a controlled pool of pending orders created before the run, but no bulk order-creation endpoint is documented.
- Final states cannot transition again, so reruns require database reseeding or newly created orders.
- State-changing admin operations under high concurrency can measure lock contention and workflow conflicts as well as endpoint performance, so expected conflict responses must be separated from genuine server errors.
