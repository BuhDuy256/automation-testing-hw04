# HW06 Postman Features (Derived)

> Generated from `work/registry/postman-features.json`; only features with real evidence are listed.

| Feature | Verified usage | Evidence |
|---|---|---|
| Postman collections | Separated the 41 data-driven FR-04 cases from three dedicated stateful multi-request flows while retaining canonical case IDs in request/test execution. | work/postman/fr04/FR04-profile.postman_collection.json, work/postman/fr04/FR04-profile-stateful.postman_collection.json |
| Postman environment and environment variables | Stored the base URL, student ID, credentials, tokens, and baseline state used by the FR-04 collections and Newman runs. | work/postman/fr04/FR04-profile.postman_environment.json, work/runs/RUN-20260823040227192-fr04-canonical-input/metadata.json |
| Collection pre-request scripts | Injected X-Student-Id: 23127179 into every collection request and constructed case-specific request bodies and authentication modes. | work/postman/fr04/FR04-profile.postman_collection.json, work/evidence/screenshots/EVID-FR04-POSTMAN-CONSOLE.png |
| Postman test scripts and assertions | Performed authenticated read-back, persistence, protected-field, cleanup, and state-transition assertions without inventing undocumented response status/schema requirements. | work/postman/fr04/FR04-profile.postman_collection.json, work/postman/fr04/FR04-profile-stateful.postman_collection.json, work/runs/RUN-20260823040227192-fr04-canonical-input/newman-report.json |
| Data-driven Newman iterations | Executed 41 canonical FR-04 input-partition cases from an external JSON data file, with one canonical case ID per iteration. | work/postman/fr04/FR04-cases.postman_data.json, work/runs/RUN-20260823040227192-fr04-canonical-input/metadata.json, work/runs/RUN-20260823040227192-fr04-canonical-input/newman-report.json |
| pm.sendRequest helper requests | Issued authenticated read-back and cleanup requests from test scripts to verify persisted state independently of the selected PUT response. | work/postman/fr04/FR04-profile.postman_collection.json, work/runs/RUN-20260823040227192-fr04-canonical-input/stdout.log |
| Newman CLI with JSON and HTML reporters | Ran the committed collections with the locked Newman dependency and captured CLI output, raw JSON, HTML, command arguments, hashes, timestamps, and hostnames. | work/runs/RUN-20260823040227192-fr04-canonical-input/metadata.json, work/runs/RUN-20260823040227192-fr04-canonical-input/newman-report.json, work/runs/RUN-20260823040227192-fr04-canonical-input/newman-report.html |
| Postman Console | Used the Postman Desktop Console to verify a real request carried X-Student-Id: 23127179. | work/evidence/screenshots/EVID-FR04-POSTMAN-CONSOLE.png |
