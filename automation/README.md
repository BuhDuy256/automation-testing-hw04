# EShop Automation Suite (HW04)

Playwright + TypeScript automation for 3 EShop web features:

| Folder | Feature | Pool | SUT app |
|---|---|---|---|
| `tests/fr-04-profile` | FR-04 Personal Profile Management | A | frontend-web (`:5173`) |
| `tests/fr-08-checkout` | FR-08 Checkout | B | frontend-web (`:5173`) |
| `tests/fr-15-product-crud` | FR-15 Product Management CRUD | C | frontend-admin (`:5174`) |

## Prerequisites

The SUT must be running (see repo root `CLAUDE.md` for start commands):
- Backend on `http://localhost:3000`
- Frontend Web on `http://localhost:5173`
- Frontend Admin on `http://localhost:5174`

## Setup

```bash
npm install
npx playwright install   # downloads Chromium/Firefox/WebKit
```

## Run

```bash
npm test                 # all features, all 3 browsers
npm run test:chromium    # single browser
npm run report           # open the last HTML report
```

## Conventions

- **Data-driven:** test data lives in `data/*.csv` or `data/*.json` — never hardcoded inline in a spec.
- **Assertions:** each feature's spec set uses at least 3 distinct assertion patterns (e.g. UI state assertion, API response assertion, DB/persisted-state assertion via re-fetch).
- **Run-by stamp:** every spec must `import { test, expect } from '../../fixtures/base'` (not directly from `@playwright/test`) so the "Run by: {StudentID}" annotation + ISO timestamp is attached automatically, and the HTML report title carries it too (`playwright.config.ts`).
