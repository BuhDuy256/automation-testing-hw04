import { type APIRequestContext } from '@playwright/test';
import { test, expect } from '../../fixtures/base';
import { registerAndLogin } from '../../utils/api';
import { ADMIN_URL } from '../../utils/urls';
import fixtureData from '../../data/fr-15-product-crud.json';
import {
  adminAuth,
  adminProductRows,
  loginAsAdmin,
  openAdminProducts,
  productMarker,
  seedAdminSession,
  uniqueNameOfLength,
} from '../../utils/admin';

/**
 * FR-15 — Step 6 Batch C: four API access-control cases and the two admin-UI cases.
 *
 * P6 (README FR-12, lines 177-179): POST / PUT / DELETE /api/products require a valid JWT **and**
 *                                   `role = 'admin'` in that token.
 * P5 (line 198): editing one product changes only that product — here on the **admin UI** surface.
 * P1 (line 193): an admin can add products — here **through the interface**.
 *
 * Expected values come from data/fr-15-product-crud.json only, never from observed behaviour.
 *
 * BROWSER COVERAGE — this is the ONLY FR-15 batch that launches a browser, and only for two of its
 * six cases. `TC-15-EP-011-UI` and `TC-15-N02-UI` request `page` (2 × 3 = **6 genuine browser
 * executions**); the four access-control cases never do, and their 12 executions are matrix
 * uniformity only. FR-15's entire browser coverage is those 6.
 *
 * ORACLE NOTE — no status code is asserted anywhere. `api_specification.md` §3.3 documents only the
 * request body for the product write endpoints; there is no error contract in the whole document.
 * The access-control oracle is therefore an OUTCOME: no product created, not modified, not deleted.
 *
 * GLOBAL STATE — products belong to no user. Every case tags its payload with a unique marker,
 * targets only the rows it created, and **never asserts on a product count**.
 */

type CaseData = (typeof fixtureData.cases)[number];
type ProductRow = Record<string, unknown>;

const batchC = fixtureData.cases.filter((c) => c.batch === 'C');
if (batchC.length !== 6) {
  throw new Error(`expected 6 batch-C cases in fr-15-product-crud.json, found ${batchC.length}`);
}

const caseById = (id: string): CaseData => {
  const found = batchC.find((c) => c.id === id);
  if (!found) throw new Error(`case ${id} missing from fr-15-product-crud.json batch C`);
  return found;
};

const nameLengthOf = (testCase: CaseData): number => {
  const spec = testCase.input.name as { length?: number } | undefined;
  if (!spec || typeof spec.length !== 'number') {
    throw new Error(`case ${testCase.id} declares no input.name.length`);
  }
  return spec.length;
};

/** `price` may come back as a string from the detail endpoint (BUG-15-102, issue #9). */
const asNumber = (value: unknown): unknown =>
  value === null || value === undefined || value === '' ? value : Number(value);

const annotate = (testCase: CaseData) => {
  test.info().annotations.push(
    { type: 'Requirement', description: testCase.requirement },
    { type: 'Technique', description: testCase.technique },
    { type: 'Expected source', description: testCase.expectedSource },
    {
      type: 'Mechanism',
      description:
        testCase.mechanism === 'UI'
          ? 'admin UI — a real browser is launched'
          : 'APIRequestContext — no browser is launched',
    },
  );
  if (testCase.hw02Ref) {
    test.info().annotations.push({ type: 'HW02 case', description: testCase.hw02Ref });
  }
};

/** Creates a product as admin and returns its id + marker. Used to build preconditions. */
async function createAsAdmin(
  api: APIRequestContext,
  auth: Record<string, string>,
  testCase: CaseData,
): Promise<{ id: number; name: string; marker: string }> {
  const marker = productMarker(testCase.id);
  const name = uniqueNameOfLength(marker, nameLengthOf(testCase));
  const response = await api.post('/api/products', {
    headers: auth,
    data: {
      name,
      price: testCase.input.price,
      description: marker,
      imageUrl: `https://placehold.co/300?text=${encodeURIComponent(marker)}`,
      category_id: testCase.input.categoryId,
    },
  });
  const body = response.ok() ? ((await response.json()) as { id?: number }) : {};
  const id = typeof body.id === 'number' ? body.id : null;
  expect(id, `could not create the precondition product for ${testCase.id} — setup failed`).not.toBeNull();
  return { id: id as number, name, marker };
}

const listProducts = async (api: APIRequestContext): Promise<ProductRow[]> =>
  (await (await api.get('/api/products')).json()) as ProductRow[];

// --- P6: POST must be refused without admin rights ----------------------------------------------

for (const id of ['TC-15-EP-006-API', 'TC-15-EP-007-API']) {
  const testCase = caseById(id);

  test(`${testCase.id} — ${testCase.title}`, async ({ api }) => {
    annotate(testCase);

    let headers: Record<string, string> = {};
    if (testCase.input.auth === 'normalUser') {
      // A REAL non-admin account, registered fresh. BUG-04-103 self-escalation is deliberately not
      // used — depending on it would require that filed security defect to stay unfixed.
      const user = await registerAndLogin(api, 'fr15-nonadmin');
      headers = { Authorization: `Bearer ${user.token}` };

      // Precondition, asserted explicitly: if the fixture ever handed back an admin, the case would
      // "fail" while proving nothing about access control.
      const me = (await (
        await api.get('/api/users/me', { headers })
      ).json()) as { role?: string };
      test.info().annotations.push({ type: 'Actor role', description: String(me.role) });
      expect(me.role, 'the non-admin fixture returned an admin account — setup failed').not.toBe(
        'admin',
      );
    }

    const marker = productMarker(testCase.id);
    const name = uniqueNameOfLength(marker, nameLengthOf(testCase));
    const response = await api.post('/api/products', {
      headers,
      data: {
        name,
        price: testCase.input.price,
        description: marker,
        imageUrl: `https://placehold.co/300?text=${encodeURIComponent(marker)}`,
        category_id: testCase.input.categoryId,
      },
    });

    // Evidence, not oracle — no status code is documented for this endpoint.
    test.info().annotations.push({ type: 'POST status', description: String(response.status()) });

    // Outcome oracle: no product bearing THIS test's marker may exist. Never a total count, which is
    // shared with every parallel worker and every previous run.
    const created = (await listProducts(api)).filter((row) => row.description === marker);
    expect
      .soft(
        created,
        `a product was created by a request that ${
          testCase.input.auth === 'none' ? 'carried no Authorization header' : 'used a non-admin token'
        }; ${testCase.expectedSource}`,
      )
      .toEqual([]);
  });
}

// --- P6: PUT must be refused without admin rights -----------------------------------------------

test(`${caseById('TC-15-EP-008-API').id} — ${caseById('TC-15-EP-008-API').title}`, async ({ api }) => {
  const testCase = caseById('TC-15-EP-008-API');
  annotate(testCase);
  const auth = adminAuth(await loginAsAdmin(api));

  const product = await createAsAdmin(api, auth, testCase);
  const before = (await (await api.get(`/api/products/${product.id}`, { headers: auth })).json()) as ProductRow;
  expect(before.description, 'precondition product could not be read back — setup failed').toBe(
    product.marker,
  );

  const forged = await api.put(`/api/products/${product.id}`, {
    data: {
      name: `${product.name}-HIJACKED`,
      price: testCase.input.forgedPrice,
      description: product.marker,
      imageUrl: String(before.imageUrl ?? ''),
      category_id: testCase.input.categoryId,
    },
  });
  test.info().annotations.push({ type: 'PUT status', description: String(forged.status()) });

  const after = (await (await api.get(`/api/products/${product.id}`, { headers: auth })).json()) as ProductRow;

  // Compared against the row's OWN recorded originals, not constants.
  expect
    .soft(after.name, `an unauthenticated request changed the product's name; ${testCase.expectedSource}`)
    .toBe(before.name);
  expect
    .soft(
      asNumber(after.price),
      `an unauthenticated request changed the product's price; ${testCase.expectedSource}`,
    )
    .toBe(asNumber(before.price));
  expect
    .soft(
      Number(after.category_id),
      `an unauthenticated request changed the product's category; ${testCase.expectedSource}`,
    )
    .toBe(Number(before.category_id));
});

// --- P6: DELETE must be refused without admin rights --------------------------------------------

test(`${caseById('TC-15-EP-009-API').id} — ${caseById('TC-15-EP-009-API').title}`, async ({ api }) => {
  const testCase = caseById('TC-15-EP-009-API');
  annotate(testCase);
  const auth = adminAuth(await loginAsAdmin(api));

  const product = await createAsAdmin(api, auth, testCase);

  // Precondition: present BEFORE the unauthenticated delete, or "still present" proves nothing.
  const before = (await listProducts(api)).filter((row) => row.id === product.id);
  expect(before, 'precondition product is not in the list — setup failed').toHaveLength(1);

  const forged = await api.delete(`/api/products/${product.id}`);
  test.info().annotations.push({ type: 'DELETE status', description: String(forged.status()) });

  const after = (await listProducts(api)).filter((row) => row.id === product.id);
  expect
    .soft(
      after,
      `an unauthenticated request deleted the product; ${testCase.expectedSource}`,
    )
    .toHaveLength(1);
});

// --- P5 on the admin UI surface -----------------------------------------------------------------

test(`${caseById('TC-15-EP-011-UI').id} — ${caseById('TC-15-EP-011-UI').title}`, async ({
  page,
  api,
}) => {
  test.slow(); // UI-path: same measured contention budget as FR-08's UI batches.
  const testCase = caseById('TC-15-EP-011-UI');
  annotate(testCase);

  // The admin panel alerts on a successful update (App.jsx ~line 116). An unhandled dialog blocks
  // the page and every later command, so the handler is registered before any interaction.
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });

  const auth = adminAuth(await loginAsAdmin(api));
  const target = await createAsAdmin(api, auth, testCase);
  const sibling = await createAsAdmin(api, auth, testCase);

  await seedAdminSession(page, await loginAsAdmin(api));
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
  await openAdminProducts(page);

  const targetRow = adminProductRows(page).filter({ hasText: target.name });
  const siblingRow = adminProductRows(page).filter({ hasText: sibling.name });
  await expect(targetRow, 'the target product is not listed in the admin panel').toHaveCount(1);
  await expect(siblingRow, 'the sibling product is not listed in the admin panel').toHaveCount(1);

  // The sibling's DISPLAYED name is recorded before the edit, so the oracle is "unchanged from its
  // own recorded original" rather than equality with a constant.
  const siblingNameBefore = sibling.name;
  test.info().annotations.push({
    type: 'Sibling displayed name before edit',
    description: siblingNameBefore,
  });

  await targetRow.getByRole('button', { name: 'Sửa' }).click();
  const nameField = page.getByPlaceholder('Tên sản phẩm');
  await expect(nameField, 'the edit form did not load the target product').toHaveValue(target.name);
  await nameField.fill(`${target.name}${testCase.input.editedNameSuffix}`);
  await page.getByRole('button', { name: 'Lưu sản phẩm' }).click();

  // Wait for the app's own completion signal, then assert WITHOUT reloading. A reload would refetch
  // from the backend — which TC-15-EP-010 has already shown is correct — and would therefore hide a
  // client-state defect entirely. This is the whole reason the case exists on this surface.
  await expect
    .poll(() => dialogs.length, { message: 'the admin panel never confirmed the update' })
    .toBeGreaterThan(0);
  test.info().annotations.push({ type: 'Dialogs shown', description: JSON.stringify(dialogs) });

  await expect
    .soft(
      adminProductRows(page).filter({ hasText: siblingNameBefore }),
      `editing one product changed another product's displayed name in the admin panel; ` +
        `${testCase.expectedSource}. Judged independently of TC-15-EP-010 — the backend isolating ` +
        `edits correctly says nothing about what the panel renders`,
    )
    .toHaveCount(1);
});

// --- P1 (add) on the admin UI surface -----------------------------------------------------------

test(`${caseById('TC-15-N02-UI').id} — ${caseById('TC-15-N02-UI').title}`, async ({ page, api }) => {
  test.slow();
  const testCase = caseById('TC-15-N02-UI');
  annotate(testCase);

  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });

  const marker = productMarker(testCase.id);
  const name = uniqueNameOfLength(marker, nameLengthOf(testCase));

  await seedAdminSession(page, await loginAsAdmin(api));
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
  await openAdminProducts(page);

  // The admin form DOES expose placeholders — unlike the storefront profile form, where `getByLabel`
  // was unusable. Re-derived from `frontend-admin`, not inherited from FR-04.
  await page.getByPlaceholder('Tên sản phẩm').fill(name);
  await page.getByPlaceholder('Giá tiền').fill(String(testCase.input.price));
  await page.getByPlaceholder('Mô tả').fill(marker);
  await page.getByRole('button', { name: 'Lưu sản phẩm' }).click();

  // Surface 1 — what the panel shows.
  await expect
    .soft(
      adminProductRows(page).filter({ hasText: name }),
      `the product added through the admin panel does not appear in its product list; ` +
        `${testCase.expectedSource}`,
    )
    .toHaveCount(1);

  // Surface 2 — what the backend stored. Either could pass while the other failed, so both are
  // asserted: a panel that renders an optimistic row without persisting would be caught here.
  const stored = (await listProducts(api)).filter((row) => row.name === name);
  expect
    .soft(
      stored,
      `the product added through the admin panel was not persisted; ${testCase.expectedSource}. ` +
        `Dialogs: ${JSON.stringify(dialogs)}`,
    )
    .toHaveLength(1);
});
