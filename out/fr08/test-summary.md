# FR-08 Test Summary (Derived)

> Generated from `work/registry/*.json` by `npm run hw06:derive`. Raw Newman evidence outranks this file.

- Selected API: POST /api/checkout
- AI-generated cases: 57
- Human-added cases: 5
- Executable cases: 56
- Executed cases: 56
- Passed cases: 37
- Failed cases: 19
- Known-bug-related failures: 19
- Other failures: 0

Arithmetic check: 37 + 19 = 56.

Evidence limitation recorded at execution time: because the implementation does not derive the total from the cart at all, cases whose client-supplied total happened to equal the cart-derived total pass without proving that any server-side derivation occurs. The passed count must not be read as evidence that checkout recalculates the total.
