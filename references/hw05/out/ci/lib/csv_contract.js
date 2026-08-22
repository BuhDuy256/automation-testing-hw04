// Shared CSV-contract validation for the frozen New Customer Onboarding and First Order
// workflow. Extracted from the reviewed official scenario scripts (out/23127179_*_20260817.js)
// so the CI regression script enforces the same data contract without duplicating it.
export const EXPECTED_HEADERS = ['identity_seed', 'name', 'password', 'phone', 'shipping_address', 'quantity'];

export function validateWorkflowCsv(rows) {
  if (rows.length === 0) {
    throw new Error('CSV must contain at least one data row');
  }

  const actualHeaders = Object.keys(rows[0]);
  if (
    actualHeaders.length !== EXPECTED_HEADERS.length ||
    EXPECTED_HEADERS.some((header) => !actualHeaders.includes(header))
  ) {
    throw new Error(`CSV header must be exactly: ${EXPECTED_HEADERS.join(',')}`);
  }

  const seenSeeds = {};
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (Object.keys(row).length !== EXPECTED_HEADERS.length) {
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
}
