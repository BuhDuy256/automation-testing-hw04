# HW05 Context Handoff

## Current phase

Workflow selection and runtime API verification are complete. The next phase is CSV/test-data design for the selected workflow. No CSV schema, CSV data, k6 script, executor choice, or Load/Stress/Spike workload model has been designed yet.

Use **k6** for HW05 performance testing instead of JMeter. Interpret assignment requirements using their k6 equivalents when implementation begins.

## Final workflow decision

The authoritative workflow is **New Customer Onboarding and First Order**:

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

This workflow already covers the required auth-heavy, read-heavy, and transactional endpoint groups. Do not redesign it or restart candidate selection unless new blocking evidence is discovered.

## Verified runtime facts

- The complete workflow succeeded against the backend; every workflow endpoint returned HTTP `200` in the verification run.
- Registration requires a unique email. Registered users persist for the current SUT run.
- Register does not return the submitted email or password, so those original input values must be retained for Login.
- Login returns the JWT at `$.token`. Authenticated Profile, Cart, and Checkout requests use that token.
- `PUT /api/users/me` persists `shipping_address`, but Checkout does not automatically reuse it.
- Checkout must receive `shipping_address` explicitly to store it on the order. Omitting it still returns HTTP `200` but creates an order with `shipping_address: null`.
- Categories and Products can be correlated through `category_id`.
- Product Detail fields `$.id`, `$.name`, and `$.price` were accepted directly by Add to Cart.
- Checkout creates persistent order data for the current SUT run.
- Separate virtual users must not share account, cart, or order state.
- Restarting the backend reseeds the database and removes runtime-created users and orders.

These are established runtime facts, not pending design questions.

## Authoritative sources

- `AGENTS.md` — selected workflow, verified constraints, project layout, language rules, and commit discipline.
- `work/workflow1_runtime_contract.md` — authoritative runtime requests, responses, status codes, JSON paths, and dependency results for the selected workflow.
- `work/workflow_candidates.md` — candidate-generation record and original workflow rationale; runtime evidence takes precedence where assumptions differ.
- `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md` — authoritative HW05 requirements, including the data-driven workflow requirement and permission to use k6.
- `eshop-sut/api_specification.md` and `eshop-sut/README.md` — documented API and feature contracts; observed runtime behavior is recorded in `work/workflow1_runtime_contract.md`.

`AGENTS.md` also names `work/workflow_api_mapping.md`, but that file is currently absent. Its absence does not invalidate the selected workflow because the selected workflow has direct runtime evidence.

## Work that must not be repeated

- Do not generate another set of workflow candidates.
- Do not reconsider the previously rejected workflows without new evidence.
- Do not repeat manual runtime verification of the selected workflow unless a later change or failure makes re-verification necessary.
- Do not reinvestigate whether Checkout automatically reads the saved profile address; it does not.
- Do not create CSV files or k6 scripts as part of loading this handoff.

## Repository rules

- Do not modify the SUT.
- Keep intermediate work and drafts under `work/`.
- Put only reviewed, finalized submission artifacts under `out/`.
- Do not modify the frozen `references/hw04/` baseline.
- Use English for repository artifacts and Vietnamese for chat responses.
- Preserve AI-generated work and human review evidence for the mandatory AI Audit Report; do not fabricate prompts, outputs, times, or conclusions.
- Use separate commits for meaningful HW05 milestones. Do not update `out/git_commit_log.txt` until final submission preparation.
