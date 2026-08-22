import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';
import { open } from 'k6/experimental/fs';
import csv from 'k6/experimental/csv';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const RUN_ID = __ENV.K6_RUN_ID || '';
const CAL_VUS = Number.parseInt(__ENV.CAL_VUS || '1', 10);
const CAL_ITERATIONS = Number.parseInt(__ENV.CAL_ITERATIONS || '1', 10);
const USE_THINK_TIME = (__ENV.CAL_THINK_TIME || 'true').toLowerCase() === 'true';

if (!/^[a-z0-9]{8,20}$/.test(RUN_ID)) {
  throw new Error('K6_RUN_ID must match ^[a-z0-9]{8,20}$ and be unique for this invocation');
}
if (!Number.isInteger(CAL_VUS) || CAL_VUS < 1) {
  throw new Error('CAL_VUS must be a positive integer');
}
if (!Number.isInteger(CAL_ITERATIONS) || CAL_ITERATIONS < 1) {
  throw new Error('CAL_ITERATIONS must be a positive integer');
}

const dataFile = await open('./user_workflow_data.csv');
const rows = await csv.parse(dataFile, { asObjects: true });
const expectedHeaders = ['identity_seed', 'name', 'password', 'phone', 'shipping_address', 'quantity'];

if (rows.length === 0) {
  throw new Error('CSV must contain at least one data row');
}
for (const header of expectedHeaders) {
  if (!(header in rows[0])) {
    throw new Error(`CSV is missing required header: ${header}`);
  }
}

const seenSeeds = {};
for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
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
  if (!/^[0-9]+$/.test(row.quantity) || Number.parseInt(row.quantity, 10) <= 0) {
    throw new Error(`Invalid quantity at CSV row ${index + 2}`);
  }
}

export const options = {
  scenarios: {
    calibration: {
      executor: 'per-vu-iterations',
      vus: CAL_VUS,
      iterations: CAL_ITERATIONS,
      maxDuration: '10m',
      gracefulStop: '30s',
      tags: { test_phase: 'calibration' },
    },
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const workflowSuccess = new Rate('workflow_success');
const completedWorkflows = new Counter('completed_workflows');
const workflowHttpRequests = new Counter('workflow_http_requests');
const apiTime = new Trend('workflow_api_time_ms', true);
const thinkTime = new Trend('workflow_think_time_ms', true);
const wallTime = new Trend('workflow_wall_time_ms', true);

const endpointLatency = {
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

function parseJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

function requestParams(step, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return { headers, tags: { step } };
}

function recordResponse(response, trend) {
  trend.add(response.timings.duration);
  workflowHttpRequests.add(1);
  return response.timings.duration;
}

function randomPause(minSeconds, maxSeconds) {
  if (!USE_THINK_TIME) {
    return 0;
  }
  const seconds = minSeconds + Math.random() * (maxSeconds - minSeconds);
  sleep(seconds);
  return seconds * 1000;
}

function failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt) {
  workflowSuccess.add(false);
  apiTime.add(apiMilliseconds);
  thinkTime.add(thinkMilliseconds);
  wallTime.add(Date.now() - startedAt);
}

export default function () {
  const startedAt = Date.now();
  let apiMilliseconds = 0;
  let thinkMilliseconds = 0;
  const iterationId = exec.scenario.iterationInTest;
  const row = rows[iterationId % rows.length];
  const quantity = Number.parseInt(row.quantity, 10);
  const email = `hw05.${RUN_ID}.${exec.scenario.name}.v${exec.vu.idInTest}.i${iterationId}.${row.identity_seed}@example.test`;

  const registerPayload = {
    name: row.name,
    email,
    password: row.password,
  };
  const registerResponse = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify(registerPayload),
    requestParams('register'),
  );
  apiMilliseconds += recordResponse(registerResponse, endpointLatency.register);
  const registerBody = parseJson(registerResponse);
  if (!check(registerResponse, {
    'register status is 200': (r) => r.status === 200,
    'register message is correct': () => registerBody?.message === 'User registered successfully',
    'register user id is positive': () => Number.isInteger(registerBody?.id) && registerBody.id > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  thinkMilliseconds += randomPause(1, 2);

  const loginResponse = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password: row.password }),
    requestParams('login'),
  );
  apiMilliseconds += recordResponse(loginResponse, endpointLatency.login);
  const loginBody = parseJson(loginResponse);
  if (!check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login token is present': () => typeof loginBody?.token === 'string' && loginBody.token.length > 0,
    'login email matches registration': () => loginBody?.user?.email === email,
    'login user id matches registration': () => loginBody?.user?.id === registerBody.id,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }
  const token = loginBody.token;

  const profileResponse = http.get(
    `${BASE_URL}/api/users/me`,
    requestParams('read_profile', token),
  );
  apiMilliseconds += recordResponse(profileResponse, endpointLatency.readProfile);
  const profileBody = parseJson(profileResponse);
  if (!check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
    'profile email matches registration': () => profileBody?.email === email,
    'profile user id matches registration': () => profileBody?.id === registerBody.id,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  thinkMilliseconds += randomPause(3, 5);

  const profilePayload = {
    name: row.name,
    phone: row.phone,
    shipping_address: row.shipping_address,
  };
  if (!check(profilePayload, {
    'profile payload has CSV name': (value) => value.name === row.name && value.name.length > 0,
    'profile payload has CSV phone': (value) => value.phone === row.phone,
    'profile payload has CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }
  const updateResponse = http.put(
    `${BASE_URL}/api/users/me`,
    JSON.stringify(profilePayload),
    requestParams('update_profile', token),
  );
  apiMilliseconds += recordResponse(updateResponse, endpointLatency.updateProfile);
  const updateBody = parseJson(updateResponse);
  if (!check(updateResponse, {
    'profile update status is 200': (r) => r.status === 200,
    'profile update message is correct': () => updateBody?.message === 'Profile updated',
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  const categoriesResponse = http.get(
    `${BASE_URL}/api/categories`,
    requestParams('read_categories'),
  );
  apiMilliseconds += recordResponse(categoriesResponse, endpointLatency.readCategories);
  const categoriesBody = parseJson(categoriesResponse);
  const selectedCategory = Array.isArray(categoriesBody) ? categoriesBody[0] : null;
  if (!check(categoriesResponse, {
    'categories status is 200': (r) => r.status === 200,
    'categories array is non-empty': () => Array.isArray(categoriesBody) && categoriesBody.length > 0,
    'selected category id is positive': () => Number.isInteger(selectedCategory?.id) && selectedCategory.id > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  const productsResponse = http.get(
    `${BASE_URL}/api/products`,
    requestParams('read_products'),
  );
  apiMilliseconds += recordResponse(productsResponse, endpointLatency.readProducts);
  const productsBody = parseJson(productsResponse);
  const selectedProduct = Array.isArray(productsBody)
    ? productsBody.find((product) => product.category_id === selectedCategory.id)
    : null;
  if (!check(productsResponse, {
    'products status is 200': (r) => r.status === 200,
    'products array is non-empty': () => Array.isArray(productsBody) && productsBody.length > 0,
    'matching product exists': () => Number.isInteger(selectedProduct?.id) && selectedProduct.id > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  thinkMilliseconds += randomPause(2, 4);

  const detailResponse = http.get(
    `${BASE_URL}/api/products/${selectedProduct.id}`,
    requestParams('read_product_detail'),
  );
  apiMilliseconds += recordResponse(detailResponse, endpointLatency.readProductDetail);
  const detailBody = parseJson(detailResponse);
  if (!check(detailResponse, {
    'product detail status is 200': (r) => r.status === 200,
    'product detail id matches selection': () => detailBody?.id === selectedProduct.id,
    'product detail category matches selection': () => detailBody?.category_id === selectedCategory.id,
    'product detail name is non-empty': () => typeof detailBody?.name === 'string' && detailBody.name.length > 0,
    'product detail price is positive numeric': () => typeof detailBody?.price === 'number' && detailBody.price > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  thinkMilliseconds += randomPause(2, 4);

  const cartPayload = {
    id: detailBody.id,
    name: detailBody.name,
    price: detailBody.price,
    quantity,
  };
  if (!check(cartPayload, {
    'cart payload preserves product detail': (value) => value.id === detailBody.id && value.name === detailBody.name && value.price === detailBody.price,
    'cart payload quantity is CSV quantity': (value) => value.quantity === quantity && value.quantity > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }
  const cartResponse = http.post(
    `${BASE_URL}/api/cart`,
    JSON.stringify(cartPayload),
    requestParams('add_to_cart', token),
  );
  apiMilliseconds += recordResponse(cartResponse, endpointLatency.addToCart);
  const cartBody = parseJson(cartResponse);
  if (!check(cartResponse, {
    'add to cart status is 200': (r) => r.status === 200,
    'add to cart message is correct': () => cartBody?.message === 'Added to cart',
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  thinkMilliseconds += randomPause(1, 3);

  const checkoutPayload = {
    shipping_address: row.shipping_address,
    total_amount: detailBody.price * quantity,
  };
  if (!check(checkoutPayload, {
    'checkout payload has exact CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
    'checkout total is correlated and positive': (value) => value.total_amount === detailBody.price * quantity && value.total_amount > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }
  const checkoutResponse = http.post(
    `${BASE_URL}/api/checkout`,
    JSON.stringify(checkoutPayload),
    requestParams('checkout', token),
  );
  apiMilliseconds += recordResponse(checkoutResponse, endpointLatency.checkout);
  const checkoutBody = parseJson(checkoutResponse);
  if (!check(checkoutResponse, {
    'checkout status is 200': (r) => r.status === 200,
    'checkout message is correct': () => checkoutBody?.message === 'Checkout successful',
    'checkout order id is positive': () => Number.isInteger(checkoutBody?.orderId) && checkoutBody.orderId > 0,
  })) {
    failWorkflow(apiMilliseconds, thinkMilliseconds, startedAt);
    return;
  }

  completedWorkflows.add(1);
  workflowSuccess.add(true);
  apiTime.add(apiMilliseconds);
  thinkTime.add(thinkMilliseconds);
  wallTime.add(Date.now() - startedAt);
}
