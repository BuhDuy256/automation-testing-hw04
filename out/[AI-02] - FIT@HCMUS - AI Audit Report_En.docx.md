# Faculty of Information Technology (FIT) – Ho Chi Minh City University of Science (HCMUS)

## CS423 / CSC13003 – Software Testing (AI-augmented · 2026)

### AI POLICY · TEMPLATES — 2026 v1.0

# AI Audit Report — 5-section Template per Artifact

*Mandatory appendix for every AI-assisted homework (HW#01–HW#06, and Seminar).*

*Adapted from Med Kharbach, PhD (2026) — AI Use Policy Templates for Higher Education. CC BY-NC-SA 4.0. This adaptation is prepared for FIT@HCMUS – CS423 / CSC15003 Software Testing course.*

---

## 1. Student Information

| Field | Value |
|---|---|
| **Student name (printed):** | Nguyen Bao Duy |
| **Student ID:** | 23127179 |
| **Class / Cohort:** | 23KTPM2 |
| **Assignment ID (e.g., HW#00, HW#02):** | HW05 |
| **Assignment date:** | 2026-08-16 |
| **AI tool(s) used:** | OpenAI Codex |
| **AI tool(s) used:** | [x] Yes  [ ] No |

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

| (1) Prompt + Tool | (2) AI Output | (3) Verdict | (4) Reasoning (ISTQB) | (5) Student Fix |
|---|---|---|---|---|
| **Artifact #1 — Initial workflow API mapping**<br>Tool: OpenAI Codex<br>Time: `[EXACT TIME UNAVAILABLE]`<br>Prompt (verbatim):<br>We have decided to use this end-to-end performance testing workflow:<br><br>Login<br>→ Search Product<br>→ View Product Detail<br>→ Add Product to Cart<br>→ Checkout<br><br>Do not create any test plan yet.<br><br>Read:<br>- eshop-sut/api_specification.md<br>- eshop-sut/README.md<br><br>For each step in the workflow, identify:<br>1. The exact API endpoint.<br>2. HTTP method.<br>3. Required request parameters/body.<br>4. Required authentication.<br>5. Important response fields that will be needed by later steps.<br><br>Also explain dependencies between steps, for example whether a product ID returned from Search is needed by Product Detail or Cart.<br><br>Write the result to:<br>work/workflow_api_mapping.md<br><br>Do not modify the SUT. | **Clearly labelled verbatim excerpt from the earlier generated artifact; `work/workflow_api_mapping.md` is currently missing from the filesystem:**<br>“The key correlation rules are:<br><br>1. Use the product `id` returned by Search in `/api/products/:id` and in the cart body.<br>2. Keep `id`, `name`, and `price` from the same selected product; do not combine fields from different search results.<br>3. Use the same user's JWT for Add to Cart and Checkout so both calls address the same authenticated cart.<br>4. Do not treat the client-supplied `total_amount` as the checkout oracle; the README makes the backend-recalculated cart total authoritative.” | VALID | The output fulfilled the requested documentation task: it mapped each workflow step to documented endpoints, methods, bodies, authentication, downstream fields, and dependencies, while identifying response-schema gaps rather than inventing paths. Its correctness as an API mapping is separate from the student's later decision not to use this common workflow. Evidence: HW05 specification Sections 5–6 and the two requested EShop API documents. | Reviewed the accurate mapping, rejected the workflow because it was too close to the homework example and likely too common, and requested alternative workflows. |
| **Artifact #2 — Alternative workflow candidates**<br>Tool: OpenAI Codex<br>Time: `[EXACT TIME UNAVAILABLE]`<br>Prompt (verbatim):<br>We want to replace the current workflow because:<br><br>Login -> Search Product -> View Product Detail -> Add to Cart -> Checkout<br><br>is too common and is very close to the example workflow in the homework specification.<br><br>Do not create or modify any test plan yet.<br><br>Read:<br>- eshop-sut/api_specification.md<br>- eshop-sut/README.md<br>- docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md<br><br>Find alternative end-to-end workflows that satisfy all of these conditions:<br><br>1. The workflow covers:<br>&nbsp;&nbsp;&nbsp;- auth-heavy<br>&nbsp;&nbsp;&nbsp;- read-heavy<br>&nbsp;&nbsp;&nbsp;- transactional<br><br>2. The steps form a logically connected workflow rather than unrelated API calls.<br><br>3. Prefer workflows that are less obvious than the standard:<br>&nbsp;&nbsp;&nbsp;Login -> Browse/Search -> Add to Cart -> Checkout.<br><br>4. Every workflow must be implementable using actual documented EShop APIs.<br><br>5. Do not assume undocumented endpoints.<br><br>For each candidate, provide only:<br>- Workflow name<br>- Ordered steps<br>- API endpoints used<br>- Classification of each step as auth-heavy, read-heavy, or transactional<br>- Why the steps logically belong to the same workflow<br>- Any technical risk or missing API contract<br><br>Generate 5 candidate workflows.<br><br>Write the result to:<br>work/workflow_candidates.md<br><br>Do not modify the SUT.<br>Do not modify workflow_api_mapping.md. | **Clearly labelled verbatim excerpt from `work/workflow_candidates.md`:**<br>“## Candidate 1 — New Customer Onboarding and First Order”<br>“## Candidate 2 — Password Recovery Followed by Order Cancellation”<br>“## Candidate 3 — Repeat Purchase from Order History”<br>“## Candidate 4 — Admin Catalog Publication and Customer-Facing Verification”<br>“## Candidate 5 — Admin Order Fulfillment State Progression” | VALID | The output generated exactly five logically connected candidates, used documented endpoints, classified every step, and stated technical risks or missing contracts. That correctly fulfilled an exploratory candidate-generation prompt. A candidate later being rejected does not invalidate the candidate-set artifact. Evidence: `work/workflow_candidates.md` and HW05 specification Sections 5–6. | Manually reviewed all five candidates. Rejected Candidate 4 because admin CRUD was an ambiguous fit for the required transactional group, then selected Candidates 3 and 1 for runtime verification rather than accepting either design without evidence. |
| **Artifact #3 — Repeat Purchase runtime verification**<br>Tool: OpenAI Codex<br>Time: `[EXACT TIME UNAVAILABLE]`<br>Prompt (verbatim):<br>We have selected Candidate 3:<br><br>Repeat Purchase from Order History<br><br>Workflow:<br>Login<br>-> Read Order History<br>-> Read Order Detail<br>-> Read Product Detail<br>-> Add Product to Cart<br>-> Read Cart<br>-> Checkout<br><br>Do not create a JMeter test plan yet.<br><br>Your only goal in this step is to verify the real runtime API contract needed for this workflow.<br><br>Tasks:<br><br>1. Start the SUT if needed.<br><br>2. Use an existing user account that has at least one previous order.<br><br>3. Execute the workflow manually through the backend APIs.<br><br>4. Capture the real response structure for:<br>&nbsp;&nbsp;&nbsp;- POST /api/login<br>&nbsp;&nbsp;&nbsp;- GET /api/orders/my-orders<br>&nbsp;&nbsp;&nbsp;- GET /api/orders/:id<br>&nbsp;&nbsp;&nbsp;- GET /api/products/:id<br>&nbsp;&nbsp;&nbsp;- POST /api/cart<br>&nbsp;&nbsp;&nbsp;- GET /api/cart<br>&nbsp;&nbsp;&nbsp;- POST /api/checkout<br><br>5. Verify specifically whether GET /api/orders/:id exposes a product ID that can be reused in GET /api/products/:id.<br><br>6. Record the exact JSON paths needed for correlation, such as:<br>&nbsp;&nbsp;&nbsp;- JWT token<br>&nbsp;&nbsp;&nbsp;- order ID<br>&nbsp;&nbsp;&nbsp;- product ID<br>&nbsp;&nbsp;&nbsp;- product name<br>&nbsp;&nbsp;&nbsp;- product price<br><br>7. Record actual success HTTP status codes.<br><br>8. Do not modify the SUT source code.<br><br>9. Do not create performance test artifacts yet.<br><br>Write the findings to:<br>work/workflow3_runtime_contract.md | **Clearly labelled verbatim excerpt from `work/workflow3_runtime_contract.md`:**<br>“Product correlation result:<br><br>- `$.items` does not exist.<br>- `$.product_id` does not exist.<br>- `$.items[0].product_id` does not exist.<br>- No product name, product price, quantity, or other order-line field is returned.<br><br>**Conclusion:** Order Detail does not expose a product ID that can be reused in Product Detail. The required `Order Detail -> Product Detail` dependency fails at runtime.” | VALID | The output performed the requested runtime verification, recorded actual requests, responses, status codes, and JSON paths, and answered the central correlation question correctly. Runtime evidence showed that Order Detail contained no product data. The workflow's rejection was a student decision based on a valid AI-generated finding, not evidence that the verification artifact was invalid. Evidence: `work/workflow3_runtime_contract.md`. | Reviewed the captured responses and rejected Candidate 3 because the valid verification proved that Order Detail could not feed Product Detail. No JMeter plan was created from it. |
| **Artifact #4 — New Customer Onboarding runtime verification**<br>Tool: OpenAI Codex<br>Time: `[EXACT TIME UNAVAILABLE]`<br>Prompt (verbatim):<br>We have selected Candidate 1:<br><br>New Customer Onboarding and First Order<br><br>Workflow:<br>Register<br>-> Login<br>-> Read Profile<br>-> Update Profile<br>-> Read Categories<br>-> Read Products<br>-> Read Product Detail<br>-> Add Product to Cart<br>-> Checkout<br><br>Do not create a JMeter test plan yet.<br><br>Your only goal in this step is to verify that this workflow works end-to-end against the real runtime API.<br><br>Tasks:<br><br>1. Start the SUT if needed.<br><br>2. Register a new user with a unique email.<br><br>3. Execute the complete workflow directly through the backend APIs.<br><br>4. Capture the actual request and response structure for every endpoint in the workflow.<br><br>5. Record the actual HTTP success status code for every step.<br><br>6. Record the exact JSON paths needed to pass data between steps, including:<br>&nbsp;&nbsp;&nbsp;- registered email<br>&nbsp;&nbsp;&nbsp;- JWT token<br>&nbsp;&nbsp;&nbsp;- user ID if needed<br>&nbsp;&nbsp;&nbsp;- shipping address<br>&nbsp;&nbsp;&nbsp;- category ID if needed<br>&nbsp;&nbsp;&nbsp;- product ID<br>&nbsp;&nbsp;&nbsp;- product name<br>&nbsp;&nbsp;&nbsp;- product price<br><br>7. Verify whether the shipping address saved by PUT /api/users/me is actually used by Checkout automatically.<br><br>8. If Checkout still requires shipping_address in its request body, record that clearly.<br><br>9. Verify that the product selected from the product APIs can be used directly in POST /api/cart.<br><br>10. Verify the final Checkout succeeds for the newly registered user.<br><br>11. Identify any step where the logical dependency between two workflow steps fails.<br><br>12. Do not modify the SUT source code.<br><br>13. Do not create JMeter, CSV, Load, Stress, or Spike artifacts yet.<br><br>Write the findings to:<br>work/workflow1_runtime_contract.md | **Clearly labelled verbatim excerpt from `work/workflow1_runtime_contract.md`:**<br>“One logical dependency failed: the shipping address saved by `PUT /api/users/me` was **not** used automatically by Checkout. A Checkout request without `shipping_address` still returned HTTP `200`, but the created order stored `shipping_address: null`. Sending the saved address explicitly in the Checkout request created another order with the correct address.”<br><br>“Final verdict: Candidate 1 works end-to-end when the registered email is preserved for Login and the shipping address is explicitly copied into the Checkout request.” | VALID | The output completed the requested end-to-end runtime check, captured every workflow contract and success status, verified Product Detail-to-Cart correlation, and correctly discovered the non-automatic shipping-address behavior. The correction was itself a requested verification result, so it does not make the artifact incomplete. Evidence: `work/workflow1_runtime_contract.md`. | Accepted Candidate 1 after reviewing the valid runtime evidence. Preserved or reread `shipping_address`, included it explicitly in Checkout, required more than HTTP `200` as the correctness assertion, and recorded the workflow as authoritative in `AGENTS.md`. |

---

## 4. Summary of AI Accuracy

Aggregate the verdicts from Section 3 and complete the table below.

| Metric | Count | Percentage |
|---|---|---|
| **Total AI-generated artifacts audited** | 4 | 100% |
| **VALID (correct, accepted as-is)** | 4 | 100% |
| **INVALID (wrong; rejected)** | 0 | 0% |
| **INCOMPLETE (acceptable after edits)** | 0 | 0% |

---

## 5. Conclusion — When should AI be used (or not)?

Write 80–150 words describing patterns you observed. Where did AI shine? Where did AI fail? What is your recommendation for using AI in this kind of work in the future?

AI correctly fulfilled all four audited prompts: it mapped the documented APIs, generated five structured alternatives, and performed two runtime-contract investigations. Its value was strongest in expanding the option space and turning uncertain API dependencies into evidence. Candidate 3 was not selected, but its verification artifact remained valid because it correctly showed that Order Detail exposed no product data. Candidate 1 verification also remained valid because it discovered that Checkout did not reuse the saved profile address automatically. The student's role was therefore not to relabel accurate AI work as invalid when a workflow was rejected, but to interpret those valid findings, choose the defensible workflow, and require explicit shipping-address correlation. Future AI use should retain this pattern: generation, human review, runtime verification, then design selection.

---

## 6. Mandatory Disclosure (paste verbatim)

> "Workflow API mappings, workflow candidates, and runtime-contract reports were initially generated by OpenAI Codex; I reviewed and modified the workflow-selection and API-correlation sections, added runtime verification for order-product correlation and shipping-address propagation; the final workflow decision was written entirely by me. The detailed AI Audit Report is attached as Appendix A. I confirm I did not use AI to generate any artifact listed in the prohibited category."

### Signature

| Field | Value |
|---|---|
| **Student name (printed):** | Nguyen Bao Duy |
| **Student ID:** | 23127179 |
| **Class / Cohort:** | 23KTPM2 |
| **Course:** | Software Testing |
| **Instructor:** | `[INSTRUCTOR NAME REQUIRED]` |
| **Date:** | 2026-08-16 |
| **Signature:** | `[STUDENT SIGNATURE REQUIRED]` |

---

## References

- Kharbach, M. (2026). *AI Use Policy Templates for Higher Education.* CC BY-NC-SA 4.0.
- ISTQB Foundation Level Syllabus (latest version).
- Hardman, P. (2025). *A Post-AI Learning Taxonomy.*
- Fuster Rabella, M. (2025). OECD Education Working Paper No. 338.
- Perkins, M., Roe, J., & Furze, L. (2025). *AI Assessment Scale.*
- Anthropic (2025). *Building reliable AI test agents* — engineering blog.
- DeepEval & Promptfoo documentation — testing frameworks for LLM systems.
