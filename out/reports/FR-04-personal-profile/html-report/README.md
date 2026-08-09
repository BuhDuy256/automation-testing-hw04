# FR-04 — Playwright HTML reports

Every file here carries `Run by: 23127179` + an ISO timestamp in the report title and metadata
(HW04 §6/§11). Verify any of them with:

```bash
cd automation && node scripts/verify-report-stamp.js ../out/reports/FR-04-personal-profile/html-report/<file>
```

| File | Run | Contents | Result |
|---|---|---|---|
| `index.html` | Step 2 — vertical smoke | `TC-04-BVA-002-UI` × 3 browsers | 0 passed / 3 failed |
| `batch-a.html` | Step 3 Batch A | `TC-04-BVA-001/003/004/005-UI` × 3 browsers | 6 passed / 6 failed |
| `batch-b.html` | Step 3 Batch B | `TC-04-BVA-006…010-API` × 3 projects | 6 passed / 9 failed |
| `batch-c.html` | Step 3 Batch C | `TC-04-EP-001…006` × 3 projects | 9 passed / 9 failed |

## Why `index.html` is still the Step 2 report

It is **not** the latest run, deliberately:

1. GitHub issue [#1](https://github.com/BuhDuy256/automation-testing-hw04/issues/1) links to it as
   the evidence for `BUG-04-101`; silently replacing its contents would invalidate a filed bug's
   evidence link.
2. No single run so far covers all of FR-04 — each file is one batch. Promoting any one of them to
   "the" report would misrepresent coverage.

**Planned:** once Batch C is frozen and the whole FR-04 suite runs together, that combined run
becomes `index.html`, and the per-batch files are kept as the historical evidence each bug report
and issue already points at.

## Browser-coverage caveat for `batch-b.html`

Batch B cases are API-path (`APIRequestContext`) and never request Playwright's `page` fixture, so
**no browser is launched**. They execute once per configured project for matrix uniformity, and
the three identical results are **not** cross-browser evidence. HW04 §6's multi-browser
requirement is carried by the UI cases in `index.html` and `batch-a.html`.
