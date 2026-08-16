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

### Verbatim Prompt Records

The audit rows reference these prompt records to keep the five-column table readable. The text inside each block is verbatim from the available chat history.

#### P1 — Initial workflow API mapping

```text
We have decided to use this end-to-end performance testing workflow:

Login
→ Search Product
→ View Product Detail
→ Add Product to Cart
→ Checkout

Do not create any test plan yet.

Read:
- eshop-sut/api_specification.md
- eshop-sut/README.md

For each step in the workflow, identify:
1. The exact API endpoint.
2. HTTP method.
3. Required request parameters/body.
4. Required authentication.
5. Important response fields that will be needed by later steps.

Also explain dependencies between steps, for example whether a product ID returned from Search is needed by Product Detail or Cart.

Write the result to:
work/workflow_api_mapping.md

Do not modify the SUT.
```

#### P2 — Alternative workflow candidates

```text
We want to replace the current workflow because:

Login -> Search Product -> View Product Detail -> Add to Cart -> Checkout

is too common and is very close to the example workflow in the homework specification.

Do not create or modify any test plan yet.

Read:
- eshop-sut/api_specification.md
- eshop-sut/README.md
- docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md

Find alternative end-to-end workflows that satisfy all of these conditions:

1. The workflow covers:
   - auth-heavy
   - read-heavy
   - transactional

2. The steps form a logically connected workflow rather than unrelated API calls.

3. Prefer workflows that are less obvious than the standard:
   Login -> Browse/Search -> Add to Cart -> Checkout.

4. Every workflow must be implementable using actual documented EShop APIs.

5. Do not assume undocumented endpoints.

For each candidate, provide only:
- Workflow name
- Ordered steps
- API endpoints used
- Classification of each step as auth-heavy, read-heavy, or transactional
- Why the steps logically belong to the same workflow
- Any technical risk or missing API contract

Generate 5 candidate workflows.

Write the result to:
work/workflow_candidates.md

Do not modify the SUT.
Do not modify workflow_api_mapping.md.
```

#### P3 — Repeat Purchase runtime verification

```text
We have selected Candidate 3:

Repeat Purchase from Order History

Workflow:
Login
-> Read Order History
-> Read Order Detail
-> Read Product Detail
-> Add Product to Cart
-> Read Cart
-> Checkout

Do not create a JMeter test plan yet.

Your only goal in this step is to verify the real runtime API contract needed for this workflow.

Tasks:

1. Start the SUT if needed.

2. Use an existing user account that has at least one previous order.

3. Execute the workflow manually through the backend APIs.

4. Capture the real response structure for:
   - POST /api/login
   - GET /api/orders/my-orders
   - GET /api/orders/:id
   - GET /api/products/:id
   - POST /api/cart
   - GET /api/cart
   - POST /api/checkout

5. Verify specifically whether GET /api/orders/:id exposes a product ID that can be reused in GET /api/products/:id.

6. Record the exact JSON paths needed for correlation, such as:
   - JWT token
   - order ID
   - product ID
   - product name
   - product price

7. Record actual success HTTP status codes.

8. Do not modify the SUT source code.

9. Do not create performance test artifacts yet.

Write the findings to:
work/workflow3_runtime_contract.md
```

#### P4 — New Customer Onboarding runtime verification

```text
We have selected Candidate 1:

New Customer Onboarding and First Order

Workflow:
Register
-> Login
-> Read Profile
-> Update Profile
-> Read Categories
-> Read Products
-> Read Product Detail
-> Add Product to Cart
-> Checkout

Do not create a JMeter test plan yet.

Your only goal in this step is to verify that this workflow works end-to-end against the real runtime API.

Tasks:

1. Start the SUT if needed.

2. Register a new user with a unique email.

3. Execute the complete workflow directly through the backend APIs.

4. Capture the actual request and response structure for every endpoint in the workflow.

5. Record the actual HTTP success status code for every step.

6. Record the exact JSON paths needed to pass data between steps, including:
   - registered email
   - JWT token
   - user ID if needed
   - shipping address
   - category ID if needed
   - product ID
   - product name
   - product price

7. Verify whether the shipping address saved by PUT /api/users/me is actually used by Checkout automatically.

8. If Checkout still requires shipping_address in its request body, record that clearly.

9. Verify that the product selected from the product APIs can be used directly in POST /api/cart.

10. Verify the final Checkout succeeds for the newly registered user.

11. Identify any step where the logical dependency between two workflow steps fails.

12. Do not modify the SUT source code.

13. Do not create JMeter, CSV, Load, Stress, or Spike artifacts yet.

Write the findings to:
work/workflow1_runtime_contract.md
```

| (1) Prompt + Tool | (2) AI Output | (3) Verdict | (4) Reasoning (ISTQB) | (5) Student Fix |
|---|---|---|---|---|
| **Artifact #1 — Initial workflow API mapping**<br>Tool: OpenAI Codex<br>Time: `[EXACT INTERACTION TIME REQUIRED FROM CHAT HISTORY]`<br>Prompt: P1 above | **Clearly labelled verbatim excerpt from the earlier generated artifact; `work/workflow_api_mapping.md` is currently missing from the filesystem:**<br>“The key correlation rules are:<br><br>1. Use the product `id` returned by Search in `/api/products/:id` and in the cart body.<br>2. Keep `id`, `name`, and `price` from the same selected product; do not combine fields from different search results.<br>3. Use the same user's JWT for Add to Cart and Checkout so both calls address the same authenticated cart.<br>4. Do not treat the client-supplied `total_amount` as the checkout oracle; the README makes the backend-recalculated cart total authoritative.” | INCOMPLETE | The endpoint mapping and dependency analysis were useful, but HW05 Section 5 warns that workflows must not be duplicated within the group, and Task 1 presents nearly the same path as its example. The design did not sufficiently address originality or likely duplication, so it was not suitable as the final workflow. | Rejected the original workflow and requested five less-obvious alternatives before any test plan was created. |
| **Artifact #2 — Alternative workflow candidates**<br>Tool: OpenAI Codex<br>Time: `[EXACT INTERACTION TIME REQUIRED FROM CHAT HISTORY]`<br>Prompt: P2 above | **Clearly labelled verbatim excerpt from `work/workflow_candidates.md`:**<br>“## Candidate 1 — New Customer Onboarding and First Order”<br>“## Candidate 2 — Password Recovery Followed by Order Cancellation”<br>“## Candidate 3 — Repeat Purchase from Order History”<br>“## Candidate 4 — Admin Catalog Publication and Customer-Facing Verification”<br>“## Candidate 5 — Admin Order Fulfillment State Progression” | INCOMPLETE | The candidate set broadened the design space and covered the three requested endpoint groups, but the homework's Human review principle requires AI output to be reviewed and corrected rather than accepted directly. Several candidates still depended on unverified response schemas or ambiguous endpoint-group classifications. | Manually reviewed each candidate, rejected ambiguous options, and selected Candidates 3 and 1 for separate runtime-contract checks before making a final decision. |
| **Artifact #3 — Admin Catalog Publication workflow candidate**<br>Tool: OpenAI Codex<br>Time: `[EXACT INTERACTION TIME REQUIRED FROM CHAT HISTORY]`<br>Prompt: P2 above | **Clearly labelled verbatim excerpt from `work/workflow_candidates.md`:**<br>“An administrator prepares a category, publishes a product into it, then verifies through the public catalog APIs that the product can be discovered and viewed. The admin JWT authorizes both create operations; the new category ID feeds Product Creation; and the created product ID feeds Product Detail.”<br><br>“The category-create and product-create response schemas are not documented, so IDs may need to be correlated by rereading lists with unique names.” | INCOMPLETE | The workflow was logically connected, but its classification of `POST /api/categories` and `POST /api/products` as the homework's transactional group was not sufficiently justified. HW05 Section 5 exemplifies the transactional group with cart, checkout, and order creation; it does not explicitly confirm that admin catalog CRUD is an equivalent choice. `[ISTQB / COURSE REFERENCE TO BE ADDED]` | Rejected this candidate rather than relying on an ambiguous interpretation of the required transactional endpoint group. |
| **Artifact #4 — Repeat Purchase from Order History workflow**<br>Tool: OpenAI Codex<br>Times: `[EXACT INTERACTION TIMES REQUIRED FROM CHAT HISTORY]`<br>Prompts: P2 and P3 above | **Clearly labelled verbatim excerpts:**<br>From `work/workflow_candidates.md`: “A returning customer uses purchase history to choose an item to buy again, verifies that product is still available, adds it to the current cart, checks the cart, and submits the repeat order. The prior order ID feeds Order Detail; a product ID from that order should feed Product Detail and Cart; and the authenticated cart feeds Checkout.”<br><br>From `work/workflow3_runtime_contract.md`: “**Conclusion:** Order Detail does not expose a product ID that can be reused in Product Detail. The required `Order Detail -> Product Detail` dependency fails at runtime.” | INVALID | Runtime evidence showed that `GET /api/orders/:id` returned only order metadata. `$.items`, `$.product_id`, and `$.items[0].product_id` did not exist, so the workflow's central correlation could not be implemented using the real API contract. A conceptually plausible sequence is invalid when a required runtime dependency is absent. | Executed the backend workflow manually, documented the response contract, and rejected Candidate 3. No JMeter plan was created from it. |
| **Artifact #5 — New Customer Onboarding and First Order workflow**<br>Tool: OpenAI Codex<br>Times: `[EXACT INTERACTION TIMES REQUIRED FROM CHAT HISTORY]`<br>Prompts: P2 and P4 above | **Clearly labelled verbatim excerpts:**<br>From `work/workflow_candidates.md`: “A new customer creates an account, completes the profile information needed for delivery, selects a product from the catalog, and places the first order. The registration credentials feed Login; the JWT feeds profile, cart, and checkout requests; the selected product feeds the cart; and the saved address feeds Checkout.”<br><br>From `work/workflow1_runtime_contract.md`: “Final verdict: Candidate 1 works end-to-end when the registered email is preserved for Login and the shipping address is explicitly copied into the Checkout request. It does not work as an automatic ‘saved address’ flow because that dependency is absent at runtime.” | INCOMPLETE | Runtime verification confirmed all workflow endpoints returned HTTP `200`, and Product Detail fields could feed Add to Cart. However, the initial dependency description was incomplete because Checkout did not automatically reuse the saved profile address. The workflow became acceptable only after the request contract was corrected. | Preserved the registration inputs for Login, explicitly carried `shipping_address` into Checkout, selected Candidate 1 as the authoritative workflow, and recorded the constraints in `AGENTS.md`. |
| **Artifact #6 — Runtime assumption about saved `shipping_address`**<br>Tool: OpenAI Codex<br>Times: `[EXACT INTERACTION TIMES REQUIRED FROM CHAT HISTORY]`<br>Prompts: P2 and P4 above | **Clearly labelled verbatim excerpts:**<br>From `work/workflow_candidates.md`: “the saved address feeds Checkout.”<br><br>From `work/workflow1_runtime_contract.md`: “Result: Checkout did not read `$.shipping_address` from the saved profile. It accepted the omitted field and created an incomplete order with a null address.” | INVALID | The assumed automatic data flow contradicted observed runtime behavior. HTTP `200` was not a sufficient correctness oracle because Checkout created an order with `shipping_address: null`. The runtime order response is stronger evidence than a design assumption. | Preserved or reread `$.shipping_address`, sent it explicitly in the Checkout body, and required an address-value assertion rather than checking HTTP `200` alone. |

---

## 4. Summary of AI Accuracy

Aggregate the verdicts from Section 3 and complete the table below.

| Metric | Count | Percentage |
|---|---|---|
| **Total AI-generated artifacts audited** | 6 | 100% |
| **VALID (correct, accepted as-is)** | 0 | 0% |
| **INVALID (wrong; rejected)** | 2 | 33.3% |
| **INCOMPLETE (acceptable after edits)** | 4 | 66.7% |

---

## 5. Conclusion — When should AI be used (or not)?

Write 80–150 words describing patterns you observed. Where did AI shine? Where did AI fail? What is your recommendation for using AI in this kind of work in the future?

AI was useful for exploring workflow candidates and identifying API dependencies, but its designs could not be trusted without runtime verification. Candidate 3 appeared logically coherent because an earlier order seemed likely to expose its purchased products. The real `GET /api/orders/:id` response contained no product or order-line data, so the essential correlation failed and the workflow was rejected. Candidate 1 was more viable, yet it became acceptable only after checking `shipping_address` behavior. The saved profile address was not reused automatically, and a successful HTTP response could still create an order with a null address. Future AI use should combine broad candidate generation with explicit human review, documented API evidence, and direct runtime checks before any performance test plan is produced.

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
