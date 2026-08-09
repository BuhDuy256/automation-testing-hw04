# CLAUDE.md — HW04 Automation Testing on EShop

## Project Context

- **Course:** Software Testing — HW04 Automation Testing (AI-first)
- **SUT:** EShop (Vietnamese e-commerce demo, intentionally buggy)
- **Student:** Nguyen Bao Duy — 23127179 — 23KTPM2
- **Your 3 features (one per pool, same trio as HW02):**
  - **FR-04** — Personal Profile Management (Pool A)
  - **FR-08** — Checkout (Pool B)
  - **FR-15** — Product Management CRUD (Pool C, admin)
- **Tooling:** Playwright (TypeScript), HTML reporter, 3 browsers (Chromium/Firefox/WebKit)

---

## Input Documents (Read These First)

| File | Purpose |
|---|---|
| `docs/hw04-req/2026.HW04.Automation Testing_En.md` | Full HW04 assignment spec |
| `eshop-sut/README.md` | Feature specifications (FR-01–FR-20), Vietnamese |
| `eshop-sut/api_specification.md` | Backend API details and validation rules |
| `eshop-sut/setup_guide.md` | How to run the system manually |
| `references/hw2/eshop-sut-hw2-testing/out/reports/FR-{04,08,15}-*/` | HW02 domain-testing + BVA test cases for these same 3 features — the source test-case list to convert into automation scripts (Task 1 says "convert ≥12 test cases into automation scripts") |

`references/` is HW02 material kept for local reference only — it is gitignored, not part of this submission.

---

## Output Documents (Write These During Homework)

### Root outputs (`out/`)
| File | Purpose |
|---|---|
| `out/README.md` | Self-assessment table + test summary report |
| `out/ai-critique.md` | AI Critique (200–300 words) |
| `out/git_commit_log.txt` | Git commit log — populate with `git log --oneline` before submission |
| `out/ai-declaration/[AI-02]...md` | AI Audit Report — log every AI interaction |
| `out/reports/FR-0X-*/` | Copies of the multi-browser HTML reports + bug reports, mirrored for submission |

### Automation project (`automation/`)
| Path | Purpose |
|---|---|
| `automation/playwright.config.ts` | 3-browser config + HTML reporter ("Run by: 23127179" + ISO timestamp) |
| `automation/tests/fr-04-profile/*.spec.ts` | FR-04 automation scripts |
| `automation/tests/fr-08-checkout/*.spec.ts` | FR-08 automation scripts |
| `automation/tests/fr-15-product-crud/*.spec.ts` | FR-15 automation scripts |
| `automation/data/fr-0X-*.csv\|json` | Data-driven test data (never hardcode arrays in specs) |

Each feature needs ≥12 automated test cases, ≥3 distinct assertion patterns, and a run on all 3 browsers (≥9 browser runs total).

---

## Running the System

```bash
# Backend
cd eshop-sut/backend && npm install && node database.js && node server.js   # http://localhost:3000

# Frontend Web (customer-facing — FR-04, FR-08)
cd eshop-sut/frontend-web && npm install && npm run dev                     # http://localhost:5173

# Frontend Admin (FR-15)
cd eshop-sut/frontend-admin && npm install && npm run dev                   # http://localhost:5174
```

**Test Accounts:**
- Admin: `admin@eshop.com` / `Admin123!`
- User: `test@eshop.com` / `Test1234!`

## Running the automation suite

```bash
cd automation
npm install
npx playwright install          # first time only
npm test                        # all 3 browsers, all 3 features
npm run report                  # open the last HTML report
```
