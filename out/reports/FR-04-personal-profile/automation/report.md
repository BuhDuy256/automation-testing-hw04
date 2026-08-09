# FR-04 — Automation Report (Personal Profile Management)

> **Status:** Step 2 (vertical smoke) complete — 1 of ≥12 cases automated.
> Steps 3 extends this to the full ≥12-case set. This file is the §14 "main report" for FR-04.
>
> | Field | Value |
> |---|---|
> | Student | Nguyen Bao Duy — 23127179 — 23KTPM2 |
> | Feature | FR-04 Personal Profile Management (Pool A) |
> | SUT surface | `frontend-web` @ `http://localhost:5173` |
> | Tool | Playwright 1.62.1 (TypeScript), Chromium / Firefox / WebKit |
> | Freeze commit | `e6cd87f` — `freeze: FR-04 smoke spec` |

---

## 1. Scope of this pass

Step 2 is a **vertical smoke**: one case driven end to end so that every HW04 §6 requirement is
exercised at once — external data, ≥3 assertion patterns, 3 browsers, a Run-by-stamped HTML
report — *before* scaling to 12+ cases. It validates the pipeline, not the feature's coverage.

| Automated | Executed | Passed | Failed | Browser runs | Confirmed defects |
|---|---|---|---|---|---|
| 1 | 3 (1 × 3 browsers) | 0 | 3 | 3 | 1 (`BUG-04-101`) |

The single failure is a **confirmed product defect**, not a test defect — see §5.

---

## 2. Case selected, and why

**`TC-04-BVA-002-UI`** — converted from HW02's frozen `TC-04-BVA-002`.

| Field | Value |
|---|---|
| Input | `phone = "0912345678"` (10 digits, leading `0`) |
| Boundary point | **min** of the valid length range |
| Oracle | `eshop-sut/README.md` FR-04 line 65 — *"Số điện thoại hợp lệ: bắt đầu bằng số `0`, từ 10–11 chữ số."* |
| Expected | Accepted: no rejection, `PUT /api/users/me` issued → 200, phone persisted as `0912345678` |
| `expected_source` | `spec` — never derived from observed behaviour |

**Why this case for the smoke:** it has a *certain* outcome (a deterministic client-side check),
it exercises the **real browser UI** as HW04 §4/§5 requires, and it sits exactly on a spec
boundary — so if the SUT and the spec disagree, the disagreement is unambiguous rather than a
matter of interpretation.

**Upgrade over HW02.** HW02's "UI-path" for this case evaluated the frontend regex directly
(`node -e "/^[1-9][0-9]{8,9}$/.test(...)"`) — it never opened a browser. HW04 drives the real
form: fill the field, click **Cập nhật**, observe the dialog, the network, and the stored value.
That is a strictly stronger test: it confirms the regex is actually reached on the submit path
and that the user-visible outcome follows from it.

---

## 3. Data-driven design

All case data lives in **`automation/data/fr-04-profile.json`**; the spec contains no inline test
data (HW04 §6). The file carries the oracle text itself, so an expected value can never be edited
without visibly editing the oracle beside it:

```json
{
  "id": "TC-04-BVA-002-UI",
  "input": { "phone": "0912345678", "shippingAddress": "12 Nguyen Van Cu, Q5, TP.HCM" },
  "expected": { "rejectedByUi": false, "putRequestIssued": true,
                "putStatus": 200, "persistedPhone": "0912345678" },
  "expectedSource": "spec — eshop-sut/README.md FR-04 line 65 (leading 0, 10-11 digits)"
}
```

## 4. The three assertion patterns (HW04 §6 requires ≥3)

| # | Pattern | In this spec | What it alone would miss |
|---|---|---|---|
| 1 | **UI state** | No dialog matching `/không hợp lệ/` may appear | Would pass if the UI silently swallowed the update |
| 2 | **Network response** | `PUT /api/users/me` must be issued and return `200` | Would pass if the request were sent but the write lost |
| 3 | **Persisted round-trip** | Independent `GET /api/users/me` must return `0912345678` | Would pass if the UI merely *looked* correct |

They are **soft** (`expect.soft`), so a single run reports every way the spec was violated rather
than stopping at the first — which is what made the full impact chain visible in §5.

---

## 5. Result — real-defect gate

All 3 browser runs failed **identically**. Applying the gate (*is this a test defect or a product
defect?*):

**Observed**

```
Error: spec-valid phone "0912345678" (10 digits, leading 0) was rejected by the client-side
       check; FR-04 line 65 says it is valid
  Expected: []
  Received: ["Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số."]

Error: no PUT /api/users/me was issued — the update never reached the backend
  Received: null

Error: phone was not persisted as the spec-valid value
  Expected: "0912345678"   Received: null
```

**Analysis.** `frontend-web/src/pages/Profile.jsx:43` guards submission with
`/^[1-9][0-9]{8,9}$/`. That pattern requires the **first digit to be 1–9**, i.e. it rejects every
number beginning with `0` — the exact inverse of the spec's *"bắt đầu bằng số 0"*. Evaluated
against the whole HW02 boundary set:

| Value | Digits | Spec class | Frontend regex |
|---|---|---|---|
| `0912345678` | 10, leading 0 | **valid** | ✗ rejected |
| `09123456789` | 11, leading 0 | **valid** | ✗ rejected |
| `091234567` | 9, leading 0 | invalid | ✗ rejected |
| `091234567890` | 12, leading 0 | invalid | ✗ rejected |
| `1912345678` | 10, leading 1 | invalid | ✓ **accepted** |

The regex accepts exactly the class the spec forbids and rejects both classes it permits.

**Cross-check — is the whole system wrong, or only the UI?** Executed the same value straight at
the backend with a fresh account:

```
PUT /api/users/me  {"phone":"0912345678"}  →  {"message":"Profile updated"}
GET /api/users/me                          →  phone="0912345678"
```

The backend **accepts and stores it correctly**. The defect is therefore **frontend-only**: the
client-side guard blocks a value the server is perfectly willing to persist.

**Verdict: CONFIRMED PRODUCT DEFECT** (`BUG-04-101`). The test typed a spec-valid value into the
correct field and pressed the correct button; nothing about the automation is wrong. **The
assertion was not weakened** — per plan §2 rule 1 and §5.2, an assertion that exposes a real
defect stays red and the finding goes to the bug report.

---

## 6. Human review of the AI-generated script (HW04 §6)

Reviewed before the first run — findings and fixes:

| # | Finding | Why the AI missed it | Fix |
|---|---|---|---|
| 1 | **`getByLabel` would not work.** The obvious locator for a field labelled *"Số điện thoại"* fails: `Profile.jsx:137` renders `<label>` as a **sibling** of `<input>`, with no `for`/`id`, `aria-label`, or nesting — so nothing associates them. | Feature characteristic. An AI reasoning from the *rendered text* assumes a visible label is a programmatic label; only reading the JSX reveals it is not. | Used `getByPlaceholder('VD: 0912345678')` — unique on the page and still a semantic locator, not a CSS/structural hack (arch §3.3 order). Recorded as the reason the label path is unavailable. |
| 2 | **A `waitForResponse` would hang the test.** The natural way to assert the network call is to await the PUT — but when validation blocks, **no request is ever sent**, so the await would simply time out and report a timeout, hiding *why*. | Prompt/model limitation: the AI wrote the happy path first and did not reason about the failing branch changing the *shape* of the observation. | Captured it as a value (`.catch(() => null)`) and asserted on that value, so "no request was made" is reported as a specific, readable failure rather than an opaque timeout. |
| 3 | **Unused data field.** `shippingAddress` was declared in the JSON case but never filled by the spec — data and behaviour silently diverging. | Attention gap between artefacts written in separate passes. | Spec now fills the address too, so `phone` is genuinely the only spec-relevant variable. |
| 4 | **Typecheck failure.** `addInitScript`'s callback runs in the browser and references `window`/`localStorage`, but `tsconfig.lib` had no `DOM`. | Environment characteristic, invisible until a typecheck is actually run. | Added `DOM` to `lib`; `npx tsc --noEmit` now exits 0. Caught **before** the freeze commit. |
| 5 | **Login coupling risk.** Driving the login form would tie every FR-04 test to `Login.jsx`, whose inputs have no `type`/`name`/`id` at all — an FR-02 regression would then masquerade as an FR-04 failure. | Reasonable default (log in like a user) that is wrong once the test's *subject* is considered. | `utils/session.ts` seeds the same `localStorage` token the app itself reads (`AuthContext.jsx:8`); the app still performs its own authenticated fetch, so the session is genuine. |

**Not changed after seeing results:** nothing. The only post-run edits were to *reports*, never to
an assertion or an expected value.

---

## 7. Evidence

| Artefact | Path |
|---|---|
| Multi-browser HTML report (`Run by: 23127179` + ISO) | `../html-report/index.html` |
| Failure screenshot (chromium) | `../bug-reports/evidence/BUG-04-101-profile-form-chromium.png` |
| Bug report | `../bug-reports/report.md` |
| Spec (frozen before run) | `automation/tests/fr-04-profile/phone-boundary.spec.ts` @ `e6cd87f` |
| Data | `automation/data/fr-04-profile.json` |

Report stamp verified with `npm run verify:report` — 5/5 PASS on both the working report and the
copy stored here.

---

## 8. Cases not automated

None yet — Step 2 scope is deliberately one case. Step 3 selects ≥12 from FR-04's 16 HW02 cases
and will list, with reasons, any that cannot be automated (HW04 §6).
