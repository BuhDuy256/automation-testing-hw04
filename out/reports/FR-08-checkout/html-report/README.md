# FR-08 — Playwright HTML reports

Every file here carries `Run by: 23127179` + an ISO timestamp in the report title and metadata
(HW04 §6/§11). Verify any of them with:

```bash
cd automation && node scripts/verify-report-stamp.js ../out/reports/FR-08-checkout/html-report/<file>
```

| File | Run | Contents | Result |
|---|---|---|---|
| `batch-a.html` | Step 5 Batch A | `TC-08-N01-UI` … `TC-08-N06-UI` × 3 browsers | **12 passed / 6 failed** |

Batches B and C are not yet automated; a combined FR-08 `index.html` will be added once all three
have run, following the FR-04 layout.

## Browser coverage — all 18 executions are genuine

Unlike FR-04, **every** case in this batch is UI-path and requests Playwright's `page` fixture, so
all **6 cases × 3 browsers = 18 executions launch a real browser**. Nothing here rides the project
matrix without exercising it, and nothing is excluded from the browser-run count.

That is a property of what R2 and R3 *are*: both are rules about the interface, so neither can be
tested any other way. FR-08's API-path cases live in Batch B, and those will be counted separately
and honestly when they run.

## What the 6 failures are

All six are **assertion** failures, stable and identical across all three browsers:

| Case | Defect | Issue |
|---|---|---|
| `TC-08-N01-UI` × 3 | `BUG-08-101` — the order total is a user-editable form field | [#4](https://github.com/BuhDuy256/automation-testing-hw04/issues/4) |
| `TC-08-N03-UI` × 3 | `BUG-08-102` — the backend stores the client-sent `total_amount` verbatim | [#5](https://github.com/BuhDuy256/automation-testing-hw04/issues/5) |

## Harness failures — fixed, and one residual environment flake

These are kept separate on purpose: one category was **our defect and is fixed**, the other is
**not ours and remains**. Neither ever reached an assertion, so neither is evidence about the SUT.

**Fixed — harness defects in the test code.** Both were diagnosed and corrected, not tolerated:

| Defect | Fixed in |
|---|---|
| Test budget too small for a batch where all 18 executions are browser-heavy | `bbe6361` |
| **Swallowed client-side navigation click** — a click issued while React was re-rendering from the preceding `addToCart` was lost, leaving the app on the storefront | `70d2636` |

The swallowed click was **our bug in `utils/checkout.ts`**, not an environment problem: the helper
clicked once and assumed the route had changed. It is now retried until the URL actually changes.
One residual occurrence appeared in the first run after that fix and has not recurred in the three
runs since.

**Residual environment flake — not ours, not fixed.** Firefox in this environment shows intermittent
Playwright **driver** instability:

```
browserContext.close: Protocol error (Browser.removeBrowserContext):
can't access property "_maybeDontRestoreTabs", this._windows[aWindow.__SSi] is undefined
```

This is a crash in **context teardown**, after the test body has finished — it is a Playwright/Firefox
driver fault with no test-code remedy, so it is recorded rather than chased.

**Run history after both fixes:** four runs, all with the same six assertion failures. Two were clean
at **12 / 6**; one carried the residual navigation failure noted above and one carried the teardown
crash. The product result was identical in every case — which is the point of separating harness
failures from assertion failures rather than reporting a single pass rate.
