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

## Known environment flake — read before comparing runs

Firefox in this environment shows **intermittent Playwright driver instability that is unrelated to
the SUT and never touches an assertion**. Two distinct signatures were observed across six runs:

- `browserContext.close: Protocol error (Browser.removeBrowserContext): can't access property "_maybeDontRestoreTabs"` — a crash during **context teardown**, after the test body finished.
- a swallowed client-side navigation click, addressed in the second post-run correction.

Four consecutive post-fix runs produced the same **12 / 6** with the same six assertion failures;
two of those four additionally carried one firefox infrastructure failure. The product result is
unaffected either way, and the flake is recorded rather than papered over — the run counts in the
report are the ones actually observed.
