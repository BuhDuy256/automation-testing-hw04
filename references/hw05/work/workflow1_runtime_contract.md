# Workflow 1 Runtime API Contract Verification

## Verification scope

Selected workflow:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

Runtime environment:

- Base URL: `http://localhost:3000`
- Verification date: `2026-08-16` (Asia/Bangkok)
- Unique registered email: `runtime.candidate1.20260816163735859@example.com`
- Requests were sent directly to the backend API after a clean SUT reseed.
- No SUT source code or performance-test artifact was created or modified.

## Overall result

The workflow reached Checkout successfully for the newly registered user. Every workflow endpoint returned HTTP `200`.

One logical dependency failed: the shipping address saved by `PUT /api/users/me` was **not** used automatically by Checkout. A Checkout request without `shipping_address` still returned HTTP `200`, but the created order stored `shipping_address: null`. Sending the saved address explicitly in the Checkout request created another order with the correct address.

Therefore, `shipping_address` is not enforced as a required HTTP field, but it is required in the Checkout request body to persist a valid delivery address. The workflow must carry it explicitly from profile data or test input into Checkout.

## Actual success status codes

| Step | Method and endpoint | Actual status | Result |
|---|---|---:|---|
| Register | `POST /api/register` | `200` | User ID `3` created. |
| Login | `POST /api/login` | `200` | JWT returned. |
| Read Profile | `GET /api/users/me` | `200` | New-user profile returned. |
| Update Profile | `PUT /api/users/me` | `200` | Update accepted. |
| Read Categories | `GET /api/categories` | `200` | Category array returned. |
| Read Products | `GET /api/products` | `200` | Product array returned. |
| Read Product Detail | `GET /api/products/1` | `200` | Selected product object returned. |
| Add Product to Cart | `POST /api/cart` | `200` | Product-detail values accepted directly. |
| Checkout without address probe | `POST /api/checkout` | `200` | Order `1` created with a null address. |
| Checkout with explicit address | `POST /api/checkout` | `200` | Order `2` created with the saved address. |

## 1. Register

Actual request:

```http
POST /api/register
Content-Type: application/json
```

```json
{
  "email": "runtime.candidate1.20260816163735859@example.com",
  "name": "Runtime Candidate One",
  "password": "Runtime123!"
}
```

Actual response:

```json
{
  "message": "User registered successfully",
  "id": 3
}
```

Data paths:

| Value | Location | JSONPath | Next use |
|---|---|---|---|
| Registered email | Register request | `$.email` | Login request `email` |
| Registered password | Register request | `$.password` | Login request `password` |
| User ID | Register response | `$.id` | Available but not required by later workflow requests |

The Register response does not echo the email, so the original input value must be retained for Login.

## 2. Login

Actual request:

```http
POST /api/login
Content-Type: application/json
```

```json
{
  "email": "runtime.candidate1.20260816163735859@example.com",
  "password": "Runtime123!"
}
```

Actual response (`token` value redacted):

```json
{
  "message": "Login successful",
  "token": "<JWT>",
  "user": {
    "id": 3,
    "name": "Runtime Candidate One",
    "email": "runtime.candidate1.20260816163735859@example.com",
    "password": "Runtime123!",
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

| Value | JSONPath | Next use |
|---|---|---|
| JWT | `$.token` | Bearer token for Profile, Add to Cart, and Checkout |
| User ID | `$.user.id` | Available but not needed because authenticated APIs identify the user from the JWT |
| Email | `$.user.email` | Optional identity assertion |

Authenticated requests use `Authorization: Bearer <token>`.

Runtime risk: Login exposes the user's plaintext `password` and a `reset_token` field in the response object.

## 3. Read Profile

Actual request:

```http
GET /api/users/me
Authorization: Bearer <token>
```

Actual response before update:

```json
{
  "id": 3,
  "name": "Runtime Candidate One",
  "email": "runtime.candidate1.20260816163735859@example.com",
  "password": "Runtime123!",
  "role": "user",
  "login_attempts": 0,
  "locked_until": null,
  "reset_token": null,
  "shipping_address": null,
  "phone": null
}
```

Relevant paths:

| Value | JSONPath |
|---|---|
| User ID | `$.id` |
| Registered email | `$.email` |
| Current shipping address | `$.shipping_address` |

The initial `shipping_address` and `phone` values were `null`, as expected for the new account.

## 4. Update Profile

Actual request:

```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "shipping_address": "231 Candidate One Street, Ho Chi Minh City",
  "name": "Runtime Candidate One Updated",
  "phone": "0912345678"
}
```

Actual response:

```json
{
  "message": "Profile updated"
}
```

The update response does not echo any updated value. A verification `GET /api/users/me` returned HTTP `200` with:

```json
{
  "id": 3,
  "name": "Runtime Candidate One Updated",
  "email": "runtime.candidate1.20260816163735859@example.com",
  "password": "Runtime123!",
  "role": "user",
  "login_attempts": 0,
  "locked_until": null,
  "reset_token": null,
  "shipping_address": "231 Candidate One Street, Ho Chi Minh City",
  "phone": "0912345678"
}
```

Shipping-address paths:

| Value | Location | JSONPath | Next use |
|---|---|---|---|
| Submitted address | Update request | `$.shipping_address` | Must be retained or reread for Checkout |
| Persisted address | Profile verification response | `$.shipping_address` | Checkout request `shipping_address` |

The profile update persisted successfully, but Checkout did not consume this saved field automatically.

## 5. Read Categories

Actual request:

```http
GET /api/categories
```

No authentication header was required.

Actual response:

```json
[
  {
    "id": 1,
    "name": "Điện thoại"
  },
  {
    "id": 2,
    "name": "Laptop"
  },
  {
    "id": 3,
    "name": "Phụ kiện"
  }
]
```

Correlation paths:

| Value | JSONPath | Next use |
|---|---|---|
| First category ID used in this run | `$[0].id` | Match a Product List element's `category_id` |
| All category IDs | `$[*].id` | Optional category selection |

The selected runtime category ID was `1`.

## 6. Read Products

Actual request:

```http
GET /api/products
```

No authentication header was required.

Actual response:

```json
[
  {
    "id": 1,
    "name": "iPhone 15 Pro Max",
    "price": 30000000,
    "description": "Điện thoại cao cấp của Apple",
    "imageUrl": "https://placehold.co/300x300/png?text=iPhone+15",
    "category_id": 1
  },
  {
    "id": 2,
    "name": "Samsung Galaxy S24 Ultra",
    "price": 28000000,
    "description": "Màn hình hiển thị xuất sắc, camera siêu zoom",
    "imageUrl": "https://placehold.co/300x300/png?text=Samsung+S24",
    "category_id": 1
  },
  {
    "id": 3,
    "name": "MacBook Pro M3",
    "price": 45000000,
    "description": "Laptop chuyên nghiệp mạnh mẽ",
    "imageUrl": "https://placehold.co/300x300/png?text=Macbook+Pro",
    "category_id": 2
  },
  {
    "id": 4,
    "name": "Tai nghe AirPods Pro 2",
    "price": 6000000,
    "description": "Chống ồn chủ động xuất sắc",
    "imageUrl": "https://placehold.co/300x300/png?text=AirPods+Pro",
    "category_id": 3
  },
  {
    "id": 5,
    "name": "Bàn phím cơ Keychron Q1",
    "price": 4000000,
    "description": "Gõ cực sướng, thiết kế kim loại",
    "imageUrl": "https://placehold.co/300x300/png?text=Keychron+Q1",
    "category_id": 3
  }
]
```

The run selected the first product whose `category_id` equaled the selected category ID `1`.

Correlation paths for the observed first matching product:

| Value | JSONPath | Next use |
|---|---|---|
| Product ID | `$[0].id` | Product Detail path parameter |
| Product name | `$[0].name` | Available, but Product Detail was used as the source for Cart |
| Product price | `$[0].price` | Available, but Product Detail was used as the source for Cart |
| Product category ID | `$[0].category_id` | Verify it matches the selected category ID |

The product array contains `category_id`, so Categories and Products can be connected by client-side selection. The endpoint does not document a category query parameter.

## 7. Read Product Detail

Actual request:

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

| Value | JSONPath | Next use |
|---|---|---|
| Product ID | `$.id` | Add to Cart body `id` |
| Product name | `$.name` | Add to Cart body `name` |
| Product price | `$.price` | Add to Cart body `price` and Checkout `total_amount` input |
| Category ID | `$.category_id` | Optional assertion against the selected category |

## 8. Add Product to Cart

Actual request constructed directly from Product Detail:

```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json
```

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

Response path:

| Value | JSONPath |
|---|---|
| Result message | `$.message` |

Verification result: the exact `id`, `name`, and `price` returned by Product Detail were accepted directly by `POST /api/cart`, which returned HTTP `200`. This dependency works.

## 9. Checkout and shipping-address verification

### Probe without `shipping_address`

Actual request:

```http
POST /api/checkout
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "total_amount": 30000000
}
```

Actual response:

```json
{
  "message": "Checkout successful",
  "orderId": 1
}
```

A verification `GET /api/orders/my-orders` returned:

```json
[
  {
    "id": 1,
    "user_id": 3,
    "total_amount": 30000000,
    "status": "pending",
    "shipping_address": null,
    "created_at": "2026-08-16 09:37:36"
  }
]
```

Result: Checkout did not read `$.shipping_address` from the saved profile. It accepted the omitted field and created an incomplete order with a null address.

### Checkout with explicit `shipping_address`

The product was added to the cart again before this corrected Checkout request.

Actual request:

```http
POST /api/checkout
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "shipping_address": "231 Candidate One Street, Ho Chi Minh City",
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

Final order verification returned HTTP `200`:

```json
[
  {
    "id": 2,
    "user_id": 3,
    "total_amount": 30000000,
    "status": "pending",
    "shipping_address": "231 Candidate One Street, Ho Chi Minh City",
    "created_at": "2026-08-16 09:37:36"
  },
  {
    "id": 1,
    "user_id": 3,
    "total_amount": 30000000,
    "status": "pending",
    "shipping_address": null,
    "created_at": "2026-08-16 09:37:36"
  }
]
```

Checkout response paths:

| Value | JSONPath |
|---|---|
| Result message | `$.message` |
| Created order ID | `$.orderId` |

Shipping-address conclusion: the Checkout request must explicitly include `shipping_address` to place that value on the order. The API does not reject an omitted address, but it does not fall back to the authenticated user's saved profile address.

## End-to-end correlation map

| Produced or preserved by | Value | JSONPath | Consumer | Result |
|---|---|---|---|---|
| Register input | Registered email | Request `$.email` | Login request `email` | Works; Register response does not echo it |
| Register input | Password | Request `$.password` | Login request `password` | Works |
| Register response | User ID | `$.id` | Optional identity check | Available but not needed for authenticated calls |
| Login response | JWT | `$.token` | Profile, Cart, and Checkout bearer header | Works |
| Profile update input or verification response | Shipping address | `$.shipping_address` | Checkout request `shipping_address` | Must be passed explicitly; automatic dependency fails |
| Categories response | Category ID | `$[0].id` in this run | Match Product List `category_id` | Works |
| Products response | Product ID | `$[0].id` in this run | Product Detail path parameter | Works |
| Product Detail response | Product ID | `$.id` | Add to Cart `id` | Works |
| Product Detail response | Product name | `$.name` | Add to Cart `name` | Works |
| Product Detail response | Product price | `$.price` | Add to Cart `price` | Works |
| Checkout response | Order ID | `$.orderId` | Optional final order verification | Works |

## Dependency verdict

| Dependency | Verdict |
|---|---|
| Register email/password -> Login | Works when original input values are retained. |
| Login JWT -> authenticated profile/cart/checkout APIs | Works. |
| Profile update -> persisted profile fields | Works. |
| Saved profile shipping address -> automatic Checkout address | **Fails.** Checkout does not read it automatically. |
| Category ID -> product category selection | Works through client-side matching on `category_id`. |
| Product List ID -> Product Detail path | Works. |
| Product Detail fields -> Add to Cart body | Works directly. |
| Authenticated cart -> Checkout | Works; Checkout returned HTTP `200` for the new user. |

Final verdict: Candidate 1 works end-to-end when the registered email is preserved for Login and the shipping address is explicitly copied into the Checkout request. It does not work as an automatic “saved address” flow because that dependency is absent at runtime.
