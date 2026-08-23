import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  absoluteFromRepo,
  parseArgs,
  readJson,
  relativeToRepo,
  repoRoot,
  writeJson,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const action = args._[0];

function required(name) {
  if (typeof args[name] !== 'string' || !args[name].trim()) throw new Error(`Missing --${name}`);
  return args[name].trim();
}

function run(command, commandArgs) {
  const executable = process.platform === 'win32' && command === 'gh' ? 'gh.exe' : command;
  const result = spawnSync(executable, commandArgs, { cwd: repoRoot, encoding: 'utf8', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${commandArgs[0]} failed: ${(result.stderr ?? result.stdout ?? '').trim()}`);
  return result.stdout;
}

function repository() {
  if (typeof args.repo === 'string') return args.repo;
  const remote = run('git', ['remote', 'get-url', 'origin']).trim();
  const match = /github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/.exec(remote);
  if (!match) throw new Error('Cannot derive OWNER/REPO from origin; pass --repo');
  return match[1];
}

function runId(value) {
  if (/^\d+$/.test(value)) return value;
  const match = /^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/(\d+)(?:\/.*)?$/.exec(value);
  if (!match) throw new Error('--run must be a numeric run ID or a GitHub Actions run URL');
  return match[1];
}

function newmanSummary(reportPath) {
  const report = JSON.parse(fs.readFileSync(absoluteFromRepo(reportPath), 'utf8'));
  const executions = report.run?.executions;
  if (!Array.isArray(executions)) throw new Error('Newman JSON lacks run.executions');
  const failedExecutions = executions.filter((execution) =>
    (execution.assertions ?? []).some((assertion) => assertion.error));
  // Newman can repeat one request execution in run.executions when setNextRequest
  // revisits the same item. Count the logical item/iteration/position once so a
  // single failing case is not misreported as several failed test cases.
  const failedCases = new Map();
  for (const execution of failedExecutions) {
    const key = [
      execution.item?.id ?? execution.item?.name ?? '<unnamed>',
      execution.cursor?.iteration ?? '<unknown-iteration>',
      execution.cursor?.position ?? '<unknown-position>',
    ].join(':');
    if (!failedCases.has(key)) failedCases.set(key, execution.item?.name ?? '<unnamed>');
  }
  return {
    executionCount: executions.length,
    failedTestCases: failedCases.size,
    failedAssertions: report.run?.stats?.assertions?.failed ?? null,
    failedExecutionNames: [...failedCases.values()],
  };
}

function findReports(directory) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...findReports(candidate));
    else if (entry.isFile() && entry.name === 'newman-report.json') found.push(candidate);
  }
  return found;
}

function findNamedFiles(directory, fileName) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...findNamedFiles(candidate, fileName));
    else if (entry.isFile() && entry.name === fileName) found.push(candidate);
  }
  return found;
}

try {
  if (action === 'inspect-report') {
    const report = relativeToRepo(path.resolve(required('report')));
    process.stdout.write(`${JSON.stringify(newmanSummary(report), null, 2)}\n`);
  } else if (action === 'capture') {
    const purpose = required('purpose');
    if (!['all-pass', 'intentional-single-failure', 'canonical-full-suite'].includes(purpose)) throw new Error('Invalid --purpose');
    const runReference = runId(required('run'));
    const artifactName = required('artifact-name');
    const screenshotEvidenceId = required('screenshot-evidence-id');
    const repo = repository();
    run('gh', ['auth', 'status']);
    const remoteRun = JSON.parse(run('gh', [
      'run', 'view', runReference, '--repo', repo,
      '--json', 'attempt,conclusion,createdAt,databaseId,headBranch,headSha,name,startedAt,status,updatedAt,url,workflowName',
    ]));
    if (remoteRun.status !== 'completed') throw new Error(`CI run is not completed: ${remoteRun.status}`);
    const id = `CI-${remoteRun.databaseId}-${purpose}`;
    const registry = readJson('work/registry/ci-runs.json');
    if (registry.runs.some((item) => item.id === id)) throw new Error(`CI run already recorded: ${id}`);
    const evidence = readJson('work/registry/evidence.json').items;
    const screenshot = evidence.find((item) => item.id === screenshotEvidenceId);
    if (!screenshot) throw new Error(`Screenshot evidence does not exist: ${screenshotEvidenceId}`);

    const directoryRel = `work/ci/runs/${id}`;
    const artifactDirectory = absoluteFromRepo(`${directoryRel}/artifacts`);
    fs.mkdirSync(artifactDirectory, { recursive: true });
    run('gh', ['run', 'download', String(remoteRun.databaseId), '--repo', repo, '--name', artifactName, '--dir', artifactDirectory]);
    const reports = findReports(artifactDirectory);
    let reportPath;
    let reportPaths;
    let summary;
    let canonicalSummaryPath = null;
    let canonicalSummary = null;
    if (purpose === 'canonical-full-suite') {
      const summaries = findNamedFiles(artifactDirectory, 'canonical-summary.json');
      if (summaries.length !== 1) throw new Error(`Expected exactly one canonical-summary.json in artifact; found ${summaries.length}`);
      if (reports.length !== 4) throw new Error(`Expected four canonical Newman JSON reports; found ${reports.length}`);
      canonicalSummaryPath = relativeToRepo(summaries[0]);
      canonicalSummary = JSON.parse(fs.readFileSync(summaries[0], 'utf8'));
      reportPaths = reports.map(relativeToRepo).sort();
      reportPath = reportPaths.find((item) => item.includes('/input/newman-report.json'));
      if (!reportPath) throw new Error('Canonical artifact lacks the main input Newman report');
      summary = {
        executionCount: canonicalSummary.counts?.executed,
        failedTestCases: canonicalSummary.counts?.failed,
        failedAssertions: canonicalSummary.reports?.reduce((total, item) => total + (item.assertionsFailed ?? 0), 0),
      };
    } else {
      if (reports.length !== 1) throw new Error(`Expected exactly one newman-report.json in artifact; found ${reports.length}`);
      reportPath = relativeToRepo(reports[0]);
      reportPaths = [reportPath];
      summary = newmanSummary(reportPath);
    }
    if (purpose === 'all-pass' && (remoteRun.conclusion !== 'success' || summary.failedTestCases !== 0)) {
      throw new Error('All-pass CI evidence is not successful with zero failed test cases');
    }
    if (purpose === 'intentional-single-failure' && (remoteRun.conclusion !== 'failure' || summary.failedTestCases !== 1)) {
      throw new Error('Intentional-failure CI evidence must conclude failure with exactly one failed test case');
    }
    if (purpose === 'canonical-full-suite' && (
      remoteRun.conclusion !== 'failure'
      || canonicalSummary.integrityOk !== true
      || canonicalSummary.counts?.executed !== canonicalSummary.counts?.executable
      || canonicalSummary.counts?.passed + canonicalSummary.counts?.failed !== canonicalSummary.counts?.executed
      || canonicalSummary.caseResultMismatches?.length !== 0
    )) {
      throw new Error('Canonical full-suite evidence does not prove a complete, internally consistent failing execution');
    }
    writeJson(`${directoryRel}/github-run.json`, remoteRun);
    const record = {
      id,
      purpose,
      commitSha: remoteRun.headSha,
      url: remoteRun.url,
      status: remoteRun.status,
      conclusion: remoteRun.conclusion,
      workflowName: remoteRun.workflowName,
      startedAtUtc: remoteRun.startedAt,
      capturedAtUtc: new Date().toISOString(),
      failedTests: summary.failedTestCases,
      failedAssertions: summary.failedAssertions,
      newmanReportPath: reportPath,
      newmanReportPaths: reportPaths,
      canonicalSummaryPath,
      counts: canonicalSummary?.counts ?? null,
      failedCaseIds: canonicalSummary?.failedCaseIds ?? null,
      knownBugFailureCaseIds: canonicalSummary?.knownBugFailureCaseIds ?? null,
      otherFailureCaseIds: canonicalSummary?.otherFailureCaseIds ?? null,
      runtimeHeaderCoverage: canonicalSummary?.runtimeHeaderCoverage ?? null,
      identities: canonicalSummary?.identities ?? null,
      matchesCanonicalLocalResults: canonicalSummary ? canonicalSummary.caseResultMismatches.length === 0 : null,
      limitationStatus: purpose === 'canonical-full-suite' ? 'PARTIAL / documented limitation due to confirmed SUT defects' : null,
      githubRunMetadataPath: `${directoryRel}/github-run.json`,
      evidencePaths: [screenshot.path, reportPath, ...(canonicalSummaryPath ? [canonicalSummaryPath] : [])],
      screenshotEvidenceId,
      screenshotHumanAttestation: screenshot.humanAttestation === true,
    };
    registry.runs.push(record);
    writeJson('work/registry/ci-runs.json', registry);
    process.stdout.write(`Captured and verified ${id}: ${remoteRun.url}\n`);
  } else {
    throw new Error('Usage: capture-ci-run.mjs <inspect-report|capture> [options]');
  }
} catch (caught) {
  process.stderr.write(`ERROR: ${caught.message}\n`);
  process.exitCode = 1;
}
