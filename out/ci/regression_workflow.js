// HW05 Task 3 — CI performance regression profile.
//
// Runs the frozen "New Customer Onboarding and First Order" workflow (Register -> Login ->
// Read Profile -> Update Profile -> Read Categories -> Read Products -> Read Product Detail
// -> Add Product to Cart -> Checkout) against a short, deterministic 3-VU profile so it fits
// inside a normal CI job. It shares the exact request/check logic and CSV contract used by
// the official Load/Stress/Spike/Soak scripts (out/23127179_*_20260817.js) via
// out/ci/lib/workflow_steps.js and out/ci/lib/csv_contract.js — nothing about the workflow
// itself is re-implemented or simplified.
//
// Scope of the enforced thresholds (see work/task3_continuous_performance_pipeline.md):
// - Correctness guards (http_req_failed, checks, workflow_success) are scenario-agnostic and
//   apply at any VU count.
// - Latency guards (p95 <= 25ms, p99 <= 50ms) are the HUMAN-APPROVED Task 2 regression guards,
//   established from Load/Stress/Spike/Soak runs (4-24 VUs) on this same hardware/dataset/
//   harness where tail latency did not scale materially with VU count. They are valid only
//   for this comparable harness/profile, not a business SLO.
// - Throughput/endurance guards (sustained req/s, clean workflow rate, early-to-late
//   degradation) require the full 12-VU/12-minute protocol and are intentionally NOT
//   evaluated here; see out/ci/evaluate_endurance.js and the dedicated endurance CI job.
import { Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { open } from 'k6/experimental/fs';
import csv from 'k6/experimental/csv';
import { validateWorkflowCsv } from './lib/csv_contract.js';
import { runWorkflow } from './lib/workflow_steps.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const RUN_ID = __ENV.K6_RUN_ID || '';
const CSV_PATH = __ENV.WORKFLOW_CSV_PATH || './user_workflow_data.csv';

if (!/^[a-z0-9]{8,20}$/.test(RUN_ID)) {
  throw new Error('K6_RUN_ID must match ^[a-z0-9]{8,20}$ and be unique for this invocation');
}

const dataFile = await open(CSV_PATH);
const rows = await csv.parse(dataFile, { asObjects: true });
validateWorkflowCsv(rows);

export const options = {
  scenarios: {
    ci_regression: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 3 },
        { duration: '45s', target: 3 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '15s',
      gracefulStop: '15s',
      tags: { test_phase: 'ci_regression' },
    },
  },
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
    workflow_success: ['rate==1'],
    // HUMAN-APPROVED Task 2 regression guards; see file header for scope.
    http_req_duration: ['p(95)<=25', 'p(99)<=50'],
  },
  summaryTrendStats: ['avg', 'min', 'p(50)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const workflowSuccess = new Rate('workflow_success');
const trends = {
  register: new Trend('latency_register_ms', true),
  login: new Trend('latency_login_ms', true),
  readProfile: new Trend('latency_read_profile_ms', true),
  updateProfile: new Trend('latency_update_profile_ms', true),
  readCategories: new Trend('latency_read_categories_ms', true),
  readProducts: new Trend('latency_read_products_ms', true),
  readProductDetail: new Trend('latency_read_product_detail_ms', true),
  addToCart: new Trend('latency_add_to_cart_ms', true),
  checkout: new Trend('latency_checkout_ms', true),
};

export default function () {
  const iterationId = exec.scenario.iterationInTest;
  const row = rows[iterationId % rows.length];
  const quantity = Number.parseInt(row.quantity, 10);
  const email = `hw05.ci.${RUN_ID}.v${exec.vu.idInTest}.i${iterationId}.${row.identity_seed}@example.test`;

  runWorkflow({ BASE_URL, email, row, quantity, workflowSuccess, trends });
}
