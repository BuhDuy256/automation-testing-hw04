# FR-08 manual-import package for Postman Desktop

These three files exist so the FR-08 implementation can be imported and driven by hand in Postman
Desktop. They are **presentation copies**, not a second implementation.

| File | Import as | Source |
|---|---|---|
| `FR08-checkout.postman_collection.json` | Collection | `work/postman/fr08/FR08-checkout.postman_collection.json` |
| `FR08-checkout.postman_environment.json` | Environment | `work/postman/fr08/FR08-checkout.postman_environment.json` |
| `FR08-cases.postman_data.json` | **not** imported — selected as Collection Runner data | `work/postman/fr08/FR08-checkout.data.json` |

## Provenance

Canonical source hashes at the time these copies were produced:

```text
collection   sha256 7d185f739fa800f84d4433ddd7586928aabae225277e88b546984926e099de82
environment  sha256 c5ee711db7f232825763768a0b28008daf19620d620b7ede4cafa3088f279679
data         sha256 4b9e7c3824e7b78a1d15cda9271532019e062206a1bf9f6dd73a888ab6005b23
```

Differences from the canonical artifacts, and nothing else:

- collection `info.name` → `HW06 FR-08 Checkout — POST /api/checkout`, plus `info._postman_id` and a
  provenance sentence prepended to `info.description`;
- environment `name` → `HW06 FR-08 Local — localhost:3000`, plus `id`.

Everything that affects behaviour is byte-identical: collection variables, the collection-level
pre-request script, every request, every test script, and every data row. The data file carries the
same 56 reviewed executable cases used for the canonical run
`RUN-20260823080014785-fr08-canonical-full-suite`; the six INVALID cases (`FR08-AI-024`, `049`,
`050`, `052`, `054`, `056`) are excluded by construction.

No test was regenerated, no oracle was changed, and Newman was not rerun to produce these copies.

## Secrets

No credential is introduced. `casePassword` and the token slots ship empty and are filled at run time.
`expiredToken` is the synthetic validly-signed-but-expired JWT fixture that `FR08-AI-057` needs; it
was already committed in the canonical environment and in `work/postman/fr04/`, and it authorises
nothing because it is expired.

## Rebuilding

If the canonical artifacts change, rebuild these copies rather than editing them, and re-run the
package verification so the hashes above are refreshed.
