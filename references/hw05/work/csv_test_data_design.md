# CSV Test-Data Design

## Scope

This design supports the selected workflow:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

The CSV contains only controlled test inputs. Values returned by the running workflow are correlated in memory and are not stored in the CSV.

## Minimum CSV schema

| Column | Purpose | Workflow consumer | Usage | Validation constraints |
|---|---|---|---|---|
| `identity_seed` | Gives each sample row a short, stable identity label. | Register, through email construction | Combined with the run ID, scenario name, k6 VU ID, and k6 iteration ID to create the email. | Required; unique in the CSV; lowercase ASCII letter first, followed by lowercase letters or digits; 1-12 characters. |
| `name` | Supplies the user's display name. | Register and Update Profile | Used directly in both request bodies. The profile still changes because `phone` and `shipping_address` start as `null`. | Required; trimmed; non-empty. |
| `password` | Supplies the credential that Register creates and Login must reuse. | Register and Login | Used directly and retained in memory between the two steps. | Required; at least 8 characters; contains an uppercase letter, lowercase letter, digit, and non-alphanumeric character. |
| `phone` | Supplies valid profile data. | Update Profile | Used directly as a string so its leading zero is preserved. | Required; matches the FR-04 rule `^0[0-9]{9,10}$`: starts with `0` and contains 10-11 digits in total. |
| `shipping_address` | Supplies the delivery address saved on the profile and sent to the order. | Update Profile and Checkout | Used directly in Update Profile, retained in memory, and used directly again in Checkout. | Required; trimmed; non-empty; CSV-quoted whenever it contains a comma, quote, or line break. |
| `quantity` | Controls how many units of the runtime-selected product are added. | Add Product to Cart and Checkout total calculation | Parsed as an integer. Checkout `total_amount` is derived as runtime product price multiplied by this value. | Required; base-10 integer greater than zero. |

No category or product preference is stored because the verified workflow can select and correlate these values safely from API responses.

## CSV-controlled inputs

- `identity_seed`
- `name`
- `password`
- `phone`
- `shipping_address`
- `quantity`

These fields express test intent. The same small dataset can be cycled with a zero-based selection such as `iterationInTest % rowCount`; cycling a row is safe because the final email also contains unique runtime identity values.

## Runtime-generated and correlated values

| Value | Source | Consumer |
|---|---|---|
| Email | Constructed before Register from the CSV seed and runtime identity tuple | Register and Login |
| Runtime user ID | Register response `$.id` or Login response `$.user.id` | Optional identity assertion only; not needed by later requests |
| JWT token | Login response `$.token` | Authorization header for Profile, Cart, and Checkout |
| Category ID | Selected from `GET /api/categories` | Match a product whose `category_id` is equal |
| Product ID from the list | Matching element from `GET /api/products` | Product Detail path parameter |
| Product ID, name, and price | Product Detail response `$.id`, `$.name`, and `$.price` | Add to Cart request |
| Total amount | Product Detail price multiplied by CSV quantity | Checkout request |
| Order ID | Checkout response `$.orderId` | Result assertion or reporting only |

`shipping_address` is intentionally not reread as an automatic Checkout dependency. It is controlled input, so the script must retain the CSV value and explicitly send the same value to both Update Profile and Checkout.

## Identity uniqueness strategy

### Decision

Derive email from a stable CSV seed plus runtime identifiers instead of storing a complete email per row.

The future k6 script should require a new `K6_RUN_ID` for every invocation and construct a lowercase email using this shape:

```text
hw05.<run_id>.<scenario>.v<vu_id_in_test>.i<iteration_in_test>.<identity_seed>@example.test
```

Example:

```text
hw05.20260817t103015123.load.v7.i42.u001@example.test
```

Rules for the components:

- `run_id` must be new for every k6 invocation, including reruns, and match `^[a-z0-9]{8,20}$`.
- `scenario` must be a short lowercase label matching `^[a-z0-9]{1,10}$`.
- Use k6's test-wide VU ID and scenario-wide iteration ID rather than row number as identity.
- Fail before traffic starts if `K6_RUN_ID` is missing or invalid; silently using a constant fallback would make reruns unsafe.

### Why this is safer

- Repeated iterations are isolated because the iteration ID changes for every scenario iteration.
- Concurrent VUs are isolated because the VU and iteration IDs are part of the identity.
- Load, Stress, and Spike can reuse the same CSV because the scenario label and run ID separate their accounts.
- A rerun without a backend restart remains safe because its required run ID differs from every earlier run.
- The strategy does not require knowing the final VU count or creating one CSV row per VU.

A fully stored email would limit safe executions to the number of prepared rows and would collide as soon as a row was reused while its account still existed.

## Field validation rules

Before the test starts, the future CSV loader must reject the dataset if any of these checks fail:

1. The header is exactly `identity_seed,name,password,phone,shipping_address,quantity`.
2. Every record has exactly six fields and no unexpected extra field.
3. `identity_seed` values satisfy their format rule and contain no duplicates.
4. `name`, `password`, `phone`, and `shipping_address` are strings and are not empty after trimming.
5. Passwords satisfy the complexity rule in the schema table.
6. Phones match `^0[0-9]{9,10}$` and remain strings after parsing.
7. Quantities contain digits only and convert to safe integers greater than zero.
8. A standards-compliant CSV parser can round-trip every value, including commas inside quoted addresses.

The phone rule comes from `eshop-sut/README.md` FR-04. The backend currently lacks equivalent validation, so the dataset must enforce the specification instead of relying on the endpoint to reject bad data.

## Sample-row interpretation

For the first row, suppose the run ID is `20260817t103015123`, the scenario is `load`, the test-wide VU ID is `7`, and the scenario-wide iteration ID is `42`.

- Register uses `Nguyen An`, the generated email `hw05.20260817t103015123.load.v7.i42.u001@example.test`, and `PerfTest123!`.
- Login reuses that exact generated email and the original password.
- Update Profile sends `Nguyen An`, `0912345678`, and `12 Nguyen Van Cu Street, District 5, Ho Chi Minh City`.
- The script selects a category and a matching product from API responses, then reads Product Detail.
- Add to Cart sends the Product Detail ID, name, and price with quantity `1`.
- Checkout sends the same CSV shipping address and computes `total_amount` as the Product Detail price multiplied by `1`.
- JWT, IDs, product fields, calculated total, and order ID exist only in runtime memory or results.

The three sample rows are for schema validation and k6 script development only; they are not workload-sized data.

## Assumptions to validate in k6

- The chosen k6 CSV parser preserves `phone` as text and correctly handles quoted commas.
- `K6_RUN_ID`, scenario name, test-wide VU ID, and scenario-wide iteration ID are available before email construction and produce the documented format.
- The generated email is accepted by Register and can be reused unchanged by Login.
- Every Categories response is non-empty and at least one Products response item matches a returned category ID; otherwise the iteration must fail without guessing an ID.
- Product Detail returns numeric `price` and Checkout accepts `price * quantity` as `total_amount`.
- The script retains the original email, password, and shipping address for later steps rather than trying to recover them from responses that do not reliably provide them.

None of these assumptions changes the CSV schema. They require checks when the k6 script is designed.
