# FR-04 — Bug Report

> Defects confirmed through the real-defect gate during automated execution.
> Found by: Nguyen Bao Duy (23127179). SUT: EShop `frontend-web` + backend.
> Numbering starts at `BUG-04-101` to avoid colliding with HW02's `BUG-04-001..004`.
>
> **Combined-run confirmation (2026-08-09).** All 16 FR-04 cases were re-run together
> (`../html-report/index.html`): **48 executions, 21 passed / 27 failed, zero timeouts**. The 27
> failures collapse to exactly the three defects below — **no fourth root cause appeared**, and
> every failure reproduces identically on all 3 projects. Executions per defect: `BUG-04-101` 9,
> `BUG-04-102` 15, `BUG-04-103` 3.

| ID | Title | Severity | Priority | Status | GitHub Issue |
|---|---|---|---|---|---|
| `BUG-04-101` | Profile form rejects every spec-valid phone number, and accepts a spec-invalid one (client-side regex is the inverse of the spec) | **High** | High | Confirmed | [#1](https://github.com/BuhDuy256/automation-testing-hw04/issues/1) |
| `BUG-04-102` | `PUT /api/users/me` performs no input validation — spec-invalid `phone`, and an empty `name`, are persisted | **High** | High | Confirmed | [#2](https://github.com/BuhDuy256/automation-testing-hw04/issues/2) |
| `BUG-04-103` | **Privilege escalation** — `PUT /api/users/me` lets a user set their own `role`, and re-login mints a genuine admin JWT | **Critical** | Critical | Confirmed | [#3](https://github.com/BuhDuy256/automation-testing-hw04/issues/3) |

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
- Multi-browser HTML report: `../html-report/smoke.html` — the Step 2 run this defect was
  originally filed from. *(That report was `index.html` at filing time, which is the path GitHub
  issue #1 links to. `index.html` now holds the **combined** FR-04 run; the original artefact is
  preserved unchanged as `smoke.html`, and the link is not broken — the combined report contains
  the same failing case plus the rest of FR-04. See `../html-report/README.md`.)*
- Combined FR-04 run: `../html-report/index.html` — `TC-04-BVA-002-UI`, `TC-04-BVA-003-UI` and
  `TC-04-BVA-005-UI` all fail 3/3 browsers there, 9 executions evidencing this defect.
- Automated case: `automation/tests/fr-04-profile/phone-boundary.spec.ts`, frozen at `e6cd87f`
  **before** execution.

### GitHub issue

**[#1 — BUG-04-101: Profile form rejects every spec-valid phone number (client-side regex is the
inverse of FR-04)](https://github.com/BuhDuy256/automation-testing-hw04/issues/1)**
· filed 2026-08-09 · state: OPEN

The issue embeds the evidence screenshot inline (served from this repo at
`out/reports/FR-04-personal-profile/bug-reports/evidence/BUG-04-101-profile-form-chromium.png`)
and links the frozen spec, this report, and the multi-browser HTML report.

### Additional evidence from Step 3 Batch A (2026-08-09)

Batch A completed the 5-point boundary set through the UI and **widened this defect in both
directions** — it is the same single regex, so it is recorded here rather than as a new bug:

| Case | Value | Spec class | Result | What it adds |
|---|---|---|---|---|
| `TC-04-BVA-003-UI` | `09123456789` (11 digits, lead `0`) | **valid** | **FAIL** 3/3 browsers — rejected | The *other* valid length is rejected too, so **no** spec-valid phone is accepted |
| `TC-04-BVA-005-UI` | `1912345678` (10 digits, lead `1`) | invalid | **FAIL** 3/3 browsers — **accepted** | The inverse half: a spec-**invalid** value passes the guard |

`TC-04-BVA-001-UI` (9 digits) and `TC-04-BVA-004-UI` (12 digits) **passed** — but only
incidentally: they are rejected by the leading-digit clause, not by any length check. The regex
never enforces the spec's 10–11 length rule at all.

Both halves of the boundary set now confirm one statement: `/^[1-9][0-9]{8,9}$/` accepts exactly
the class the spec forbids and rejects both classes it permits.

Evidence: `evidence/BUG-04-101-BVA-003-11digit-rejected-chromium.png`,
Batch A report `../html-report/batch-a.html`.

---

## BUG-04-102 — `PUT /api/users/me` performs no phone validation, so a spec-invalid phone is stored

| Field | Value |
|---|---|
| **Feature** | FR-04 Personal Profile Management |
| **Component** | `backend/server.js:118-135` (`PUT /api/users/me`) |
| **Found by** | `TC-04-BVA-005-UI` (automated, Playwright) |
| **HW02 lineage** | `TC-04-BVA-010` / `TC-04-EP-004` (API-path — Batch B will test this surface directly) |
| **Severity** | **High** — invalid data enters persistent storage; survives any frontend fix |
| **Priority** | High |
| **Reproducible** | 3/3 browsers, 100% (and directly via API) |

### Why this is a separate defect from `BUG-04-101`

They share a symptom in `TC-04-BVA-005-UI` but not a cause, and **fixing `BUG-04-101` would not
fix this one**:

| | `BUG-04-101` | `BUG-04-102` |
|---|---|---|
| Component | `frontend-web/src/pages/Profile.jsx:43` | `backend/server.js:118-135` |
| Fault | regex is the inverse of the spec | **no validation exists at all** |
| Fix | correct the regex | add server-side validation |
| Remains after the other is fixed? | — | **Yes** — any direct API client still stores anything |

### Expected (oracle)

`README.md` FR-04 line 65 defines a valid phone as starting with `0`, 10–11 digits. Applied
path-agnostically (HW02's reframed oracle, `boundary-value-analysis/report.md`): the SUT **must
not end up storing** a value its own spec defines as invalid. The spec does not prescribe *how*
that is prevented — reject, coerce, or ignore are all acceptable.

### Actual

`1912345678` (leading `1` — spec-invalid) is written straight to the database and read back
unchanged:

```
Error: spec-invalid phone "1912345678" ended up stored; FR-04 line 65 defines it as invalid
expect(received).not.toBe(expected)
Expected: not "1912345678"
```

### Root cause

```js
// backend/server.js:118
app.put("/api/users/me", authenticateToken, (req, res) => {
  const { name, shipping_address, phone, role } = req.body;
  let query = "UPDATE users SET name = ?, shipping_address = ?, phone = ?";
  let params = [name, shipping_address, phone];
  // ... no validation of `phone` anywhere before the UPDATE
```

The handler destructures `phone` and passes it directly into the `UPDATE`. There is no length
check, no leading-digit check, no type check. The only guard in the entire system is the
client-side regex — which `BUG-04-101` shows is itself wrong, and which any non-browser client
bypasses entirely.

### Steps to reproduce

1. Register and log in as any user.
2. `PUT /api/users/me` with `{"name":"X","shipping_address":"Y","phone":"1912345678"}`.
3. `GET /api/users/me` → `phone` is `"1912345678"`.

(Reachable through the UI too, because `BUG-04-101`'s regex *accepts* leading-`1` values — that
is how the automated case found it.)

### Suggested fix

Validate server-side before the `UPDATE`, mirroring the spec:

```js
if (phone !== undefined && phone !== null && !/^0[0-9]{9,10}$/.test(phone)) {
  return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
}
```

Client-side validation is a usability affordance; the server is the only place that can actually
enforce the rule.

### Evidence

- `evidence/BUG-04-102-BVA-005-leading1-persisted-chromium.png` — the spec-invalid value entered
  and accepted under a fresh isolated account.
- Batch A HTML report: `../html-report/batch-a.html` (carries `Run by: 23127179` + ISO).
- Automated case: `automation/tests/fr-04-profile/phone-boundary-ui.spec.ts`, frozen at
  `8053add` **before** execution.

### Additional evidence from Step 3 Batch B (2026-08-09)

Batch B drove `PUT /api/users/me` directly for all five boundary values. It **widens this defect
substantially** — same root cause (no validation), so recorded here rather than as a new bug.

| Case | Value | Spec class | Reachable via UI? | Backend | Result |
|---|---|---|---|---|---|
| `TC-04-BVA-006-API` | `091234567` (9) | invalid | ❌ blocked by `BUG-04-101`'s regex | 200, **stored** | **FAIL** 3/3 |
| `TC-04-BVA-007-API` | `0912345678` (10) | **valid** | ❌ blocked | 200, stored | PASS |
| `TC-04-BVA-008-API` | `09123456789` (11) | **valid** | ❌ blocked | 200, stored | PASS |
| `TC-04-BVA-009-API` | `091234567890` (12) | invalid | ❌ blocked | 200, **stored** | **FAIL** 3/3 |
| `TC-04-BVA-010-API` | `1912345678` (lead `1`) | invalid | ✅ accepted | 200, **stored** | **FAIL** 3/3 |

**6 passed / 9 failed.** Independently reproduced outside Playwright against fresh accounts —
the endpoint returns **200 for every input** and stores all five verbatim:

```
phone=091234567     PUT=200  persisted="091234567"
phone=0912345678    PUT=200  persisted="0912345678"
phone=09123456789   PUT=200  persisted="09123456789"
phone=091234567890  PUT=200  persisted="091234567890"
phone=1912345678    PUT=200  persisted="1912345678"
```

**What this changes about the defect:**

1. **Every invalid class is accepted**, not just the one the frontend leaks. The original report
   evidenced only `1912345678`, because that is the sole invalid value `BUG-04-101`'s regex lets
   through. Too-short and too-long values are stored just as readily.
2. **Independence from `BUG-04-101` is now proven, not merely argued.** `BVA-006` and `BVA-009`
   fail on inputs the frontend *already rejects*, so correcting `Profile.jsx` would leave both
   failing. This is the direct evidence for the "survives any frontend fix" claim above.
3. **The write path itself is sound** — `BVA-007`/`BVA-008` store valid values correctly. The
   fault is precisely *absent validation*, which is why the fix is a guard clause, not a rewrite.

Evidence: Batch B report `../html-report/batch-b.html`; spec frozen at `5af1749` before execution.

### GitHub issue

**[#2 — BUG-04-102](https://github.com/BuhDuy256/automation-testing-hw04/issues/2)** · filed
2026-08-09 · state: OPEN · updated with the Batch B evidence above.

### Additional evidence from Step 3 Batch C (2026-08-09) — the gap is not phone-specific

`TC-04-EP-002-API` sent `name: ""` and the value was persisted verbatim (3/3 projects):

```
Error: name ended up persisted as "", which accepted assumption A2 defines as invalid
expect(received).not.toBe(expected)   Expected: not ""
```

Same handler, same absent-validation fault, **different field** — so this is recorded here rather
than as a new bug. One guard clause in `server.js:118-135` fixes both. The defect is therefore
"no input validation", not "no *phone* validation"; the title above has been widened accordingly.

**Evidence-strength note, stated plainly:** the phone findings rest on a **direct spec line**
(README FR-04 line 65). The empty-`name` finding rests on **accepted assumption A2**
(`{source: spec, confidence: MED, status: accepted}`) — HW02 reasoned that a profile cannot have a
blank name, since `name` is mandatory at registration (FR-01) with no stated exception. That is a
defensible but *weaker* basis than a quoted requirement, and it is flagged here so the two are not
treated as equally grounded.

`TC-04-EP-004-API` also failed 3/3 with the same phone finding; it **converges by design** with
`TC-04-BVA-010-API` (same input, same assertion — see the automation report §14 finding 19) and
adds no independent evidence.

---

## BUG-04-103 — Privilege escalation: a user can make themselves admin via `PUT /api/users/me`

| Field | Value |
|---|---|
| **Feature** | FR-04 Personal Profile Management |
| **Component** | `backend/server.js:124-127` (`PUT /api/users/me`) |
| **Found by** | `TC-04-EP-005-API` (automated, Playwright) |
| **HW02 lineage** | `TC-04-EP-005` |
| **Severity** | **Critical** — complete vertical privilege escalation, self-service, no admin involvement |
| **Priority** | Critical |
| **Reproducible** | 3/3 projects, 100%, and directly via API |

### Why this is a distinct defect, not part of `BUG-04-102`

`BUG-04-102` is *missing validation of a user's own data* — bad data, one user's row.
This is *an authorisation boundary being writable by the client* — a security control, not a
format check. Different fault class, different severity, different fix:

| | `BUG-04-102` | `BUG-04-103` |
|---|---|---|
| Fault | no format validation | a **privilege field is client-writable** |
| Blast radius | the caller's own profile data | **the whole admin surface** |
| Fix | add a validation guard | **stop accepting `role` from the request body at all** |
| Basis | README line 65 / assumption A2 | README line 67 **and SEC-06 (line 283)** |

### Expected (oracle)

- `README.md` line 67: *"Người dùng chỉ có thể cập nhật hồ sơ của chính mình; **không thể tự thay
  đổi thuộc tính `role`**."*
- `README.md` line 283, **SEC-06**: *"API cập nhật hồ sơ **không được cho phép thay đổi trường
  `role` từ client**."*

Both state the rule directly — this finding needs no assumption.

### Actual

```
Error: a client-supplied role="admin" changed the stored role. README line 67 says a user
       cannot change their own role, and SEC-06 (line 283) says the profile update API must
       not allow the client to change it
expect(received).toBe(expected)
Expected: "user"   Received: "admin"
```

### Exploitability — verified end to end, outside Playwright

The stored value is not merely cosmetic. A fresh account escalates itself and then obtains a
**genuine admin JWT**:

```
1. role in ORIGINAL token:          user
2. stored role after self-update:   admin     <- PUT /api/users/me {"role":"admin"}
3. role in NEW token after re-login: admin    <- the server signs role=admin into the JWT
```

Step 3 is what makes this Critical rather than a data-integrity bug: the escalated role is minted
into a legitimately signed token, so any component that trusts `role` from the JWT — which
`README.md` line 179 and SEC-03 specify as the admin gate — will treat the account as an
administrator.

### Steps to reproduce

1. Register any ordinary account and log in.
2. `PUT /api/users/me` with `{"name":"X","shipping_address":"Y","phone":"0912345678","role":"admin"}`.
3. `GET /api/users/me` → `role` is now `"admin"`.
4. Log in again → the new JWT payload contains `"role":"admin"`.

### Root cause

```js
// backend/server.js:119-127
const { name, shipping_address, phone, role } = req.body;   // `role` read from the CLIENT
let query = "UPDATE users SET name = ?, shipping_address = ?, phone = ?";
let params = [name, shipping_address, phone];

if (role) {                       // <-- any truthy client value is applied
  query += ", role = ?";
  params.push(role);
}
```

The handler deliberately destructures `role` from `req.body` and appends it to the `UPDATE`
whenever it is truthy. There is no check that the caller is an admin, and no allow-list of
updatable fields.

### Suggested fix

Do not read `role` from the request body at all:

```js
const { name, shipping_address, phone } = req.body;   // `role` is never client-supplied
const query = "UPDATE users SET name = ?, shipping_address = ?, phone = ? WHERE id = ?";
const params = [name, shipping_address, phone, req.user.id];
```

Role changes, if needed, belong on a separate admin-only endpoint that verifies
`req.user.role === 'admin'` per SEC-03.

### Evidence

- Batch C HTML report: `../html-report/batch-c.html` (carries `Run by: 23127179` + ISO).
- Automated case: `automation/tests/fr-04-profile/profile-fields.spec.ts`, frozen at `6942a0a`
  **before** execution. The case asserts a hard precondition that the account starts as
  `role: "user"`, so a fixture problem cannot be mistaken for the escalation.
- Command-line reproduction above, run independently of Playwright.

### GitHub issue

**[#3 — BUG-04-103](https://github.com/BuhDuy256/automation-testing-hw04/issues/3)** · filed
2026-08-09 · state: OPEN
