# FR-08 Postman implementation — `POST /api/checkout`

Working inputs for `ACT-PM-01`. Finalized copies are promoted to `out/fr08/postman/` during curation.

| File | Purpose |
|---|---|
| `FR08-checkout.postman_collection.json` | Collection v2.1. Eight items per iteration; optional phases skip themselves per row. |
| `FR08-checkout.postman_environment.json` | Base URL, student id, the expired-JWT fixture, and runtime slots. |
| `FR08-checkout.data.json` | One row per canonical executable case (56 rows). |
| `build-data.mjs` | Rebuilds the data file from the canonical registries. Fails loudly if a reviewed-usable case has no configuration or a rejected case is still configured. |

## Case coverage

The data file is derived from `work/registry/test-cases.json` filtered by
`work/registry/human-reviews.json`: 51 reviewed-usable AI-origin cases plus the five
student-selected extensions `FR08-H-001` … `FR08-H-005`, giving 56 executable cases. The six
INVALID cases (`FR08-AI-024`, `049`, `050`, `052`, `054`, `056`) are excluded by construction, and
`build-data.mjs` refuses to build if that ever stops being true.

## Harness decisions and why they were necessary

1. **A fresh registered user per case.** The implementation keeps cart state in process memory keyed
   by user id, `POST /api/cart` only appends, and no cart-clearing endpoint is documented. Reusing
   one account would make every case start from a cart polluted by earlier cases. Each iteration
   therefore registers its own account through `POST /api/register`, which is a documented supporting
   request, not an additional selected API.
2. **The expected total is never hardcoded.** Every checkout is preceded by `GET /api/cart`, and the
   expected total is computed from the cart state the server itself reports at that moment. This is
   exactly the reviewed FR-08 oracle: *the persisted total must equal the total derived from the cart
   state actually observed immediately before checkout.*
3. **No status or schema oracle.** The API specification defines no status code or response body for
   `POST /api/checkout`, so the collection asserts only that a response is observable and logs the
   actual status and body as a `SPEC GAP` observation. Documented statuses are asserted only on the
   supporting `POST /api/register` and `POST /api/login` calls, where the specification does state
   `200 OK`, and on read-back calls whose success is a precondition for verifying anything at all.
4. **`FR08-AI-057` uses the seeded account.** Its expired-token fixture is bound to user id 2
   (`test@eshop.com`), so the case logs in as that account instead of the per-case user. The fixture
   is a test input only; no expectation is taken from implementation code.
5. **Raw bodies are sent verbatim.** `FR08-AI-043` sends the exact malformed string
   `{"total_amount": 200000, "shipping_address":` and `FR08-AI-041` sends no body bytes; neither is
   re-serialised by the client.
6. **`X-Student-Id: 23127179`** is upserted by a collection-level pre-request script, added
   explicitly to every helper call made through `pm.sendRequest`, and asserted on each checkout
   request so the header presence is visible in the report itself.

## Evidence boundaries encoded in the collection

- SEC-04 (`FR08-AI-028`) logs that API-side preservation neither proves nor disproves safe UI
  escaping.
- SEC-05 (`FR08-AI-029`, `FR08-AI-030`) logs that a safe response is consistent with, but not proof
  of, parameterized queries.
- `FR08-AI-040` logs that the order endpoints expose no line-item composition, so only the persisted
  total can be compared against the rebuilt cart.
- Exploratory inputs that produce no order are logged as observations rather than asserted.

## Rebuild and preflight

```bash
node work/postman/fr08/build-data.mjs   # regenerate the data file from the canonical registries
```

Run the official execution through `node scripts/hw06/run-newman.mjs` so raw JSON, HTML, console
output, hashes, arguments, and timestamps are captured together.
