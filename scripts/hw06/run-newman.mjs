import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  absoluteFromRepo,
  parseArgs,
  readJson,
  relativeToRepo,
  repoRoot,
  sha256File,
  uniqueId,
  writeJson,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));

function required(name) {
  if (typeof args[name] !== 'string' || !args[name].trim()) throw new Error(`Missing --${name}`);
  return args[name].trim();
}
function repositoryFile(name, requiredValue = false) {
  if (!args[name]) {
    if (requiredValue) throw new Error(`Missing --${name}`);
    return null;
  }
  const absolute = path.resolve(args[name]);
  if (!fs.statSync(absolute).isFile()) throw new Error(`Not a file: ${args[name]}`);
  relativeToRepo(absolute);
  return absolute;
}

function allRequests(items, result = []) {
  for (const item of items ?? []) {
    if (item.request) result.push(item.request);
    if (item.item) allRequests(item.item, result);
  }
  return result;
}

function hasStudentHeader(collection) {
  const collectionScripts = (collection.event ?? [])
    .filter((event) => event.listen === 'prerequest')
    .flatMap((event) => event.script?.exec ?? [])
    .join('\n');
  if (collectionScripts.includes('X-Student-Id') && collectionScripts.includes('23127179')) return true;
  const requests = allRequests(collection.item);
  return requests.length > 0 && requests.every((request) =>
    (request.header ?? []).some((header) =>
      header.disabled !== true && header.key?.toLowerCase() === 'x-student-id' && header.value === '23127179'));
}

function reportFacts(relativePath) {
  const report = JSON.parse(fs.readFileSync(absoluteFromRepo(relativePath), 'utf8'));
  if (!Array.isArray(report.run?.executions)) throw new Error('Newman JSON report lacks run.executions');
  const hostnames = new Set();
  let studentHeaderRequests = 0;
  for (const execution of report.run.executions) {
    const url = execution.request?.url;
    const hostname = Array.isArray(url?.host) ? url.host.join('.') : null;
    if (!hostname) throw new Error('Newman report contains an unresolved request hostname');
    hostnames.add(url.port ? `${hostname}:${url.port}` : hostname);
    if ((execution.request?.header ?? []).some((header) =>
      header.key?.toLowerCase() === 'x-student-id' && header.value === '23127179')) studentHeaderRequests += 1;
  }
  return {
    hostnames: [...hostnames].sort(),
    stats: report.run.stats ?? {},
    executionCount: report.run.executions.length,
    studentHeaderRequests,
  };
}

try {
  const collection = repositoryFile('collection', true);
  const environment = repositoryFile('environment');
  const data = repositoryFile('data');
  const label = required('label').toLowerCase();
  const hostname = required('hostname');
  const fixture = args.fixture === true;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(label)) throw new Error('Label must match ^[a-z0-9][a-z0-9-]{0,39}$');
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(hostname)) throw new Error('Hostname must be localhost/127.0.0.1 with an optional port');
  const collectionJson = JSON.parse(fs.readFileSync(collection, 'utf8'));
  if (!hasStudentHeader(collectionJson)) throw new Error('Collection must set X-Student-Id: 23127179 globally or on every request');
  if (args.iterations && (!Number.isInteger(Number(args.iterations)) || Number(args.iterations) < 1)) throw new Error('Iterations must be a positive integer');

  const startedAt = new Date();
  const id = `${uniqueId('RUN', startedAt)}-${label}`;
  const runDirectoryRel = `${fixture ? 'work/fixtures/newman-runs' : 'work/runs'}/${id}`;
  const runDirectory = absoluteFromRepo(runDirectoryRel);
  if (fs.existsSync(runDirectory)) throw new Error(`Run directory already exists: ${runDirectoryRel}`);
  fs.mkdirSync(runDirectory, { recursive: true });
  const jsonPath = `${runDirectoryRel}/newman-report.json`;
  const htmlPath = `${runDirectoryRel}/newman-report.html`;
  const stdoutPath = `${runDirectoryRel}/stdout.log`;
  const stderrPath = `${runDirectoryRel}/stderr.log`;
  const metadataPath = `${runDirectoryRel}/metadata.json`;

  const commandArgs = [
    'run',
    relativeToRepo(collection),
    '--reporters',
    'cli,json,htmlextra',
    '--reporter-json-export',
    jsonPath,
    '--reporter-htmlextra-export',
    htmlPath,
  ];
  if (environment) commandArgs.push('--environment', relativeToRepo(environment));
  if (data) commandArgs.push('--iteration-data', relativeToRepo(data));
  if (args.iterations) commandArgs.push('--iteration-count', String(Number.parseInt(args.iterations, 10)));

  const command = process.execPath;
  const newmanBin = absoluteFromRepo('node_modules/newman/bin/newman.js');
  if (!fs.statSync(newmanBin).isFile()) throw new Error('Local Newman is missing; run npm install');
  const result = spawnSync(command, [newmanBin, ...commandArgs], { cwd: repoRoot, encoding: 'utf8', shell: false });
  fs.writeFileSync(absoluteFromRepo(stdoutPath), result.stdout ?? '', 'utf8');
  fs.writeFileSync(absoluteFromRepo(stderrPath), result.stderr ?? '', 'utf8');
  const exitCode = Number.isInteger(result.status) ? result.status : 127;
  if (result.error) throw result.error;
  const completedAt = new Date();
  if (!fs.existsSync(absoluteFromRepo(jsonPath)) || fs.statSync(absoluteFromRepo(jsonPath)).size < 100) {
    throw new Error(`Newman did not create a valid JSON report; raw console files remain under ${runDirectoryRel}`);
  }
  if (!fs.existsSync(absoluteFromRepo(htmlPath)) || fs.statSync(absoluteFromRepo(htmlPath)).size < 100) {
    throw new Error(`Newman did not create a valid HTML report; raw console files remain under ${runDirectoryRel}`);
  }
  const facts = reportFacts(jsonPath);
  if (facts.hostnames.length === 0 || facts.hostnames.some((value) => value !== hostname)) {
    throw new Error(`Newman report hostnames [${facts.hostnames.join(', ')}] do not exactly match ${hostname}`);
  }
  if (facts.studentHeaderRequests !== facts.executionCount) {
    throw new Error(`Runtime report proves X-Student-Id on ${facts.studentHeaderRequests}/${facts.executionCount} requests`);
  }
  const metadata = {
    id,
    fixture,
    startedAtUtc: startedAt.toISOString(),
    completedAtUtc: completedAt.toISOString(),
    hostname,
    command,
    arguments: [newmanBin, ...commandArgs],
    exitCode,
    collectionPath: relativeToRepo(collection),
    collectionSha256: sha256File(relativeToRepo(collection)),
    environmentPath: environment ? relativeToRepo(environment) : null,
    environmentSha256: environment ? sha256File(relativeToRepo(environment)) : null,
    dataPath: data ? relativeToRepo(data) : null,
    dataSha256: data ? sha256File(relativeToRepo(data)) : null,
    rawJsonPath: jsonPath,
    htmlReportPath: htmlPath,
    consoleLogPath: stdoutPath,
    stderrPath,
    metadataPath,
    reporters: ['cli', 'json', 'htmlextra'],
    actualHostnames: facts.hostnames,
    summaryStats: facts.stats,
    executionCount: facts.executionCount,
    studentHeaderRequests: facts.studentHeaderRequests,
    caseResults: [],
    resultImportStatus: 'pending-human-checked-mapping',
  };
  writeJson(metadataPath, metadata);

  if (!fixture) {
    const registry = readJson('work/registry/runs.json');
    registry.runs.push({ mode: 'local', ...metadata });
    writeJson('work/registry/runs.json', registry);
  }
  process.stdout.write(`Captured ${fixture ? 'fixture' : 'real'} Newman run ${id} with exit code ${exitCode}.\n`);
  process.stdout.write('Case-result mapping remains pending and must be checked against the raw JSON report.\n');
  process.exitCode = exitCode;
} catch (caught) {
  process.stderr.write(`ERROR: ${caught.message}\n`);
  process.exitCode = 1;
}
