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
| `batch-c.html` | Step 6 Batch C — **API + UI**, P6 + P5-UI + P1-UI | `TC-15-EP-006/007/008/009-API`, `TC-15-EP-011-UI`, `TC-15-N02-UI` × 3 projects | **3 passed / 15 failed** |

All three batches have now run. A combined FR-15 `index.html` will be added by the combined run,
following the FR-04 and FR-08 layout.

## Browser coverage — **6 of 54**, all of it from Batch C

| Batch | Cases | Executions | Browser runs |
|---|---|---|---|
| A | 6 API | 18 | **0** |
| B | 6 API | 18 | **0** |
| C | 4 API + **2 UI** | 18 | **6** |
| **Total** | **18 cases** | **54** | **6** |

Neither `product-constraints-api.spec.ts` nor `product-lifecycle-api.spec.ts` requests Playwright's
`page` fixture, and only two of Batch C's six cases do. Every other execution runs once per
configured project for **matrix uniformity only** — three identical backend results are not
cross-browser evidence. Wall times corroborate it: Batch A 14.6–18.6 s and Batch B **6.1 s** for 18
executions each, against Batch C's **41.2 s** once two real browsers are involved.

**Counting all 54 would overstate FR-15's browser coverage ninefold.**

FR-15's browser coverage comes entirely from **Batch C's two UI cases** against the admin panel
(2 × 3 = **6 executions**), which have now run.

## What the failures are

**All 36 failures across the three batches are assertion** failures — 15 from A, 6 from B, 15 from
C — stable across consecutive runs and identical on all three projects. They split across **five**
distinct root causes:

| Batch | Cases | Executions | Defect | Issue |
|---|---|---|---|---|
| A | `EP-002`, `EP-003`, `BVA-003`, `BVA-004`, `BVA-005` × 3 | **15** | `BUG-15-101` — `POST /api/products` performs no input validation | [#8](https://github.com/BuhDuy256/automation-testing-hw04/issues/8) |
| B | `BVA-009` × 3 | **3** | `BUG-15-103` — `category_id` is never checked against existing categories | [#10](https://github.com/BuhDuy256/automation-testing-hw04/issues/10) |
| B | `BVA-006-API` × 3 (view half) | **3** | `BUG-15-102` — detail and list endpoints disagree about the same product's price | [#9](https://github.com/BuhDuy256/automation-testing-hw04/issues/9) |
| C | `EP-006/007/008/009-API` × 3 | **12** | `BUG-15-104` — **no access control on any product write endpoint** | [#11](https://github.com/BuhDuy256/automation-testing-hw04/issues/11) |
| C | `EP-011-UI` × 3 | **3** | `BUG-15-105` — the admin panel overwrites every listed product's displayed name | [#12](https://github.com/BuhDuy256/automation-testing-hw04/issues/12) |

The five are **not** variations of one fault: `BUG-15-101` is missing format/presence validation,
`BUG-15-103` is missing referential integrity against another table, `BUG-15-102` is a read-path
transformation, `BUG-15-104` is absent access-control middleware, and `BUG-15-105` is frontend local
state. No single fix delivers any of the others.

**The six passes carry the argument.** A valid create round-trips, a valid category is stored, delete
removes the row, editing one product leaves its sibling's *stored* data byte-identical, the minimum
valid price persists, and the admin panel's create flow works end to end. Every positive operation
**works** — so each failure is a *missing guard* or a *display error*, never a broken operation,
which is what makes each recommended fix a validation step, a middleware, or a one-line state
correction rather than a rewrite.

## Read this alongside §11 of the automation report

The **first** run of this batch returned 5 passed / 13 failed, because a strict-equality assertion
could not see a value the SUT returned as a string rather than a number. That was a **test defect
producing a false pass**, fixed in `4dc1cd3` before the run recorded here — and diagnosing it
surfaced a second genuine product defect,
[`BUG-15-102`](https://github.com/BuhDuy256/automation-testing-hw04/issues/9). The full account is in
§11 of `../automation/report.md`; it is the most useful thing this batch produced.
