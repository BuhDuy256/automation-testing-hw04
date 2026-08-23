# HW06 Main Codex Orchestrator

## Purpose and boundary

This file is the internal operating procedure for the main Codex session while completing HW06. It is not an Agent Skill, a workflow engine, a canonical state registry, or a submission-facing artifact.

The sources of truth remain:

- `work/registry/*.json`: structured test, run, bug, CI, and evidence truth;
- raw Newman, CI, screenshot, and hash artifacts: observed evidence;
- `HANDOFF.md`: the cross-session project checkpoint;
- `docs/hw06-standard-actions.md`: mechanics for recurring actions;
- this file: how the main Codex session coordinates work.

Raw and canonical evidence outrank derived summaries. Canonical evidence outranks stale statements in `HANDOFF.md`; correct the handoff when they disagree.

## Entry behavior

When the user says `Continue`:

1. Read `AGENTS.md`.
2. Read `HANDOFF.md`.
3. Read this file.
4. Inspect only the canonical state and authoritative sources needed for the current task.
5. Determine the next incomplete action from the handoff, evidence, and standard-action catalog.
6. Continue without asking for intermediate decisions that authoritative evidence can resolve.

If the user bounds the turn, stop at that boundary even when another action is ready.

## Main Codex responsibility

Main Codex is the orchestrator:

```text
ANALYZE
-> DELEGATE / PRODUCE
-> INDEPENDENT REVIEW
-> ADVERSARIAL VERIFY
-> REPAIR IF NEEDED
-> EVIDENCE VERIFY
-> DETERMINISTIC VALIDATE
-> CONTINUE or HUMAN GATE
```

Use specialized native sub-agents for independent semantic work when they are available. Give each one a bounded responsibility and the minimum authoritative context. Do not ask one producer to approve its own output.

If native sub-agents are unavailable, perform clearly separated producer, reviewer, and adversarial passes. State that they are separate passes from one session; do not invent agent identities or claim independence that did not occur.

The Student-Perspective Reviewer may conservatively recommend what the student should approve by checking assignment compliance, evidence strength, and oral-defense risk. Its result remains an AI recommendation.

## Gate classes

These labels guide behavior only. Do not store them in a new orchestration registry or build a second workflow state machine.

### `AUTO`

Run without asking the student: derive, validate, hash comparison, arithmetic, registry reconciliation, report regeneration, canonical/raw consistency checks, and file promotion after existing prerequisites are satisfied.

### `AI_REVIEW`

Codex performs the full semantic loop: produce, independent review, adversarial verification, repair, and review again. Examples include test generation, specification cross-checks, duplicate detection, proposed bug analysis, report review, evidence mapping, and proposed corrections.

Do not stop while the disagreement can be resolved from authoritative inputs. Reviewer rejection returns work for repair. A verifier contradiction overrides a reviewer PASS. Genuine SUT failures remain failures; never weaken an oracle or hide a case to manufacture PASS.

### `HUMAN_GATE`

Stop only for genuine human action: assignment-required student review, final API selection, visual evidence inspection, actual human attestation, approval before external publication, an ambiguity no authoritative source resolves, the student-designed generator diagram, or final submission approval.

Do not manufacture additional human gates. Complete all AI and deterministic preparation first, then present only the minimum material the student must inspect.

## Action routing

For each next action:

1. Use the matching entry in `docs/hw06-standard-actions.md`.
2. Read the correct authoritative source for the fact being decided.
3. For ACT-GEN-01, use `hw06-api-test-generator` as the generation methodology and `work/templates/ai-generation-prompt.md` as the bounded prompt scaffold. Existing coverage and the selected API determine batch scope unless a genuine unresolved choice remains.
4. For each bounded generation interaction, create the exact prompt before invocation, then immediately stamp every original candidate with the actual available tool/model, actual date/time, `generationBatchId`, verbatim prompt, source anchors, and coverage slice. Stable candidate IDs plus the batch ID define the output boundary; do not reconstruct provenance later.
5. Use independent review and adversarial verification before preparing any student-review packet.
6. Repair AI-detectable defects automatically and rerun relevant checks.
7. Update canonical registries only for facts they own.
8. Run `npm run hw06:derive` after canonical registry changes and `npm run hw06:validate` before meaningful commits.
9. Update `HANDOFF.md` after each meaningful phase.

External GitHub Issue publication and final submission follow the existing explicit-approval policy. This protocol does not broaden external authorization.

## Failure and disagreement handling

- Generator versus reviewer: repair the rejected cases, then review again.
- Reviewer PASS versus verifier contradiction: authoritative verifier evidence wins; repair or mark the claim unsupported.
- Generated summary versus raw execution: raw execution wins; regenerate the summary.
- HANDOFF versus canonical evidence: canonical evidence wins; update HANDOFF.
- Missing authoritative input: stop at a HUMAN_GATE only when repository discovery cannot recover it.
- Repeated unresolved AI disagreement: summarize the exact dispute and evidence instead of looping indefinitely.

## Human truth boundary

AI and sub-agents must never create `humanAttestation=true`, `HUMAN_APPROVED`, `HUMAN_VERIFIED`, a canonical human verdict attributed to Nguyen Bao Duy, a student-authored case, or a claim that the student inspected evidence when that did not occur.

Only an explicit student message may create real human approval or attestation. Use plain language such as `AI recommendation: approve`; do not create proxy-human status taxonomies or parallel approval fields.

## Compact human-review packet

At a real human gate, omit internal transcripts and use:

```text
HUMAN GATE: HG-<scope>-<id>

Decision needed:
APPROVE / REJECT / CHOOSE

Why I need to review:
<short reason>

AI checks already completed:
- requirement review: PASS
- independent review: PASS
- adversarial verification: PASS
- evidence verification: PASS
- deterministic validation: PASS

I need to inspect:
1. <exact item/file>
2. <exact item/file>

Remaining risk/disagreement:
<none or concise issue>

AI recommendation:
<clearly labeled AI recommendation>

If correct, reply:
"I reviewed HG-... and approve."
```

### ACT-REV-01 batch audit packet

Complete independent review, adversarial verification, and repair before stopping. Present every AI case once in a compact table:

```text
HUMAN GATE: HG-<API>-REV-01

| Case | Purpose | AI recommendation | Reason | Proposed correction | Source anchor | Uncertainty |
|---|---|---|---|---|---|---|
```

Do not write `work/registry/human-reviews.json` yet. The student may approve the whole proposal and override exceptions in one message, for example:

```text
I reviewed HG-FR08-REV-01 and approve all proposed verdicts/corrections except FR08-AI-014 and FR08-AI-027: <overrides>.
```

After that explicit response, mechanically write only the approved or overridden human verdicts, reasoning, corrections, reviewer identity, and time. Original AI candidates remain immutable.

### ACT-EXT-01 human-extension packet

After the audited suite is known, have AI analyze remaining coverage gaps and adversarially remove weak or duplicate ideas. Present one labelled shortlist with each idea's purpose, source anchor, proposed oracle, why AI generation missed it, and an AI-recommended subset:

```text
HUMAN GATE: HG-<API>-EXT-01

A. <idea and why it was missed>
B. <idea and why it was missed>
...

AI recommendation: select <at least five labels>.
```

Do not create `origin=HUMAN` cases yet. A response such as `I choose A, C, D, F, H. Change D from X to Y.` is sufficient. Only then materialize the selected/modified cases and their student-approved `humanExtensionRationale`.

## Expected phase gates

- Generation normally runs as AI_REVIEW/AUTO once the selected API and verified specification exist.
- Human audit uses one ACT-REV-01 batch gate for the full AI candidate set.
- Human extension uses one ACT-EXT-01 selection gate for at least five added cases.
- Evidence stops only for genuine visual inspection or attestation.
- Bug confirmation/publication stops only for genuine human judgment or existing external-publication approval.
- Do not create a human gate merely because a phase ended.

## AI Audit behavior

Keep meaningful AI generation and review attributable to the actual AI tool and interaction. For new work, preserve the actual tool, date/time, verbatim prompt, and meaningful AI output boundary required by HW06 section 9. Artifact-level source context is only a disclosed fallback for historical interactions whose prompt was not captured. Never rewrite AI review as student review.

Deterministic commands such as derive, validate, hashes, and parsers remain execution evidence; do not create fake AI interactions for them.

## Next planned reuse

FR-08 is the first real reuse of both this operating protocol and `hw06-api-test-generator`. FR-15 is the next reuse/refinement opportunity. Do not reopen or rewrite FR-04 merely because the operating protocol changed.
