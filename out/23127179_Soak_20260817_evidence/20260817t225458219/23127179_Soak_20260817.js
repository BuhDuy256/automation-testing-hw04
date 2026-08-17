import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
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

const SOAK_WINDOWS = [
  { name: 'warmup_entry', startMs: 0, endMs: 60_000 },
  { name: 'early_steady', startMs: 60_000, endMs: 300_000 },
  { name: 'middle_steady', startMs: 300_000, endMs: 540_000 },
  { name: 'late_steady', startMs: 540_000, endMs: 780_000 },
  { name: 'exit_ramp', startMs: 780_000, endMs: 810_000 },
];

export const options = {
  scenarios: {
    soak: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '60s', target: 12 },
        { duration: '720s', target: 12 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
      tags: { test_phase: 'official_soak' },
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
const completedWorkflows = new Counter('soak_completed_workflows');
const crossWindowIterations = new Counter('soak_cross_window_iterations');
const sameWindowIterationDuration = new Trend('soak_same_window_iteration_duration_ms', true);
const actualVUs = new Gauge('soak_actual_vus');

function currentSoakWindow() {
  const elapsedMs = Math.max(0, Date.now() - exec.scenario.startTime);
  for (const window of SOAK_WINDOWS) {
    if (elapsedMs >= window.startMs && elapsedMs < window.endMs) {
      return window.name;
    }
  }
  return 'graceful_completion';
}

function targetVUsAt(elapsedMs) {
  if (elapsedMs < 60_000) {
    return Math.min(12, Math.max(1, Math.ceil(1 + (11 * elapsedMs) / 60_000)));
  }
  if (elapsedMs < 780_000) {
    return 12;
  }
  if (elapsedMs < 810_000) {
    return Math.max(0, Math.ceil((12 * (810_000 - elapsedMs)) / 30_000));
  }
  return 0;
}

function currentContext() {
  const elapsedMs = Math.max(0, Date.now() - exec.scenario.startTime);
  return {
    window: currentSoakWindow(),
    targetVUs: targetVUsAt(elapsedMs),
  };
}

function parseJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

function requestParams(step, token, context) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  exec.vu.tags.soak_window = context.window;
  exec.vu.tags.target_vus = String(context.targetVUs);
  return {
    headers,
    tags: {
      step,
      soak_window: context.window,
      target_vus: String(context.targetVUs),
    },
  };
}

function recordActualVUs(step, context) {
  actualVUs.add(exec.instance.vusActive, {
    step,
    soak_window: context.window,
    target_vus: String(context.targetVUs),
  });
}

function trackedCheck(value, definitions, step, context) {
  const tags = {
    step,
    soak_window: context.window,
    target_vus: String(context.targetVUs),
  };
  let allPassed = true;
  for (const name of Object.keys(definitions)) {
    const oneCheck = {};
    oneCheck[name] = definitions[name];
    if (!check(value, oneCheck, tags)) {
      allPassed = false;
    }
  }
  return allPassed;
}

function randomPause(minSeconds, maxSeconds) {
  sleep(minSeconds + Math.random() * (maxSeconds - minSeconds));
}

function finishWorkflow(success, iterationStartedAt, iterationStartWindow) {
  const context = currentContext();
  const tags = {
    soak_window: context.window,
    start_window: iterationStartWindow,
    end_window: context.window,
    target_vus: String(context.targetVUs),
  };
  exec.vu.tags.soak_window = context.window;
  exec.vu.tags.target_vus = String(context.targetVUs);
  workflowSuccess.add(success, tags);
  recordActualVUs('workflow_completion', context);

  if (iterationStartWindow === context.window) {
    if (success) {
      completedWorkflows.add(1, { ...tags, window_scope: 'same_window' });
    }
    sameWindowIterationDuration.add(Date.now() - iterationStartedAt, tags);
  } else {
    crossWindowIterations.add(1, {
      start_window: iterationStartWindow,
      end_window: context.window,
      workflow_result: success ? 'success' : 'failure',
    });
  }
}

export default function () {
  if (exec.scenario.iterationInTest === 0) {
    console.log(
      `SOAK_SCENARIO_START epoch_ms=${exec.scenario.startTime} scenario=${exec.scenario.name} run_id=${RUN_ID}`,
    );
  }

  const iterationStartedAt = Date.now();
  const iterationStartWindow = currentSoakWindow();
  const iterationId = exec.scenario.iterationInTest;
  const row = rows[iterationId % rows.length];
  const quantity = Number.parseInt(row.quantity, 10);
  const email = `hw05.${RUN_ID}.${exec.scenario.name}.v${exec.vu.idInTest}.i${iterationId}.${row.identity_seed}@example.test`;

  const registerPayload = { name: row.name, email, password: row.password };
  const registerContext = currentContext();
  const registerResponse = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify(registerPayload),
    requestParams('register', null, registerContext),
  );
  recordActualVUs('register', registerContext);
  const registerBody = parseJson(registerResponse);
  if (!trackedCheck(registerResponse, {
    'register status is 200': (response) => response.status === 200,
    'register message is correct': () => registerBody?.message === 'User registered successfully',
    'register user id is positive': () => Number.isInteger(registerBody?.id) && registerBody.id > 0,
  }, 'register', registerContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  randomPause(1, 2);

  const loginContext = currentContext();
  const loginResponse = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password: row.password }),
    requestParams('login', null, loginContext),
  );
  recordActualVUs('login', loginContext);
  const loginBody = parseJson(loginResponse);
  if (!trackedCheck(loginResponse, {
    'login status is 200': (response) => response.status === 200,
    'login token is present': () => typeof loginBody?.token === 'string' && loginBody.token.length > 0,
    'login email matches registration': () => loginBody?.user?.email === email,
    'login user id matches registration': () => loginBody?.user?.id === registerBody.id,
  }, 'login', loginContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }
  const token = loginBody.token;

  const profileContext = currentContext();
  const profileResponse = http.get(
    `${BASE_URL}/api/users/me`,
    requestParams('read_profile', token, profileContext),
  );
  recordActualVUs('read_profile', profileContext);
  const profileBody = parseJson(profileResponse);
  if (!trackedCheck(profileResponse, {
    'profile status is 200': (response) => response.status === 200,
    'profile email matches registration': () => profileBody?.email === email,
    'profile user id matches registration': () => profileBody?.id === registerBody.id,
  }, 'read_profile', profileContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  randomPause(3, 5);

  const profilePayload = {
    name: row.name,
    phone: row.phone,
    shipping_address: row.shipping_address,
  };
  const updateContext = currentContext();
  if (!trackedCheck(profilePayload, {
    'profile payload has CSV name': (value) => value.name === row.name && value.name.length > 0,
    'profile payload has CSV phone': (value) => value.phone === row.phone,
    'profile payload has CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
  }, 'update_profile', updateContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }
  const updateResponse = http.put(
    `${BASE_URL}/api/users/me`,
    JSON.stringify(profilePayload),
    requestParams('update_profile', token, updateContext),
  );
  recordActualVUs('update_profile', updateContext);
  const updateBody = parseJson(updateResponse);
  if (!trackedCheck(updateResponse, {
    'profile update status is 200': (response) => response.status === 200,
    'profile update message is correct': () => updateBody?.message === 'Profile updated',
  }, 'update_profile', updateContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  const categoriesContext = currentContext();
  const categoriesResponse = http.get(
    `${BASE_URL}/api/categories`,
    requestParams('read_categories', null, categoriesContext),
  );
  recordActualVUs('read_categories', categoriesContext);
  const categoriesBody = parseJson(categoriesResponse);
  const selectedCategory = Array.isArray(categoriesBody) ? categoriesBody[0] : null;
  if (!trackedCheck(categoriesResponse, {
    'categories status is 200': (response) => response.status === 200,
    'categories array is non-empty': () => Array.isArray(categoriesBody) && categoriesBody.length > 0,
    'selected category id is positive': () => Number.isInteger(selectedCategory?.id) && selectedCategory.id > 0,
  }, 'read_categories', categoriesContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  const productsContext = currentContext();
  const productsResponse = http.get(
    `${BASE_URL}/api/products`,
    requestParams('read_products', null, productsContext),
  );
  recordActualVUs('read_products', productsContext);
  const productsBody = parseJson(productsResponse);
  const selectedProduct = Array.isArray(productsBody)
    ? productsBody.find((product) => product.category_id === selectedCategory.id)
    : null;
  if (!trackedCheck(productsResponse, {
    'products status is 200': (response) => response.status === 200,
    'products array is non-empty': () => Array.isArray(productsBody) && productsBody.length > 0,
    'matching product exists': () => Number.isInteger(selectedProduct?.id) && selectedProduct.id > 0,
  }, 'read_products', productsContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  randomPause(2, 4);

  const detailContext = currentContext();
  const detailResponse = http.get(
    `${BASE_URL}/api/products/${selectedProduct.id}`,
    requestParams('read_product_detail', null, detailContext),
  );
  recordActualVUs('read_product_detail', detailContext);
  const detailBody = parseJson(detailResponse);
  if (!trackedCheck(detailResponse, {
    'product detail status is 200': (response) => response.status === 200,
    'product detail id matches selection': () => detailBody?.id === selectedProduct.id,
    'product detail category matches selection': () => detailBody?.category_id === selectedCategory.id,
    'product detail name is non-empty': () => typeof detailBody?.name === 'string' && detailBody.name.length > 0,
    'product detail price is positive numeric': () => typeof detailBody?.price === 'number' && detailBody.price > 0,
  }, 'read_product_detail', detailContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  randomPause(2, 4);

  const cartPayload = {
    id: detailBody.id,
    name: detailBody.name,
    price: detailBody.price,
    quantity,
  };
  const cartContext = currentContext();
  if (!trackedCheck(cartPayload, {
    'cart payload preserves product detail': (value) => value.id === detailBody.id && value.name === detailBody.name && value.price === detailBody.price,
    'cart payload quantity is CSV quantity': (value) => value.quantity === quantity && value.quantity > 0,
  }, 'add_to_cart', cartContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }
  const cartResponse = http.post(
    `${BASE_URL}/api/cart`,
    JSON.stringify(cartPayload),
    requestParams('add_to_cart', token, cartContext),
  );
  recordActualVUs('add_to_cart', cartContext);
  const cartBody = parseJson(cartResponse);
  if (!trackedCheck(cartResponse, {
    'add to cart status is 200': (response) => response.status === 200,
    'add to cart message is correct': () => cartBody?.message === 'Added to cart',
  }, 'add_to_cart', cartContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  randomPause(1, 3);

  const checkoutPayload = {
    shipping_address: row.shipping_address,
    total_amount: detailBody.price * quantity,
  };
  const checkoutContext = currentContext();
  if (!trackedCheck(checkoutPayload, {
    'checkout payload has exact CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
    'checkout total is correlated and positive': (value) => value.total_amount === detailBody.price * quantity && value.total_amount > 0,
  }, 'checkout', checkoutContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }
  const checkoutResponse = http.post(
    `${BASE_URL}/api/checkout`,
    JSON.stringify(checkoutPayload),
    requestParams('checkout', token, checkoutContext),
  );
  recordActualVUs('checkout', checkoutContext);
  const checkoutBody = parseJson(checkoutResponse);
  if (!trackedCheck(checkoutResponse, {
    'checkout status is 200': (response) => response.status === 200,
    'checkout message is correct': () => checkoutBody?.message === 'Checkout successful',
    'checkout order id is positive': () => Number.isInteger(checkoutBody?.orderId) && checkoutBody.orderId > 0,
  }, 'checkout', checkoutContext)) {
    finishWorkflow(false, iterationStartedAt, iterationStartWindow);
    return;
  }

  finishWorkflow(true, iterationStartedAt, iterationStartWindow);
}
