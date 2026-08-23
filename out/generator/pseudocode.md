# AI-Driven API Test Generator — Pseudocode

## Purpose

Given one selected API operation and authoritative requirement sources, generate at least 35 meaningful, auditable test candidates without inventing contracts or runtime evidence.

```text
FUNCTION GenerateApiTests(selectedApi, apiSpec, featureRules, securityRules,
                          stateModel, existingCoverage, generationMetadata):
    REQUIRE selectedApi has feature, method, and path
    REQUIRE apiSpec contains the selected operation
    REQUIRE generationMetadata has batchId, tool, exactPrompt, and timestamp

    contract = Extract(
        request parameters and headers,
        documented response schema,
        authorization boundary,
        state transitions,
        explicit unknowns
    )

    coverageLedger = InitializeLedger(contract, featureRules, securityRules, stateModel)
    candidates = []

    FOR EACH request parameter OR relevant header:
        partitions = EquivalencePartitions(parameter)
        boundaries = BoundaryValues(parameter)
        shapes = [missing, null, wrong-type] where meaningful
        candidates += IsolatedCases(partitions, boundaries, shapes)

    FOR EACH documented state transition:
        candidates += StateCase(
            startingState,
            action,
            expectedNextState,
            authoritativeReadBack,
            resetPlan
        )

    FOR EACH security rule:
        IF rule applies to selectedApi:
            candidates += SecurityCases(rule, observableInvariant)
        ELSE:
            coverageLedger.RecordNotApplicable(rule, reason)

    FOR EACH exact documented response field/type/rule:
        candidates += SchemaCase(rule)

    FOR EACH candidate:
        candidate.expected = AnchorOracleToSource(candidate)
        IF exact behavior is undocumented:
            candidate.expected = ObservableInvariantPlus("SPEC GAP")
        IF candidate is mutating and negative:
            candidate.setupReset += BaselineReadBackAndCleanup()
        candidate.provenance = generationMetadata

    candidates = RemoveDuplicatesBy(purpose, requestShape, oracle, stateTransition)
    candidates = RemovePaddingAndNonProductSetupCases(candidates)
    candidates = EnforceSingleDiagnosticFaultUnlessInteractionIsRequired(candidates)

    WHILE Count(candidates) < 35 AND coverageLedger.HasMeaningfulGap():
        candidates += GenerateBoundedBatch(coverageLedger.NextGap())
        candidates = DeduplicateAndValidate(candidates)

    REQUIRE every candidate has concrete input, source anchors, setup/reset, and stable ID
    REQUIRE no candidate claims execution, PASS/FAIL, bug confirmation, or human verdict

    RETURN candidates, coverageLedger
END FUNCTION

FUNCTION HumanControlledPipeline(candidates):
    humanReviews = StudentLabelsEachCandidate(VALID, INVALID, INCOMPLETE)
    correctedSuite = ApplyOnlyStudentApprovedCorrections(candidates, humanReviews)
    extensions = MaterializeOnlyStudentSelectedExtensions(minimum = 5)
    executableSuite = BuildPostman(correctedSuite + extensions)
    runtimeEvidence = ExecuteWithNewman(executableSuite)
    bugs = ConfirmOnlyWithRealEvidenceAndStudentDecision(runtimeEvidence)
    RETURN auditableArtifacts
END FUNCTION
```

## Design boundaries

- API read-back cannot prove SEC-04 display escaping.
- Black-box responses cannot prove SEC-05 parameterized-query implementation.
- Missing status or schema rules stay `SPEC GAP`.
- Human review, evidence attestation, and bug publication are outside the generator.
