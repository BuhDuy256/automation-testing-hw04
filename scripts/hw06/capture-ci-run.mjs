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
  return {
    executionCount: executions.length,
    failedTestCases: failedExecutions.length,
    failedAssertions: report.run?.stats?.assertions?.failed ?? null,
    failedExecutionNames: failedExecutions.map((execution) => execution.item?.name ?? '<unnamed>'),
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

try {
  if (action === 'inspect-report') {
    const report = relativeToRepo(path.resolve(required('report')));
    process.stdout.write(`${JSON.stringify(newmanSummary(report), null, 2)}\n`);
  } else if (action === 'capture') {
    const purpose = required('purpose');
    if (!['all-pass', 'intentional-single-failure'].includes(purpose)) throw new Error('Invalid --purpose');
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
    if (!screenshot?.humanAttestation) throw new Error(`Screenshot evidence must exist and be human-attested: ${screenshotEvidenceId}`);

    const directoryRel = `work/ci/runs/${id}`;
    const artifactDirectory = absoluteFromRepo(`${directoryRel}/artifacts`);
    fs.mkdirSync(artifactDirectory, { recursive: true });
    run('gh', ['run', 'download', String(remoteRun.databaseId), '--repo', repo, '--name', artifactName, '--dir', artifactDirectory]);
    const reports = findReports(artifactDirectory);
    if (reports.length !== 1) throw new Error(`Expected exactly one newman-report.json in artifact; found ${reports.length}`);
    const reportPath = relativeToRepo(reports[0]);
    const summary = newmanSummary(reportPath);
    if (purpose === 'all-pass' && (remoteRun.conclusion !== 'success' || summary.failedTestCases !== 0)) {
      throw new Error('All-pass CI evidence is not successful with zero failed test cases');
    }
    if (purpose === 'intentional-single-failure' && (remoteRun.conclusion !== 'failure' || summary.failedTestCases !== 1)) {
      throw new Error('Intentional-failure CI evidence must conclude failure with exactly one failed test case');
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
      githubRunMetadataPath: `${directoryRel}/github-run.json`,
      evidencePaths: [screenshot.path, reportPath],
      screenshotEvidenceId,
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
