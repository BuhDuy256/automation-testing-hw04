import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outRoot = path.resolve(repoRoot, 'out');
const errors = [];
const warnings = [];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else files.push(target);
  }
}
walk(outRoot);

function relative(file) { return path.relative(outRoot, file).split(path.sep).join('/'); }
function requireFile(name) {
  const target = path.join(outRoot, name);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) errors.push(`Missing required submission file: ${name}`);
  return target;
}

for (const name of [
  'README.md', 'main-report.md', 'main-report.pdf', 'test-cases.xlsx', 'submission-checklist.md',
  'ai-audit-report.md', 'ai-audit-report.pdf', 'ai-critique.md', 'ai-critique.pdf', 'git-commit-log.txt',
  'github-repo-link.txt', 'bug-report.md', 'ci-cd-report.md', 'postman-features.md',
  'generator/pseudocode.md', 'generator/agent-skill/SKILL.md',
]) requireFile(name);

for (const file of files) {
  if (/database\.sqlite$/i.test(file) || /\.(sqlite|sqlite3|db)$/i.test(file)) errors.push(`Forbidden runtime database included: ${relative(file)}`);
}

const textExtensions = new Set(['.md', '.txt', '.json', '.html', '.yml', '.yaml', '.mjs', '.log']);
const forbiddenPatterns = [
  ['development work path', /(?:\.\.\/)?work\//i],
  ['scratch path', /\.scratch[\\/]/i],
  ['frozen reference path', /(?:^|[\s`"'(])references[\\/]/im],
  ['Windows user path', /[A-Za-z]:\\Users\\/i],
  ['macOS user path', /\/Users\/[A-Za-z0-9._-]+\//],
  ['file URI', /file:\/\//i],
  ['repository script path', /scripts\/hw06\//i],
  ['repository SUT path', /eshop-sut\//i],
];
for (const file of files.filter((item) => textExtensions.has(path.extname(item).toLowerCase()))) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of forbiddenPatterns) if (pattern.test(content)) errors.push(`${relative(file)} contains ${label}`);
  if (/\b(?:TODO|TBD|FIXME)\b/i.test(content)) errors.push(`${relative(file)} contains an avoidable TODO/TBD/FIXME marker`);
  if (/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(content)) {
    errors.push(`${relative(file)} contains a token/private-key signature`);
  }
}

const youtubeMarker = '[TO BE FILLED BY STUDENT]';
const markerLocations = files.filter((file) => textExtensions.has(path.extname(file).toLowerCase()) && fs.readFileSync(file, 'utf8').includes(youtubeMarker));
const readme = fs.readFileSync(path.join(outRoot, 'README.md'), 'utf8');
const youtubeUrls = [...readme.matchAll(/https?:\/\/(?:www\.)?(?:youtube\.com\/\S+|youtu\.be\/\S+)/gi)];
if (markerLocations.length > 0 && (markerLocations.length !== 1 || relative(markerLocations[0]) !== 'README.md')) errors.push('YouTube placeholder may appear only once, in README.md');
if (markerLocations.length === 0 && youtubeUrls.length !== 1) errors.push('README.md must contain exactly one YouTube demonstration URL when the placeholder is removed');

for (const file of files.filter((item) => path.extname(item).toLowerCase() === '.md')) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    target = target.replace(/^<|>$/g, '').split('#')[0].split('?')[0];
    if (!target) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (resolved !== outRoot && !resolved.startsWith(outRoot + path.sep)) errors.push(`${relative(file)} link escapes out/: ${match[1]}`);
    else if (!fs.existsSync(resolved)) errors.push(`${relative(file)} has broken local link: ${match[1]}`);
  }
}

const critique = fs.readFileSync(path.join(outRoot, 'ai-critique.md'), 'utf8').trim();
const critiqueWords = critique.split(/\s+/).filter(Boolean).length;
if (critiqueWords < 200 || critiqueWords > 300) errors.push(`AI critique has ${critiqueWords} words; expected 200-300`);

const summary = JSON.parse(fs.readFileSync(path.join(outRoot, 'provenance', 'test-summary.json'), 'utf8'));
if (summary.selectedApiCount !== 3 || summary.totals.aiGenerated !== 163 || summary.totals.humanAdded !== 17 || summary.totals.executed !== 159 || summary.totals.failed !== 56 || summary.bugCount !== 6) {
  errors.push('Submission summary counts do not match canonical expected totals');
}
for (const api of summary.apis) {
  if (api.passed + api.failed !== api.executed) errors.push(`${api.feature} arithmetic does not reconcile`);
}

const bugs = JSON.parse(fs.readFileSync(path.join(outRoot, 'provenance', 'bugs.json'), 'utf8')).bugs.filter((bug) => bug.status === 'published');
const bugReport = fs.readFileSync(path.join(outRoot, 'bug-report.md'), 'utf8');
if (bugs.length !== 6) errors.push(`Expected six published bugs, found ${bugs.length}`);
for (const bug of bugs) {
  if (!bugReport.includes(bug.githubIssueUrl) || !bugReport.includes(`Issue #${bug.githubIssueNumber}`)) errors.push(`Bug report does not match ${bug.id}`);
}

const ciRuns = JSON.parse(fs.readFileSync(path.join(outRoot, 'provenance', 'ci-runs.json'), 'utf8')).runs;
const ciText = fs.readFileSync(path.join(outRoot, 'ci-cd-report.md'), 'utf8') + fs.readFileSync(path.join(outRoot, 'provenance', 'ci-index.md'), 'utf8');
for (const run of ciRuns) {
  if (!ciText.includes(run.commitSha) || !ciText.includes(run.url)) errors.push(`CI evidence is missing commit/link for ${run.id}`);
}
if (!ciRuns.some((run) => run.purpose === 'all-pass' && run.failedTests === 0)) errors.push('No recorded all-pass CI run');
if (!ciRuns.some((run) => run.purpose === 'intentional-single-failure' && run.failedTests === 1)) errors.push('No recorded intentional-single-failure CI run');

const gitEvidencePath = path.join(outRoot, 'git-commit-log.txt');
if (fs.existsSync(gitEvidencePath)) {
  const gitEvidence = fs.readFileSync(gitEvidencePath, 'utf8');
  const hashes = [...gitEvidence.matchAll(/\b[0-9a-f]{40}\b/g)].map((match) => match[0]);
  if (hashes.length === 0) errors.push('Git evidence contains no full commit hashes');
  for (const hash of new Set(hashes)) {
    try { execFileSync('git', ['cat-file', '-e', `${hash}^{commit}`], { cwd: repoRoot, stdio: 'ignore' }); }
    catch { errors.push(`Git evidence references unknown commit: ${hash}`); }
  }
}

for (const [name, signature] of [['main-report.pdf', '%PDF-'], ['ai-audit-report.pdf', '%PDF-'], ['ai-critique.pdf', '%PDF-']]) {
  const target = path.join(outRoot, name);
  if (fs.existsSync(target) && fs.readFileSync(target).subarray(0, 5).toString('ascii') !== signature) errors.push(`${name} is not a valid PDF`);
}
const xlsxPath = path.join(outRoot, 'test-cases.xlsx');
if (fs.existsSync(xlsxPath) && fs.readFileSync(xlsxPath).subarray(0, 2).toString('ascii') !== 'PK') errors.push('test-cases.xlsx is not an Open XML ZIP package');

for (const warning of warnings) process.stdout.write(`WARN: ${warning}\n`);
for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
process.stdout.write(`Out self-containment: ${errors.length ? 'FAIL' : 'PASS'} (${errors.length} errors, ${warnings.length} warnings)\n`);
if (errors.length) process.exitCode = 1;
