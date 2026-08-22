import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import {
  absoluteFromRepo,
  parseArgs,
  readJson,
  relativeToRepo,
  sha256File,
  writeJson,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const action = args._[0];
const registryPath = 'work/registry/evidence.json';

function required(name) {
  if (typeof args[name] !== 'string' || !args[name].trim()) throw new Error(`Missing --${name}`);
  return args[name].trim();
}

function pngInfo(relativePath) {
  const data = fs.readFileSync(absoluteFromRepo(relativePath));
  const signature = '89504e470d0a1a0a';
  if (data.length < 100 || data.subarray(0, 8).toString('hex') !== signature) throw new Error(`Invalid PNG: ${relativePath}`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width < 1 || height < 1) throw new Error(`Invalid PNG dimensions: ${relativePath}`);
  return { bytes: data.length, width, height };
}

function parseViewport(value = '1440x900') {
  const match = /^(\d{3,4})x(\d{3,4})$/.exec(value);
  if (!match) throw new Error('Viewport must use WIDTHxHEIGHT, for example 1440x900');
  return { width: Number(match[1]), height: Number(match[2]) };
}

async function capture() {
  const id = required('id').toUpperCase();
  const fixture = args.fixture === true;
  if (!(fixture ? /^FIXTURE-[A-Z0-9_-]+$/ : /^EVID-[A-Z0-9_-]+$/).test(id)) {
    throw new Error(fixture ? 'Fixture id must start with FIXTURE-' : 'Evidence id must start with EVID-');
  }
  const type = required('type');
  const description = required('description');
  const sourceUrl = required('url');
  const parsedUrl = new URL(sourceUrl);
  if (!['http:', 'https:', 'file:', 'data:'].includes(parsedUrl.protocol)) throw new Error('URL must use http, https, file, or data');
  if (parsedUrl.protocol === 'file:') relativeToRepo(decodeURIComponent(parsedUrl.pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1))));
  if (['file:', 'data:'].includes(parsedUrl.protocol) && !fixture) throw new Error('file/data URLs are allowed only for fixtures');

  const mode = typeof args.mode === 'string' ? args.mode : 'viewport';
  if (!['viewport', 'full-page', 'element'].includes(mode)) throw new Error('Mode must be viewport, full-page, or element');
  const selector = mode === 'element' ? required('selector') : null;
  const outputPath = typeof args.output === 'string'
    ? relativeToRepo(path.resolve(args.output))
    : `${fixture ? 'work/fixtures/screenshots' : 'work/evidence/screenshots'}/${id}.png`;
  const metadataPath = outputPath.replace(/\.png$/i, '.metadata.json');
  if (!outputPath.toLowerCase().endsWith('.png')) throw new Error('Output must be a .png file');
  if (fs.existsSync(absoluteFromRepo(outputPath))) throw new Error(`Refusing to overwrite ${outputPath}`);

  const registry = readJson(registryPath);
  if (!fixture && registry.items.some((item) => item.id === id)) throw new Error(`Evidence already exists: ${id}`);
  fs.mkdirSync(path.dirname(absoluteFromRepo(outputPath)), { recursive: true });

  const storageState = typeof args['storage-state'] === 'string' ? absoluteFromRepo(args['storage-state']) : undefined;
  if (storageState && !fs.statSync(storageState).isFile()) throw new Error(`Storage state is not a file: ${args['storage-state']}`);
  const browser = await chromium.launch({ channel: typeof args.channel === 'string' ? args.channel : 'msedge', headless: true });
  let pageTitle;
  let finalUrl;
  try {
    const context = await browser.newContext({ viewport: parseViewport(args.viewport), storageState });
    const page = await context.newPage();
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: Number(args.timeout ?? 30000) });
    if (typeof args['wait-for'] === 'string') await page.locator(args['wait-for']).waitFor({ state: 'visible' });
    if (mode === 'element') {
      await page.locator(selector).screenshot({ path: absoluteFromRepo(outputPath), animations: 'disabled', caret: 'hide', scale: 'css' });
    } else {
      await page.screenshot({ path: absoluteFromRepo(outputPath), fullPage: mode === 'full-page', animations: 'disabled', caret: 'hide', scale: 'css' });
    }
    pageTitle = await page.title();
    finalUrl = page.url();
    await context.close();
  } finally {
    await browser.close();
  }

  const image = pngInfo(outputPath);
  const capturedAt = new Date().toISOString();
  const item = {
    id,
    type,
    description,
    path: outputPath,
    sha256: sha256File(outputPath),
    capturedAt,
    captureMethod: 'Playwright headless Chromium',
    sourceUrl,
    finalUrl,
    pageTitle,
    mode,
    selector,
    viewport: parseViewport(args.viewport),
    image,
    humanAttestation: false,
  };
  writeJson(metadataPath, item);
  if (!fixture) {
    registry.items.push(item);
    writeJson(registryPath, registry);
  }
  process.stdout.write(`${fixture ? 'Fixture' : 'Evidence'} screenshot captured: ${outputPath}\n`);
  process.stdout.write('Human visual verification is still required.\n');
}

function register() {
  const id = required('id').toUpperCase();
  if (!/^EVID-[A-Z0-9_-]+$/.test(id)) throw new Error('Evidence id must start with EVID-');
  const type = required('type');
  const description = required('description');
  const method = required('method');
  const source = path.resolve(required('file'));
  if (!fs.statSync(source).isFile()) throw new Error(`Not a file: ${source}`);
  const targetPath = `work/evidence/screenshots/${id}.png`;
  if (fs.existsSync(absoluteFromRepo(targetPath))) throw new Error(`Refusing to overwrite ${targetPath}`);
  const registry = readJson(registryPath);
  if (registry.items.some((item) => item.id === id)) throw new Error(`Evidence already exists: ${id}`);
  fs.mkdirSync(path.dirname(absoluteFromRepo(targetPath)), { recursive: true });
  fs.copyFileSync(source, absoluteFromRepo(targetPath), fs.constants.COPYFILE_EXCL);
  const image = pngInfo(targetPath);
  const item = {
    id,
    type,
    description,
    path: targetPath,
    sha256: sha256File(targetPath),
    capturedAt: new Date().toISOString(),
    captureMethod: `manual fallback: ${method}`,
    sourceUrl: typeof args.url === 'string' ? args.url : null,
    image,
    humanAttestation: false,
  };
  registry.items.push(item);
  writeJson(registryPath, registry);
  writeJson(targetPath.replace(/\.png$/i, '.metadata.json'), item);
  process.stdout.write(`Registered manual fallback screenshot: ${targetPath}\nHuman visual verification is still required.\n`);
}

function attest() {
  const id = required('id').toUpperCase();
  const attestedBy = required('attested-by');
  const registry = readJson(registryPath);
  const item = registry.items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown evidence: ${id}`);
  pngInfo(item.path);
  if (sha256File(item.path) !== item.sha256) throw new Error(`Screenshot hash changed after capture: ${id}`);
  item.humanAttestation = true;
  item.attestedBy = attestedBy;
  item.attestedAt = new Date().toISOString();
  writeJson(registryPath, registry);
  const metadataPath = item.path.replace(/\.png$/i, '.metadata.json');
  writeJson(metadataPath, item);
  process.stdout.write(`Recorded human visual attestation for ${id}.\n`);
}

try {
  if (action === 'capture') await capture();
  else if (action === 'register') register();
  else if (action === 'attest') attest();
  else throw new Error('Usage: capture-screenshot.mjs <capture|register|attest> [options]');
} catch (caught) {
  process.stderr.write(`ERROR: ${caught.message}\n`);
  process.exitCode = 1;
}
