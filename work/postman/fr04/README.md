# FR-04 Postman Build

This working suite represents the 44 reviewed-usable FR-04 cases through `FR04-cases.postman_data.json`.
The ten AI cases with final `INVALID` verdicts are deliberately absent. The original AI artifacts and human reviews remain unchanged in `work/registry/`.

The data runner executes the same selected operation, `PUT /api/users/me`, once per canonical `caseId`. The collection pre-request script maps each ID to its reviewed request shape; the test script performs only contract-grounded persisted-state checks and uses `SPEC GAP` observation for undocumented status/body behavior.

Supporting requests are login, registration of a temporary second user, baseline capture, and restore. They are not selected APIs or counted test cases. The second user is created only for `FR04-H-005`; database reseeding on SUT restart remains the reset strategy.

No Newman output, screenshot, bug record, or execution evidence is stored by this build.
