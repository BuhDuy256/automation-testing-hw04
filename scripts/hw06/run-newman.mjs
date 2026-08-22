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

try {
  const collection = repositoryFile('collection', true);
  const environment = repositoryFile('environment');
  const data = repositoryFile('data');
  const label = required('label').toLowerCase();
  const hostname = required('hostname');
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(label)) throw new Error('Label must match ^[a-z0-9][a-z0-9-]{0,39}$');
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(hostname)) throw new Error('Hostname must be localhost/127.0.0.1 with an optional port');

  const startedAt = new Date();
  const id = `${uniqueId('RUN', startedAt)}-${label}`;
  const runDirectoryRel = `work/runs/${id}`;
  const runDirectory = absoluteFromRepo(runDirectoryRel);
  fs.mkdirSync(runDirectory, { recursive: false });
  const jsonPath = `${runDirectoryRel}/newman-report.json`;
  const htmlPath = `${runDirectoryRel}/newman-report.html`;
  const stdoutPath = `${runDirectoryRel}/stdout.log`;
  const stderrPath = `${runDirectoryRel}/stderr.log`;
  const metadataPath = `${runDirectoryRel}/metadata.json`;

  const commandArgs = [
    '--no-install',
    'newman',
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

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, commandArgs, { cwd: repoRoot, encoding: 'utf8', shell: false });
  fs.writeFileSync(absoluteFromRepo(stdoutPath), result.stdout ?? '', 'utf8');
  fs.writeFileSync(absoluteFromRepo(stderrPath), result.stderr ?? '', 'utf8');
  const exitCode = Number.isInteger(result.status) ? result.status : 127;
  const completedAt = new Date();
  const metadata = {
    id,
    startedAtUtc: startedAt.toISOString(),
    completedAtUtc: completedAt.toISOString(),
    hostname,
    command,
    arguments: commandArgs,
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
    caseResults: [],
    resultImportStatus: 'pending-human-checked-mapping',
  };
  writeJson(metadataPath, metadata);

  const registry = readJson('work/registry/runs.json');
  registry.runs.push({ mode: 'local', ...metadata });
  writeJson('work/registry/runs.json', registry);
  process.stdout.write(`Captured real Newman run ${id} with exit code ${exitCode}.\n`);
  process.stdout.write('Case-result mapping remains pending and must be checked against the raw JSON report.\n');
  process.exitCode = exitCode;
} catch (caught) {
  process.stderr.write(`ERROR: ${caught.message}\n`);
  process.exitCode = 1;
}
