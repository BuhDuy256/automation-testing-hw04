// One-off evidence helper for FR-08 ACT-EVID-01.
//
// scripts/hw06/capture-screenshot.mjs cannot click, and the Newman htmlextra report keeps every
// request card collapsed behind the "Total Requests" tab. This helper opens the UNMODIFIED report
// over the local static server, performs exactly the clicks a human reviewer would perform
// (open the tab, filter to one iteration, expand the requests), and clips the resulting real
// cards. The PNGs are then registered through `capture-screenshot.mjs register`, which records the
// capture method honestly instead of pretending the standard capture path produced them.
//
// Iteration numbers are the 1-based row positions in FR08-checkout.data.json, which is NOT the
// numeric suffix of the case id: the six INVALID cases were excluded from the executable suite, so
// FR08-AI-031 is iteration 30. Verify the mapping with build-data.mjs output before capturing.
//
// Usage: node work/evidence/capture-fr08-report-cards.mjs <reportUrl> <outDir>

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [, , reportUrl, outDir] = process.argv;
if (!reportUrl || !outDir) throw new Error('Usage: capture-fr08-report-cards.mjs <reportUrl> <outDir>');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  {
    file: 'FR08-CART-NOT-CLEARED.png',
    iteration: 30,
    cards: ['Execute', 'Verify'],
    label: 'FR08-AI-031 successful checkout followed by a cart that still holds the purchased line',
  },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  for (const target of targets) {
    await page.click('#pills-requests-tab');
    await page.waitForTimeout(400);
    // The requests tab renders one iteration at a time; select it the way a reviewer would.
    await page.locator('#iterationList li').nth(target.iteration - 1).click();
    await page.waitForTimeout(600);


    const boxes = [];
    for (const card of target.cards) {
      const anchor = page.locator(`a:has-text("Iteration: ${target.iteration} - ${card}")`).first();
      await anchor.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const isOpen = await anchor.evaluate((el) => {
        const body = el.closest('div.card').querySelector('.collapse');
        return !!body && body.classList.contains('show');
      });
      if (!isOpen) { await anchor.click(); await page.waitForTimeout(900); }
      const box = await anchor.evaluate((el) => {
        const cardEl = el.closest('div.card');
        const body = cardEl.querySelector('.collapse');
        const expanded = !!body && body.classList.contains('show');
        const rect = cardEl.getBoundingClientRect();
        return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height, expanded };
      });
      if (!box.expanded) throw new Error(`Card is still collapsed: iteration ${target.iteration} ${card}`);
      if (!box || !box.height) throw new Error(`Card not found: iteration ${target.iteration} ${card}`);
      boxes.push(box);
    }
    const top = Math.min(...boxes.map((b) => b.y));
    const bottom = Math.max(...boxes.map((b) => b.y + b.height));
    const left = Math.min(...boxes.map((b) => b.x));
    const right = Math.max(...boxes.map((b) => b.x + b.width));
    const outPath = path.join(outDir, target.file);
    await page.screenshot({
      path: outPath,
      fullPage: true,
      clip: { x: left, y: top, width: right - left, height: bottom - top },
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
    const stats = fs.statSync(outPath);
    process.stdout.write(`${target.file}: ${Math.round(right - left)}x${Math.round(bottom - top)} px, ${stats.size} bytes — ${target.label}\n`);
  }
  await context.close();
} finally {
  await browser.close();
}
