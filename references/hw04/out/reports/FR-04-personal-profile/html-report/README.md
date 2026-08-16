# FR-04 — Playwright HTML reports

Every file here carries `Run by: 23127179` + an ISO timestamp in the report title and metadata
(HW04 §6/§11). Verify any of them with:

```bash
cd automation && node scripts/verify-report-stamp.js ../out/reports/FR-04-personal-profile/html-report/<file>
```

| File | Run | Contents | Result |
|---|---|---|---|
| **`index.html`** | **Combined FR-04 run** — the feature-level report | **all 16 cases × 3 projects = 48 executions** | **21 passed / 27 failed** |
| `smoke.html` | Step 2 — vertical smoke | `TC-04-BVA-002-UI` × 3 browsers | 0 passed / 3 failed |
| `batch-a.html` | Step 3 Batch A | `TC-04-BVA-001/003/004/005-UI` × 3 browsers | 6 passed / 6 failed |
| `batch-b.html` | Step 3 Batch B | `TC-04-BVA-006…010-API` × 3 projects | 6 passed / 9 failed |
| `batch-c.html` | Step 3 Batch C | `TC-04-EP-001…006` × 3 projects | 9 passed / 9 failed |

`index.html` is the report to read for FR-04. The four batch files are kept as the historical
per-batch evidence that individual bug reports and GitHub issues were filed against, each one
produced from a spec frozen *before* it ran.

## Note for anyone following a link to `index.html`

Until the combined run existed, `index.html` held the Step 2 smoke report, and GitHub issue
[#1](https://github.com/BuhDuy256/automation-testing-hw04/issues/1) links to that path as
`BUG-04-101` evidence. That original file is preserved unchanged as **`smoke.html`**.

The link is **not** broken by the swap: the combined report contains the same failing case
(`TC-04-BVA-002-UI`, 3/3 browsers) plus the rest of FR-04, so it is strictly more evidence for the
same defect. `smoke.html` is retained so the exact artefact cited at filing time is still
inspectable.

## Browser-coverage caveat

Of the 16 cases, **6 are UI-path** and drive a real browser:
`TC-04-BVA-001/002/003/004/005-UI` and the UI half of `TC-04-EP-006-UI-API`. Those are the
HW04 §6 multi-browser evidence — 6 × 3 = **18 genuine browser executions**.

The other 10 cases are API-path (`APIRequestContext`) and never request Playwright's `page`
fixture, so **no browser launches** for them. They still execute once per configured project for
matrix uniformity, but three identical backend results are **not** cross-browser evidence and are
excluded from the browser-run count. The timings in `index.html` corroborate this: UI cases take
seconds, API cases tens of milliseconds.
