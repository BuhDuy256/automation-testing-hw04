# FR-08 — Playwright HTML reports

Every file here carries `Run by: 23127179` + an ISO timestamp in the report title and metadata
(HW04 §6/§11). Verify any of them with:

```bash
cd automation && node scripts/verify-report-stamp.js ../out/reports/FR-08-checkout/html-report/<file>
```

| File | Run | Contents | Result |
|---|---|---|---|
| `batch-a.html` | Step 5 Batch A — **UI**, R2 + R3 | `TC-08-N01-UI` … `TC-08-N06-UI` × 3 browsers | **12 passed / 6 failed** |
| `batch-b.html` | Step 5 Batch B — **API**, R1 + R4 | `TC-08-001`, `EP-002`, `EP-003`, `N08`, `N09`, `N10` × 3 projects | **6 passed / 12 failed** |
| `batch-c.html` | Step 5 Batch C — **UI + API**, R5 + R1-UI | `TC-08-EP-004`, `TC-08-N07-UI`, `TC-08-N11-UI` × 3 projects | **3 passed / 6 failed** |

All three batches have now run. A combined FR-08 `index.html` will be added by the combined run,
following the FR-04 layout.

## Browser coverage — 24 of 45, and the split is not cosmetic

| Batch | Surface | Executions | Browser runs |
|---|---|---|---|
| A | UI-path — requests `page` | 18 | **18** |
| **B** | **API-path — never requests `page`** | 18 | **0** |
| C | mixed — 2 UI cases, 1 API case | 9 | **6** |
| **Total** | | **45** | **24** |

**Batch A**: every case drives a real browser, because R2 and R3 are both rules about the interface
and cannot be tested any other way. Nothing is deducted.

**Batch B**: no test in `checkout-api.spec.ts` requests the `page` fixture, so **no browser is
launched**. Its 18 executions run once per configured project for **matrix uniformity only** — three
identical backend results are not cross-browser evidence.

**What the honest number avoids.** FR-08's real browser coverage is **24**. Counting Batch B's 18 as
browser runs would inflate it to **42**; counting every matrix execution, including `TC-08-EP-004`'s
three, would inflate it to **45** — nearly double the truth. Both inflated figures would still be
"true" statements about how many test executions occurred, which is exactly why the distinction is
stated explicitly rather than left to the reader.

**Batch C** is mixed and is counted case by case: `TC-08-N07-UI` and `TC-08-N11-UI` drive a browser
(6 executions), `TC-08-EP-004` does not (3 excluded).

The runtimes corroborate this beyond argument: Batch B completed all 18 executions in **7.5 s**,
against Batch A's **1.1–2.9 min** for the same execution count.

## What the failures are

**All 24 failures across the three batches are assertion failures** — zero timeouts in the reported
runs, identical on all three projects. Batch A's six:

| Case | Defect | Issue |
|---|---|---|
| `TC-08-N01-UI` × 3 | `BUG-08-101` — the order total is a user-editable form field | [#4](https://github.com/BuhDuy256/automation-testing-hw04/issues/4) |
| `TC-08-N03-UI` × 3 | `BUG-08-102` — the backend stores the client-sent `total_amount` verbatim | [#5](https://github.com/BuhDuy256/automation-testing-hw04/issues/5) |

Batch B's **12** failures (`TC-08-001`, `N08`, `N09`, `N10` × 3) are all the **same** `BUG-08-102`
root cause reached through four payload shapes — issue #5 was updated, not duplicated. Its two
passes (`EP-002`, `EP-003`) show the **auth boundary is enforced**.

Batch C's **6** failures are **two distinct** defects — the same requirement (line 108) violated in
two disconnected stores, proven independent because neither fix reaches the other's cart:

| Case | Defect | Issue |
|---|---|---|
| `TC-08-EP-004` × 3 | `BUG-08-103` — the **server** cart is not cleared | [#6](https://github.com/BuhDuy256/automation-testing-hw04/issues/6) |
| `TC-08-N07-UI` × 3 | `BUG-08-104` — the **client** cart is not cleared (`clearCart` never called) | [#7](https://github.com/BuhDuy256/automation-testing-hw04/issues/7) |

`TC-08-N11-UI` passed 3/3, completing **R1** on the interface surface.

## Harness failures — fixed, and one residual environment flake

**Batch A only.** Batch B ran clean on its first invocation: 18 executions in 7.5 s, no timeouts, no
setup failures, no corrections needed — which is itself informative, since it locates Batch A's
trouble in *driving a UI under parallel load*, not in anything about FR-08.

The two categories below are kept separate on purpose: one was **our defect and is fixed**, the other
is **not ours and remains**. Neither ever reached an assertion, so neither is evidence about the SUT.

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
