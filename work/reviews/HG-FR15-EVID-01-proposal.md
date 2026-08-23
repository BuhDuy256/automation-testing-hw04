# HG-FR15-EVID-01 — FR-15 Newman Evidence Visual Attestation

This packet requests visual review only. All three PNGs were captured from real, immutable Newman
HTML reports and mechanically registered, but `humanAttestation` remains `false`. No GitHub Issue
has been published.

| Evidence ID | File | Source / case | What the screenshot proves |
|---|---|---|---|
| `EVID-FR15-RUN-SUMMARY` | `work/evidence/screenshots/EVID-FR15-RUN-SUMMARY.png` | `RUN-20260823102155874-fr15-canonical-full-suite` | The canonical FR-15 Newman dashboard executed 59 iterations and retained the real report totals, including 430 assertions and 30 failed assertions. Canonical case classification remains registry-derived: 16 PASS, 28 FAIL, 15 SPEC-GAP, 0 HARNESS, 0 BLOCKED. |
| `EVID-FR15-AUTHORIZATION` | `work/evidence/screenshots/EVID-FR15-AUTHORIZATION.png` | `RUN-20260823102829114-fr15-auth-reproduction`, `FR15-AI-028` | An otherwise-valid create with an ordinary-user JWT returns a created id, the run-unique product appears in authoritative read-back, the no-persistence oracle fails, and `X-Student-Id: 23127179` is visible. |
| `EVID-FR15-VALIDATION` | `work/evidence/screenshots/EVID-FR15-VALIDATION.png` | `RUN-20260823102841701-fr15-validation-reproduction`, `FR15-AI-009` | A request with documented-invalid `price: 0` returns a created id, the run-unique product appears in authoritative read-back, the no-persistence oracle fails, and `X-Student-Id: 23127179` is visible. |

## AI-side integrity verification

| Evidence ID | SHA-256 | PNG dimensions | Attested |
|---|---|---:|---:|
| `EVID-FR15-RUN-SUMMARY` | `d39c6a741f7792098fe6822420bdab6996aed09e8f1e0eba601046241507f28b` | 1600×1100 | No |
| `EVID-FR15-AUTHORIZATION` | `0e128b82d61a51a805040db0bbdccf2447cc0d604ed41abf4f3e303a707c84c5` | 1046×5089 | No |
| `EVID-FR15-VALIDATION` | `880712809f90640e7e49fcd46cebfed7355650eac3495a252883c0af01fcce78` | 1046×5089 | No |

AI verified each PNG signature, byte hash, dimensions, registry/sidecar agreement, source run, case
mapping, and the visible request/response/assertion content. The canonical registry contains 59
mapped results and all 28 authoritative failures map to the two human-confirmed root bugs. The two
targeted reports preserve 40/40 and 52/52 requests with the student header and no harness failure.

## Decision required

After opening all three PNG files and visually checking that they are genuine, readable, and match
the descriptions above, use this exact sentence if you agree:

> I visually inspected EVID-FR15-RUN-SUMMARY, EVID-FR15-AUTHORIZATION, and EVID-FR15-VALIDATION and attest that all three screenshots are genuine, legible, and accurately show the described FR-15 Newman evidence. Record my attestation as Nguyen Bao Duy.

This attestation does not authorize GitHub Issue publication.
