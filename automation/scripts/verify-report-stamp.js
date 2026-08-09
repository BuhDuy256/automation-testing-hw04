/**
 * Verifies the generated Playwright HTML report carries "Run by: {StudentID}" + an ISO
 * timestamp (HW04 §6 / §11 anti-cheat evidence). Exits non-zero if the stamp is missing.
 *
 *   node scripts/verify-report-stamp.js [path/to/index.html]
 *
 * Why this exists instead of a grep: the report is a single index.html whose <title> tag is a
 * STATIC Vite shell tag that always reads "Playwright Test Report". The real title and the
 * metadata live in report.json inside a base64 zip embedded in that file, and the page sets
 * document.title from it at runtime. Grepping the raw HTML therefore reports a false failure —
 * this decodes the payload and checks the actual values.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const STUDENT_ID = '23127179';
const ISO_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

const reportPath = process.argv[2] || path.join('playwright-report', 'index.html');

function readEmbeddedReportJson(html) {
  const m = html.match(/id="playwrightReportBase64">data:application\/zip;base64,([A-Za-z0-9+/=]+)</);
  if (!m) throw new Error('no embedded report payload found in ' + reportPath);
  const buf = Buffer.from(m[1], 'base64');

  let off = 0;
  while (off < buf.length - 4 && buf.readUInt32LE(off) === 0x04034b50) {
    const method = buf.readUInt16LE(off + 8);
    const csize = buf.readUInt32LE(off + 18);
    const nlen = buf.readUInt16LE(off + 26);
    const elen = buf.readUInt16LE(off + 28);
    const name = buf.slice(off + 30, off + 30 + nlen).toString();
    const start = off + 30 + nlen + elen;
    if (name === 'report.json') {
      const raw = buf.slice(start, start + csize);
      return JSON.parse((method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8'));
    }
    off = start + csize;
  }
  throw new Error('report.json not found inside the embedded payload');
}

const report = readEmbeddedReportJson(fs.readFileSync(reportPath, 'utf8'));
const title = report.options?.title ?? '';
const runBy = report.metadata?.['Run by'] ?? '';

const checks = [
  ['report title contains "Run by: ' + STUDENT_ID + '"', title.includes(`Run by: ${STUDENT_ID}`)],
  ['report title contains an ISO timestamp', ISO_RE.test(title)],
  ['report title is not the default', title !== '' && title !== 'Playwright Test Report'],
  ['metadata "Run by" contains ' + STUDENT_ID, runBy.includes(STUDENT_ID)],
  ['metadata "Run by" contains an ISO timestamp', ISO_RE.test(runBy)],
];

console.log(`report:   ${reportPath}`);
console.log(`title:    ${title}`);
console.log(`metadata: Run by = ${runBy}\n`);

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} check(s) failed — the report does not carry the required stamp.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
