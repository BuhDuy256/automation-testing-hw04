# FR-15 Postman implementation — `POST /api/products`

Working inputs for `ACT-PM-01`. The suite contains all 54 reviewed-usable AI-origin cases and the five
student-selected HUMAN extensions, for 59 executable cases.

| File | Purpose |
|---|---|
| `FR15-products.postman_collection.json` | Canonical Postman v2.1 collection with data-driven and optional stateful phases. |
| `FR15-products.postman_environment.json` | Base URL, student id, accounts, synthetic expired-admin and missing-role JWT fixtures, and runtime slots. |
| `FR15-products.postman_data.json` | One row per reviewed-usable canonical case. |
| `FR15-target-authorization.postman_data.json` | Five representative authorization cases for clean reproduction. |
| `FR15-target-validation.postman_data.json` | Six representative validation cases for clean reproduction. |
| `build.mjs` | Validates registry/config parity and regenerates the three Postman artifacts. |

Every direct request receives `X-Student-Id: 23127179` through the collection pre-request script.
Every asynchronous cleanup helper carries the same header explicitly. The two synthetic JWTs are
test-input fixtures only; no product oracle is derived from implementation code.

The collection never asserts an undocumented status or response schema for `POST /api/products`.
It asserts documented persistence and authorization invariants, logs pure observations as `SPEC GAP`,
keeps SEC-04 UI evidence separate, and states that black-box behavior cannot prove SEC-05 internals.

`FR15-AI-043`, `FR15-AI-044`, `FR15-H-003`, and `FR15-H-004` activate optional multi-step phases.
All other rows use the same baseline, selected request, authoritative read-back, and cleanup flow.
Created products are removed after each iteration; changed baseline rows are restored and verified.

Rebuild:

```bash
node work/postman/fr15/build.mjs
```

Official execution must use `scripts/hw06/run-newman.mjs` after this implementation is committed.
