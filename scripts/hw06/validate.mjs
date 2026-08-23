import fs from 'node:fs';
import YAML from 'yaml';
import {
  absoluteFromRepo,
  fileExists,
  parseArgs,
  readJson,
  repoRoot,
  sha256File,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const submissionMode = Boolean(args.submission);
const errors = [];
const warnings = [];

function error(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function isIso(value) { return nonEmpty(value) && !Number.isNaN(Date.parse(value)); }
function duplicateValues(values) {
  const seen = new Set();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))];
}
function requireExisting(pathValue, context) {
  if (!nonEmpty(pathValue) || !fileExists(pathValue)) {
    error(`${context} references missing file: ${pathValue ?? '<unset>'}`);
    return false;
  }
  return true;
}
function load(relativePath, arrayKey) {
  try {
    const value = readJson(relativePath);
    if (value.schemaVersion !== 1) error(`${relativePath} must use schemaVersion 1`);
    if (arrayKey && !Array.isArray(value[arrayKey])) error(`${relativePath}.${arrayKey} must be an array`);
    return value;
  } catch (caught) {
    error(`Cannot read ${relativePath}: ${caught.message}`);
    return arrayKey ? { [arrayKey]: [] } : {};
  }
}

const project = load('work/registry/project.json');
const caseRegistry = load('work/registry/test-cases.json', 'cases');
const reviewRegistry = load('work/registry/human-reviews.json', 'reviews');
const runRegistry = load('work/registry/runs.json', 'runs');
const bugRegistry = load('work/registry/bugs.json', 'bugs');
const ciRegistry = load('work/registry/ci-runs.json', 'runs');
const featureRegistry = load('work/registry/postman-features.json', 'features');
const evidenceRegistry = load('work/registry/evidence.json', 'items');
const submission = load('work/registry/submission.json');
requireExisting('docs/hw06-standard-actions.md', 'standard action catalog');
requireExisting('work/templates/verified-api-spec.md', 'verified API-spec template');
requireExisting('work/templates/ai-generation-prompt.md', 'AI generation prompt template');

try {
  const issueFormPath = '.github/ISSUE_TEMPLATE/hw06-api-bug.yml';
  const issueForm = YAML.parse(fs.readFileSync(absoluteFromRepo(issueFormPath), 'utf8'));
  if (!nonEmpty(issueForm.name) || !nonEmpty(issueForm.description) || !Array.isArray(issueForm.body)) {
    error(`${issueFormPath} lacks required name, description, or body`);
  } else {
    const ids = issueForm.body.map((item) => item.id).filter(Boolean);
    for (const duplicate of duplicateValues(ids)) error(`${issueFormPath} has duplicate field id ${duplicate}`);
    const screenshot = issueForm.body.find((item) => item.id === 'screenshot');
    if (screenshot?.type !== 'upload' || screenshot?.validations?.required !== true) error(`${issueFormPath} must require screenshot upload`);
    const confirmation = issueForm.body.find((item) => item.id === 'confirmation');
    if (confirmation?.type !== 'checkboxes') error(`${issueFormPath} must include human confirmation checkboxes`);
  }
} catch (caught) {
  error(`Cannot validate GitHub Issue Form: ${caught.message}`);
}

if (project.assignment !== 'HW06-AI') error('project.assignment must be HW06-AI');
if (project.student?.id !== '23127179') error('project.student.id must be 23127179');
requireExisting(project.requirementPath, 'project.requirementPath');
requireExisting(project.apiSpecificationPath, 'project.apiSpecificationPath');

try {
  const head = fs.readFileSync(absoluteFromRepo('.git/HEAD'), 'utf8').trim();
  const branch = head.startsWith('ref: refs/heads/') ? head.slice('ref: refs/heads/'.length) : '<detached-HEAD>';
  if (branch !== project.branch) error(`Current branch ${branch} does not match project.branch ${project.branch}`);
} catch (caught) {
  error(`Cannot resolve Git branch from .git/HEAD: ${caught.message}`);
}

const selectedApis = Array.isArray(project.selectedApis) ? project.selectedApis : [];
if (selectedApis.length === 0) {
  warn('No APIs selected yet; API-specific work must not start');
} else {
  if (selectedApis.length !== 3) error(`Exactly 3 APIs must be selected; found ${selectedApis.length}`);
  const pools = selectedApis.map((api) => api.pool);
  if ([...pools].sort().join(',') !== 'A,B,C') error('Selected APIs must include exactly one API from each Pool A, B, and C');
  for (const api of selectedApis) {
    for (const field of ['id', 'featureId', 'name', 'method', 'path', 'selectionConfirmedBy', 'selectionConfirmedAt']) {
      if (!nonEmpty(api[field])) error(`Selected API ${api.id ?? '<unknown>'} is missing ${field}`);
    }
    if (!isIso(api.selectionConfirmedAt)) error(`Selected API ${api.id ?? '<unknown>'} has invalid selectionConfirmedAt`);
  }
}
for (const duplicate of duplicateValues(selectedApis.map((api) => api.id))) error(`Duplicate API id: ${duplicate}`);

const cases = caseRegistry.cases ?? [];
const caseIds = new Set(cases.map((testCase) => testCase.id));
const apiIds = new Set(selectedApis.map((api) => api.id));
const coverageValues = new Set(['domain_partition', 'state_transition', 'security', 'schema_validation']);
for (const duplicate of duplicateValues(cases.map((testCase) => testCase.id))) error(`Duplicate test case id: ${duplicate}`);
for (const testCase of cases) {
  if (!apiIds.has(testCase.apiId)) error(`Test case ${testCase.id} references unselected API ${testCase.apiId}`);
  if (!['AI', 'HUMAN'].includes(testCase.origin)) error(`Test case ${testCase.id} has invalid origin`);
  if (!nonEmpty(testCase.title)) error(`Test case ${testCase.id} has no title`);
  if (!Array.isArray(testCase.requirementRefs) || testCase.requirementRefs.length === 0) error(`Test case ${testCase.id} has no requirementRefs`);
  if (!Array.isArray(testCase.coverage) || testCase.coverage.length === 0) error(`Test case ${testCase.id} has no coverage classification`);
  for (const coverage of testCase.coverage ?? []) if (!coverageValues.has(coverage)) error(`Test case ${testCase.id} has unknown coverage ${coverage}`);
  if (testCase.origin === 'HUMAN' && !nonEmpty(testCase.humanExtensionRationale)) error(`Human test case ${testCase.id} lacks humanExtensionRationale`);
}

const reviews = reviewRegistry.reviews ?? [];
const reviewsByCase = new Map();
for (const duplicate of duplicateValues(reviews.map((review) => review.caseId))) error(`Duplicate human review for case: ${duplicate}`);
for (const review of reviews) {
  reviewsByCase.set(review.caseId, review);
  const testCase = cases.find((candidate) => candidate.id === review.caseId);
  if (!testCase) error(`Human review references unknown case ${review.caseId}`);
  else if (testCase.origin !== 'AI') error(`Human review ${review.caseId} must reference an AI-generated case`);
  if (!['VALID', 'INVALID', 'INCOMPLETE'].includes(review.verdict)) error(`Human review ${review.caseId} has invalid verdict`);
  if (!nonEmpty(review.reviewedBy) || !isIso(review.reviewedAt) || !nonEmpty(review.reasoning)) error(`Human review ${review.caseId} lacks reviewer, time, or reasoning`);
  if (['INVALID', 'INCOMPLETE'].includes(review.verdict) && !nonEmpty(review.correction)) error(`Human review ${review.caseId} requires a correction`);
}
if (submissionMode) {
  for (const testCase of cases.filter((item) => item.origin === 'AI')) {
    if (!reviewsByCase.has(testCase.id)) error(`AI test case ${testCase.id} has not been human-reviewed`);
  }
  for (const api of selectedApis) {
    const apiCases = cases.filter((item) => item.apiId === api.id);
    const aiCount = apiCases.filter((item) => item.origin === 'AI').length;
    const humanCount = apiCases.filter((item) => item.origin === 'HUMAN').length;
    if (aiCount < 35) error(`${api.id} has ${aiCount} AI-generated cases; minimum is 35`);
    if (humanCount < 5) error(`${api.id} has ${humanCount} human-added cases; minimum is 5`);
  }
}

const runs = runRegistry.runs ?? [];
const executedCaseIds = new Set();
const latestResultByCase = new Map();
for (const duplicate of duplicateValues(runs.map((run) => run.id))) error(`Duplicate run id: ${duplicate}`);
const chronologicalRuns = [...runs].sort((left, right) =>
  Date.parse(left.completedAtUtc ?? left.startedAtUtc) - Date.parse(right.completedAtUtc ?? right.startedAtUtc));
for (const run of chronologicalRuns) {
  if (!['local', 'ci'].includes(run.mode)) error(`Run ${run.id} has invalid mode`);
  if (!isIso(run.startedAtUtc) || !Number.isInteger(run.exitCode)) error(`Run ${run.id} lacks a valid time or exit code`);
  for (const field of ['collectionPath', 'rawJsonPath', 'htmlReportPath', 'consoleLogPath', 'metadataPath']) requireExisting(run[field], `Run ${run.id}.${field}`);
  for (const duplicate of duplicateValues((run.caseResults ?? []).map((result) => result.caseId))) error(`Run ${run.id} has duplicate result for ${duplicate}`);
  for (const result of run.caseResults ?? []) {
    executedCaseIds.add(result.caseId);
    latestResultByCase.set(result.caseId, result);
    if (!caseIds.has(result.caseId)) error(`Run ${run.id} references unknown case ${result.caseId}`);
    if (!['PASS', 'FAIL'].includes(result.result)) error(`Run ${run.id}/${result.caseId} has invalid result`);
  }
}
for (const api of selectedApis) {
  const executableCases = cases.filter((testCase) => testCase.apiId === api.id &&
    (testCase.origin === 'HUMAN' || reviewsByCase.get(testCase.id)?.verdict !== 'INVALID'));
  const executed = executableCases.filter((testCase) => latestResultByCase.has(testCase.id));
  const passed = executed.filter((testCase) => latestResultByCase.get(testCase.id).result === 'PASS').length;
  const failed = executed.filter((testCase) => latestResultByCase.get(testCase.id).result === 'FAIL').length;
  if (passed + failed !== executed.length) error(`${api.id} latest-result arithmetic does not reconcile`);
}
if (submissionMode) {
  for (const testCase of cases.filter((item) => item.origin === 'HUMAN' || reviewsByCase.get(item.id)?.verdict !== 'INVALID')) {
    if (!executedCaseIds.has(testCase.id)) error(`Test case ${testCase.id} has no registered execution result`);
  }
}

const evidenceItems = evidenceRegistry.items ?? [];
for (const duplicate of duplicateValues(evidenceItems.map((item) => item.id))) error(`Duplicate evidence id: ${duplicate}`);
for (const item of evidenceItems) {
  if (!nonEmpty(item.type) || !nonEmpty(item.description)) error(`Evidence ${item.id} lacks type or description`);
  requireExisting(item.path, `Evidence ${item.id}`);
  if (!isIso(item.capturedAt)) error(`Evidence ${item.id} has invalid capturedAt`);
  if (nonEmpty(item.sha256) && requireExisting(item.path, `Evidence ${item.id}`) && sha256File(item.path) !== item.sha256) error(`Evidence ${item.id} hash changed after capture`);
  if (item.path?.toLowerCase().endsWith('.png') && (!Number.isInteger(item.image?.width) || !Number.isInteger(item.image?.height))) error(`Screenshot evidence ${item.id} lacks validated dimensions`);
  if (item.humanAttestation !== true) warn(`Evidence ${item.id} has no explicit human attestation`);
}

for (const bug of bugRegistry.bugs ?? []) {
  if (!['candidate', 'human-confirmed', 'published'].includes(bug.status)) error(`Bug ${bug.id} has invalid status`);
  if (!Array.isArray(bug.caseIds) || bug.caseIds.length === 0) error(`Bug ${bug.id} has no caseIds`);
  for (const caseId of bug.caseIds ?? []) if (!caseIds.has(caseId)) error(`Bug ${bug.id} references unknown case ${caseId}`);
  for (const evidencePath of bug.evidencePaths ?? []) requireExisting(evidencePath, `Bug ${bug.id} evidence`);
  if (bug.status !== 'candidate' && (!nonEmpty(bug.expected) || !nonEmpty(bug.actual) || !nonEmpty(bug.confirmedBy))) error(`Bug ${bug.id} lacks human confirmation details`);
  if (bug.status === 'published' && (!/^https:\/\/github\.com\//.test(bug.githubIssueUrl ?? '') || !Number.isInteger(bug.githubIssueNumber) || !(bug.screenshotPaths ?? []).length)) error(`Published bug ${bug.id} lacks verified GitHub Issue number/URL or screenshot`);
}

for (const feature of featureRegistry.features ?? []) {
  if (!nonEmpty(feature.name) || !nonEmpty(feature.usage)) error('Postman feature lacks name or usage');
  for (const evidencePath of feature.evidencePaths ?? []) requireExisting(evidencePath, `Postman feature ${feature.name} evidence`);
}

const ciRuns = ciRegistry.runs ?? [];
for (const run of ciRuns) {
  if (!['all-pass', 'intentional-single-failure', 'canonical-full-suite'].includes(run.purpose)) error(`CI run ${run.id} has invalid purpose`);
  if (!/^[0-9a-f]{7,40}$/i.test(run.commitSha ?? '') || !/^https:\/\/github\.com\//.test(run.url ?? '')) error(`CI run ${run.id} lacks a valid commit SHA or GitHub URL`);
  for (const evidencePath of run.evidencePaths ?? []) requireExisting(evidencePath, `CI run ${run.id} evidence`);
  if (!nonEmpty(run.newmanReportPath) || !nonEmpty(run.screenshotEvidenceId)) error(`CI run ${run.id} lacks Newman artifact or screenshot evidence ID`);
  if (run.purpose === 'all-pass' && run.failedTests !== 0) error(`CI all-pass run ${run.id} must have zero failed tests`);
  if (run.purpose === 'intentional-single-failure' && run.failedTests !== 1) error(`CI intentional failure run ${run.id} must have exactly one failed test`);
  if (run.purpose === 'canonical-full-suite') {
    requireExisting(run.canonicalSummaryPath, `CI canonical full-suite ${run.id} summary`);
    if (run.conclusion !== 'failure') error(`CI canonical full-suite ${run.id} must expose its genuine failing result`);
    if (!Number.isInteger(run.counts?.executable) || run.counts.executed !== run.counts.executable) error(`CI canonical full-suite ${run.id} does not execute every canonical case`);
    if (run.counts?.passed + run.counts?.failed !== run.counts?.executed) error(`CI canonical full-suite ${run.id} arithmetic does not reconcile`);
    if (run.runtimeHeaderCoverage?.requests !== run.runtimeHeaderCoverage?.studentHeaderRequests) error(`CI canonical full-suite ${run.id} lacks complete student-header coverage`);
    if (run.matchesCanonicalLocalResults !== true) error(`CI canonical full-suite ${run.id} differs from canonical local results`);
    if (typeof run.screenshotHumanAttestation !== 'boolean') error(`CI canonical full-suite ${run.id} lacks screenshot attestation state`);
  }
}

function resolvePathFrom(source) {
  if (source === 'project.postman.collectionPath') return project.postman?.collectionPath;
  return null;
}

if (submissionMode) {
  if (selectedApis.length !== 3) error('Submission requires three selected APIs');
  if (runs.length === 0) error('Submission requires at least one real Newman run');
  if (!ciRuns.some((run) => run.purpose === 'all-pass')) error('Submission lacks an all-pass CI run');
  if (!ciRuns.some((run) => run.purpose === 'intentional-single-failure')) error('Submission lacks an intentional-single-failure CI run');
  const evidenceTypes = new Set(evidenceItems.map((item) => item.type));
  for (const type of submission.requiredEvidenceTypes ?? []) if (!evidenceTypes.has(type)) error(`Submission lacks required evidence type: ${type}`);
  for (const artifact of submission.requiredArtifacts ?? []) {
    if (artifact.path) requireExisting(artifact.path, `Submission artifact ${artifact.id}`);
    if (artifact.pathFrom) requireExisting(resolvePathFrom(artifact.pathFrom), `Submission artifact ${artifact.id}`);
    if (artifact.evidenceType && !evidenceTypes.has(artifact.evidenceType)) error(`Submission artifact ${artifact.id} lacks evidence type ${artifact.evidenceType}`);
  }
  if (fileExists('out/ai-critique.md')) {
    const words = fs.readFileSync(absoluteFromRepo('out/ai-critique.md'), 'utf8').trim().split(/\s+/).filter(Boolean).length;
    if (words < 200 || words > 300) error(`AI critique has ${words} words; required range is 200-300`);
  }
  if (project.postman?.collectionPath && fileExists(project.postman.collectionPath)) {
    const collection = fs.readFileSync(absoluteFromRepo(project.postman.collectionPath), 'utf8');
    if (!collection.includes('X-Student-Id') || !collection.includes('23127179')) error('Postman collection does not statically contain X-Student-Id and 23127179');
  }
}

for (const message of warnings) process.stdout.write(`WARN: ${message}\n`);
for (const message of errors) process.stderr.write(`ERROR: ${message}\n`);
process.stdout.write(`Validation mode: ${submissionMode ? 'submission' : 'workspace'}\n`);
process.stdout.write(`Result: ${errors.length === 0 ? 'PASS' : 'FAIL'} (${errors.length} errors, ${warnings.length} warnings)\n`);
if (errors.length > 0) process.exitCode = 1;
