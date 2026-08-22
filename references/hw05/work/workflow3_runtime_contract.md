# Workflow 3 Runtime API Contract Verification

## Verification scope

Selected workflow:

`Login -> Read Order History -> Read Order Detail -> Read Product Detail -> Add Product to Cart -> Read Cart -> Checkout`

Runtime environment:

- Base URL: `http://localhost:3000`
- Verification date: `2026-08-16` (Asia/Bangkok)
- Existing account: `test@eshop.com`
- Requests were sent directly to the backend API.
- No SUT source code or performance-test artifact was created or modified.

The reseeded default account initially had no orders: `GET /api/orders/my-orders` returned `[]`. One prerequisite order was therefore created for the existing account through the documented Product Detail, Add to Cart, and Checkout APIs. That prerequisite checkout returned HTTP `200` and `{"message":"Checkout successful","orderId":1}`.

## Overall result

The selected workflow is **not dynamically correlatable with the current runtime contract**.

`GET /api/orders/:id` returns only order metadata. It exposes neither an `items` collection nor a `product_id`. Therefore, a product from an old order cannot be extracted and reused in `GET /api/products/:id`.

The runtime contract for the remaining endpoints was verified using the controlled fallback `productId = 1`. This fallback proves those endpoint contracts independently, but it does not repair the missing logical correlation from Order Detail to Product Detail.

## Success status codes

| Step | Method and endpoint | Actual success status | Execution note |
|---|---|---:|---|
| Login | `POST /api/login` | `200` | Executed normally. |
| Read Order History | `GET /api/orders/my-orders` | `200` | Executed normally with the JWT. |
| Read Order Detail | `GET /api/orders/1` | `200` | Executed normally with the JWT. |
| Read Product Detail | `GET /api/products/1` | `200` | Used controlled fallback ID because Order Detail exposed no product ID. |
| Add Product to Cart | `POST /api/cart` | `200` | Used product fields from the fallback Product Detail response. |
| Read Cart | `GET /api/cart` | `200` | Executed normally with the JWT. |
| Checkout | `POST /api/checkout` | `200` | Executed normally with the JWT. |

## 1. Login

Request:

```http
POST /api/login
Content-Type: application/json
```

```json
{
  "email": "test@eshop.com",
  "password": "Test1234!"
}
```

Actual response structure (`token` value redacted):

```json
{
  "message": "Login successful",
  "token": "<JWT>",
  "user": {
    "id": 2,
    "name": "Test User",
    "email": "test@eshop.com",
    "password": "Test1234!",
    "role": "user",
    "login_attempts": 0,
    "locked_until": null,
    "reset_token": null,
    "shipping_address": null,
    "phone": null
  }
}
```

Correlation paths:

| Value | JSONPath | Runtime type |
|---|---|---|
| JWT | `$.token` | String |
| User ID | `$.user.id` | Number |

The JWT is sent on the authenticated requests as `Authorization: Bearer <token>`.

Runtime risk: the response exposes `user.password` and `user.reset_token`. The observed password value is plaintext, which contradicts README security requirement SEC-01 and unnecessarily exposes sensitive account data in the login response.

## 2. Read Order History

Request:

```http
GET /api/orders/my-orders
Authorization: Bearer <token>
```

Actual response during the selected workflow:

```json
[
  {
    "id": 1,
    "user_id": 2,
    "total_amount": 30000000,
    "status": "pending",
    "shipping_address": "123 Runtime Contract Street, Ho Chi Minh City",
    "created_at": "2026-08-16 09:29:41"
  }
]
```

Correlation paths:

| Value | JSONPath | Runtime type |
|---|---|---|
| First returned order ID | `$[0].id` | Number |
| All returned order IDs | `$[*].id` | Array of numbers |
| First order status | `$[0].status` | String |

After Checkout, the endpoint returned order `2` before order `1`, so newest-first ordering was observed. The documents do not guarantee this ordering; selecting `$[0]` should not be treated as a stable semantic contract without an explicit selection rule.

## 3. Read Order Detail

Request:

```http
GET /api/orders/1
Authorization: Bearer <token>
```

Actual response:

```json
{
  "id": 1,
  "user_id": 2,
  "total_amount": 30000000,
  "status": "pending",
  "shipping_address": "123 Runtime Contract Street, Ho Chi Minh City",
  "created_at": "2026-08-16 09:29:41"
}
```

Available correlation paths:

| Value | JSONPath | Runtime type |
|---|---|---|
| Order ID | `$.id` | Number |
| User ID | `$.user_id` | Number |
| Total amount | `$.total_amount` | Number |
| Status | `$.status` | String |

Product correlation result:

- `$.items` does not exist.
- `$.product_id` does not exist.
- `$.items[0].product_id` does not exist.
- No product name, product price, quantity, or other order-line field is returned.

**Conclusion:** Order Detail does not expose a product ID that can be reused in Product Detail. The required `Order Detail -> Product Detail` dependency fails at runtime.

## 4. Read Product Detail

Because the previous response contained no product ID, this contract was verified with the controlled fallback `productId = 1`.

Request:

```http
GET /api/products/1
```

No authentication header was required.

Actual response:

```json
{
  "id": 1,
  "name": "iPhone 15 Pro Max",
  "price": 30000000,
  "description": "Điện thoại cao cấp của Apple",
  "imageUrl": "https://placehold.co/300x300/png?text=iPhone+15",
  "category_id": 1
}
```

Correlation paths:

| Value | JSONPath | Runtime type | Used by |
|---|---|---|---|
| Product ID | `$.id` | Number | Add to Cart body `id` |
| Product name | `$.name` | String | Add to Cart body `name` |
| Product price | `$.price` | Number | Add to Cart body `price` |

## 5. Add Product to Cart

Request:

```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json
```

Actual request body assembled from Product Detail:

```json
{
  "id": 1,
  "name": "iPhone 15 Pro Max",
  "price": 30000000,
  "quantity": 1
}
```

Actual response:

```json
{
  "message": "Added to cart"
}
```

Available response path:

| Value | JSONPath | Runtime type |
|---|---|---|
| Result message | `$.message` | String |

The response does not return the added item, cart ID, cart total, or quantity. Product correlation must therefore be preserved from the Product Detail response rather than extracted from this response.

## 6. Read Cart

Request:

```http
GET /api/cart
Authorization: Bearer <token>
```

Actual response:

```json
[
  {
    "price": 30000000,
    "quantity": 1,
    "name": "iPhone 15 Pro Max",
    "id": 1
  },
  {
    "price": 30000000,
    "quantity": 1,
    "name": "iPhone 15 Pro Max",
    "id": 1
  }
]
```

Item paths for the first array element:

| Value | JSONPath | Runtime type |
|---|---|---|
| Product ID | `$[0].id` | Number |
| Product name | `$[0].name` | String |
| Product price | `$[0].price` | Number |
| Quantity | `$[0].quantity` | Number |

The first item remained from the prerequisite checkout, and Add to Cart created a second identical array element. Runtime behavior therefore contradicted two README requirements during this verification:

- Checkout did not clear the cart.
- Adding the same product created another row instead of increasing the existing row's quantity.

The response contains no cart-level ID or total field. A total would need to be derived from item `price * quantity` values, but the backend is still required to calculate the authoritative Checkout total.

## 7. Checkout

Request:

```http
POST /api/checkout
Authorization: Bearer <token>
Content-Type: application/json
```

Actual request body:

```json
{
  "shipping_address": "123 Runtime Contract Street, Ho Chi Minh City",
  "total_amount": 30000000
}
```

Actual response:

```json
{
  "message": "Checkout successful",
  "orderId": 2
}
```

Response paths:

| Value | JSONPath | Runtime type |
|---|---|---|
| Result message | `$.message` | String |
| Created order ID | `$.orderId` | Number |

The cart contained two items priced at `30000000` each, but Checkout accepted the client request containing `total_amount: 30000000`; the resulting Order History entry also reported `total_amount: 30000000`. This observed behavior indicates that the server did not recalculate the total from the full cart as required by the README.

A follow-up `GET /api/cart` after the successful Checkout still returned the same two items, confirming that the cart was not cleared.

## Correlation map and viability

| Produced by | Required value | JSONPath | Consumer | Result |
|---|---|---|---|---|
| Login | JWT | `$.token` | Order History, Order Detail, Add to Cart, Read Cart, Checkout | Available |
| Order History | Order ID | `$[0].id` for the observed single-order setup | Order Detail path parameter | Available, but array selection needs a stable rule |
| Order Detail | Product ID | No path exists | Product Detail path parameter | **Unavailable; workflow-blocking gap** |
| Product Detail | Product ID | `$.id` | Add to Cart `id` | Available only after an external/fallback product ID is supplied |
| Product Detail | Product name | `$.name` | Add to Cart `name` | Available |
| Product Detail | Product price | `$.price` | Add to Cart `price` | Available |
| Checkout | New order ID | `$.orderId` | Optional post-checkout verification | Available |

Final contract verdict: Candidate 3 cannot currently implement a true repeat purchase from order history because Order Detail omits order-line data. It can only be executed by supplying a product ID from outside the order response, which changes the workflow from “repeat a prior product” to “purchase a separately selected product.”
