---
name: hw06-api-test-generator
description: Generate structured, source-grounded API test candidates from a selected API specification and relevant feature, security, state, and schema requirements. Use for HW06 section 7/G9.5 generation and for bounded candidate-generation batches such as FR-08 or FR-15. Do not use it to perform human review, execute tests, attest evidence, publish bugs, or orchestrate the whole assignment.
---

# HW06 API Test Generator

Generate candidate API tests from authoritative specifications. Output candidates only; the surrounding HW06 workflow performs independent review, human audit, execution, evidence, and reporting.

## Required inputs

- Selected API identity: feature, method, and path.
- Source-anchored API specification or verified extract.
- Relevant FR business rules.
- Relevant SEC requirements, including explicit applicability decisions.
- Known state model and setup/reset constraints when the operation is stateful.
- Existing case titles or coverage index when adding a batch, to prevent duplication.

If a rule needed for an oracle is absent, record `SPEC GAP`. Do not infer it from implementation code, an existing test, or an observed response. Implementation observations may identify exploratory targets but are not expected behavior.

## Generation method

Build the suite step by step rather than with one undifferentiated prompt:

1. Extract the request contract, response contract, state changes, authorization boundary, applicable security rules, schema rules, and explicit unknowns.
2. Create a coverage model for every request parameter and relevant header: valid/invalid equivalence partitions, boundary values, missing/null/wrong-type shapes, and cross-field constraints.
3. Add state-transition cases with explicit starting state, action, expected next state, read-back observation, and reset plan.
4. Add applicable security cases for authentication, authorization, IDOR/ownership, protected fields, injection, output-boundary handling, and other source-defined SEC rules. Mark non-applicable SEC rules instead of padding the suite.
5. Add response-schema cases only where the specification defines exact fields, types, requiredness, or additional-property behavior.
6. Deduplicate by test purpose, request shape, oracle, and state transition. Keep one diagnostic fault per negative case. Allow a multi-field or multi-step combination only when a source-defined interaction or named distinct risk requires it.
7. Check the coverage ledger and generate additional meaningful cases until the selected API has at least 35 AI candidates. Never create filler or disguise setup/cleanup as product cases.
8. Preserve named generation stages in the coverage ledger and `generationContext`: contract/domain, authorization/security, state, schema, and closure/deduplication.

## Oracle rules

- Anchor each expected result to an FR, SEC, or API-spec source.
- When exact HTTP status or error schema is unspecified, assert only the documented invariant and label the exact response behavior `SPEC GAP`.
- For every mutating negative case or protected-field case, capture the relevant baseline, use an authoritative read-back or observation, and assert that the forbidden value or state was not persisted. If no observation mechanism exists, record the evidence gap instead of claiming the invariant was proved.
- Separate API behavior from UI/display-boundary behavior; API read-back alone cannot prove safe UI escaping.
- Do not claim that a black-box response proves an internal technique such as parameterized SQL.
- Do not claim execution, PASS/FAIL, or a product bug during generation.

## Candidate output

Return a structured candidate list plus a compact coverage ledger. Each candidate must contain:

- `candidateId`: stable temporary ID within the batch;
- `title`: one distinct test purpose;
- `preconditions`: authentication, data, and starting state;
- `request`: exact method/path, headers or auth mode, and one concrete input shape/value;
- `expected`: source-grounded observable oracle or explicit `SPEC GAP`;
- `basis`: the existing registry vocabulary: `official_contract`, `official_contract_plus_exploration`, `exploratory`, or `state_management`;
- `coverage`: one or more of `domain_partition`, `state_transition`, `security`, `schema_validation`;
- `requirementRefs`: relevant FR/SEC/API-spec identifiers;
- `sourceAnchors`: repository file plus exact heading, rule ID, or endpoint section;
- `setupReset`: required setup, read-back, and cleanup;
- `assumptions`: only explicit unresolved assumptions;
- `generationContext`: API and bounded coverage slice used for later audit;
- `generationBatchId`: unique ID supplied by the invoking session for this bounded interaction;
- `generationTool`: actual available AI tool/model identity;
- `generationPrompt`: the exact prompt used for this generation interaction;
- `generatedAt`: the actual interaction date/time supplied by the invoking session, never guessed.

The invoking session must stamp `generationBatchId`, `generationTool`, `generationPrompt`, and `generatedAt` immediately after the response; the generator must not guess them. The stable candidate IDs sharing one batch ID define that interaction's exact output boundary.

The coverage ledger must list each parameter, state transition, applicable SEC rule, and schema rule with the candidate IDs that cover it, plus uncovered items and reasons.

## Quality check before returning

- Every candidate is traceable to the selected API.
- Every candidate is executable as written; reject vague values such as `very long`, `SQL-like text`, `one field`, or `run boundary values`.
- No candidate duplicates another candidate or an existing case.
- Negative cases are diagnostically isolated.
- Setup, cleanup, and monitoring steps are not counted as product test cases.
- Contract and exploratory expectations are visibly separated.
- Missing status/schema behavior is not invented.
- The list contains at least 35 meaningful candidates when the authoritative inputs support the assignment target.
- Output contains no human verdict, human attestation, runtime result, bug confirmation, Issue publication, or assignment curation.
