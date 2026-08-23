# FR-15 Postman submission package

This folder contains the final executable inputs for all 59 reviewed FR-15 cases.

| File | Purpose |
|---|---|
| `FR15-products.postman_collection.json` | Canonical Postman v2.1 collection with data-driven and optional stateful phases. |
| `FR15-products.postman_environment.json` | Base URL, student ID, test accounts, synthetic JWT fixtures, and runtime slots. |
| `FR15-products.postman_data.json` | One row per reviewed-usable canonical case. |
| `FR15-target-authorization.postman_data.json` | Representative authorization cases for clean reproduction. |
| `FR15-target-validation.postman_data.json` | Representative validation cases for clean reproduction. |

Every direct request receives `X-Student-Id: 23127179` through the collection pre-request script, and asynchronous cleanup helpers carry the same header explicitly. The collection asserts documented persistence and authorization invariants, records unspecified behavior as `SPEC GAP`, keeps SEC-04 display evidence separate, and does not claim that black-box behavior proves SEC-05 internals.

The repository builder and official execution harness are available in the [public HW06 branch](https://github.com/BuhDuy256/automation-testing-hw04/tree/hw06-api-testing); they are not required to inspect or import this standalone final package.
