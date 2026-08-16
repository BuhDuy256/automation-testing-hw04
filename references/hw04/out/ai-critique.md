# AI Critique

*HW04 §10 · Nguyen Bao Duy — 23127179 — 23KTPM2*

AI was genuinely productive at **scaffolding**: turning 49 frozen HW02/HW04 cases into data-driven
Playwright specs, generating externalised JSON, and drafting reports. That work is repetitive and
structural, and it went fast.

Its failures were not random — the same few recurred across all three features. **Inventing oracles**
appeared in six consecutive batches: told an input is invalid, the model reaches for `toBe(400)` or
`toBeNull()`, even though `api_specification.md` documents no status code anywhere. Related was
**asserting mechanisms** rather than outcomes — `toBeDisabled()` for "the user may not edit this",
which would fail a compliant implementation that simply omitted the field. It also wrote **checks
that inspected the wrong layer** (grepping a compressed report payload for a title that is set at
runtime), broke a **shared data file** three times by appending to it, and let **documentation drift**
behind the work repeatedly.

The most instructive failure was subtler. A price assertion used strict equality; the SUT returns
`price` as a string for even product ids, so `expect("0").not.toBe(0)` **passed** while the invalid
value was in fact stored. A false pass — the test could not fail for the right reason — and it hid a
real defect until a per-project discrepancy exposed it.

What made the results trustworthy was not better prompting but process: **freeze-before-run**, so git
order proves no expectation was tuned to observed output; **human review before every freeze**, which
produced 85 recorded findings; and the **real-defect gate**, which separated four harness timeouts
from genuine defects and prevented three fabricated bug reports.

The principle: model output is never the oracle. The specification is.
