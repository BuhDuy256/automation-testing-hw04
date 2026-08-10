# FR-15 — Playwright HTML reports

Every file here carries `Run by: 23127179` + an ISO timestamp in the report title and metadata
(HW04 §6/§11). Verify any of them with:

```bash
cd automation && node scripts/verify-report-stamp.js ../out/reports/FR-15-product-crud/html-report/<file>
```

| File | Run | Contents | Result |
|---|---|---|---|
| `batch-a.html` | Step 6 Batch A — **API**, P2 + P3 | `TC-15-EP-002/003`, `TC-15-BVA-002/003/004/005` × 3 projects | **3 passed / 15 failed** |

Batches B and C are not yet automated. A combined FR-15 `index.html` will be added once all three
have run, following the FR-04 and FR-08 layout.

## Browser coverage — Batch A contributes **zero**

No test in `product-constraints-api.spec.ts` requests Playwright's `page` fixture, so **no browser is
launched**. Its 18 executions run once per configured project for **matrix uniformity only** — three
identical backend results are not cross-browser evidence. The 14.6–18.6 s wall time for all 18
corroborates this.

FR-15's browser coverage will come entirely from **Batch C's two UI cases** against the admin panel
(2 × 3 = 6 executions).

## What the failures are

All 15 are **assertion** failures, stable across two consecutive runs and identical on all three
projects. They collapse to **one** root cause:

| Cases | Defect | Issue |
|---|---|---|
| `EP-002`, `EP-003`, `BVA-003`, `BVA-004`, `BVA-005` × 3 | `BUG-15-101` — `POST /api/products` performs no input validation | [#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8) |

`TC-15-BVA-002` (255-character name) **passed** 3/3: the create path stores a long name in full, so
the fault is *absent validation*, not a broken write.

## Read this alongside §11 of the automation report

The **first** run of this batch returned 5 passed / 13 failed, because a strict-equality assertion
could not see a value the SUT returned as a string rather than a number. That was a **test defect
producing a false pass**, fixed in `4dc1cd3` before the run recorded here — and diagnosing it
surfaced a second genuine product defect,
[`BUG-15-102`](https://github.com/BuhDuy256/automation-testing-hw04/issues/9). The full account is in
§11 of `../automation/report.md`; it is the most useful thing this batch produced.
