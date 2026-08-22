# HW06-A-FR04-PUT-USERS-ME Verified Specification Extract

> Status: UNVERIFIED. This extract is a source-anchored navigation aid; the official specification remains authoritative. Human verification is required before test generation.

## Identity

- Pool: A
- Feature ID: FR-04 — Personal profile management
- Method and path: `PUT /api/users/me`
- Source headings: `eshop-sut/api_specification.md`, §2. Users, §2.2; `eshop-sut/README.md`, FR-04 and SEC-02/SEC-06

## Request contract

| Input | Location | Type | Required | Documented rule | Source reference |
|---|---|---|---|---|---|
| Authorization | Header | Bearer JWT | Yes | User APIs require a token | API specification §2; README SEC-02 |
| name | JSON body | String | Shown in example; exact requiredness not stated in API spec | Basic profile name | API specification §2.2 |
| shipping_address | JSON body | String | Shown in example; exact requiredness not stated in API spec | Default shipping address | API specification §2.2; README FR-04 |
| phone | JSON body | String | Shown in example; exact requiredness not stated in API spec | FR-04 requires `0` followed by 9–10 digits | README FR-04 |
| email | JSON body | — | — | Must not be changeable through this feature | README FR-04 |
| role | JSON body | — | — | Must not be client-changeable | README FR-04; SEC-06 |

## Response contract

| Condition | Status | Schema/fields | Source reference |
|---|---:|---|---|
| Successful update | Not documented | Not documented | API specification §2.2 ends after the request body |
| Current implementation observation | Runtime-dependent | May return `{ "message": "Profile updated" }` | Implementation observation `backend/server.js`; not an official contract |
| Authentication failure | Not explicitly stated in API specification | Error schema/status is unspecified in the API specification | Implementation observation only; do not treat as official contract |

## Domain partitions and boundaries

| Input | Valid partitions | Invalid partitions | Boundaries | Source reference |
|---|---|---|---|---|
| phone | Starts with `0`, 10 or 11 digits | Wrong prefix, non-digits, empty, wrong length, wrong type | 9/10/11/12 digits | README FR-04 |
| name | Ordinary and Unicode text | No official invalid partition is defined | No API limit documented | API specification §2.2; README FR-04; empty, wrong type, very long and HTML-like values are exploratory/robustness partitions |
| shipping_address | Ordinary and Unicode text | No official invalid partition is defined | No API limit documented | API specification §2.2; README FR-04; empty, wrong type, very long and HTML-like values are exploratory/robustness partitions |
| Authorization | Valid user token | Missing, malformed, expired, invalid signature | Token validity boundary | README SEC-02; API specification §2 |

## State and setup

- Preconditions: known registered user and successful login.
- State transitions: baseline profile → update → persisted profile; profile V1 → update → profile V2 → update → profile V3.
- Authorization/forbidden operations: unauthenticated update; changing another user’s profile; changing `role` or `email`.
- Persistent side effects: profile fields are persisted for the authenticated user.
- Reset/setup needs: capture baseline profile, run cases, then restore baseline; use GET `/api/users/me` as supporting verification.

## Applicable security requirements

| SEC ID | Applicability | Expected enforcement | Source reference |
|---|---|---|---|
| SEC-02 | Direct | Require valid JWT | README SEC-02 |
| SEC-04 | Relevant to stored/displayed profile text | Escape user-controlled text at display boundaries | README SEC-04 |
| SEC-05 | Relevant to persistence | Parameterized database queries | README SEC-05 |
| SEC-06 | Direct | Ignore/reject client attempts to change role | README SEC-06 |
| SEC-01 | Not directly exercised | Password storage is outside this operation | README SEC-01 |
| SEC-03 | Limited | No admin-only route is selected | README SEC-03 |
| SEC-07 | Not applicable | OTP is outside this operation | README SEC-07 |

## Schema checks

- Required fields: Exact body requiredness is not defined by the API specification.
- Types/formats: Example uses strings; phone format is defined by FR-04.
- Nullable/optional fields: Not documented.
- Additional-property rule, if documented: Not documented; `email` and `role` must nevertheless not be mutable under FR-04.

## Unknowns requiring runtime verification

- Exact validation and error status/schema for missing or invalid fields.
- Whether extra fields are rejected, ignored, or persisted.
- Whether stored HTML-like values are escaped at the consuming UI boundary.

## Human verification

- Verified by: Pending human verification after corrections
- Verified at: Pending
- Verification notes: Response shape is implementation-only; name/address exploratory inputs must not receive undocumented mandatory rejection expectations; authorization checks are separate from state transitions.
