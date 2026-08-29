# Disposable HW06 Generator Skill Demonstration

Use the `hw06-api-test-generator` Skill for this task. Read its complete `SKILL.md` before acting.

## Demo identity

- Demo run ID: `{{DEMO_RUN_ID}}`
- Selected API: FR-04 Personal profile management — `PUT /api/users/me`
- This is a disposable video demonstration, not an official generation or review interaction.

## Authoritative inputs

Use only the copies inside this demo run:

- Verified specification: `{{DEMO_RUN_DIR}}/input/fr04-verified-spec.md`
- Full feature requirements: `{{DEMO_RUN_DIR}}/input/eshop-requirements.md`
- Full API specification: `{{DEMO_RUN_DIR}}/input/eshop-api-specification.md`
- Skill snapshot for visible provenance: `{{DEMO_RUN_DIR}}/input/hw06-api-test-generator-SKILL.md`
- Existing coverage: `{{DEMO_RUN_DIR}}/input/existing-coverage.md` (intentionally empty)

Do not use implementation code, observed runtime behavior, official candidate registries, human
reviews, or existing generated test cases as requirement sources.

## Task

Generate a fresh suite of at least 35 meaningful test candidates for the selected API, together with
the Skill's compact coverage ledger.

Apply the Skill's contract/domain, authorization/security, state, schema, and
closure/deduplication stages. Use concrete inputs, one diagnostic fault per negative case, exact
source anchors, and `SPEC GAP` wherever the authoritative sources do not define an exact oracle.

Treat existing coverage as empty. Candidate IDs must use the disposable prefix `DEMO-FR04-AI-`.
Use `{{DEMO_RUN_ID}}` as `generationBatchId`. After generation, stamp the actual tool/model identity,
the exact contents of this prompt, and the actual completion timestamp; do not guess those values in
advance.

## Strict isolation boundary

Write files only inside:

```text
{{DEMO_RUN_DIR}}/output/
```

Create exactly these files:

1. `candidate-test-cases.json` — a JSON object containing demo metadata and the candidate array.
2. `coverage-ledger.md` — mappings for parameters, states, applicable security rules, schema rules,
   candidate IDs, and any uncovered items with reasons.
3. `demo-summary.md` — run ID, selected API, candidate count, covered generation stages, SPEC GAP
   count, output filenames, and a statement that the output is unreviewed demo data.

Do not modify `out/`, `work/registry/`, `work/generated/`, `work/prompts/`, Postman artifacts, or any
official test suite. Do not assign human verdicts, claim execution, report PASS/FAIL, confirm bugs,
or publish issues. Do not run the SUT or Newman.

Before finishing, validate that the JSON parses, the candidate count is at least 35, every candidate
has all fields required by the Skill, and every created file is inside the disposable output folder.
Report only the three output paths and the validation summary in chat.
