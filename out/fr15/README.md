# FR-15 Finalized Artifacts

> Promoted from canonical registries and immutable execution evidence by `npm run hw06:derive`.

- Primary run: RUN-20260823102155874-fr15-canonical-full-suite
- Collection SHA-256: 32216e5f0740e8b4bd2dee1156f879274e562d81e080f232a182f3117671ca6c
- Environment SHA-256: 932cab373654bde979273f95244a5fa6cb65756020b0852a45c30ec2dea6dc30
- Data SHA-256: d1fd5e9736f85aa0be92e9478d92f7a457717b29cf7f18ae67277e46437c58ec
- Newman exit code preserved: 1
- Runtime student-header coverage: 485/485 executed requests
- Primary Newman HTML: fr15/newman/FR15-canonical-full-suite.html
- Targeted bug reproductions: fr15/newman/FR15-authorization-reproduction.html and fr15/newman/FR15-validation-reproduction.html
- CI workflow configuration: out/https://github.com/BuhDuy256/automation-testing-hw04/blob/hw06-api-testing/.github/workflows/hw06-fr15-ci.yml
- CI evidence: all-pass https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32636054520; intentional-single-failure https://github.com/BuhDuy256/automation-testing-hw04/actions/runs/32636132200
- Published bugs: BUG-CANDIDATE-FR15-AUTHORIZATION (#17), BUG-CANDIDATE-FR15-VALIDATION (#18)
- Promoted attested evidence (10): EVID-FR15-RUN-SUMMARY, EVID-FR15-AUTHORIZATION, EVID-FR15-VALIDATION, EVID-FR15-AUTHORIZATION-ISSUE, EVID-FR15-VALIDATION-ISSUE, EVID-CI-FR15-ALL-PASS, EVID-CI-FR15-SINGLE-FAILURE, EVID-FR15-POSTMAN-CONSOLE, EVID-FR15-POSTMAN-RUNNER, EVID-FR15-POSTMAN-COLLECTION
- All FR-15 evidence carries explicit student attestation.

The canonical run preserves all genuine failures and its original non-zero exit code. The 28 failures map to the two published root bugs; 15 PASS-shaped observations remain explicitly classified as SPEC-GAP instead of being promoted to authoritative PASS.
