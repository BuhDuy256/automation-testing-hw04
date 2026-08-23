// One-off FR-15 ACT-EVID-01 helper.
//
// The Newman htmlextra report keeps request cards collapsed behind the Total Requests tab. This
// helper opens the unmodified targeted reports over a read-only local HTTP server, performs only
// the clicks a human reviewer would perform, and clips the real Execute and Verify cards. The PNGs
// are registered separately so the evidence registry records this fallback method honestly.
//
// Usage: node work/evidence/capture-fr15-report-cards.mjs <baseUrl> <outDir>

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [, , baseUrl, outDir] = process.argv;
if (!baseUrl || !outDir) {
  throw new Error('Usage: capture-fr15-report-cards.mjs <baseUrl> <outDir>');
}
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  {
    file: 'EVID-FR15-AUTHORIZATION.png',
    report: 'work/runs/RUN-20260823102829114-fr15-auth-reproduction/newman-report.html',
    iteration: 2,
    caseId: 'FR15-AI-028',
  },
  {
    file: 'EVID-FR15-VALIDATION.png',
    report: 'work/runs/RUN-20260823102841701-fr15-validation-reproduction/newman-report.html',
    iteration: 2,
    caseId: 'FR15-AI-009',
  },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  for (const target of targets) {
    const reportUrl = `${baseUrl.replace(/\/$/, '')}/${target.report}`;
    await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.click('#pills-requests-tab');
    await page.locator('#iterationList li').nth(target.iteration - 1).click();
    await page.waitForTimeout(600);

    const boxes = [];
    for (const phase of ['Execute', 'Verify']) {
      const anchor = page.locator(`a:has-text("Iteration: ${target.iteration} - ${phase}")`).first();
      await anchor.scrollIntoViewIfNeeded();
      const isOpen = await anchor.evaluate((element) => {
        const body = element.closest('div.card')?.querySelector('.collapse');
        return Boolean(body?.classList.contains('show'));
      });
      if (!isOpen) {
        await anchor.click();
        await page.waitForTimeout(800);
      }
      const box = await anchor.evaluate((element) => {
        const card = element.closest('div.card');
        const body = card?.querySelector('.collapse');
        const rect = card?.getBoundingClientRect();
        if (!rect || !body?.classList.contains('show')) return null;
        return {
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
          width: rect.width,
          height: rect.height,
        };
      });
      if (!box) throw new Error(`Expanded ${phase} card not found for ${target.caseId}`);
      boxes.push(box);
    }

    const left = Math.min(...boxes.map((box) => box.x));
    const top = Math.min(...boxes.map((box) => box.y));
    const right = Math.max(...boxes.map((box) => box.x + box.width));
    const bottom = Math.max(...boxes.map((box) => box.y + box.height));
    const output = path.join(outDir, target.file);
    await page.screenshot({
      path: output,
      fullPage: true,
      clip: { x: left, y: top, width: right - left, height: bottom - top },
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
    const stats = fs.statSync(output);
    process.stdout.write(`${target.file}: ${Math.round(right - left)}x${Math.round(bottom - top)} px, ${stats.size} bytes, ${target.caseId}\n`);
  }
  await context.close();
} finally {
  await browser.close();
}
