# FR-08 execution triage — `RUN-20260823080014785-fr08-canonical-full-suite`

Derived analysis. Raw evidence in `work/runs/RUN-20260823080014785-fr08-canonical-full-suite/`
(`newman-report.json`, `newman-report.html`, `stdout.log`, `metadata.json`) outranks this file.

## Run facts

| Fact | Value |
|---|---|
| Collection | `work/postman/fr08/FR08-checkout.postman_collection.json` (committed in `ec6db5d`, before execution) |
| Hostname verified | `localhost:3000` on every request |
| Iterations | 56 (one per canonical executable case) |
| Requests | 438, none failed at transport level |
| Assertions | 422 total, 19 failed |
| Newman exit code | 1 — preserved, not suppressed |
| `X-Student-Id: 23127179` | present on 438/438 executed requests, enforced by the runner |
| Case mapping | 56/56 mapped from the raw JSON; 37 PASS, 19 FAIL |

## Failure classification

All 19 failures are genuine assertion failures against source-grounded oracles. **No harness defect,
no setup or state contamination, no blocked execution, and no `SPEC GAP` case was turned into a
failure.**

| Category | Count | Cases |
|---|---:|---|
| Genuine failure → bug candidate 1 (client total persisted verbatim) | 16 | FR08-AI-002, 003, 004, 005, 006, 007, 009, 010, 011, 030, 035, 041, 042, 044, 046, FR08-H-001 |
| Genuine failure → bug candidate 2 (cart not cleared) | 1 | FR08-AI-031 |
| Genuine failure → both candidates combined | 2 | FR08-AI-040, FR08-H-005 |
| Harness defect | 0 | — |
| Setup / state contamination | 0 | — |
| `SPEC GAP` observation recorded without failing | 0 failures | e.g. FR08-AI-043 (malformed JSON → 400, no order), FR08-AI-013/014/015/016/017 (address partitions) |
| Blocked execution | 0 | — |

### Bug candidate 1 — `BUG-CANDIDATE-FR08-CLIENT-TOTAL`

The persisted order total equals whatever the client sent. Observed persisted values against a cart
the server itself reported as 200000: `1000`, `9999000`, `0`, `-200000`, `199999.99`,
`999999999999`, `1` (from boolean `true`), `NaN`/`NULL` (from `"abc"`, `"1 OR 1=1"`, an omitted
field, `{}`, no body, and a top-level array). `FR08-AI-035` persisted 200000 from an empty cart whose
derived total was 0, and `FR08-H-001` persisted a stale 200000 against a cart the server reported as
250000. This contradicts the explicit README FR-08 rule that the backend recalculates the total and
does not accept the client value.

### Bug candidate 2 — `BUG-CANDIDATE-FR08-CART-NOT-CLEARED`

After a successful checkout the cart still contained the purchased line, contradicting the explicit
README FR-08 rule that the cart is cleared after a successful checkout. The stale line then polluted
the next checkout in `FR08-AI-040` and `FR08-H-005`, where the server-observed pre-checkout cart was
250000 instead of the rebuilt 50000.

## Evidence limitation that the PASS count does not show

Because no server-side derivation happens at all, the cases whose client-supplied total happens to
equal the cart-derived total pass without proving that any derivation occurred — including
`FR08-AI-001`, `FR08-AI-008`, `FR08-AI-033`, `FR08-AI-034`, `FR08-AI-051`, `FR08-AI-053`,
`FR08-H-002` and `FR08-H-004`. Their PASS means "the persisted total matched the server-observed cart
total", which under bug candidate 1 is satisfied by echoing the client value. This must not be read
as evidence that checkout computes the total from the cart.

The same applies to `FR08-H-002`: cross-user isolation cannot be distinguished from client echo while
bug candidate 1 stands.

## Notable non-failing observations

- `FR08-AI-057` (validly signed but expired JWT) → `403 Forbidden`, no order created, cart unchanged.
  The expired-token partition is genuinely closed.
- `FR08-AI-019`/`020`/`021`/`022`/`023` → refused, no order created. Authentication holds.
- `FR08-AI-027` (client `status: "delivered"`) → the persisted status was recorded from the run, not
  assumed; see `stdout.log`.
- `FR08-H-004` (cart line for the nonexistent product id 9999) → the cart endpoint accepted the ghost
  line and checkout proceeded, so the case reached `POST /api/checkout` and no execution limitation
  had to be recorded.
- `FR08-AI-028` and `FR08-AI-029`/`030` logged their SEC-04 UI and SEC-05 black-box evidence
  boundaries in the run console, so neither is claimed as proved.

## Repairs applied

None were needed. A pre-execution harness smoke fixture
(`work/fixtures/newman-runs/RUN-20260823075824705-fr08-harness-smoke`) exercised every optional
phase — second user, second checkout, cart rebuild, raw malformed body, seeded-account expired token
— and surfaced no harness defect, so no oracle, setup step, or expectation was changed after seeing
results.
