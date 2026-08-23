# FR-04 Canonical Full-Suite CI Freeze Plan

## Scope

The workflow executes the complete set of 44 reviewed-executable FR-04 cases without changing any canonical test oracle. It repeats the four official execution groups recorded in `project.json`: the main data-driven collection, the stateful collection, the clean H-006/H-007 closure run, and the independently reseeded AI-027 run. Later groups replace earlier observations only for the same canonical case ID.

## Pre-run prediction

Based on the unchanged SUT implementation and the already frozen local evidence, the predicted GitHub Actions result is 44 executed, 35 passed, and 9 failed. Eight predicted failures belong to the two published SUT bugs; `FR04-H-007` is predicted to remain the documented specification-gap observation. This prediction is not an oracle and will not be copied into the CI result registry as observed fact.

## Integrity checks before execution

- The workflow uses the current canonical collections, environment, and data files directly from `work/postman/fr04/`.
- Their hashes are checked against the official local run records.
- The backend is stopped and restarted before every independent execution group; backend startup reseeds the database.
- Runtime Newman JSON must prove `X-Student-Id: 23127179` on every request.
- Logical results are selected by canonical case ID using the same latest-result semantics as the repository derivation.
- Newman failures are retained. Artifacts upload before the final step exposes a nonzero full-suite result.

## Deliberate limitations

The separate smoke workflow remains the mechanism demonstration for one green run and one transparent intentional failure. This full-suite workflow is authoritative for canonical integration and is expected to remain red while confirmed SUT defects remain unfixed. No `continue-on-error`, expected-failure conversion, assertion weakening, or SUT modification is used to manufacture a green result.
