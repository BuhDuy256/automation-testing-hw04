# HW05 Performance Testing on EShop

## Project Context

- **Course:** Software Testing - HW05 Performance Testing (AI-first)
- **Student:** Nguyen Bao Duy - 23127179 - 23KTPM2
- **Active branch:** `hw05-performance`
- **HW04 baseline:** frozen at tag `hw04-complete`; do not modify files under `references/hw04/`
- **SUT:** EShop, a Vietnamese e-commerce demo application
- **HW05 requirement:** `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
- **Allowed tools:** Apache JMeter (default) or k6, an AI tool, and a resource monitor

## Chat Language and Explanation Style

- Always respond in Vietnamese during chat sessions.
- Explain concepts as if the user is a complete beginner.
- Explain each idea in one short, simple sentence.
- This Vietnamese language rule applies only to chat responses.
- Write all project outputs, including code, filenames, comments, documentation, reports, and other artifacts, in English.

## Authoritative Inputs

| File | Purpose |
|---|---|
| `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md` | Full HW05 assignment specification |
| `eshop-sut/README.md` | SUT feature specifications |
| `eshop-sut/api_specification.md` | Backend API endpoints and validation rules |
| `eshop-sut/setup_guide.md` | How to run the SUT |
| `references/hw04/` | Completed HW04 automation, reports, and requirements for reference only |
| `references/hw2/` | Local HW02 material used only when needed for historical context |

## Selected HW05 Performance Workflow

This is the current authoritative HW05 workflow unless explicitly changed later.

**Workflow name:** New Customer Onboarding and First Order

`Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail -> Add Product to Cart -> Checkout`

Verified runtime constraints:

1. Every test user needs a unique email because registration requires email uniqueness.
2. Register creates persistent user data for the current SUT run.
3. Checkout creates persistent order data for the current SUT run.
4. Register does not return the email or password; preserve the original inputs for Login.
5. Login returns the JWT at `$.token`; reuse it for authenticated Profile, Cart, and Checkout requests.
6. `PUT /api/users/me` persists `shipping_address`, but Checkout does not read it automatically.
7. Preserve or reread `shipping_address` and include it explicitly in the Checkout request.
8. Checkout accepts an omitted `shipping_address` and creates an order with `shipping_address = null`; HTTP 200 alone is not a sufficient correctness assertion.
9. Keep Category and Product selection logically correlated through `category_id`.
10. Use Product Detail fields `$.id`, `$.name`, and `$.price` as the authoritative runtime values for Add to Cart.
11. Give each virtual user an isolated account to prevent cart and order state interference.
12. Restarting the backend reseeds the database and removes runtime-created users and orders.

Authoritative verification artifacts:

- `work/workflow_api_mapping.md`
- `work/workflow_candidates.md`
- `work/workflow3_runtime_contract.md`
- `work/workflow1_runtime_contract.md`

## Repository Workflow

- `references/hw04/` is frozen reference material. Do not add HW05 work there.
- `work/` contains intermediate plans, drafts, raw experiments, exploratory logs, and temporary evidence.
- `out/` contains only finalized files intended for the HW05 submission ZIP.
- `eshop-sut/` is the shared system under test and remains at the repository root.
- Keep required HW05 evidence (`.jtl`, HTML reports, screenshots, hardware reports, and test plans) in `out/` once finalized; do not ignore it.

## HW05 Required Outputs

The root `out/` directory should contain, as applicable:

- Three test plans named `23127179_{Load|Stress|Spike}_YYYYMMDD`.
- CSV-driven workflow data.
- Three raw `.jtl` logs and three HTML report folders.
- Resource-monitor captures and hardware specifications.
- Endurance/soak-test results with concrete threshold numbers.
- AI Audit Report and 200-300 word AI Critique.
- Continuous performance-testing proposal with flowchart and trade-offs.
- Bug reports with screenshots, demo video link, README summary, and Git commit log.

All three scenarios must exercise one end-to-end workflow covering auth-heavy, read-heavy, and transactional endpoint groups. Review AI-generated plans before execution and record corrections and metric misinterpretations using the raw logs.

## Running the SUT

```bash
./run.sh start    # boots backend :3000 + frontend-web :5173 + frontend-admin :5174
./run.sh status
./run.sh stop
```

The backend re-seeds the database on every start. Restarting it wipes users, orders, and admin-created products.

Test accounts:

- Admin: `admin@eshop.com` / `Admin123!`
- User: `test@eshop.com` / `Test1234!`

## Commit Discipline

- Keep HW04 unchanged and use `references/hw04/` only as a reference.
- Create a separate commit for each meaningful HW05 step, such as each test plan, execution evidence, AI analysis, and continuous-testing proposal.
- Update `out/git_commit_log.txt` from the final HW05 branch history before submission.
