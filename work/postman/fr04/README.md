# FR-04 Postman Build

This working suite represents all 44 reviewed-usable FR-04 cases. `FR04-profile.postman_collection.json` drives 41 input-partition cases with `FR04-cases.postman_data.json`; `FR04-profile-stateful.postman_collection.json` implements `FR04-AI-031`, `FR04-AI-046`, and `FR04-H-005` because their reviewed semantics require real multi-request state sequences.
The ten AI cases with final `INVALID` verdicts are deliberately absent. The original AI artifacts and human reviews remain unchanged in `work/registry/`.

The input collection executes the selected operation, `PUT /api/users/me`, once per canonical `caseId`. Its mapper uses explicit braced case branches, preserves `null`, creates real Unicode and additional-property inputs, and records exact submitted values for read-back. The separate stateful collection performs the actual V2-to-V3, repeated-identical PUT, and cross-user sequences once per dedicated case instead of repeating them for every data iteration.

Supporting requests are user-A login, exact baseline capture, read-back, restore, and the user-B setup inside `FR04-H-005` only. They are not selected APIs or counted test cases. Baseline restoration sends the captured `null` value unchanged when present and verifies the complete persisted profile after restore. Database reseeding on SUT restart remains the reset strategy.

If a protected field is changed by the SUT during an exploratory tampering case, the API-level restore deliberately does not pretend it can repair that protected field; the follow-up exact-baseline check fails and a fresh seeded SUT state is required before later execution. This is an explicit cleanup limitation, not a fabricated pass.

Negative-authentication cases verify that a valid-token read-back remains equal to the exact baseline; they do not invent a response status or schema. `FR04-AI-024` explicitly records that API read-back is not evidence of SEC-04 UI escaping and requires separate manual/UI verification. `FR04-AI-009` uses the environment's genuinely validly signed expired JWT; the signing secret itself is not committed.

No Newman output, screenshot, bug record, or execution evidence is stored by this build.
