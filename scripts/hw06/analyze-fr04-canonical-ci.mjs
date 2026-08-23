import fs from 'node:fs';
import path from 'node:path';
import {
  absoluteFromRepo,
  parseArgs,
  readJson,
  relativeToRepo,
  sha256File,
  writeJson,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
if (typeof args['artifact-dir'] !== 'string') throw new Error('Missing --artifact-dir');
const artifactDirectory = relativeToRepo(path.resolve(args['artifact-dir']));

const project = readJson('work/registry/project.json');
const cases = readJson('work/registry/test-cases.json').cases;
const reviews = readJson('work/registry/human-reviews.json').reviews;
const runs = readJson('work/registry/runs.json').runs;
const bugs = readJson('work/registry/bugs.json').bugs;

const reviewByCase = new Map(reviews.map((review) => [review.caseId, review]));
const fr04Api = project.selectedApis.find((api) => api.featureId === 'FR-04');
if (!fr04Api) throw new Error('FR-04 selected API is missing');
const executableCases = cases.filter((testCase) => testCase.apiId === fr04Api.id
  && (testCase.origin === 'HUMAN' || reviewByCase.get(testCase.id)?.verdict !== 'INVALID'));
const executableCaseIds = executableCases.map((testCase) => testCase.id);
const executableCaseIdSet = new Set(executableCaseIds);

const officialRuns = new Map((project.postman.officialFr04RunIds ?? []).map((id) => {
  const run = runs.find((candidate) => candidate.id === id);
  if (!run) throw new Error(`Official run is missing: ${id}`);
  return [id, run];
}));
const primaryRun = officialRuns.get(project.postman.officialFr04PrimaryRunId);
const statefulRun = [...officialRuns.values()].find((run) => run.collectionPath.endsWith('FR04-profile-stateful.postman_collection.json'));
const closureRun = [...officialRuns.values()].find((run) => run.dataPath?.endsWith('FR04-target-closure.postman_data.json'));
const ai027Run = [...officialRuns.values()].find((run) => run.dataPath?.endsWith('FR04-target-ai027.postman_data.json'));
if (!primaryRun || !statefulRun || !closureRun || !ai027Run) throw new Error('Official FR-04 execution semantics are incomplete');

function report(relativePath) {
  const parsed = readJson(relativePath);
  if (!Array.isArray(parsed.run?.executions)) throw new Error(`Newman executions are missing: ${relativePath}`);
  return parsed;
}

function assertionFailed(execution) {
  return (execution.assertions ?? []).some((assertion) => assertion.error);
}

function runtimeFacts(parsed) {
  let studentHeaderRequests = 0;
  const hostnames = new Set();
  for (const execution of parsed.run.executions) {
    const url = execution.request?.url;
    const hostname = Array.isArray(url?.host) ? url.host.join('.') : null;
    if (hostname) hostnames.add(url.port ? `${hostname}:${url.port}` : hostname);
    if ((execution.request?.header ?? []).some((header) =>
      header.key?.toLowerCase() === 'x-student-id' && header.value === '23127179')) studentHeaderRequests += 1;
  }
  return {
    executionCount: parsed.run.executions.length,
    studentHeaderRequests,
    hostnames: [...hostnames].sort(),
    assertionsFailed: parsed.run.stats?.assertions?.failed ?? null,
  };
}

function mapDataDriven(parsed, dataPath, includedCaseIds) {
  const data = readJson(dataPath);
  if (!Array.isArray(data)) throw new Error(`Iteration data must be an array: ${dataPath}`);
  const included = new Set(includedCaseIds);
  const mapped = new Map();
  for (let iteration = 0; iteration < data.length; iteration += 1) {
    const caseId = data[iteration]?.caseId;
    if (!included.has(caseId)) continue;
    const executions = parsed.run.executions.filter((execution) => execution.cursor?.iteration === iteration);
    if (executions.length === 0) throw new Error(`No execution found for ${caseId} in ${dataPath}`);
    mapped.set(caseId, executions.some(assertionFailed) ? 'FAIL' : 'PASS');
  }
  return mapped;
}

function mapStateful(parsed, includedCaseIds) {
  const mapped = new Map();
  for (const caseId of includedCaseIds) {
    const executions = parsed.run.executions.filter((execution) => execution.item?.name?.includes(caseId));
    if (executions.length === 0) throw new Error(`No stateful execution found for ${caseId}`);
    mapped.set(caseId, executions.some(assertionFailed) ? 'FAIL' : 'PASS');
  }
  return mapped;
}

const specifications = [
  { key: 'input', template: primaryRun, mapping: 'data' },
  { key: 'stateful', template: statefulRun, mapping: 'stateful' },
  { key: 'closure', template: closureRun, mapping: 'data' },
  { key: 'ai027', template: ai027Run, mapping: 'data' },
];
const latestResultByCase = new Map();
const reportSummaries = [];
const integrityErrors = [];

for (const specification of specifications) {
  const reportPath = `${artifactDirectory}/${specification.key}/newman-report.json`;
  const parsed = report(reportPath);
  const templateCaseIds = (specification.template.caseResults ?? []).map((result) => result.caseId);
  const mapped = specification.mapping === 'stateful'
    ? mapStateful(parsed, templateCaseIds)
    : mapDataDriven(parsed, specification.template.dataPath, templateCaseIds);
  for (const [caseId, result] of mapped) latestResultByCase.set(caseId, result);
  const facts = runtimeFacts(parsed);
  if (facts.studentHeaderRequests !== facts.executionCount) {
    integrityErrors.push(`${specification.key} header coverage is ${facts.studentHeaderRequests}/${facts.executionCount}`);
  }
  if (facts.hostnames.length !== 1 || facts.hostnames[0] !== 'localhost:3000') {
    integrityErrors.push(`${specification.key} hostnames are ${facts.hostnames.join(', ')}`);
  }
  for (const field of ['collectionPath', 'environmentPath', 'dataPath']) {
    const sourcePath = specification.template[field];
    if (!sourcePath) continue;
    const hashField = `${field.replace('Path', '')}Sha256`;
    if (sha256File(sourcePath) !== specification.template[hashField]) {
      integrityErrors.push(`${specification.key} ${field} differs from official local run ${specification.template.id}`);
    }
  }
  reportSummaries.push({
    key: specification.key,
    reportPath,
    officialTemplateRunId: specification.template.id,
    mappedCases: mapped.size,
    ...facts,
  });
}

const missingCaseIds = executableCaseIds.filter((caseId) => !latestResultByCase.has(caseId));
const unexpectedCaseIds = [...latestResultByCase.keys()].filter((caseId) => !executableCaseIdSet.has(caseId));
if (missingCaseIds.length > 0) integrityErrors.push(`Missing executable cases: ${missingCaseIds.join(', ')}`);
if (unexpectedCaseIds.length > 0) integrityErrors.push(`Unexpected cases: ${unexpectedCaseIds.join(', ')}`);

const publishedBugCaseIds = new Set(bugs
  .filter((bug) => bug.status === 'published')
  .flatMap((bug) => bug.caseIds ?? []));
const caseResults = executableCaseIds
  .filter((caseId) => latestResultByCase.has(caseId))
  .map((caseId) => ({ caseId, result: latestResultByCase.get(caseId) }));
const failedCaseIds = caseResults.filter((item) => item.result === 'FAIL').map((item) => item.caseId);
const knownBugFailureCaseIds = failedCaseIds.filter((caseId) => publishedBugCaseIds.has(caseId));
const otherFailureCaseIds = failedCaseIds.filter((caseId) => !publishedBugCaseIds.has(caseId));

const localLatestResultByCase = new Map();
for (const run of [...runs].sort((left, right) =>
  Date.parse(left.completedAtUtc ?? left.startedAtUtc) - Date.parse(right.completedAtUtc ?? right.startedAtUtc))) {
  for (const result of run.caseResults ?? []) localLatestResultByCase.set(result.caseId, result.result);
}
const caseResultMismatches = caseResults.filter((item) => localLatestResultByCase.get(item.caseId) !== item.result)
  .map((item) => ({ caseId: item.caseId, local: localLatestResultByCase.get(item.caseId), ci: item.result }));

const counts = {
  executable: executableCaseIds.length,
  executed: caseResults.length,
  passed: caseResults.filter((item) => item.result === 'PASS').length,
  failed: failedCaseIds.length,
  knownBugFailures: knownBugFailureCaseIds.length,
  otherFailures: otherFailureCaseIds.length,
};
if (counts.passed + counts.failed !== counts.executed) integrityErrors.push('PASS/FAIL arithmetic does not reconcile');
if (caseResultMismatches.length > 0) integrityErrors.push('CI case results differ from latest canonical local results');

const summary = {
  schemaVersion: 1,
  generatedAtUtc: new Date().toISOString(),
  scope: 'complete canonical FR-04 suite',
  executionSemantics: specifications.map((item) => item.template.id),
  counts,
  failedCaseIds,
  knownBugFailureCaseIds,
  otherFailureCaseIds,
  caseResults,
  caseResultMismatches,
  reports: reportSummaries,
  runtimeHeaderCoverage: {
    requests: reportSummaries.reduce((total, item) => total + item.executionCount, 0),
    studentHeaderRequests: reportSummaries.reduce((total, item) => total + item.studentHeaderRequests, 0),
  },
  identities: {
    mainCollectionSha256: sha256File(project.postman.collectionPath),
    statefulCollectionSha256: sha256File(project.postman.supportingCollectionPaths[0]),
    environmentSha256: sha256File(project.postman.environmentPath),
    mainDataSha256: sha256File(project.postman.dataFiles[0]),
    closureDataSha256: sha256File(closureRun.dataPath),
    ai027DataSha256: sha256File(ai027Run.dataPath),
  },
  integrityOk: integrityErrors.length === 0,
  integrityErrors,
};
writeJson(`${artifactDirectory}/canonical-summary.json`, summary);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
