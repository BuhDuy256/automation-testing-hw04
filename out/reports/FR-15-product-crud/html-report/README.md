# FR-15 — Playwright HTML reports

Every file here carries `Run by: 23127179` + an ISO timestamp in the report title and metadata
(HW04 §6/§11). Verify any of them with:

```bash
cd automation && node scripts/verify-report-stamp.js ../out/reports/FR-15-product-crud/html-report/<file>
```

| File | Run | Contents | Result |
|---|---|---|---|
| `batch-a.html` | Step 6 Batch A — **API**, P2 + P3 | `TC-15-EP-002/003`, `TC-15-BVA-002/003/004/005` × 3 projects | **3 passed / 15 failed** |
| `batch-b.html` | Step 6 Batch B — **API**, P1 + P3 + P4 + P5 | `TC-15-BVA-006-API/007/009`, `TC-15-EP-001`, `TC-15-N01-API`, `TC-15-EP-010` × 3 projects | **12 passed / 6 failed** |

Batch C is not yet automated. A combined FR-15 `index.html` will be added once all three have run,
following the FR-04 and FR-08 layout.

## Browser coverage — Batches A and B both contribute **zero**

Neither `product-constraints-api.spec.ts` nor `product-lifecycle-api.spec.ts` requests Playwright's
`page` fixture, so **no browser is launched by either**. Their 36 executions run once per configured
project for **matrix uniformity only** — three identical backend results are not cross-browser
evidence. The wall times corroborate it: 14.6–18.6 s for Batch A's 18 and **6.1 s** for Batch B's.

**FR-15 so far: 36 executions, 0 browser runs.**

FR-15's browser coverage will come entirely from **Batch C's two UI cases** against the admin panel
(2 × 3 = 6 executions).

## What the failures are

**All 21 failures across Batches A and B are assertion** failures — 15 from Batch A and 6 from
Batch B — stable across consecutive runs and identical on all three projects. They split across
**three** distinct root causes:

| Batch | Cases | Executions | Defect | Issue |
|---|---|---|---|---|
| A | `EP-002`, `EP-003`, `BVA-003`, `BVA-004`, `BVA-005` × 3 | **15** | `BUG-15-101` — `POST /api/products` performs no input validation | [#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8) |
| B | `BVA-009` × 3 | **3** | `BUG-15-103` — `category_id` is never checked against existing categories | [#10](https://github.com/BuhDuy256/automation-testing-hw04/issues/10) |
| B | `BVA-006-API` × 3 (view half) | **3** | `BUG-15-102` — detail and list endpoints disagree about the same product's price | [#9](https://github.com/BuhDuy256/automation-testing-hw04/issues/9) |

The three are **not** variations of one fault: `BUG-15-101` is missing format/presence validation on
the write path, `BUG-15-103` is missing referential integrity against another table, and `BUG-15-102`
is a read-path transformation. No single fix delivers the other two.

**Batch B's four passes carry the argument.** A valid create round-trips, a valid category is stored,
delete removes the row, and editing one product leaves its sibling byte-identical. The write path
demonstrably **works** — so the failures above are *absent guards*, not a broken endpoint, which is
what makes every recommended fix a validation step rather than a rewrite.

## Read this alongside §11 of the automation report

The **first** run of this batch returned 5 passed / 13 failed, because a strict-equality assertion
could not see a value the SUT returned as a string rather than a number. That was a **test defect
producing a false pass**, fixed in `4dc1cd3` before the run recorded here — and diagnosing it
surfaced a second genuine product defect,
[`BUG-15-102`](https://github.com/BuhDuy256/automation-testing-hw04/issues/9). The full account is in
§11 of `../automation/report.md`; it is the most useful thing this batch produced.
