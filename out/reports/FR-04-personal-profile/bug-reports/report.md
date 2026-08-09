# FR-04 — Bug Report

> Defects confirmed through the real-defect gate during automated execution.
> Found by: Nguyen Bao Duy (23127179). SUT: EShop `frontend-web`.
> Numbering starts at `BUG-04-101` to avoid colliding with HW02's `BUG-04-001..004`.

| ID | Title | Severity | Priority | Status |
|---|---|---|---|---|
| `BUG-04-101` | Profile form rejects every spec-valid phone number (client-side regex is the inverse of the spec) | **High** | High | Confirmed |

---

## BUG-04-101 — Profile form rejects every spec-valid phone number

| Field | Value |
|---|---|
| **Feature** | FR-04 Personal Profile Management |
| **Component** | `frontend-web/src/pages/Profile.jsx:43` |
| **Found by** | `TC-04-BVA-002-UI` (automated, Playwright) |
| **HW02 lineage** | `TC-04-BVA-002` |
| **Severity** | **High** — the phone field of FR-04 is unusable through its intended interface for *every* valid input; no workaround exists for a user |
| **Priority** | High |
| **Reproducible** | 3/3 browsers (Chromium, Firefox, WebKit), 100% |
| **Environment** | `frontend-web` @ `localhost:5173`, backend @ `localhost:3000`, commit `85af3ba` |

### Expected (oracle)

`eshop-sut/README.md` — FR-04, line 65:

> **Số điện thoại hợp lệ**: bắt đầu bằng số `0`, từ 10–11 chữ số.
> *(A valid phone number starts with `0` and is 10–11 digits.)*

Therefore `0912345678` (10 digits, leading `0`) **is valid and must be accepted**.

### Actual

The form rejects it with:

```
Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số.
```

No `PUT /api/users/me` is issued, and the phone is never stored (`phone = null` on read-back).

### Steps to reproduce

1. Register and log in as any user.
2. Go to `/profile`.
3. Enter `0912345678` in **Số điện thoại**, and any address.
4. Click **Cập nhật**.
5. Observe the rejection alert; check the network tab — no `PUT /api/users/me`.
6. `GET /api/users/me` — `phone` is unchanged.

### Root cause

```js
// frontend-web/src/pages/Profile.jsx:43
if (!/^[1-9][0-9]{8,9}$/.test(phone)) {
  alert("Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số.");
  return;
}
```

`[1-9]` requires the **first digit to be 1–9**, i.e. it rejects any number starting with `0` —
the exact inverse of the spec's *"bắt đầu bằng số `0`"*. Since every Vietnamese mobile number
begins with `0`, no real phone number can be saved. Behaviour across the boundary set:

| Value | Digits | Spec class | Frontend regex | Agrees with spec? |
|---|---|---|---|---|
| `0912345678` | 10, leading `0` | **valid** | rejected | ✗ |
| `09123456789` | 11, leading `0` | **valid** | rejected | ✗ |
| `091234567` | 9, leading `0` | invalid | rejected | ✓ (right result, wrong reason) |
| `091234567890` | 12, leading `0` | invalid | rejected | ✓ (right result, wrong reason) |
| `1912345678` | 10, leading `1` | invalid | **accepted** | ✗ |

The regex accepts exactly the class the spec forbids, and rejects both classes it permits. The two
"agreements" are incidental — those values are rejected by the leading-digit clause, not the
length clause.

### Scope — frontend only

The backend accepts and persists the same value correctly:

```
PUT /api/users/me  {"phone":"0912345678"}  →  200 {"message":"Profile updated"}
GET /api/users/me                          →  phone = "0912345678"
```

So the data layer is correct and the client-side guard alone blocks the user. A fix is confined to
`Profile.jsx`.

### Secondary defect in the same statement

The alert text says **"9-10 chữ số"** while the spec says **10–11**. Even taken on its own terms
the message is wrong, and it actively misleads the user into entering a number the spec considers
invalid.

### Suggested fix

```js
if (!/^0[0-9]{9,10}$/.test(phone)) {
  alert("Số điện thoại không hợp lệ. Vui lòng nhập số bắt đầu bằng 0, gồm 10-11 chữ số.");
  return;
}
```

`^0` matches the spec's leading-zero rule; `[0-9]{9,10}` gives a total length of 10–11 digits.

### Evidence

- `evidence/BUG-04-101-profile-form-chromium.png` — the form with the spec-valid value entered
  under an isolated test account, update refused. *(The native `alert` dialog is not part of the
  page and cannot appear in a screenshot; its exact text is captured verbatim by the automated
  assertion, quoted above.)*
- Multi-browser HTML report: `../html-report/index.html` (carries `Run by: 23127179` + ISO).
- Automated case: `automation/tests/fr-04-profile/phone-boundary.spec.ts`, frozen at `e6cd87f`
  **before** execution.

### GitHub issue

_Not yet filed — pending confirmation before posting publicly._
