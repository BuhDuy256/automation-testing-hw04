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
