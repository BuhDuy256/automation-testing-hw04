import fs from 'node:fs';

const LINE_A = { id: 1, name: 'San pham A', price: 100000, quantity: 2 };
const ADDR = '123 Le Loi, TP.HCM';
const stdBody = { total_amount: 200000, shipping_address: ADDR };

const LINE_B1 = { id: 2, name: 'San pham B', price: 50000, quantity: 1 };
const LINE_B3 = { id: 2, name: 'San pham B', price: 50000, quantity: 3 };
const ADDR_1 = '111 Nguyen Hue, Quan 1';
const ADDR_2 = '222 Le Duan, Quan 3';

const cfg = {
  'FR08-AI-001': { body: stdBody },
  'FR08-AI-002': { body: { total_amount: 1000, shipping_address: ADDR } },
  'FR08-AI-003': { body: { total_amount: 9999000, shipping_address: ADDR } },
  'FR08-AI-004': { body: { total_amount: 0, shipping_address: ADDR } },
  'FR08-AI-005': { body: { total_amount: -200000, shipping_address: ADDR } },
  'FR08-AI-006': { body: { shipping_address: ADDR } },
  'FR08-AI-007': { body: { total_amount: null, shipping_address: ADDR } },
  'FR08-AI-008': { body: { total_amount: '200000', shipping_address: ADDR } },
  'FR08-AI-009': { body: { total_amount: 'abc', shipping_address: ADDR } },
  'FR08-AI-010': { body: { total_amount: 199999.99, shipping_address: ADDR } },
  'FR08-AI-011': { body: { total_amount: 999999999999, shipping_address: ADDR } },
  'FR08-AI-012': { body: { total_amount: 200000, shipping_address: '12 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, Thành phố Hồ Chí Minh' }, recordAddress: true },
  'FR08-AI-013': { body: { total_amount: 200000, shipping_address: '' }, recordAddress: true },
  'FR08-AI-014': { body: { total_amount: 200000, shipping_address: '   ' }, recordAddress: true },
  'FR08-AI-015': { body: { total_amount: 200000, shipping_address: null }, recordAddress: true },
  'FR08-AI-016': { body: { total_amount: 200000 }, recordAddress: true },
  'FR08-AI-017': { body: { total_amount: 200000, shipping_address: 12345 }, recordAddress: true },
  'FR08-AI-018': { body: { total_amount: 200000, shipping_address: 'A'.repeat(1000) }, recordAddress: true },

  'FR08-AI-019': { body: stdBody, auth: 'none', expectNoNewOrder: true },
  'FR08-AI-020': { body: stdBody, auth: 'scheme', expectNoNewOrder: true },
  'FR08-AI-021': { body: stdBody, auth: 'empty', expectNoNewOrder: true },
  'FR08-AI-022': { body: stdBody, auth: 'tampered', expectNoNewOrder: true },
  'FR08-AI-023': { body: stdBody, auth: 'nonjwt', expectNoNewOrder: true },
  'FR08-AI-027': { body: { total_amount: 200000, shipping_address: ADDR, status: 'delivered' }, recordStatus: true },
  'FR08-AI-028': { body: { total_amount: 200000, shipping_address: "<script>alert('xss')</script>123 Le Loi" }, recordAddress: true, secUiGap: true },
  'FR08-AI-029': { body: { total_amount: 200000, shipping_address: "1 Le Loi'); DROP TABLE orders; --" }, seedPriorOrder: true, assertPriorOrdersIntact: true, recordAddress: true },
  'FR08-AI-030': { body: { total_amount: '1 OR 1=1', shipping_address: ADDR }, seedPriorOrder: true, assertPriorOrdersIntact: true },

  'FR08-AI-031': { body: stdBody, assertCartCleared: true },
  'FR08-AI-032': { body: stdBody, assertExactlyOneNewOrder: true },
  'FR08-AI-033': { cart: [LINE_A, { id: 2, name: 'San pham B', price: 50000, quantity: 3 }], body: { total_amount: 350000, shipping_address: ADDR } },
  'FR08-AI-034': { cart: [{ id: 1, name: 'San pham A', price: 100000, quantity: 2 }, { id: 1, name: 'San pham A', price: 100000, quantity: 3 }], body: { total_amount: 500000, shipping_address: ADDR } },
  'FR08-AI-035': { cart: [], body: stdBody },
  'FR08-AI-037': { body: stdBody, auth: 'none', expectNoNewOrder: true, assertCartUnchanged: true },
  'FR08-AI-038': { body: stdBody, assertOrderDetail: true },

  'FR08-AI-041': { bodyMode: 'none' },
  'FR08-AI-042': { body: {} },
  'FR08-AI-043': { bodyMode: 'raw', raw: '{"total_amount": 200000, "shipping_address":' },
  'FR08-AI-044': { bodyMode: 'raw', raw: JSON.stringify([stdBody]) },
  'FR08-AI-045': { body: { total_amount: 200000, shipping_address: { street: '123 Le Loi', city: 'TP.HCM' } }, recordAddress: true },
  'FR08-AI-046': { body: { total_amount: true, shipping_address: ADDR } },
  'FR08-AI-047': { body: { total_amount: 200000, shipping_address: ADDR, discount_code: 'FREESHIP99' } },
  'FR08-AI-048': { bodyMode: 'raw', raw: JSON.stringify(stdBody), contentType: 'text/plain', recordAddress: true },

  'FR08-AI-051': { cart: [{ id: 1, name: 'San pham A', price: 100000, quantity: 1 }], body: { total_amount: 100000, shipping_address: ADDR } },
  'FR08-AI-053': { cart: [{ id: 1, name: 'San pham A', price: 1, quantity: 1 }], body: { total_amount: 1, shipping_address: ADDR }, readCatalogueProductId: 1 },
  'FR08-AI-055': { body: { total_amount: 200000, shipping_address: '123 Le Loi\r\n\tTP.HCM' }, recordAddress: true },

  'FR08-AI-057': { body: stdBody, auth: 'expired', expectNoNewOrder: true, assertCartUnchanged: true, useSeededUser: 'test@eshop.com', useSeededPassword: 'Test1234!' },

  'FR08-H-004': { cart: [{ id: 9999, name: 'Ghost Product', price: 100000, quantity: 1 }], body: { total_amount: 100000, shipping_address: ADDR }, probeMissingProductId: 9999 },

  // Multi-phase / multi-user cases. Optional collection phases are activated per row.
  'FR08-AI-025': { body: stdBody, secondUser: { cart: [] }, assertSecondUserNoNewOrder: true },
  'FR08-AI-026': { body: stdBody, secondUser: { cart: [] }, injectSecondUserIdField: 'user_id', assertSecondUserNoNewOrder: true },
  'FR08-AI-036': { body: stdBody, assertFirstOrderDerived: true, secondCheckout: { body: stdBody }, assertSecondOrderDerived: true },
  'FR08-AI-039': { body: stdBody, secondUser: { cart: [LINE_A] }, assertSecondUserCartUnchanged: true },
  'FR08-AI-040': { body: stdBody, assertFirstOrderDerived: true, secondCheckout: { rebuildCart: [LINE_B1], body: { total_amount: 50000, shipping_address: ADDR } }, assertSecondOrderDerived: true, logItemCompositionGap: true },
  'FR08-H-001': { cart: [LINE_A, LINE_B1], body: stdBody, logIntermediateCart: true, logStaleClientTotal: true },
  'FR08-H-002': { cart: [LINE_A], body: stdBody, secondUser: { cart: [LINE_A, LINE_B3] }, logSecondUserDerived: true },
  'FR08-H-003': { body: stdBody, auth: 'none', expectNoNewOrder: true, secondCheckout: { body: stdBody }, assertCartUnchangedBeforeSecond: true, assertExactlyOneNewOrder: true, assertSecondOrderDerived: true },
  'FR08-H-005': { cart: [LINE_A], body: { total_amount: 200000, shipping_address: ADDR_1 }, secondCheckout: { rebuildCart: [LINE_B1], body: { total_amount: 50000, shipping_address: ADDR_2 } }, assertBothOrdersIndependent: { firstAddress: ADDR_1, secondAddress: ADDR_2 } },
};

const registry = JSON.parse(fs.readFileSync('work/registry/test-cases.json', 'utf8')).cases
  .filter((c) => c.apiId === 'HW06-B-FR08-POST-CHECKOUT');
const invalid = new Set(JSON.parse(fs.readFileSync('work/registry/human-reviews.json', 'utf8')).reviews
  .filter((r) => r.verdict === 'INVALID').map((r) => r.caseId));

const usable = registry.filter((c) => !invalid.has(c.id)).map((c) => c.id);
const expected = usable;

const missing = expected.filter((id) => !cfg[id]);
const extra = Object.keys(cfg).filter((id) => !expected.includes(id));
if (missing.length || extra.length) {
  throw new Error(`data-driven config mismatch. missing=${missing.join(',')} extra=${extra.join(',')}`);
}

const rows = expected.map((id) => {
  const c = cfg[id];
  const cart = c.cart === undefined ? [LINE_A] : c.cart;
  return {
    caseId: id,
    origin: id.includes('-H-') ? 'HUMAN' : 'AI',
    cart,
    bodyMode: c.bodyMode || 'json',
    body: c.body === undefined ? null : c.body,
    raw: c.raw === undefined ? null : c.raw,
    contentType: c.contentType || 'application/json',
    auth: c.auth || 'bearer',
    expectNoNewOrder: !!c.expectNoNewOrder,
    assertExactlyOneNewOrder: !!c.assertExactlyOneNewOrder,
    assertCartCleared: !!c.assertCartCleared,
    assertCartUnchanged: !!c.assertCartUnchanged,
    assertOrderDetail: !!c.assertOrderDetail,
    assertPriorOrdersIntact: !!c.assertPriorOrdersIntact,
    seedPriorOrder: !!c.seedPriorOrder,
    recordAddress: !!c.recordAddress,
    recordStatus: !!c.recordStatus,
    secUiGap: !!c.secUiGap,
    readCatalogueProductId: c.readCatalogueProductId || null,
    probeMissingProductId: c.probeMissingProductId || null,
    useSeededUser: c.useSeededUser || null,
    useSeededPassword: c.useSeededPassword || null,
    secondUser: c.secondUser || null,
    secondCheckout: c.secondCheckout || null,
    injectSecondUserIdField: c.injectSecondUserIdField || null,
    assertSecondUserNoNewOrder: !!c.assertSecondUserNoNewOrder,
    assertSecondUserCartUnchanged: !!c.assertSecondUserCartUnchanged,
    assertCartUnchangedBeforeSecond: !!c.assertCartUnchangedBeforeSecond,
    assertFirstOrderDerived: !!c.assertFirstOrderDerived,
    assertSecondOrderDerived: !!c.assertSecondOrderDerived,
    assertBothOrdersIndependent: c.assertBothOrdersIndependent || null,
    logIntermediateCart: !!c.logIntermediateCart,
    logStaleClientTotal: !!c.logStaleClientTotal,
    logSecondUserDerived: !!c.logSecondUserDerived,
    logItemCompositionGap: !!c.logItemCompositionGap,
  };
});

fs.mkdirSync('work/postman/fr08', { recursive: true });
fs.writeFileSync('work/postman/fr08/FR08-checkout.data.json', `${JSON.stringify(rows, null, 2)}\n`);
console.log('data rows:', rows.length, '| reviewed-usable FR-08 cases:', usable.length);
