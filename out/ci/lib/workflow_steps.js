// Shared 9-step "New Customer Onboarding and First Order" workflow.
// Extracted from the reviewed official scenario scripts (out/23127179_*_20260817.js) so the
// CI regression profile exercises the identical request/check sequence instead of a
// duplicated or simplified copy. Behavior is unchanged from the official scripts:
// Register -> Login -> Read Profile -> Update Profile -> Read Categories -> Read Products
// -> Read Product Detail -> Add Product to Cart -> Checkout, exactly 9 HTTP requests,
// exactly one Checkout, semantic checks beyond HTTP 200.
import http from 'k6/http';
import { check, sleep } from 'k6';

export function parseJson(response) {
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
  if (trend) {
    trend.add(response.timings.duration);
  }
}

function randomPause(minSeconds, maxSeconds) {
  const seconds = minSeconds + Math.random() * (maxSeconds - minSeconds);
  sleep(seconds);
}

/**
 * Runs one complete workflow iteration against BASE_URL using one CSV row.
 * @param {object} params
 * @param {string} params.BASE_URL
 * @param {string} params.email - must be unique per iteration/VU.
 * @param {object} params.row - CSV row: { name, password, phone, shipping_address, quantity }.
 * @param {number} params.quantity
 * @param {import('k6/metrics').Rate} params.workflowSuccess
 * @param {object} [params.trends] - optional per-endpoint Trend metrics.
 * @returns {boolean} true when the full workflow completed successfully.
 */
export function runWorkflow({ BASE_URL, email, row, quantity, workflowSuccess, trends = {} }) {
  function failWorkflow() {
    workflowSuccess.add(false);
    return false;
  }

  const registerPayload = { name: row.name, email, password: row.password };
  const registerResponse = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify(registerPayload),
    requestParams('register'),
  );
  recordResponse(registerResponse, trends.register);
  const registerBody = parseJson(registerResponse);
  if (!check(registerResponse, {
    'register status is 200': (response) => response.status === 200,
    'register message is correct': () => registerBody?.message === 'User registered successfully',
    'register user id is positive': () => Number.isInteger(registerBody?.id) && registerBody.id > 0,
  })) {
    return failWorkflow();
  }

  randomPause(1, 2);

  const loginResponse = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password: row.password }),
    requestParams('login'),
  );
  recordResponse(loginResponse, trends.login);
  const loginBody = parseJson(loginResponse);
  if (!check(loginResponse, {
    'login status is 200': (response) => response.status === 200,
    'login token is present': () => typeof loginBody?.token === 'string' && loginBody.token.length > 0,
    'login email matches registration': () => loginBody?.user?.email === email,
    'login user id matches registration': () => loginBody?.user?.id === registerBody.id,
  })) {
    return failWorkflow();
  }
  const token = loginBody.token;

  const profileResponse = http.get(`${BASE_URL}/api/users/me`, requestParams('read_profile', token));
  recordResponse(profileResponse, trends.readProfile);
  const profileBody = parseJson(profileResponse);
  if (!check(profileResponse, {
    'profile status is 200': (response) => response.status === 200,
    'profile email matches registration': () => profileBody?.email === email,
    'profile user id matches registration': () => profileBody?.id === registerBody.id,
  })) {
    return failWorkflow();
  }

  randomPause(1, 2);

  const profilePayload = { name: row.name, phone: row.phone, shipping_address: row.shipping_address };
  if (!check(profilePayload, {
    'profile payload has CSV name': (value) => value.name === row.name && value.name.length > 0,
    'profile payload has CSV phone': (value) => value.phone === row.phone,
    'profile payload has CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
  })) {
    return failWorkflow();
  }
  const updateResponse = http.put(
    `${BASE_URL}/api/users/me`,
    JSON.stringify(profilePayload),
    requestParams('update_profile', token),
  );
  recordResponse(updateResponse, trends.updateProfile);
  const updateBody = parseJson(updateResponse);
  if (!check(updateResponse, {
    'profile update status is 200': (response) => response.status === 200,
    'profile update message is correct': () => updateBody?.message === 'Profile updated',
  })) {
    return failWorkflow();
  }

  const categoriesResponse = http.get(`${BASE_URL}/api/categories`, requestParams('read_categories'));
  recordResponse(categoriesResponse, trends.readCategories);
  const categoriesBody = parseJson(categoriesResponse);
  const selectedCategory = Array.isArray(categoriesBody) ? categoriesBody[0] : null;
  if (!check(categoriesResponse, {
    'categories status is 200': (response) => response.status === 200,
    'categories array is non-empty': () => Array.isArray(categoriesBody) && categoriesBody.length > 0,
    'selected category id is positive': () => Number.isInteger(selectedCategory?.id) && selectedCategory.id > 0,
  })) {
    return failWorkflow();
  }

  const productsResponse = http.get(`${BASE_URL}/api/products`, requestParams('read_products'));
  recordResponse(productsResponse, trends.readProducts);
  const productsBody = parseJson(productsResponse);
  const selectedProduct = Array.isArray(productsBody)
    ? productsBody.find((product) => product.category_id === selectedCategory.id)
    : null;
  if (!check(productsResponse, {
    'products status is 200': (response) => response.status === 200,
    'products array is non-empty': () => Array.isArray(productsBody) && productsBody.length > 0,
    'matching product exists': () => Number.isInteger(selectedProduct?.id) && selectedProduct.id > 0,
  })) {
    return failWorkflow();
  }

  const detailResponse = http.get(`${BASE_URL}/api/products/${selectedProduct.id}`, requestParams('read_product_detail'));
  recordResponse(detailResponse, trends.readProductDetail);
  const detailBody = parseJson(detailResponse);
  if (!check(detailResponse, {
    'product detail status is 200': (response) => response.status === 200,
    'product detail id matches selection': () => detailBody?.id === selectedProduct.id,
    'product detail category matches selection': () => detailBody?.category_id === selectedCategory.id,
    'product detail name is non-empty': () => typeof detailBody?.name === 'string' && detailBody.name.length > 0,
    'product detail price is positive numeric': () => typeof detailBody?.price === 'number' && detailBody.price > 0,
  })) {
    return failWorkflow();
  }

  const cartPayload = { id: detailBody.id, name: detailBody.name, price: detailBody.price, quantity };
  if (!check(cartPayload, {
    'cart payload preserves product detail': (value) => value.id === detailBody.id && value.name === detailBody.name && value.price === detailBody.price,
    'cart payload quantity is CSV quantity': (value) => value.quantity === quantity && value.quantity > 0,
  })) {
    return failWorkflow();
  }
  const cartResponse = http.post(`${BASE_URL}/api/cart`, JSON.stringify(cartPayload), requestParams('add_to_cart', token));
  recordResponse(cartResponse, trends.addToCart);
  const cartBody = parseJson(cartResponse);
  if (!check(cartResponse, {
    'add to cart status is 200': (response) => response.status === 200,
    'add to cart message is correct': () => cartBody?.message === 'Added to cart',
  })) {
    return failWorkflow();
  }

  randomPause(1, 2);

  const checkoutPayload = { shipping_address: row.shipping_address, total_amount: detailBody.price * quantity };
  if (!check(checkoutPayload, {
    'checkout payload has exact CSV shipping address': (value) => value.shipping_address === row.shipping_address && value.shipping_address.length > 0,
    'checkout total is correlated and positive': (value) => value.total_amount === detailBody.price * quantity && value.total_amount > 0,
  })) {
    return failWorkflow();
  }
  const checkoutResponse = http.post(`${BASE_URL}/api/checkout`, JSON.stringify(checkoutPayload), requestParams('checkout', token));
  recordResponse(checkoutResponse, trends.checkout);
  const checkoutBody = parseJson(checkoutResponse);
  if (!check(checkoutResponse, {
    'checkout status is 200': (response) => response.status === 200,
    'checkout message is correct': () => checkoutBody?.message === 'Checkout successful',
    'checkout order id is positive': () => Number.isInteger(checkoutBody?.orderId) && checkoutBody.orderId > 0,
  })) {
    return failWorkflow();
  }

  workflowSuccess.add(true);
  return true;
}
