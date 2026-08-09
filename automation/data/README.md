# Test data

One `.csv` or `.json` file per feature, named to match its test folder:

- `fr-04-profile.json` / `.csv`
- `fr-08-checkout.json` / `.csv`
- `fr-15-product-crud.json` / `.csv`

Specs read from here at runtime (e.g. via `csv-parse` or `JSON.parse`/`import`) — no inline
hardcoded arrays/objects of test data inside `*.spec.ts` files (HW04 §6).
