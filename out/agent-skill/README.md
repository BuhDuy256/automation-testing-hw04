# Agent Skill — `test-automation-design`

HW04 §7 deliverable. `SKILL.md` in this folder is the submitted skill.

## Why a copy lives here

The working copies live in the two agent config repos:

| Copy | Path |
|---|---|
| Claude | `.claude/skills/test-automation-design/SKILL.md` |
| Codex | `.codex/skills/test-automation-design/SKILL.md` |
| **Submission** | **`out/agent-skill/SKILL.md`** (this folder) |

All three are **byte-identical** (`sha256 2bb4b512…bada1cc5`).

`.claude/` and `.codex/` are *separate git repositories* cloned into this project, and the
submission repo records them only as gitlinks (mode `160000`) with no `.gitmodules`. Cloning the
submission repo therefore produces two **empty** directories — the skill would not be present for
anyone marking this work. This copy exists so the deliverable is actually delivered. It is not a
second version to maintain; the config copies are the source, and any change must be re-mirrored.

## What the skill is

A repo-agnostic, framework-agnostic procedure for converting an already-designed test-case set into
an executed, data-driven, multi-browser automated suite. It was **extracted from** the completed
FR-04 pilot, not written in advance — every rule in it corresponds to something that actually
happened during that feature.

Its organising constraint is the **freeze**: each test script is committed *before* its first run,
so the commit order proves no expected value was tuned to match observed behaviour.

| Phase | Purpose |
|---|---|
| 1 | Select cases, map each to a mechanism, size batches |
| 2 | Externalize data with its oracle attached |
| 3 | Generate one batch (isolation, assertion patterns, selectors) |
| 4 | Review before freezing — 8 recurring generated-code failure modes + static gates |
| 5 | Freeze, then execute |
| 6 | Classify every failure through the real-defect gate |
| 7 | Report evidence honestly |

## Validation

The skill was checked against the FR-04 inputs it was derived from — the requirement being that it
would reproduce an equivalent workflow, not that it would reproduce the same prose.

**Workflow reproduction.** Each phase was traced against what FR-04 actually did:

| Phase | Would it reproduce FR-04? |
|---|---|
| 1 Select + map | Yes — 16 frozen cases taken as given, 6 UI / 10 API with a per-case reason, one convergence declared, batches of 4–6 |
| 2 Externalize | Yes — `data/fr-04-profile.json`, `expectedSource` per case, `persistence: {mode, value}`, parse gate, count guard |
| 3 Generate | Yes — test-scoped fixture for state-mutating tests, unique identities, 3+ assertion patterns, soft assertions, selector fallback with logged fragility |
| 4 Review | Yes — the 8 failure modes in the table are generalised from the 23 findings actually recorded across the four batches |
| 5 Freeze → run | Yes — matches the 4 freeze commits, each preceding its run |
| 6 Classify | Yes — the "did it fail *at an assertion*?" gate is what separated the Batch A timeouts from genuine defects, and the "would fixing one fix the other?" test is what produced 3 issues rather than 1 or 27 |
| 7 Report | Yes — including the 18-vs-48 browser-count split |

**Executable gates.** Phase 4.3's static gates were run literally against the finished suite:

| Gate | Result |
|---|---|
| Data parses; per-batch counts | 16 cases — smoke 1 / A 4 / B 5 / C 6; all carry `expectedSource`; all `frozen` |
| Static typecheck | exit 0 |
| Test discovery | 48 tests in 4 files |
| No pre-seeded account referenced | 0 matches |
| No inline test-data literals | 0 matches |
| No invented-oracle assertion | 0 matches *(after the gate was corrected — see below)* |
| Failure messages cite an oracle | 30 across 4 files |

**One defect found in the skill by this validation, and fixed.** The invented-oracle gate was first
written to grep for the operator alone (`toBeNull` / `toBe('')` / `toBe(400)`). Run against the real
suite it produced **3 false positives** — all three assert on a *captured request object* ("was a
request issued?"), which is the legitimate capture-then-assert pattern the skill itself prescribes,
not a claim about how invalid input must be refused. The gate now specifies matching the operator
together with **what it is applied to**, and says to read every hit before acting.

That correction is the skill's own Phase 5.4 rule turned on itself: *a check that cannot fail for
the right reason is worse than no check.* Re-run scoped, the gate returns zero — confirming there is
no genuine invented oracle in the suite.

**Coupling smell-test.** Zero hits for project-specific terms, and zero for an extended list
covering bug IDs, tool and browser names, and prior-assignment references. Commands and results are
in the Step 4 section of the FR-04 automation report and the AI audit row.

No FR-04 deliverable was modified to accommodate the skill.
