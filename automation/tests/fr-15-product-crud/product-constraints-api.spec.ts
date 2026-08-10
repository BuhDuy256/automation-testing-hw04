import { test, expect } from '../../fixtures/base';
import fixtureData from '../../data/fr-15-product-crud.json';
import { adminAuth, loginAsAdmin, productMarker, uniqueNameOfLength } from '../../utils/admin';

/**
 * FR-15 — Step 6 Batch A: the six API-path input-constraint cases.
 *
 * P2 (README line 195): product name is required and at most 255 characters.
 * P3 (README line 196): price is required and must be positive (> 0).
 *
 * Expected values come from data/fr-15-product-crud.json only, never from observed behaviour.
 *
 * WHY APIRequestContext AND NOT THE ADMIN UI (architecture §3.1):
 * every case here asserts what the BACKEND stores. The admin form may well refuse an empty name or a
 * negative price on its own, which would hide whether the server validates anything — and
 * `TC-15-EP-003` (the `name` key absent entirely) is not expressible through a form at all, because
 * the form always sends the field. The admin interface is covered by Batch C's two UI cases.
 *
 * BROWSER COVERAGE — no test in this file requests the `page` fixture, so NO BROWSER IS LAUNCHED.
 * These 18 executions run once per configured project for matrix uniformity only and are excluded
 * from the browser-run count, exactly as FR-08's Batch B was.
 *
 * ORACLE NOTE — why no case asserts a status code:
 * `api_specification.md` §3.3 documents only the REQUEST BODY for the product write endpoints. It
 * defines no success status, no error contract, and no status code anywhere in the document. HW02
 * froze these expectations at outcome level for that exact reason, and both compliant shapes must
 * pass: *the create is rejected*, OR *a row is created but does not carry the invalid value*. The
 * status is recorded as an annotation.
 *
 * GLOBAL STATE — the rule that makes this batch different from FR-04 and FR-08 (design report §5
 * risk 1). Products belong to no user; they are shared by every worker, every project and every
 * previous run. So each case tags its payload with a unique marker, targets ONLY the row it created
 * via the id `POST /api/products` returns, and **never asserts on a total product count**.
 */

type CaseData = (typeof fixtureData.cases)[number];

const batchA = fixtureData.cases.filter((c) => c.batch === 'A');
if (batchA.length !== 6) {
  throw new Error(`expected 6 batch-A cases in fr-15-product-crud.json, found ${batchA.length}`);
}

type NameSpec = { mode: string; value?: string; length?: number };
type Persistence = { field: string; mode: string; compareTo: string; literal?: unknown };

const nameSpecOf = (testCase: CaseData): NameSpec => {
  const spec = testCase.input.name as NameSpec | undefined;
  if (!spec) throw new Error(`case ${testCase.id} declares no input.name in fr-15-product-crud.json`);
  return spec;
};

const persistenceOf = (testCase: CaseData): Persistence => {
  const rule = testCase.expected.persistence as Persistence | undefined;
  if (!rule) throw new Error(`case ${testCase.id} declares no expected.persistence`);
  return rule;
};

for (const testCase of batchA) {
  test(`${testCase.id} — ${testCase.title}`, async ({ api }) => {
    test.info().annotations.push(
      { type: 'HW02 case', description: testCase.hw02Ref },
      { type: 'Requirement', description: testCase.requirement },
      { type: 'Technique', description: testCase.technique },
      { type: 'Spec class', description: testCase.expected.specClass },
      { type: 'Expected source', description: testCase.expectedSource },
      { type: 'Mechanism', description: 'APIRequestContext — no browser is launched' },
    );

    const token = await loginAsAdmin(api);
    const auth = adminAuth(token);
    const marker = productMarker(testCase.id);

    // --- Build the payload. `description` always carries the marker, including for the cases whose
    // `name` is empty or absent: without it there would be no way to recognise an accidentally
    // persisted row, because the field that would normally identify it is the one under test.
    const nameSpec = nameSpecOf(testCase);
    const body: Record<string, unknown> = {
      price: testCase.input.price,
      description: marker,
      imageUrl: `https://placehold.co/300?text=${encodeURIComponent(marker)}`,
      category_id: testCase.input.categoryId,
    };

    let sentName: string | undefined;
    if (nameSpec.mode === 'literal') {
      sentName = nameSpec.value ?? '';
      body.name = sentName;
    } else if (nameSpec.mode === 'uniqueOfLength') {
      sentName = uniqueNameOfLength(marker, nameSpec.length as number);
      body.name = sentName;
      expect(
        sentName.length,
        `generated name is not exactly ${nameSpec.length} characters — the boundary under test would be wrong`,
      ).toBe(nameSpec.length);
    }
    // mode === 'omit' — the `name` key is deliberately never assigned, so it is absent from the body
    // rather than present-and-undefined. That distinction is the whole point of TC-15-EP-003.

    test.info().annotations.push({
      type: 'Sent payload',
      description: JSON.stringify({
        ...body,
        name: sentName === undefined ? '(key absent)' : `${sentName.slice(0, 30)}… (len ${sentName.length})`,
      }),
    });

    const created = await api.post('/api/products', { headers: auth, data: body });

    // Evidence, not oracle — no status code is documented for this endpoint.
    test.info().annotations.push({ type: 'POST status', description: String(created.status()) });

    const createdBody = created.ok()
      ? ((await created.json()) as { id?: number })
      : ({} as { id?: number });
    const createdId = typeof createdBody.id === 'number' ? createdBody.id : null;

    test.info().annotations.push({
      type: 'Product created',
      description: createdId === null ? 'no — the create was refused' : `yes — id ${createdId}`,
    });

    // --- A refused create is a COMPLIANT outcome for an invalid case, and the test must not require
    // the defect to be present in order to run. If nothing was created, the invalid value certainly
    // was not persisted, so the oracle is satisfied and there is nothing left to read back.
    if (createdId === null) {
      expect
        .soft(
          testCase.expected.mustBeCreated,
          `a spec-VALID product was refused; FR-15 line 193 says an admin can add products and ` +
            `line 195 defines this input as valid`,
        )
        .toBe(false);
      return;
    }

    const readBack = await api.get(`/api/products/${createdId}`, { headers: auth });
    expect(readBack.ok(), 'GET /api/products/:id failed — cannot judge persistence').toBeTruthy();
    const persisted = (await readBack.json()) as Record<string, unknown>;

    // Confirms the row read back is the one this test created. Products are global state, so without
    // this a fixture or id mix-up would silently move the assertion onto somebody else's row.
    expect
      .soft(persisted.description, 'read-back returned a different product than this test created')
      .toBe(marker);

    const rule = persistenceOf(testCase);
    const actual = persisted[rule.field];
    const expectedValue =
      rule.compareTo === 'sentValue'
        ? (rule.field === 'name' ? sentName : testCase.input.price)
        : rule.literal;

    const describeValue = (value: unknown): string =>
      typeof value === 'string' && value.length > 40 ? `${value.slice(0, 30)}… (len ${value.length})` : JSON.stringify(value);

    if (rule.mode === 'equals') {
      expect
        .soft(
          actual,
          `spec-valid ${rule.field} was not persisted as sent (${describeValue(expectedValue)}); ` +
            `${testCase.expectedSource}`,
        )
        .toBe(expectedValue);
    } else {
      expect
        .soft(
          actual,
          `spec-invalid ${rule.field} ${describeValue(expectedValue)} ended up stored; ` +
            `${testCase.expectedSource}. The spec does not prescribe HOW the value must be refused — ` +
            `only that this exact value must not be the stored result`,
        )
        .not.toBe(expectedValue);
    }
  });
}
