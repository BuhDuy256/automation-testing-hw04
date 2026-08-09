# Faculty of Information Technology (FIT) – Ho Chi Minh City University of Science (HCMUS)

## CS423 / CSC13003 – Software Testing (AI-augmented · 2026)

### AI POLICY · TEMPLATES — 2026 v1.0

# AI Audit Report — 5-section Template per Artifact

_Mandatory appendix for every AI-assisted homework (HW#01–HW#06, and Seminar)._

_Adapted from Med Kharbach, PhD (2026) — AI Use Policy Templates for Higher Education. CC BY-NC-SA 4.0. This adaptation is prepared for FIT@HCMUS – CS423 / CSC15003 Software Testing course._

---

## 1. Student Information

| Field                                   | Value              |
| --------------------------------------- | ------------------ |
| **Student name (printed):**             | Nguyen Bao Duy     |
| **Student ID:**                         | 23127179           |
| **Class / Cohort:**                     | 23KTPM2            |
| **Assignment ID (e.g., HW#00, HW#02):** | HW04               |
| **Assignment date:**                    | 28/07/2026         |
| **AI tool(s) used:**                    | Claude Code, Codex |
| **AI tool(s) used:**                    | [X] Yes [ ] No     |

---

## 2. Instructions (read before filling)

- Add one row per AI-generated artifact (test case, script, checklist, OpenAPI spec, JMeter plan, etc.).
- Paste the verbatim prompt — DO NOT paraphrase.
- Paste the verbatim AI output (or include a labelled screenshot in the report).
- Tag the verdict: VALID / INVALID / INCOMPLETE.
- Reasoning must cite a course slide, ISTQB section, or technical RFC.
- Show the corrected artifact with the change highlighted.
- Sample rows are in italic — replace them before submission.

---

## 3. Audit Table — one row per artifact

| (1) Prompt + Tool                                                                                                                         | (2) AI Output                                                                                      | (3) Verdict | (4) Reasoning (ISTQB)                                                                                          | (5) Student Fix                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Sample _(italic)_ — replace before submission:**                                                                                        |                                                                                                    |             |                                                                                                                |                                                                                                        |
| Tool: AI Tool (e.g., ChatGPT, Claude, Gemini)<br>Time: 14:32 25/02/2026<br>Prompt: "Generate test cases for parsePhoneNumberVN function…" | TC01: parsePhoneNumberVN("0912345678")<br>Expected: {prefix:84, number:912345678, valid:true}<br>… | INCOMPLETE  | AI ignored RFC 3966 international format. ISTQB FL §4.3 Boundary Value Analysis requires testing format edges. | Added TC: parsePhoneNumberVN("+84-91-234-5678")<br>Expected: {prefix:84, number:912345678, valid:true} |
| **Artifact #1 — `docs/implementation-plan/implementation_plan.md`**<br><br>Tool: **Claude Code (Claude Opus 5)**<br>Time: 16:16 09/08/2026<br><br>Prompt (verbatim):<br>"Before we build the test codebase, I need you create implementation_plan.md.<br><br>In HW02, I use the idea of completing 1 feature before building SKILL to finish task => The submissions of other remain feature will be created by using this SKILL => Check the C:\Users\Duy\Desktop\automation-testing-hw04\references\hw2\eshop-sut-hw2-testing\out\docs => Can we resue this approach from HW02?" | **357-line plan** — too large to inline. **Verifiable public reference:** commit `50c10df` in the submission repo → `git show 50c10df:docs/implementation-plan/implementation_plan.md`. (Raw session transcript retained locally at `trash/claude-session1.md`, lines 1882–1984; that path is git-ignored and therefore *not* part of the submission — the commit SHA is the authoritative record.) Summary of what it produced:<br><br>• §1 inheritance table: HW02's *example-first / deliverable-first / freeze-before-execute / audit-as-you-go* carried over; HW02 "Model C" (no test-runner, no assertions-in-code) marked **SUPERSEDED** by HW04's Playwright mandate.<br>• §1.4 counted reusable HW02 cases: FR-04 = 16, FR-08 = **4**, FR-15 = 20 → flagged FR-08 as 8 short of the ≥12 minimum.<br>• §3 froze 5 architecture decisions (UI-first + API-assist, per-worker user isolation, selector policy, 3 assertion patterns, JSON data).<br>• 8 steps: pilot FR-04 by hand → extract skill → apply to FR-08/FR-15 → globals → video. | **INCOMPLETE** | Three defects found in student review.<br><br>**(a) Traceability failure — the main one.** Step 5.1 proposed FR-08 cases covering *coupon interaction*, *order status after checkout*, *quantity/stock edges* and *shipping-address validation*. Per the SUT spec these belong to **FR-09, FR-10 and FR-07** respectively — FR-08 states exactly 5 requirements. ISTQB CTFL v4.0 **§1.4.4 (Traceability between the Test Basis and Test Work Products)**: every test case must trace to the specific test-basis item it claims to cover; cases traced to the wrong FR give false coverage of FR-08 while the real requirements (total non-editable; ordered-product list displayed) had **zero** planned coverage.<br><br>**(b)** Commit rule stated only "Steps 2–6 touch `.spec.ts`" — not verifiable against HW04 §12's 8-commit minimum, and it silently counted Step 4 (which touches `SKILL.md` only).<br><br>**(c)** HTML-report evidence relied on reporter *metadata*; HW04 §11 treats the report as **TA-verified anti-cheat evidence**, so the stamp must be visible, not buried. | **(a)** Rewrote Step 5.1 around an explicit **R1–R5 requirement table** quoted from FR-08, added an out-of-scope list naming FR-07/FR-09/FR-10, and 10 candidate cases each tagged with its R-ref — prioritising **R2 and R3** (zero existing coverage). Added a **setup-vs-counted-case rule**: cart seeding (FR-07) and login (FR-02) are non-counting fixtures. Added a stop condition: a case not traceable to R1–R5 is dropped or demoted.<br><br>**(b)** Added **§5 Commit schedule**: 3 qualifying commits per feature (freeze A, freeze B, post-run fix) + 1 smoke = **floor of 10**; Step 4 explicitly marked **0 qualifying**; §5.3 forbids mixing spec and doc changes; verified by `git log --oneline -- '*.spec.ts' \| wc -l`.<br><br>**(c)** Added **§3.6**: 3 evidence layers with the reporter **`title`** as primary, verified against Playwright 1.62.1 source (`process.env.PLAYWRIGHT_HTML_TITLE \|\| options.title`) plus a mandatory `grep` check that the `<title>` is not the default. |
| **Artifact #2 — Step 1 implementation** (`playwright.config.ts` reporter title, `fixtures/base.ts` isolated-user fixture, `utils/api.ts`, `automation-architecture.md`)<br><br>Tool: **Claude Code (Claude Opus 5)**<br>Time: 16:45–17:05 09/08/2026<br><br>Prompt (verbatim, complete):<br>"Read:<br>- `docs/implementation-plan/implementation_plan.md`<br>- `docs/implementation-plan/automation-architecture.md`<br>- `out/ai-declaration/[AI-02] - FIT@HCMUS - AI Audit Report_En.docx.md`<br><br>Fix only these consistency issues first:<br><br>1. In `implementation_plan.md`, update Status:<br>- Mark Step 1 as complete.<br>- Change `NEXT ACTION` from Step 1 to Step 2.<br>- Remove the stale instruction that says to verify with the §3.6 grep. The current correct check is `cd automation && npm run verify:report`.<br><br>2. In the AI Audit row for Artifact #2, it currently says 'Prompt (verbatim, abridged...)'. That is internally inconsistent with the audit template's 'verbatim prompt' rule.<br>- Either paste the full prompt verbatim, or change the label so it does not claim 'verbatim'.<br>- Prefer pasting the full prompt if practical.<br><br>Commit and push this housekeeping change separately. It is non-qualifying."<br><br>_(Note: the row's original prompt cell abridged the Step 1 instruction, which contradicted the template's §2 rule "Paste the verbatim prompt — DO NOT paraphrase." The Step 1 prompt is reproduced in full below; the housekeeping prompt that corrected it is quoted above.)_<br><br>**Step 1 prompt (verbatim, complete):**<br>"Proceed with Step 1 from `docs/implementation-plan/implementation_plan.md`.<br><br>Before implementation, fix two minor stale wording issues in the plan:<br>1. In the folder structure comment, change 'the five frozen decisions' to 'the six frozen decisions'.<br>2. In §5.4, change 'Per §5 of Step 1' to a clearer reference such as 'Per Step 1 / §5.4'.<br><br>Then execute Step 1 only:<br><br>1. Add the Playwright HTML reporter `title` in `automation/playwright.config.ts`.<br>- It must visibly include `Run by: 23127179`<br>- It must include an ISO timestamp generated at config load<br>- Keep existing metadata and per-test annotation layers<br><br>2. Write `docs/implementation-plan/automation-architecture.md`.<br>- Freeze §3.1–§3.6 from the plan<br>- Include concise rationale and evidence<br>- Include the isolation verification output after the run<br><br>3. Implement the worker-scoped isolated-user fixture in `automation/fixtures/base.ts`.<br>- Register a unique user per worker via `POST /api/register`<br>- Login via API and expose `user` + `token`<br>- Preserve the existing `runBy` auto annotation<br>- Do not depend on seeded `test@eshop.com`<br><br>4. Add thin helper(s) in `automation/utils/` only if needed.<br>- Keep them small<br>- Do not create a full Page Object Model<br>- Do not modify anything under `eshop-sut/`<br><br>5. Prove isolation with a temporary Playwright spec:<br>- Create `automation/tests/_isolation-check.spec.ts`<br>- Run it on Chromium/Firefox/WebKit with parallel workers<br>- Run it twice<br>- Paste the relevant passing command output into `automation-architecture.md`<br>- Delete `_isolation-check.spec.ts` before committing<br>- Verify `git status` has no temporary spec<br><br>6. Verify the HTML report title:<br>- Run the §3.6 grep against `automation/playwright-report/index.html`<br>- Confirm the title is not the default `Playwright Test Report`<br><br>7. Update the AI Audit Report with a new row for this Step 1 Claude-generated artifact/code/doc work.<br>- Include my prompt verbatim<br>- Summarize the output if too large<br>- Mark the verdict based on your human review<br>- Update running totals<br><br>Keep the Step 1 commit non-qualifying: no `.spec.ts` file should be committed.<br><br>Show:<br>- `git diff --stat`<br>- relevant diff snippets<br>- test commands run and results<br>- `git status --short`<br>Then commit and push with message:<br>`Step 1: freeze automation architecture and isolated-user fixture`" | Produced, in order:<br><br>• `playwright.config.ts` — added `title: \`EShop Automation — Run by: 23127179 — ${ISO}\`` to the html reporter, ISO generated once at config load; kept `metadata` + the `runBy` auto-annotation.<br>• `utils/api.ts` — `registerAndLogin()` creating `hw04-{label}-{ts}-{rand}@eshop.test`.<br>• `fixtures/base.ts` — worker-scoped `api` + `isolatedUser` fixtures; `runBy` preserved.<br>• `tests/_isolation-check.spec.ts` — temporary; wrote a worker-unique phone, waited 750 ms, read back, asserted no cross-worker leak. **6/6 passed** over 2 runs × 3 browsers (ids 12/13/14 then 15/16/17).<br>• `scripts/verify-report-stamp.js` + `automation-architecture.md`.<br><br>Full diff: Step 1 commit on `main`. | **INCOMPLETE** | The delivered code was correct on first execution, but **the verification step prescribed by the plan was not** — and it is the AI's own earlier work, added as the fix for Artifact #1's finding (c). Step 6 of the prompt instructed a `grep` on `<title>` in `playwright-report/index.html`. Run as instructed it printed `<title>Playwright Test Report</title>` → **"FAIL: still default title"**, on a report whose title was in fact set correctly.<br><br>ISTQB CTFL v4.0 **§1.2.3 (Errors, Defects, Failures — false-positive / false-fail results)**: a check that reports failure when no defect exists is itself a defect in the test. Root cause: `index.html`'s `<title>` is a **static Vite shell tag** that always reads the default; the real title lives at `report.json → options.title` inside a **base64-encoded zip embedded** in the same file, and the page sets `document.title` from it at runtime. A plain-text grep cannot read compressed data, so the check could **never** observe the value it claimed to test. Acting on that false fail would have meant reverting a working feature. | Investigated instead of reverting. Decoded the embedded zip and found the value at `report.json.options.title`; confirmed the config option worked all along, and that the earlier claim "`PLAYWRIGHT_HTML_TITLE` does not work" was the *same* false signal (re-tested: the env var populates the field too).<br><br>Replaced the grep with **`automation/scripts/verify-report-stamp.js`** (`npm run verify:report`), which decodes the payload and asserts 5 conditions, exiting non-zero on failure — reused by Steps 2/3/5/6. Confirmed visually by rendering the report in Chromium: the stamp is the page `<h1>` **and** the tab title (screenshot: `docs/implementation-plan/evidence/report-run-by-2026-08-09.png`).<br><br>Corrected §3.6 of the plan (with the false-fail documented so it is not reintroduced) and every downstream reference to the old grep. Also hardened `utils/api.ts` after reading the SUT schema: `users.email` has **no UNIQUE constraint** and `POST /api/login` uses `db.get` (first match wins), so a duplicate email would hand two workers one account and break isolation *silently* — hence the random suffix. |
| **Artifact #3**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #4**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #5**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #6**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #7**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #8**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #9**                                                                                                                           |                                                                                                    |             |                                                                                                                |                                                                                                        |
| **Artifact #10**                                                                                                                          |                                                                                                    |             |                                                                                                                |                                                                                                        |

---

## 4. Summary of AI Accuracy

Aggregate the verdicts from Section 3 and complete the table below.

> _Running totals — updated as artifacts are added. Final figures are computed at submission._

| Metric                                   | Count | Percentage |
| ---------------------------------------- | ----- | ---------- |
| **Total AI-generated artifacts audited** | 2     | 100%       |
| **VALID (correct, accepted as-is)**      | 0     | 0%         |
| **INVALID (wrong; rejected)**            | 0     | 0%         |
| **INCOMPLETE (acceptable after edits)**  | 2     | 100%       |

---

## 5. Conclusion — When should AI be used (or not)?

Write 80–150 words describing patterns you observed. Where did AI shine? Where did AI fail? What is your recommendation for using AI in this kind of work in the future?

_(Write your conclusion here.)_

---

## 6. Mandatory Disclosure (paste verbatim)

> "[Test cases / script / dataset / report] was initially generated by [AI tool name]; I reviewed and modified [section X], added [edge cases Y, Z]; [section W] was written entirely by me. The detailed AI Audit Report is attached as Appendix A. I confirm I did not use AI to generate any artifact listed in the prohibited category."

### Signature

| Field                       | Value                                         |
| --------------------------- | --------------------------------------------- |
| **Student name (printed):** | Nguyen Bao Duy                                |
| **Student ID:**             | 23127179                                      |
| **Class / Cohort:**         | 23KTPM2                                       |
| **Course:**                 | CS423 / CSC13003 – Software Testing           |
| **Instructor:**             | Lam Quang Vu, Truong Phuoc Loc, Ho Tuan Thanh |
| **Date:**                   | 09/08/2026                                    |
| **Signature:**              | Nguyen Bao Duy                                |

---

## References

- Kharbach, M. (2026). _AI Use Policy Templates for Higher Education._ CC BY-NC-SA 4.0.
- ISTQB Foundation Level Syllabus (latest version).
- Hardman, P. (2025). _A Post-AI Learning Taxonomy._
- Fuster Rabella, M. (2025). OECD Education Working Paper No. 338.
- Perkins, M., Roe, J., & Furze, L. (2025). _AI Assessment Scale._
- Anthropic (2025). _Building reliable AI test agents_ — engineering blog.
- DeepEval & Promptfoo documentation — testing frameworks for LLM systems.
