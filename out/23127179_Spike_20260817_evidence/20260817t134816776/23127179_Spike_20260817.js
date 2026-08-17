import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';
import { open } from 'k6/experimental/fs';
import csv from 'k6/experimental/csv';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const RUN_ID = __ENV.K6_RUN_ID || '';

if (!/^[a-z0-9]{8,20}$/.test(RUN_ID)) {
  throw new Error('K6_RUN_ID must match ^[a-z0-9]{8,20}$ and be unique for this invocation');
}

const dataFile = await open('./user_workflow_data.csv');
const rows = await csv.parse(dataFile, { asObjects: true });
const expectedHeaders = ['identity_seed', 'name', 'password', 'phone', 'shipping_address', 'quantity'];

if (rows.length === 0) {
  throw new Error('CSV must contain at least one data row');
}

const actualHeaders = Object.keys(rows[0]);
if (
  actualHeaders.length !== expectedHeaders.length ||
  expectedHeaders.some((header) => !actualHeaders.includes(header))
) {
  throw new Error(`CSV header must be exactly: ${expectedHeaders.join(',')}`);
}

const seenSeeds = {};
for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  if (Object.keys(row).length !== expectedHeaders.length) {
    throw new Error(`CSV row ${index + 2} must contain exactly six fields`);
  }
  if (!/^[a-z][a-z0-9]{0,11}$/.test(row.identity_seed)) {
    throw new Error(`Invalid identity_seed at CSV row ${index + 2}`);
  }
  if (seenSeeds[row.identity_seed]) {
    throw new Error(`Duplicate identity_seed: ${row.identity_seed}`);
  }
  seenSeeds[row.identity_seed] = true;
  if (!row.name.trim() || !row.shipping_address.trim()) {
    throw new Error(`Name and shipping_address must be non-empty at CSV row ${index + 2}`);
  }
  if (!/^0[0-9]{9,10}$/.test(row.phone)) {
    throw new Error(`Invalid phone at CSV row ${index + 2}`);
  }
  if (
    row.password.length < 8 ||
    !/[A-Z]/.test(row.password) ||
    !/[a-z]/.test(row.password) ||
    !/[0-9]/.test(row.password) ||
    !/[^A-Za-z0-9]/.test(row.password)
  ) {
    throw new Error(`Invalid password at CSV row ${index + 2}`);
  }
  const quantity = Number.parseInt(row.quantity, 10);
  if (!/^[0-9]+$/.test(row.quantity) || !Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity at CSV row ${index + 2}`);
  }
}

const STEPS = [
  'register',
  'login',
  'read_profile',
  'update_profile',
  'read_categories',
  'read_products',
  'read_product_detail',
  'add_to_cart',
  'checkout',
];

const SPIKE_PHASES = [
  { name: 'warmup_4', targetVUs: 4, startMs: 0, endMs: 20_000 },
  { name: 'pre_spike_steady_4', targetVUs: 4, startMs: 20_000, endMs: 60_000 },
  { name: 'spike_transition_4_to_32', targetVUs: 32, startMs: 60_000, endMs: 61_000 },
  { name: 'spike_peak_32', targetVUs: 32, startMs: 61_000, endMs: 106_000 },
  { name: 'recovery_transition_32_to_4', targetVUs: 4, startMs: 106_000, endMs: 107_000 },
  { name: 'recovery_settling_4', targetVUs: 4, startMs: 107_000, endMs: 137_000 },
  { name: 'recovery_steady_4', targetVUs: 4, startMs: 137_000, endMs: 197_000 },
  { name: 'final_rampdown_4_to_0', targetVUs: 0, startMs: 197_000, endMs: 227_000 },
];

const METRIC_PHASES = SPIKE_PHASES;

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 4,
      stages: [
        { duration: '60s', target: 4 },
        { duration: '1s', target: 32 },
        { duration: '45s', target: 32 },
        { duration: '1s', target: 4 },
        { duration: '90s', target: 4 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
      tags: { test_phase: 'official_spike' },
    },
  },
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
    workflow_success: ['rate==1'],
  },
  summaryTrendStats: ['avg', 'min', 'p(50)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const workflowSuccess = new Rate('workflow_success');
const crossPhaseIterations = new Counter('spike_cross_phase_iterations');

const endpointLatency = {
  register: new Trend('latency_register_ms', true),
  login: new Trend('latency_login_ms', true),
  read_profile: new Trend('latency_read_profile_ms', true),
  update_profile: new Trend('latency_update_profile_ms', true),
  read_categories: new Trend('latency_read_categories_ms', true),
  read_products: new Trend('latency_read_products_ms', true),
  read_product_detail: new Trend('latency_read_product_detail_ms', true),
  add_to_cart: new Trend('latency_add_to_cart_ms', true),
  checkout: new Trend('latency_checkout_ms', true),
};

const phaseMetrics = {};
for (const phase of METRIC_PHASES) {
  const prefix = `spike_${phase.name}`;
  const stepLatency = {};
  const stepRequests = {};
  for (const step of STEPS) {
    stepLatency[step] = new Trend(`${prefix}_latency_${step}_ms`, true);
    stepRequests[step] = new Counter(`${prefix}_requests_${step}`);
  }
  phaseMetrics[phase.name] = {
    httpDuration: new Trend(`${prefix}_http_duration_ms`, true),
    httpRequests: new Counter(`${prefix}_http_requests`),
    httpFailureRate: new Rate(`${prefix}_http_failure_rate`),
    httpFailures: new Counter(`${prefix}_http_failures`),
    checks: new Rate(`${prefix}_checks`),
    workflowSuccess: new Rate(`${prefix}_workflow_success`),
    workflowsCompleted: new Counter(`${prefix}_workflows_completed`),
    iterationDuration: new Trend(`${prefix}_iteration_duration_ms`, true),
    stepLatency,
    stepRequests,
  };
}

function currentSpikePhase() {
  const elapsedMs = Math.max(0, Date.now() - exec.scenario.startTime);
  for (const phase of SPIKE_PHASES) {
    if (elapsedMs >= phase.startMs && elapsedMs < phase.endMs) {
      return phase;
    }
  }
  return {
    name: 'graceful_completion',
    targetVUs: 0,
    startMs: 227_000,
    endMs: Number.POSITIVE_INFINITY,
  };
}

function parseJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

function requestParams(step, token, phase) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  exec.vu.tags.spike_phase = phase.name;
  exec.vu.tags.target_vus = String(phase.targetVUs);
  return {
    headers,
    tags: { step, spike_phase: phase.name, target_vus: String(phase.targetVUs) },
  };
}

function recordResponse(response, step, phase) {
  const tags = { step, spike_phase: phase.name, target_vus: String(phase.targetVUs) };
  endpointLatency[step].add(response.timings.duration, tags);
  const metrics = phaseMetrics[phase.name];
  if (!metrics) {
    return;
  }
  const failed = response.status !== 200;
  metrics.httpDuration.add(response.timings.duration, tags);
  metrics.httpRequests.add(1, tags);
  metrics.httpFailureRate.add(failed, tags);
  metrics.stepLatency[step].add(response.timings.duration, tags);
  metrics.stepRequests[step].add(1, tags);
  if (failed) {
    metrics.httpFailures.add(1, tags);
  }
}

function trackedCheck(value, definitions, step, phase) {
  const tags = { step, spike_phase: phase.name, target_vus: String(phase.targetVUs) };
  const metrics = phaseMetrics[phase.name];
  let allPassed = true;
  for (const name of Object.keys(definitions)) {
    const oneCheck = {};
    oneCheck[name] = definitions[name];
    const passed = check(value, oneCheck, tags);
    if (metrics) {
      metrics.checks.add(passed, tags);
    }
    if (!passed) {
      allPassed = false;
    }
  }
  return allPassed;
}

function randomPause(minSeconds, maxSeconds) {
  const seconds = minSeconds + Math.random() * (maxSeconds - minSeconds);
  sleep(seconds);
}

function finishWorkflow(success, iterationStartedAt, iterationStartPhase) {
  const phase = currentSpikePhase();
  const tags = { spike_phase: phase.name, target_vus: String(phase.targetVUs) };
  exec.vu.tags.spike_phase = phase.name;
  exec.vu.tags.target_vus = String(phase.targetVUs);
  workflowSuccess.add(success, tags);

  const metrics = phaseMetrics[phase.name];
  if (metrics) {
    metrics.workflowSuccess.add(success, tags);
    if (success) {
      metrics.workflowsCompleted.add(1, tags);
    }
    if (iterationStartPhase === phase.name) {
      metrics.iterationDuration.add(Date.now() - iterationStartedAt, tags);
    }
  }

  if (iterationStartPhase !== phase.name) {
    crossPhaseIterations.add(1, {
      start_phase: iterationStartPhase,
      end_phase: phase.name,
      workflow_result: success ? 'success' : 'failure',
    });
  }
}

export default function () {
  const iterationStartedAt = Date.now();
  const iterationStart = currentSpikePhase();
  const iterationStartPhase = iterationStart.name;
  exec.vu.tags.spike_phase = iterationStartPhase;
  exec.vu.tags.target_vus = String(iterationStart.targetVUs);

  const iterationId = exec.scenario.iterationInTest;
  const row = rows[iterationId % rows.length];
  const quantity = Number.parseInt(row.quantity, 10);
  const email = `hw05.${RUN_ID}.${exec.scenario.name}.v${exec.vu.idInTest}.i${iterationId}.${row.identity_seed}@example.test`;

  const registerPayload = {
    name: row.name,
    email,
    password: row.password,
  };
  const registerPhase = currentSpikePhase();
  const registerResponse = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify(registerPayload),
    requestParams('register', null, registerPhase),
  );
  recordResponse(registerResponse, 'register', registerPhase);
  const registerBody = parseJson(registerResponse);
  if (!trackedCheck(registerResponse, {
    'register status is 200': (response) => response.status === 200,
    'register message is correct': () => registerBody?.message === 'User registered successfully',
    'register user id is positive': () => Number.isInteger(registerBody?.id) && registerBody.id > 0,
  }, 'register', registerPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  randomPause(1, 2);

  const loginPhase = currentSpikePhase();
  const loginResponse = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password: row.password }),
    requestParams('login', null, loginPhase),
  );
  recordResponse(loginResponse, 'login', loginPhase);
  const loginBody = parseJson(loginResponse);
  if (!trackedCheck(loginResponse, {
    'login status is 200': (response) => response.status === 200,
    'login token is present': () => typeof loginBody?.token === 'string' && loginBody.token.length > 0,
    'login email matches registration': () => loginBody?.user?.email === email,
    'login user id matches registration': () => loginBody?.user?.id === registerBody.id,
  }, 'login', loginPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }
  const token = loginBody.token;

  const profilePhase = currentSpikePhase();
  const profileResponse = http.get(
    `${BASE_URL}/api/users/me`,
    requestParams('read_profile', token, profilePhase),
  );
  recordResponse(profileResponse, 'read_profile', profilePhase);
  const profileBody = parseJson(profileResponse);
  if (!trackedCheck(profileResponse, {
    'profile status is 200': (response) => response.status === 200,
    'profile email matches registration': () => profileBody?.email === email,
    'profile user id matches registration': () => profileBody?.id === registerBody.id,
  }, 'read_profile', profilePhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  randomPause(3, 5);

  const profilePayload = {
    name: row.name,
    phone: row.phone,
    shipping_address: row.shipping_address,
  };
  const updatePhase = currentSpikePhase();
  if (!trackedCheck(profilePayload, {
    'profile payload has CSV name': (value) => value.name === row.name && value.name.length > 0,
    'profile payload has CSV phone': (value) => value.phone === row.phone,
    'profile payload has CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
  }, 'update_profile', updatePhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }
  const updateResponse = http.put(
    `${BASE_URL}/api/users/me`,
    JSON.stringify(profilePayload),
    requestParams('update_profile', token, updatePhase),
  );
  recordResponse(updateResponse, 'update_profile', updatePhase);
  const updateBody = parseJson(updateResponse);
  if (!trackedCheck(updateResponse, {
    'profile update status is 200': (response) => response.status === 200,
    'profile update message is correct': () => updateBody?.message === 'Profile updated',
  }, 'update_profile', updatePhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  const categoriesPhase = currentSpikePhase();
  const categoriesResponse = http.get(
    `${BASE_URL}/api/categories`,
    requestParams('read_categories', null, categoriesPhase),
  );
  recordResponse(categoriesResponse, 'read_categories', categoriesPhase);
  const categoriesBody = parseJson(categoriesResponse);
  const selectedCategory = Array.isArray(categoriesBody) ? categoriesBody[0] : null;
  if (!trackedCheck(categoriesResponse, {
    'categories status is 200': (response) => response.status === 200,
    'categories array is non-empty': () => Array.isArray(categoriesBody) && categoriesBody.length > 0,
    'selected category id is positive': () => Number.isInteger(selectedCategory?.id) && selectedCategory.id > 0,
  }, 'read_categories', categoriesPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  const productsPhase = currentSpikePhase();
  const productsResponse = http.get(
    `${BASE_URL}/api/products`,
    requestParams('read_products', null, productsPhase),
  );
  recordResponse(productsResponse, 'read_products', productsPhase);
  const productsBody = parseJson(productsResponse);
  const selectedProduct = Array.isArray(productsBody)
    ? productsBody.find((product) => product.category_id === selectedCategory.id)
    : null;
  if (!trackedCheck(productsResponse, {
    'products status is 200': (response) => response.status === 200,
    'products array is non-empty': () => Array.isArray(productsBody) && productsBody.length > 0,
    'matching product exists': () => Number.isInteger(selectedProduct?.id) && selectedProduct.id > 0,
  }, 'read_products', productsPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  randomPause(2, 4);

  const detailPhase = currentSpikePhase();
  const detailResponse = http.get(
    `${BASE_URL}/api/products/${selectedProduct.id}`,
    requestParams('read_product_detail', null, detailPhase),
  );
  recordResponse(detailResponse, 'read_product_detail', detailPhase);
  const detailBody = parseJson(detailResponse);
  if (!trackedCheck(detailResponse, {
    'product detail status is 200': (response) => response.status === 200,
    'product detail id matches selection': () => detailBody?.id === selectedProduct.id,
    'product detail category matches selection': () => detailBody?.category_id === selectedCategory.id,
    'product detail name is non-empty': () => typeof detailBody?.name === 'string' && detailBody.name.length > 0,
    'product detail price is positive numeric': () => typeof detailBody?.price === 'number' && detailBody.price > 0,
  }, 'read_product_detail', detailPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  randomPause(2, 4);

  const cartPayload = {
    id: detailBody.id,
    name: detailBody.name,
    price: detailBody.price,
    quantity,
  };
  const cartPhase = currentSpikePhase();
  if (!trackedCheck(cartPayload, {
    'cart payload preserves product detail': (value) => value.id === detailBody.id && value.name === detailBody.name && value.price === detailBody.price,
    'cart payload quantity is CSV quantity': (value) => value.quantity === quantity && value.quantity > 0,
  }, 'add_to_cart', cartPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }
  const cartResponse = http.post(
    `${BASE_URL}/api/cart`,
    JSON.stringify(cartPayload),
    requestParams('add_to_cart', token, cartPhase),
  );
  recordResponse(cartResponse, 'add_to_cart', cartPhase);
  const cartBody = parseJson(cartResponse);
  if (!trackedCheck(cartResponse, {
    'add to cart status is 200': (response) => response.status === 200,
    'add to cart message is correct': () => cartBody?.message === 'Added to cart',
  }, 'add_to_cart', cartPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  randomPause(1, 3);

  const checkoutPayload = {
    shipping_address: row.shipping_address,
    total_amount: detailBody.price * quantity,
  };
  const checkoutPhase = currentSpikePhase();
  if (!trackedCheck(checkoutPayload, {
    'checkout payload has exact CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
    'checkout total is correlated and positive': (value) => value.total_amount === detailBody.price * quantity && value.total_amount > 0,
  }, 'checkout', checkoutPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }
  const checkoutResponse = http.post(
    `${BASE_URL}/api/checkout`,
    JSON.stringify(checkoutPayload),
    requestParams('checkout', token, checkoutPhase),
  );
  recordResponse(checkoutResponse, 'checkout', checkoutPhase);
  const checkoutBody = parseJson(checkoutResponse);
  if (!trackedCheck(checkoutResponse, {
    'checkout status is 200': (response) => response.status === 200,
    'checkout message is correct': () => checkoutBody?.message === 'Checkout successful',
    'checkout order id is positive': () => Number.isInteger(checkoutBody?.orderId) && checkoutBody.orderId > 0,
  }, 'checkout', checkoutPhase)) {
    finishWorkflow(false, iterationStartedAt, iterationStartPhase);
    return;
  }

  finishWorkflow(true, iterationStartedAt, iterationStartPhase);
}
