---
name: test-automation-design
description: >
  Converts an existing set of designed test cases into a data-driven, multi-browser automated
  suite, one reviewed batch at a time. Accepts a feature specification, a frozen test-case list,
  and a running system under test; produces test script files, an external data file carrying each
  case's oracle, a stamped HTML report per run, a classification of every failure as either a
  product defect or a test defect, and a report recording what the generated scripts got wrong
  before they were run. Enforces that each script is committed before it is first executed, so the
  commit history itself proves no expected value was tuned to match observed behaviour.
---

# Test Automation Design

Turns designed test cases into executed automation without letting the system under test dictate
what the tests expect. The phase order is the method: data before scripts, review before freeze,
freeze before run, classification before reporting. Reordering any of these destroys the property
that makes the results trustworthy.

---

## Skill Metadata

**Task Type:** Test Automation — script generation and execution from an existing test basis
**Methodology:** Freeze-before-execute batch conversion
Select cases and map each to a mechanism → externalize data with its oracle attached → generate one
small batch → review the generated scripts against known failure modes → commit the batch (freeze)
→ execute → classify each failure through the real-defect gate → report evidence honestly.

The pivot is the **freeze**: a script committed before its first run cannot have been tuned to
match what the system did. Git order is the evidence, not a claim in prose.

---

## Authoritative Inputs

Only treat each input as authoritative for what it actually contains. Substituting one for another
is the single most damaging error available in this task.

| Input | Authoritative for | NOT authoritative for |
|---|---|---|
| Feature specification / requirements | **Expected behaviour** — the oracle | How the system currently behaves; which mechanism can reach a behaviour |
| Frozen test-case list (from prior design work) | Which cases exist, their inputs, their frozen expectations, technique labels | New cases; changed expectations; automatability |
| Accepted assumptions recorded with the test basis | Expected behaviour **where the spec is silent** — flagged as weaker evidence | Anything the spec actually states (cite the spec instead) |
| System-under-test source code | Where a behaviour lives, which surface can reach it, what to predict before a run | **Expected values — never.** Reading the implementation to derive an oracle makes the test tautological |
| Observed test output / API responses | What the system did | What the system *should* do |
| Automation framework docs | Mechanism capabilities, fixture scoping, reporter configuration | Anything about the feature under test |

**MODEL ≠ ORACLE.** An expected value comes from the specification or from a recorded accepted
assumption, and from nowhere else. If neither prescribes an outcome, the correct move is to assert
less — not to invent a plausible-looking assertion. See Phase 4, failure mode 1.

**Reading the implementation is legitimate for locating and predicting, illegitimate for
expecting.** Use it to decide which surface reaches a behaviour and to write down a pre-run
prediction; never to fill in an expected value.

---

## Phase 1: Select Cases and Map Mechanisms

**Objective:** Decide which designed cases become scripts, and through which surface each one is
driven, before any code exists.

- **Step 1.1 — Take the case list as given.** Convert the cases the test basis already froze. Do
  **not** invent new cases inside an automation task: designing a test case is a different activity
  with a different methodology, and silently adding one destroys traceability back to the design
  work. If the frozen set is short of the required count, stop and say so — the design work is real
  and must be scheduled, not improvised here.

- **Step 1.2 — Map each case to a mechanism.** Default to driving the **user interface**, because
  that is what the deliverable usually asks for. Two classes of case genuinely cannot be expressed
  that way, and each use must carry a written reason:

  | Case class | Mechanism | Why the UI cannot express it |
  |---|---|---|
  | The behaviour asserts what the **backend stores**, and a client-side guard blocks the input | Direct API request | The value never reaches the server through the form, so the server's behaviour is unobservable there |
  | A **forged payload** — a value the client computes rather than accepts | Request interception | There is no field to type a forged value into |
  | Missing **access control** on an operation | Direct API request | The interface never renders the control to an unauthorised user |

  Everything else uses the interface. The escape hatches are exceptions justified per case, not a
  general licence to test the API because it is easier.

- **Step 1.3 — Declare cases that cannot be automated, with reasons.** This list is usually graded
  content, not an admission of failure. An empty list is a valid outcome but must be stated.

- **Step 1.4 — Flag convergence.** If two cases reduce to the same input, mechanism, and assertion,
  keep both (dropping a frozen case breaks traceability) but **declare the overlap** in the data
  and the report. Otherwise a reader counts one finding as two pieces of independent evidence.

- **Step 1.5 — Size the batches.** Group **4–6 cases** sharing a surface and a technique. Batches
  exist so a pre-freeze review is tractable and each freeze commit is a meaningful unit. A batch
  large enough that reviewing it becomes skimming has defeated its purpose.

---

## Phase 2: Externalize Data With Its Oracle

**Objective:** Put every test value in a data file, together with the source that justifies it, so
an expected value cannot be edited without visibly editing its justification.

- **Step 2.1 — No inline test data in any script.** Inputs and expected values live in an external
  data file. Scripts contain assertion *logic* only.

- **Step 2.2 — Carry the oracle in the data.** Each case records the source of its expectation
  next to the expectation itself:

  ```
  id, reference to the originating designed case, technique, mechanism, batch
  input:          { … the values under test … }
  expected:       { class: valid | invalid, … outcome … }
  expectedSource: "spec — <document> <section/line>"  |  "assumption <id> — <statement>"
  status:         frozen
  ```

  Keeping `expectedSource` adjacent to `expected` is what makes a silent oracle drift visible in
  review and in diff.

- **Step 2.3 — Model outcomes as outcomes, not mechanisms.** Where a specification says a value is
  invalid but does not say **how** it must be refused, express the expectation as a comparison
  rather than a mechanism:

  ```
  persistence: { mode: "equals" | "notEquals", value: "<the value>" }
  ```

  `notEquals` states exactly what the spec states — this value must not be the stored result —
  while remaining silent on whether a compliant implementation rejects, coerces, or truncates.

- **Step 2.4 — Parse the data file before committing, every time.** Appending cases to a shared
  data file repeatedly leaves the preceding element unterminated, which breaks the file for **every
  script that imports it**: the suite then reports a load error rather than test failures. Run a
  parse-and-count check after every data edit. This gate is load-bearing, not ceremonial — expect
  it to fire.

- **Step 2.5 — Guard the case count in the script.** Each batch asserts the number of cases it
  loaded:

  ```
  if (batch.length !== <N>) throw new Error(...)
  ```

  Without it, deleting a case from the data file makes the suite report "all passed" with fewer
  tests — a false green that nobody notices.

---

## Phase 3: Generate One Batch

**Objective:** Produce the scripts for a single batch, with isolation and assertion breadth built
in from the start.

- **Step 3.1 — Isolate by data, not by serialization.** Parallel workers sharing a mutable record
  produce failures that look exactly like product defects. Create the test's own data instead of
  depending on pre-seeded fixtures:

  | State the test mutates | Fixture scope |
  |---|---|
  | Per-subject state the test **writes and reads back** | **Test-scoped** — one private subject per test |
  | Read-only, or state the test does not mutate | Worker-scoped — one per worker, cheaper |
  | Globally shared records (catalogue-style) | Unique names per created record; **never assert on a total count** — a parallel worker's row breaks it |

  Carrying a worker-scoped fixture forward from a single-test example into a batch of several
  mutating tests is a specific, recurring mistake (Phase 4, failure mode 3).

  **If the schema lacks a uniqueness constraint on the identifying field, uniqueness is your
  responsibility.** Where lookups resolve by first match, two workers landing on the same identity
  silently share a subject and isolation fails **without any error**. Compose identities from a
  label plus a timestamp plus random bytes.

- **Step 3.2 — Never depend on pre-seeded data.** Beyond concurrency, seeded records are hostage to
  restart timing wherever the system re-initializes its store on boot. Tests that create their own
  data are not.

- **Step 3.3 — Use at least three assertion patterns.** Fewer leaves whole defect classes
  invisible:

  | # | Pattern | Catches |
  |---|---|---|
  | 1 | **Interface state** — visibility, text, value, enabled/disabled | What the user actually sees |
  | 2 | **Network response** — status and body | Wrong status codes, silent failures, absent validation |
  | 3 | **Persisted round-trip** — mutate, then re-read independently | "The interface said saved, the store disagrees" |
  | 4 | *(bonus)* **Absence / negative** — must-not-equal, no error shown | Expectations that forbid rather than require |

  Pattern 3 earns its place: patterns 1 and 2 can both pass while the write is lost.

- **Step 3.4 — Prefer soft assertions.** One run then reports **every** way the specification was
  violated instead of stopping at the first, which is what makes a full impact chain visible.

- **Step 3.5 — Choose selectors by resilience, and log the compromises.** Prefer role-based, then
  label-based, then text-based, then scoped structural selectors as a last resort. When the system
  under test may not be modified, accessible selectors are frequently unavailable — a visible label
  rendered as a *sibling* of its input, with no programmatic association, defeats label-based
  lookup entirely. Every last-resort selector carries a comment naming its fragility, and each one
  is recorded as a review finding.

- **Step 3.6 — Capture, don't await, an event that may never occur.** Awaiting a request that a
  client-side guard prevents from being sent yields an opaque timeout that hides the reason.
  Capture the event as a value that may be absent, then assert on that value, so "no request was
  made" is reported as a specific readable failure.

- **Step 3.7 — Annotate rather than assert where the spec is silent.** Record observed values that
  are evidence but not oracle-backed — a status code for an invalid input, a convergence note — as
  test annotations. They land in the report without becoming an unfounded claim.

- **Step 3.8 — Assert the preconditions a claim depends on.** If a test's conclusion assumes a
  starting state, assert that starting state explicitly. A security claim that rests on a subject
  starting unprivileged must verify it, so that a fixture problem fails loudly and separately
  instead of masquerading as the finding.

---

## Phase 4: Review Before Freezing

**Objective:** Find what the generated scripts got wrong **while it is still free to fix** — before
the freeze commit and before any run. This phase is usually the highest-value graded content of the
whole task, because it is the evidence that generated output was not accepted uncritically.

- **Step 4.1 — Check against the recurring failure modes.** These recur across features and
  batches; check each one explicitly rather than reading for general correctness:

  | # | Failure mode | Why it recurs | Correction |
  |---|---|---|---|
  | 1 | **Inventing a refusal mechanism.** Told an input is invalid, the generated script asserts a specific error status, a null, or an empty string. | "Invalid" reads like "should be refused", and a matched pair of assertions *looks* rigorous — which disguises that half of it has no source. **This is the most persistent failure mode; expect it in every batch containing invalid inputs.** | Assert the **outcome** the spec states, nothing more. Use `notEquals` on the value. Cite the source in the failure message. |
  | 2 | **Expected direction inferred from behaviour.** In a data-driven loop over mixed valid/invalid cases, letting the expected direction follow what the system does is a one-character mistake. | The loop makes the two directions structurally adjacent. | Read direction from the **data file's** class field. Never compute it in the script body. |
  | 3 | **Scope-anchoring on a working example.** A fixture scope that was safe for one test is carried into a batch where several tests mutate the same subject. | Pattern-matching the previous working example without re-checking the assumption that made it safe. | Re-derive fixture scope from *this* batch's mutation profile (Step 3.1). |
  | 4 | **Awaiting an event the failing branch never produces.** | The happy path is written first, and the failing branch changes the *shape* of the observation, not just its value. | Capture-then-assert (Step 3.6). |
  | 5 | **Data and behaviour silently diverging.** A field declared in the data file is never used by the script. | Artefacts written in separate passes. | Every data field is either used or removed. |
  | 6 | **Trusting the fixture implicitly.** Assertions read plausibly while pointing at the wrong subject. | The fixture is reasonable, so the failure mode stays silent. | Assert the subject's identity in the read-back (Step 3.8). |
  | 7 | **Counting non-interface executions as browser coverage.** | Nothing prompts a check of what a green result across projects actually demonstrates. | See Phase 7. |
  | 8 | **A type or lint error invisible until checked.** Callbacks that execute in another runtime reference globals the type configuration does not include. | Environment characteristic, not a reasoning error. | Run a static typecheck before freezing. |

- **Step 4.2 — Record each finding as a row.** For every finding: *what* was wrong, *why* it was
  missed (feature characteristic / environment characteristic / model bias / attention gap), and
  *how* it was fixed. The "why" column is what distinguishes a review from a changelog.

- **Step 4.3 — Run the static gates.** Before the freeze, all of these pass:

  | Gate | Expectation |
  |---|---|
  | Data file parses, case count per batch | Matches the frozen plan |
  | Static typecheck | Clean exit |
  | Test discovery (list without running) | Expected case count × configured projects |
  | No pre-seeded subject referenced anywhere in the test tree | Zero matches |
  | No inline test-data literal in scripts | Zero matches |
  | No invented-oracle assertion — scope this one, see below | Zero matches |
  | Every failure message cites its oracle | One per assertion |

  **Scope the invented-oracle check, or it reports false positives.** What is forbidden is a
  null / empty / status assertion applied to a **persisted field value**, or a status assertion on
  an **invalid input**. The *same operators* are legitimate when applied to a **captured event** —
  asserting that a request was or was not issued is an observable fact about the run, not a claim
  about how the system must refuse input (Step 3.6). A check matching the operator alone will flag
  correct code. Match the operator together with **what it is applied to**, and read every hit
  before acting on it.

- **Step 4.4 — Write down the predicted outcome, before running.** Derive it by reading the
  implementation (legitimate here — it is a prediction, not an oracle) and record the expected
  pass/fail tally per case *in the report* before execution.

  This is what converts post-run classification from a rationalisation into a **check**. It has a
  second payoff: when actual and predicted diverge, that divergence is itself the signal that
  something non-product is interfering — which is far harder to notice without a prior commitment.

---

## Phase 5: Freeze, Then Execute

**Objective:** Commit the batch before its first run, so the ordering is provable, then run it.

- **Step 5.1 — Commit the scripts and data as a freeze commit.** Message names the batch. **No run
  has happened yet.** This ordering is the anti-tuning evidence; a run-then-commit sequence
  produces the same files with none of the proof.

- **Step 5.2 — Execute the batch across all configured projects.** No retries — retries hide
  flakiness that Phase 6 needs to see.

- **Step 5.3 — Do not modify a script to change what it expects.** Ever. If an assertion exposes a
  real defect, it **stays red** and the finding goes to the bug report. Weakening an assertion to
  produce a green suite converts a found defect into a shipped one.

  Post-run script edits are permitted **only** for test-side defects that change *how the test
  waits or runs*, never *what it expects* — and they are committed separately, with the reason.

- **Step 5.4 — Verify the report carries its run identity, with a check that can actually observe
  it.** Where the deliverable requires the report stamped with an identifier and timestamp, verify
  it programmatically.

  **Verify that the verification can fail for the right reason.** A check that inspects the wrong
  layer — plain-text searching a page whose real content is embedded in a compressed payload,
  reading a static shell tag rather than the value set at runtime — will report failure regardless
  of the truth and can trigger reverting a working feature. It can equally report success while
  observing nothing. Before trusting any check, confirm it goes red when the thing it tests is
  genuinely absent.

  Generalised: **a check that cannot fail for the right reason is worse than no check** — it
  manufactures confidence in the wrong direction.

---

## Phase 6: Classify Every Failure

**Objective:** Decide, for each failure, whether it is evidence about the product or about the
harness — before anything is filed.

- **Step 6.1 — Apply the real-defect gate.** The discriminating question is **not** "did it fail?"
  but:

  > **Did it fail *at an assertion*?**

  A failure that never reached an assertion — a navigation timeout, a setup error, a load failure —
  is evidence about the **harness**, not the specification. Treating one as a product defect files
  a bug that does not exist.

- **Step 6.2 — Corroborate before concluding either way.** Signals that separate the two:

  | Observation | Points to |
  |---|---|
  | Fails identically on every project, at an assertion | Product defect |
  | Fails on one project only, and passes there in isolation | Test-side (contention or timing) |
  | Timings inflate several-fold under parallel load | Test-side (over-subscription) |
  | Reproduces outside the automation framework, by hand | Product defect |

  **Confirm product defects independently** — reproduce the behaviour outside the test framework
  before filing. This is what converts "the test says so" into "the system does so".

- **Step 6.3 — Fix test-side defects at the cause.** Two that recur when a suite first runs in
  parallel: waiting on a readiness signal stricter than the test needs, and running more workers
  than the system under test can serve. A single-threaded or development-mode backend starves under
  a default worker count derived from CPU count; matching workers to configured projects preserves
  genuine cross-project parallelism without the contention. Re-run twice and require identical
  results before believing the fix.

- **Step 6.4 — Group failures by root cause, not by symptom.** Several failing cases routinely
  share one cause. The test for distinctness:

  > **Would fixing one of them fix the other?**

  Different component, different fix, and a different blast radius mean **distinct** root causes —
  even when the symptom looks identical. Evidence that a defect survives the other's fix is the
  strongest form of this argument: a case failing on input that the other layer already blocks
  proves the two are independent.

- **Step 6.5 — File one issue per root cause.** A new root cause gets a new issue. A widened or
  re-confirmed root cause gets the **existing issue updated** with the new evidence — never a
  duplicate. Each issue carries reproduction steps, the oracle citation, the evidence artefact, and
  the suggested fix.

- **Step 6.6 — Grade evidence strength, and say so.** A finding resting on a recorded assumption is
  **weaker** than one citing a specification line directly. Both may be correct; they are not
  equally grounded, and the report must not present them as though they were.

- **Step 6.7 — Note passes that pass for the wrong reason.** Where a case passes because a guard
  rejects the input on a criterion unrelated to the rule under test, a green result does **not**
  demonstrate the rule is enforced. Record this, or the suite overstates its own coverage.

---

## Phase 7: Report Evidence Honestly

**Objective:** Produce the report and the counts, with no metric inflated by construction.

- **Step 7.1 — Count multi-project coverage honestly.** Cases driven through a non-interface
  mechanism **launch no browser**, even though a project matrix executes them once per project.
  Three identical backend results are **matrix uniformity, not cross-browser evidence**, and are
  excluded from any browser-run count.

  Report the split explicitly. Execution timings corroborate it — interface cases take seconds,
  direct-request cases take milliseconds. Inflating this number is the easiest unearned metric
  available in the whole task and the easiest for a reviewer to catch.

- **Step 7.2 — Report prediction versus actual.** Present the Phase 4.4 prediction beside the
  result, and state the match rate. A wrong prediction that is reported is worth more than a right
  one that was written afterwards.

- **Step 7.3 — Include the failures of the process, not only of the product.** A false signal that
  was diagnosed and corrected — an infrastructure timeout that nearly became a fabricated
  product defect, a verification command that could not observe what it claimed to test — is among
  the most valuable content in the report. Record it in full, including what it nearly caused.

- **Step 7.4 — State what the passes establish.** Passing cases constrain the diagnosis: they
  distinguish "the operation is broken" from "the operation is unguarded", which is the difference
  between a rewrite and a guard clause. This is not filler.

- **Step 7.5 — Log the generation session in the audit record.** Where an audit trail of assisted
  work is required, add a row per session with the **complete prompt** (not an abridged
  paraphrase), the artefact produced, the review verdict, and the corrections applied. Update the
  running totals. An audit row written from memory later is worth much less than one written at the
  time.

---

## Standardized Output

Per feature:

| Artefact | Content |
|---|---|
| Test script files, one per batch | Assertion logic only — no inline test data |
| External data file | Every case's input, expected outcome, and `expectedSource` |
| Stamped report per run | Run identity + timestamp, verified programmatically |
| Automation report | Case selection with mechanism reasons, pre-freeze review findings table, pre-run predictions, results, real-defect classification, honest coverage counts, cases not automated |
| Bug reports | One per **root cause**, with reproduction, oracle citation, evidence, suggested fix |
| Audit rows | One per generation session, full prompt, verdict |

Per batch, the required commit ordering is:

```
review findings recorded  →  FREEZE COMMIT (scripts + data)  →  run  →  results commit
                                                              ↘  optional fix commit
                                                                 (waits/config only,
                                                                  never expectations)
```

---

## Stop Conditions

Stop and ask rather than proceeding if:

- The frozen case list is **short of the required count** — new cases need design work, which is a
  different task and must not be improvised inside automation.
- A case's expected value cannot be traced to the specification or a recorded assumption.
- A required input is missing — for example, expected behaviour is needed but only source code and
  observed output are available. Source code is not a substitute for a specification.
- Producing a green result would require weakening an assertion.
- A failure cannot be classified as either a product defect or a test defect after corroboration.
- The system under test would have to be modified to make a test pass.
