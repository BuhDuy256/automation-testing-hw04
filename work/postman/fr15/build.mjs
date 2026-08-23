import crypto from 'node:crypto';
import fs from 'node:fs';

const API_ID = 'HW06-C-FR15-POST-PRODUCTS';
const OUT = 'work/postman/fr15';
const NAME = '__NAME__';
const normalBody = (overrides = {}) => ({
  name: NAME,
  price: 100000,
  description: 'FR15 product test',
  imageUrl: 'https://placehold.co/300x300/png',
  category_id: 1,
  ...overrides,
});
const without = (object, key) => {
  const copy = { ...object };
  delete copy[key];
  return copy;
};

const cfg = {};
const add = (id, options = {}) => {
  cfg[id] = {
    bodyMode: 'json',
    body: normalBody(),
    contentType: 'application/json',
    auth: 'admin',
    expectedMode: 'observe',
    assertFields: [],
    preserveExisting: false,
    detailReadback: false,
    searchReadback: false,
    secUiGap: false,
    secSqlGap: false,
    protectedIdCheck: false,
    h003: false,
    phase2Kind: null,
    phase2Body: null,
    ...options,
  };
};

add('FR15-AI-001', { expectedMode: 'mustCreate', assertFields: ['name', 'price', 'category_id'] });
add('FR15-AI-002', { body: normalBody({ name: 'N'.repeat(255), description: 'FR15 name 255' }), expectedMode: 'mustCreate' });
add('FR15-AI-003', { body: normalBody({ name: 'N'.repeat(256), description: 'FR15 name 256' }), expectedMode: 'mustNotCreate' });
add('FR15-AI-004', { body: normalBody({ name: 'X' }), expectedMode: 'mustCreate', assertFields: ['name', 'price', 'category_id'] });
add('FR15-AI-005', { body: normalBody({ name: '' }), expectedMode: 'mustNotCreate' });
add('FR15-AI-006', { body: normalBody({ name: '   ' }) });
add('FR15-AI-007', { body: without(normalBody(), 'name'), expectedMode: 'mustNotCreate' });
add('FR15-AI-008', { body: normalBody({ name: 12345 }) });
add('FR15-AI-009', { body: normalBody({ price: 0 }), expectedMode: 'mustNotCreate' });
add('FR15-AI-010', { body: normalBody({ price: -1 }), expectedMode: 'mustNotCreate' });
add('FR15-AI-011', { body: normalBody({ price: 1 }), expectedMode: 'mustCreate', assertFields: ['name', 'category_id'] });
add('FR15-AI-012', { body: normalBody({ price: 0.5 }), expectedMode: 'mustCreate', assertFields: ['name', 'category_id'] });
add('FR15-AI-013', { body: normalBody({ price: '100000' }) });
add('FR15-AI-014', { body: normalBody({ price: 'abc' }), expectedMode: 'mustNotCreate' });
add('FR15-AI-015', { body: without(normalBody(), 'price'), expectedMode: 'mustNotCreate' });
add('FR15-AI-016', { body: normalBody({ price: null }), expectedMode: 'mustNotCreate' });
add('FR15-AI-017', { body: normalBody({ category_id: 9999 }), expectedMode: 'mustNotCreate' });
add('FR15-AI-018', { body: without(normalBody(), 'category_id'), expectedMode: 'mustNotCreate' });
add('FR15-AI-019', { body: normalBody({ category_id: 'not-a-category' }), expectedMode: 'mustNotCreate' });
add('FR15-AI-020', { body: normalBody({ category_id: 2 }), expectedMode: 'mustCreate', assertFields: ['name', 'price', 'category_id'] });
add('FR15-AI-021', { body: normalBody({ description: '' }) });
add('FR15-AI-022', { body: without(normalBody(), 'description') });
add('FR15-AI-023', { body: normalBody({ description: 'D'.repeat(5000) }) });
add('FR15-AI-024', { body: normalBody({ imageUrl: 'not-a-valid-url' }) });
add('FR15-AI-025', { body: without(normalBody(), 'imageUrl') });
add('FR15-AI-026', { body: normalBody({ name: `Điện thoại thử nghiệm FR15 ${NAME}`, description: 'Mô tả sản phẩm kiểm thử' }), expectedMode: 'mustCreate', assertFields: ['price', 'category_id'] });

add('FR15-AI-027', { auth: 'none', expectedMode: 'mustNotCreate' });
add('FR15-AI-028', { auth: 'user', expectedMode: 'mustNotCreate' });
add('FR15-AI-029', { auth: 'scheme', expectedMode: 'mustNotCreate' });
add('FR15-AI-030', { auth: 'malformed', expectedMode: 'mustNotCreate' });
add('FR15-AI-031', { auth: 'tampered', expectedMode: 'mustNotCreate' });
add('FR15-AI-032', { auth: 'expiredAdmin', expectedMode: 'mustNotCreate' });
add('FR15-AI-033', { auth: 'user', body: normalBody({ role: 'admin' }), expectedMode: 'mustNotCreate' });
add('FR15-AI-034', { body: normalBody({ name: `<script>alert('xss')</script>${NAME}` }), secUiGap: true });
add('FR15-AI-035', { body: normalBody({ name: `FR15 ${NAME}'); DROP TABLE products; --` }), expectedMode: 'mustCreate', preserveExisting: true, secSqlGap: true, assertFields: ['price', 'category_id'] });
add('FR15-AI-036', { body: normalBody({ category_id: "1 OR 1=1" }), expectedMode: 'mustNotCreate', preserveExisting: true, secSqlGap: true });
add('FR15-AI-037', { auth: 'user', expectedMode: 'mustNotCreate', preserveExisting: true });

add('FR15-AI-039', { expectedMode: 'mustCreate', assertFields: ['name', 'price', 'category_id'], detailReadback: true });
add('FR15-AI-040', { expectedMode: 'mustCreate', assertFields: ['name', 'price', 'category_id'] });
add('FR15-AI-041', { expectedMode: 'mustCreate', preserveExisting: true, assertFields: ['name', 'price', 'category_id'] });
add('FR15-AI-042', { expectedMode: 'mustCreate', searchReadback: true, assertFields: ['name', 'price', 'category_id'] });
add('FR15-AI-043', { expectedMode: 'duplicateObserve', phase2Kind: 'duplicate', phase2Body: normalBody() });
add('FR15-AI-044', { body: normalBody({ price: -1 }), expectedMode: 'recovery', phase2Kind: 'domainRecovery', phase2Body: normalBody(), assertFields: ['name', 'price', 'category_id'] });

add('FR15-AI-047', { bodyMode: 'none', body: null, expectedMode: 'mustNotCreate' });
add('FR15-AI-048', { body: {}, expectedMode: 'mustNotCreate' });
add('FR15-AI-049', { bodyMode: 'raw', body: null, raw: '{"name": "FR15 AI 049", "price":', expectedMode: 'mustNotCreate' });
add('FR15-AI-050', { bodyMode: 'raw', body: null, raw: JSON.stringify([normalBody()]) });
add('FR15-AI-051', { body: normalBody({ description: { short: 'FR15', long: 'FR15 structured description' } }) });
add('FR15-AI-052', { body: normalBody({ stock_quantity: 99 }) });
add('FR15-AI-053', { bodyMode: 'raw', body: null, raw: JSON.stringify(normalBody()), contentType: 'text/plain' });
add('FR15-AI-054', { body: normalBody({ imageUrl: true }) });
add('FR15-AI-057', { body: normalBody({ name: `   ${NAME}   ` }), expectedMode: 'mustCreate', assertFields: ['price', 'category_id'] });
add('FR15-AI-058', { body: normalBody({ imageUrl: `https://placehold.co/300x300/png?text=${'U'.repeat(1955)}` }) });
add('FR15-AI-059', { body: normalBody({ category_id: null }), expectedMode: 'mustNotCreate' });

add('FR15-H-001', { body: normalBody({ id: 1 }), protectedIdCheck: true, preserveExisting: true });
add('FR15-H-002', { auth: 'missingRole', expectedMode: 'mustNotCreate' });
add('FR15-H-003', { body: normalBody({ category_id: '__DELETED_CATEGORY_ID__' }), expectedMode: 'mustNotCreate', h003: true });
add('FR15-H-004', { auth: 'user', expectedMode: 'recovery', phase2Kind: 'authRecovery', phase2Body: normalBody(), assertFields: ['name', 'price', 'category_id'] });
add('FR15-H-005', { body: normalBody({ name: null }), expectedMode: 'mustNotCreate' });

const registry = JSON.parse(fs.readFileSync('work/registry/test-cases.json', 'utf8')).cases
  .filter((candidate) => candidate.apiId === API_ID);
const reviews = JSON.parse(fs.readFileSync('work/registry/human-reviews.json', 'utf8')).reviews;
const invalid = new Set(reviews.filter((review) => review.verdict === 'INVALID').map((review) => review.caseId));
const usable = registry.filter((candidate) => candidate.origin === 'HUMAN' || !invalid.has(candidate.id));
const expectedIds = usable.map((candidate) => candidate.id);
const missing = expectedIds.filter((id) => !cfg[id]);
const extra = Object.keys(cfg).filter((id) => !expectedIds.includes(id));
if (missing.length || extra.length) {
  throw new Error(`FR-15 config mismatch. missing=${missing.join(',')} extra=${extra.join(',')}`);
}

const rows = usable.map((candidate) => ({
  caseId: candidate.id,
  origin: candidate.origin,
  title: candidate.title,
  ...cfg[candidate.id],
}));

const b64url = (value) => Buffer.from(value).toString('base64url');
const fixture = (payload) => {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', 'super_secret_key_that_should_not_be_here')
    .update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
};
const expiredAdminToken = fixture({ id: 1, role: 'admin', exp: 1 });
const missingRoleToken = fixture({ id: 2, exp: 4102444800 });

const js = (source) => source.trim().split('\n').map((line) => line.trimEnd());
const event = (listen, source) => ({ listen, script: { type: 'text/javascript', exec: js(source) } });
const requestItem = ({ name, method, path, pre = '', test = '', body = null }) => ({
  name,
  event: [pre ? event('prerequest', pre) : null, test ? event('test', test) : null].filter(Boolean),
  request: {
    method,
    header: body === null ? [] : [{ key: 'Content-Type', value: 'application/json' }],
    ...(body === null ? {} : { body: { mode: 'raw', raw: body, options: { raw: { language: 'json' } } } }),
    url: { raw: `{{baseUrl}}${path}`, host: ['{{baseUrl}}'], path: path.split('/').filter(Boolean) },
  },
});

const loginTest = (role) => `
pm.test('${role} supporting login returns 200', function () { pm.response.to.have.status(200); });
var json = pm.response.json();
pm.expect(json.token, '${role} token').to.be.a('string').and.not.empty;
pm.environment.set('${role}Token', json.token);
if (json.user && json.user.id !== undefined) pm.environment.set('${role}UserId', String(json.user.id));
`;

const authPre = `
var token = pm.environment.get('adminToken');
pm.request.headers.remove('Authorization');
pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + token });
`;

const collection = {
  info: {
    _postman_id: 'hw06-fr15-products-20260823',
    name: 'HW06 FR-15 Product Management - POST /api/products',
    description: 'Canonical reviewed FR-15 suite: 54 usable AI-origin cases plus five student-selected HUMAN extensions.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [event('prerequest', `
var row = pm.iterationData.toObject();
pm.request.headers.upsert({ key: 'X-Student-Id', value: pm.environment.get('studentId') || '23127179' });
if (pm.environment.get('activeCaseId') !== row.caseId) {
  pm.environment.set('activeCaseId', row.caseId);
  pm.environment.set('uniqueName', row.caseId + '-' + pm.info.iteration + '-' + Date.now());
  pm.environment.set('tempCategoryName', row.caseId + '-category-' + pm.info.iteration + '-' + Date.now());
  pm.environment.set('tempCategoryId', '');
  pm.environment.set('createdProductId', '');
  pm.environment.set('caseBlocked', 'false');
  pm.environment.set('phase1NewIds', '[]');
}
`)],
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'studentId', value: '23127179' },
  ],
  item: [
    requestItem({
      name: 'Setup admin login for {{caseId}}', method: 'POST', path: '/api/login',
      body: '{"email":"{{adminEmail}}","password":"{{adminPassword}}"}', test: loginTest('admin'),
    }),
    requestItem({
      name: 'Setup ordinary-user login for {{caseId}}', method: 'POST', path: '/api/login',
      body: '{"email":"{{userEmail}}","password":"{{userPassword}}"}', test: loginTest('user'),
    }),
    requestItem({
      name: 'Capture product baseline for {{caseId}}', method: 'GET', path: '/api/products',
      test: `
pm.test('product baseline is readable', function () { pm.response.to.have.status(200); });
var products = pm.response.json();
pm.expect(products, 'product baseline array').to.be.an('array');
pm.environment.set('baselineProducts', JSON.stringify(products));
pm.environment.set('baselineProductIds', JSON.stringify(products.map(function (p) { return p.id; })));
console.log(pm.iterationData.get('caseId') + ' baseline product count=' + products.length);
`,
    }),
    requestItem({
      name: 'FR15-H-003 setup - create temporary category', method: 'POST', path: '/api/categories',
      pre: `
if (!pm.iterationData.get('h003')) pm.execution.skipRequest();
${authPre}
pm.request.body.update({ mode: 'raw', raw: JSON.stringify({ name: pm.environment.get('tempCategoryName') }), options: { raw: { language: 'json' } } });
`,
      body: '{}',
      test: `
var id = pm.iterationData.get('caseId');
pm.test(id + ' temporary category create is observable', function () { pm.expect(pm.response.code).to.be.a('number'); });
try { var json = pm.response.json(); if (json.id !== undefined) pm.environment.set('tempCategoryId', String(json.id)); } catch (_) {}
`,
    }),
    requestItem({
      name: 'FR15-H-003 setup - confirm temporary category exists', method: 'GET', path: '/api/categories',
      pre: `if (!pm.iterationData.get('h003')) pm.execution.skipRequest();`,
      test: `
var rows = pm.response.json();
var found = rows.find(function (c) { return c.name === pm.environment.get('tempCategoryName'); });
pm.test('FR15-H-003 temporary category exists before deletion', function () { pm.expect(found).to.be.an('object'); });
if (found) pm.environment.set('tempCategoryId', String(found.id));
if (!found) pm.environment.set('caseBlocked', 'true');
`,
    }),
    requestItem({
      name: 'FR15-H-003 setup - delete temporary category', method: 'DELETE', path: '/api/categories/{{tempCategoryId}}',
      pre: `
if (!pm.iterationData.get('h003')) pm.execution.skipRequest();
${authPre}
`,
      test: `pm.test('FR15-H-003 category delete is observable', function () { pm.expect(pm.response.code).to.be.a('number'); });`,
    }),
    requestItem({
      name: 'FR15-H-003 setup - confirm temporary category is absent', method: 'GET', path: '/api/categories',
      pre: `if (!pm.iterationData.get('h003')) pm.execution.skipRequest();`,
      test: `
var rows = pm.response.json();
var id = Number(pm.environment.get('tempCategoryId'));
var found = rows.find(function (c) { return Number(c.id) === id; });
pm.test('FR15-H-003 temporary category is absent before product create', function () { pm.expect(found).to.equal(undefined); });
if (found) pm.environment.set('caseBlocked', 'true');
`,
    }),
    requestItem({
      name: 'Execute {{caseId}} phase 1 - POST /api/products', method: 'POST', path: '/api/products', body: '{}',
      pre: `
var row = pm.iterationData.toObject();
var id = row.caseId;
var unique = pm.environment.get('uniqueName');
function subst(value) {
  if (value === '__DELETED_CATEGORY_ID__') return Number(pm.environment.get('tempCategoryId'));
  if (typeof value === 'string') return value.replaceAll('__NAME__', unique);
  if (Array.isArray(value)) return value.map(subst);
  if (value && typeof value === 'object') { var out = {}; Object.keys(value).forEach(function (key) { out[key] = subst(value[key]); }); return out; }
  return value;
}
pm.request.headers.remove('Authorization');
var mode = row.auth || 'admin';
var admin = pm.environment.get('adminToken');
if (mode === 'admin') pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + admin });
if (mode === 'user') pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + pm.environment.get('userToken') });
if (mode === 'scheme') pm.request.headers.add({ key: 'Authorization', value: 'Token abc123' });
if (mode === 'malformed') pm.request.headers.add({ key: 'Authorization', value: 'Bearer not-a-jwt' });
if (mode === 'tampered') { var parts = admin.split('.'); var sig = parts[2]; var last = sig.slice(-1); parts[2] = sig.slice(0, -1) + (last === 'A' ? 'B' : 'A'); pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + parts.join('.') }); }
if (mode === 'expiredAdmin') pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + pm.environment.get('expiredAdminToken') });
if (mode === 'missingRole') pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + pm.environment.get('missingRoleToken') });
pm.request.headers.upsert({ key: 'Content-Type', value: row.contentType || 'application/json' });
var raw = '';
if (row.bodyMode === 'json') raw = JSON.stringify(subst(row.body));
if (row.bodyMode === 'raw') raw = subst(row.raw || '');
pm.request.body.update({ mode: 'raw', raw: raw, options: { raw: { language: 'json' } } });
pm.environment.set('submittedExpected', JSON.stringify(subst(row.body)));
console.log(id + ' phase1 auth=' + mode + ' body=' + raw);
`,
      test: `
var id = pm.iterationData.get('caseId');
pm.test(id + ' selected request carries X-Student-Id', function () { pm.expect(pm.request.headers.get('X-Student-Id')).to.eql('23127179'); });
pm.test(id + ' phase 1 produced an HTTP response', function () { pm.expect(pm.response.code).to.be.a('number'); });
pm.environment.set('phase1Status', String(pm.response.code));
console.log(id + ' SPEC GAP response phase1 status=' + pm.response.code + ' body=' + pm.response.text());
`,
    }),
    requestItem({
      name: 'Verify {{caseId}} phase 1 state before phase 2', method: 'GET', path: '/api/products',
      pre: `if (!pm.iterationData.get('phase2Kind')) pm.execution.skipRequest();`,
      test: `
var row = pm.iterationData.toObject(); var id = row.caseId;
var baselineIds = JSON.parse(pm.environment.get('baselineProductIds') || '[]').map(Number);
var current = pm.response.json();
var newRows = current.filter(function (p) { return !baselineIds.includes(Number(p.id)); });
pm.environment.set('phase1NewIds', JSON.stringify(newRows.map(function (p) { return p.id; })));
if (row.phase2Kind === 'duplicate') pm.test(id + ' first valid create persists before duplicate observation', function () { pm.expect(newRows.length).to.eql(1); });
if (row.phase2Kind === 'domainRecovery' || row.phase2Kind === 'authRecovery') pm.test(id + ' refused phase 1 leaves no product', function () { pm.expect(newRows.length).to.eql(0); });
`,
    }),
    requestItem({
      name: 'Execute {{caseId}} phase 2 - POST /api/products', method: 'POST', path: '/api/products', body: '{}',
      pre: `
var row = pm.iterationData.toObject(); if (!row.phase2Kind) pm.execution.skipRequest();
var unique = pm.environment.get('uniqueName');
function subst(value) { if (typeof value === 'string') return value.replaceAll('__NAME__', unique); if (Array.isArray(value)) return value.map(subst); if (value && typeof value === 'object') { var out={}; Object.keys(value).forEach(function(k){out[k]=subst(value[k]);}); return out; } return value; }
pm.request.headers.remove('Authorization');
pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + pm.environment.get('adminToken') });
pm.request.headers.upsert({ key: 'Content-Type', value: 'application/json' });
pm.request.body.update({ mode: 'raw', raw: JSON.stringify(subst(row.phase2Body)), options: { raw: { language: 'json' } } });
pm.environment.set('submittedExpected', JSON.stringify(subst(row.phase2Body)));
`,
      test: `
var id=pm.iterationData.get('caseId');
pm.test(id + ' phase 2 carries X-Student-Id', function(){pm.expect(pm.request.headers.get('X-Student-Id')).to.eql('23127179');});
pm.test(id + ' phase 2 produced an HTTP response', function(){pm.expect(pm.response.code).to.be.a('number');});
console.log(id + ' SPEC GAP response phase2 status=' + pm.response.code + ' body=' + pm.response.text());
`,
    }),
    requestItem({
      name: 'Verify {{caseId}} final product state', method: 'GET', path: '/api/products',
      test: `
var row=pm.iterationData.toObject(); var id=row.caseId; var unique=pm.environment.get('uniqueName');
var baseline=JSON.parse(pm.environment.get('baselineProducts')||'[]'); var baselineIds=baseline.map(function(p){return Number(p.id);});
var current=pm.response.json(); var newRows=current.filter(function(p){return !baselineIds.includes(Number(p.id));});
var matching=current.filter(function(p){return p.name===unique || (typeof p.name==='string' && p.name.includes(unique));});
pm.environment.set('newProductIds',JSON.stringify(newRows.map(function(p){return p.id;})));
if(newRows[0]) pm.environment.set('createdProductId',String(newRows[0].id));
if(row.expectedMode==='mustCreate') pm.test(id+' creates exactly one product',function(){pm.expect(newRows.length).to.eql(1);});
if(row.expectedMode==='mustNotCreate') pm.test(id+' forbidden or invalid input creates no product',function(){pm.expect(newRows.length).to.eql(0);});
if(row.expectedMode==='recovery') pm.test(id+' recovery leaves exactly one authorized valid product',function(){pm.expect(newRows.length).to.eql(1);pm.expect(matching.length).to.eql(1);});
if(row.expectedMode==='duplicateObserve') { pm.test(id+' first valid product remains persisted',function(){pm.expect(newRows.length).to.be.at.least(1);}); console.log(id+' SPEC GAP duplicate-name result: newRows='+newRows.length); }
if(row.expectedMode==='observe') console.log(id+' SPEC GAP observation: newRows='+newRows.length+' matching='+matching.length+' status='+pm.environment.get('phase1Status'));
if(row.assertFields && row.assertFields.length && newRows.length===1){var expected=JSON.parse(pm.environment.get('submittedExpected')||'{}');var actual=newRows[0];pm.test(id+' documented persisted fields match',function(){row.assertFields.forEach(function(key){pm.expect(actual[key],key).to.eql(expected[key]);});});}
function slim(p){return {id:p.id,name:p.name,price:p.price,description:p.description,imageUrl:p.imageUrl,category_id:p.category_id};}
if(row.preserveExisting){pm.test(id+' existing products remain unchanged',function(){baseline.forEach(function(before){var after=current.find(function(p){return Number(p.id)===Number(before.id);});pm.expect(after,'existing id '+before.id).to.be.an('object');pm.expect(slim(after)).to.eql(slim(before));});});}
if(row.protectedIdCheck){var before1=baseline.find(function(p){return Number(p.id)===1;});var after1=current.find(function(p){return Number(p.id)===1;});pm.test(id+' seeded product id 1 is unchanged and never aliased',function(){pm.expect(slim(after1)).to.eql(slim(before1));newRows.forEach(function(p){pm.expect(Number(p.id)).not.to.eql(1);});});}
if(row.secUiGap) console.log(id+' EVIDENCE GAP: API acceptance/read-back does not prove SEC-04 UI escaping; normalization is observational.');
if(row.secSqlGap) console.log(id+' EVIDENCE GAP: black-box persistence integrity cannot prove internal parameterized queries.');
if(row.h003 && pm.environment.get('caseBlocked')==='true') console.log(id+' BLOCKED: temporary-category starting state was not established; do not classify the product result as a defect.');
`,
    }),
    requestItem({
      name: 'FR15-AI-039 detail read-back', method: 'GET', path: '/api/products/{{createdProductId}}',
      pre: `if (!pm.iterationData.get('detailReadback')) pm.execution.skipRequest();`,
      test: `
var row=pm.iterationData.toObject();var json=pm.response.json();var expected=JSON.parse(pm.environment.get('submittedExpected')||'{}');
pm.test(row.caseId+' created product is retrievable by its id',function(){pm.expect(Number(json.id)).to.eql(Number(pm.environment.get('createdProductId')));pm.expect(json.name).to.eql(expected.name);pm.expect(Number(json.price)).to.eql(Number(expected.price));pm.expect(Number(json.category_id)).to.eql(Number(expected.category_id));});
`,
    }),
    requestItem({
      name: 'FR15-AI-042 documented name-search read-back', method: 'GET', path: '/api/products?search={{uniqueName}}',
      pre: `if (!pm.iterationData.get('searchReadback')) pm.execution.skipRequest();`,
      test: `var rows=pm.response.json();var name=pm.environment.get('uniqueName');pm.test('FR15-AI-042 created product is findable by documented name search',function(){pm.expect(rows.some(function(p){return p.name===name;})).to.eql(true);});`,
    }),
    requestItem({
      name: 'Cleanup and verify exact product baseline for {{caseId}}', method: 'GET', path: '/api/products',
      test: `
var row=pm.iterationData.toObject();var id=row.caseId;var base=pm.environment.get('baseUrl');var sid=pm.environment.get('studentId');var token=pm.environment.get('adminToken');
var baseline=JSON.parse(pm.environment.get('baselineProducts')||'[]');var baselineIds=baseline.map(function(p){return Number(p.id);});var current=pm.response.json();
var created=current.filter(function(p){return !baselineIds.includes(Number(p.id));});
function hdr(extra){return Object.assign({'X-Student-Id':sid,Authorization:'Bearer '+token},extra||{});}
function slim(p){return {id:p.id,name:p.name,price:p.price,description:p.description,imageUrl:p.imageUrl,category_id:p.category_id};}
var changed=baseline.filter(function(before){var after=current.find(function(p){return Number(p.id)===Number(before.id);});return after && JSON.stringify(slim(after))!==JSON.stringify(slim(before));});
function restore(i,done){if(i>=changed.length)return done();var p=changed[i];pm.sendRequest({url:base+'/api/products/'+p.id,method:'PUT',header:hdr({'Content-Type':'application/json'}),body:{mode:'raw',raw:JSON.stringify({name:p.name,price:p.price,description:p.description,imageUrl:p.imageUrl,category_id:p.category_id})}},function(){restore(i+1,done);});}
function remove(i,done){if(i>=created.length)return done();pm.sendRequest({url:base+'/api/products/'+created[i].id,method:'DELETE',header:hdr()},function(){remove(i+1,done);});}
restore(0,function(){remove(0,function(){pm.sendRequest({url:base+'/api/products',method:'GET',header:{'X-Student-Id':sid}},function(err,res){pm.expect(err,'cleanup read-back transport').to.equal(null);var finalRows=res.json();pm.test(id+' cleanup restores exact product baseline',function(){pm.expect(finalRows.map(slim)).to.eql(baseline.map(slim));});});});});
`,
    }),
  ],
};

const environment = {
  id: 'hw06-fr15-products-env-20260823',
  name: 'HW06 FR-15 Product Environment',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3000', enabled: true, type: 'default' },
    { key: 'studentId', value: '23127179', enabled: true, type: 'default' },
    { key: 'adminEmail', value: 'admin@eshop.com', enabled: true, type: 'default' },
    { key: 'adminPassword', value: 'Admin123!', enabled: true, type: 'secret' },
    { key: 'userEmail', value: 'test@eshop.com', enabled: true, type: 'default' },
    { key: 'userPassword', value: 'Test1234!', enabled: true, type: 'secret' },
    { key: 'expiredAdminToken', value: expiredAdminToken, enabled: true, type: 'secret' },
    { key: 'missingRoleToken', value: missingRoleToken, enabled: true, type: 'secret' },
    ...['adminToken','userToken','adminUserId','userUserId','activeCaseId','uniqueName','tempCategoryName','tempCategoryId','createdProductId','caseBlocked','baselineProducts','baselineProductIds','phase1NewIds','newProductIds','phase1Status','submittedExpected'].map((key) => ({ key, value: '', enabled: true, type: key.endsWith('Token') ? 'secret' : 'default' })),
  ],
  _postman_variable_scope: 'environment',
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/FR15-products.postman_collection.json`, `${JSON.stringify(collection, null, 2)}\n`);
fs.writeFileSync(`${OUT}/FR15-products.postman_environment.json`, `${JSON.stringify(environment, null, 2)}\n`);
fs.writeFileSync(`${OUT}/FR15-products.postman_data.json`, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`FR-15 Postman build: ${rows.length} reviewed-usable cases, ${Object.keys(cfg).length} configurations.`);
