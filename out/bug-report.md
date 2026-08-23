# HW06 Bug Report (Derived)

> Generated from published, human-confirmed records in `work/registry/bugs.json`.

## Issue #13: [HW06][FR-04] PUT /api/users/me persists phone values outside the documented format

- Status: published
- Canonical cases supporting the public finding: FR04-AI-013, FR04-AI-014, FR04-AI-015, FR04-AI-016, FR04-AI-017, FR04-H-004
- Expected: A phone must begin with 0 and contain 10-11 digits; an invalid phone must not become the user's valid persisted phone value. Exact status and error schema are unspecified.
- Actual: The invalid values 012345678, 012345678901, 1123456789, 012345678A, +84123456789, and the empty string were observed as persisted phone values instead of remaining at the captured baseline.
- GitHub Issue: https://github.com/BuhDuy256/automation-testing-hw04/issues/13
- Runtime evidence: work/runs/RUN-20260823022316955-fr04-phone-corrected/newman-report.json, work/runs/RUN-20260823022316955-fr04-phone-corrected/newman-report.html, work/runs/RUN-20260823022316955-fr04-phone-corrected/stdout.log
- Screenshot evidence: work/evidence/screenshots/EVID-FR04-PHONE-FAILURE.png, work/evidence/screenshots/EVID-FR04-PHONE-REPORT.png, work/evidence/screenshots/EVID-FR04-PHONE-ISSUE.png

## Issue #14: [HW06][FR-04][SEC-06] PUT /api/users/me allows a client to persist role=admin

- Status: published
- Canonical cases supporting the public finding: FR04-AI-026
- Expected: FR-04/SEC-06 require the authenticated ordinary user's protected role to remain user when the client submits role=admin.
- Actual: The clean FR04-AI-026 execution started from role=user, submitted role=admin, and read back the persisted role as admin.
- GitHub Issue: https://github.com/BuhDuy256/automation-testing-hw04/issues/14
- Runtime evidence: work/runs/RUN-20260823022329715-fr04-role-corrected/newman-report.json, work/runs/RUN-20260823022329715-fr04-role-corrected/newman-report.html, work/runs/RUN-20260823022329715-fr04-role-corrected/stdout.log
- Screenshot evidence: work/evidence/screenshots/EVID-FR04-ROLE-TAMPERING.png, work/evidence/screenshots/EVID-FR04-ROLE-REPORT.png, work/evidence/screenshots/EVID-FR04-ROLE-ISSUE.png

## Issue #15: [HW06][FR-08] POST /api/checkout persists the client-supplied total_amount instead of recalculating it from the cart

- Status: published
- Canonical cases supporting the public finding: FR08-AI-002, FR08-AI-003, FR08-AI-004, FR08-AI-005, FR08-AI-035, FR08-H-001
- Expected: README FR-08 states that the checkout total is calculated automatically from the cart and that the backend must recalculate it and must not accept the client-supplied total_amount. The persisted order total must therefore equal the total derived from the cart state the server itself reports immediately before checkout. The exact status code and error schema are undocumented and are not claimed.
- Actual: The persisted order total equalled the client-supplied value in every observed variation: 1000 and 9999000 against a 200000 cart, 0, -200000, 199999.99, 999999999999, and 200000 against an empty cart (server-derived 0). Non-numeric and absent client values were persisted as NULL or NaN rather than the derived total, and the boolean true was persisted as 1. FR08-H-001 shows the same behaviour with a stale client total of 200000 against a cart the server itself reported as 250000.
- GitHub Issue: https://github.com/BuhDuy256/automation-testing-hw04/issues/15
- Runtime evidence: work/runs/RUN-20260823080014785-fr08-canonical-full-suite/newman-report.html
- Screenshot evidence: work/evidence/screenshots/EVID-FR08-CLIENT-TOTAL.png, work/evidence/screenshots/EVID-FR08-RUN-SUMMARY.png

## Issue #16: [HW06][FR-08] The cart is not cleared after a successful checkout

- Status: published
- Canonical cases supporting the public finding: FR08-AI-031
- Expected: README FR-08 states that after a successful checkout the cart is cleared, so GET /api/cart must report no lines for that user once checkout succeeds. The exact empty-cart response shape is undocumented and is not claimed.
- Actual: After a successful checkout returning {"message":"Checkout successful","orderId":N}, GET /api/cart still reported the purchased line, so the cart retained 1 line where 0 were expected. The stale line then polluted the next checkout: in FR08-AI-040 and FR08-H-005 the server-observed cart before the second checkout was 250000 because the already-purchased 200000 line was still present.
- GitHub Issue: https://github.com/BuhDuy256/automation-testing-hw04/issues/16
- Runtime evidence: work/runs/RUN-20260823080014785-fr08-canonical-full-suite/newman-report.html
- Screenshot evidence: work/evidence/screenshots/EVID-FR08-CART-NOT-CLEARED.png, work/evidence/screenshots/EVID-FR08-RUN-SUMMARY.png

## Not published yet: [HW06][FR-15][SEC-02/SEC-03] POST /api/products permits creation without a valid admin authorization context

- Status: human-confirmed
- Canonical cases supporting the public finding: FR15-AI-027, FR15-AI-028, FR15-AI-029, FR15-AI-030, FR15-AI-031, FR15-AI-032, FR15-AI-033, FR15-AI-037, FR15-H-002, FR15-H-004
- Expected: README FR-12, SEC-02, and SEC-03 require a valid JWT carrying role=admin for product data changes. Requests without that authorization context must not create a persistent product. Exact rejection status and error schema are unspecified.
- Actual: The canonical run observed a newly persisted product after every tested invalid authorization context: no Authorization header, ordinary-user JWT, non-Bearer scheme, malformed token, deterministically tampered signature, validly signed expired admin token, body-borne role claim with a user token, validly signed unexpired token with no role claim, and the refused-attempt phases of the authorization state cases. Representative selected requests returned HTTP 200 with {"message":"Product created","id":N}; the HTTP code is observation only, while persistence caused the oracle failures.
- GitHub Issue: not published yet; publication needs separate student approval
- Runtime evidence: work/runs/RUN-20260823102829114-fr15-auth-reproduction/newman-report.html
- Screenshot evidence: work/evidence/screenshots/EVID-FR15-AUTHORIZATION.png, work/evidence/screenshots/EVID-FR15-RUN-SUMMARY.png

## Not published yet: [HW06][FR-15] POST /api/products persists products that violate documented name, price, and category rules

- Status: human-confirmed
- Canonical cases supporting the public finding: FR15-AI-003, FR15-AI-005, FR15-AI-007, FR15-AI-009, FR15-AI-010, FR15-AI-014, FR15-AI-015, FR15-AI-016, FR15-AI-017, FR15-AI-018, FR15-AI-019, FR15-AI-036, FR15-AI-044, FR15-AI-047, FR15-AI-048, FR15-AI-059, FR15-H-003, FR15-H-005
- Expected: README FR-15 requires a non-empty name of at most 255 characters, a positive numeric price, and an existing category. Invalid data must not become a persistent valid product. Exact rejection status and error schema are unspecified.
- Actual: The canonical run observed new persistent rows for overlong, empty, omitted, and null names; zero, negative, non-numeric, omitted, and null prices; nonexistent, omitted, non-numeric, null, SQL-like, and previously deleted category references; and no-body or empty-object requests. Representative selected requests returned HTTP 200 and a created id; persistence, not the response code, caused the oracle failures.
- GitHub Issue: not published yet; publication needs separate student approval
- Runtime evidence: work/runs/RUN-20260823102841701-fr15-validation-reproduction/newman-report.html
- Screenshot evidence: work/evidence/screenshots/EVID-FR15-VALIDATION.png, work/evidence/screenshots/EVID-FR15-RUN-SUMMARY.png
