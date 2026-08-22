import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  absoluteFromRepo,
  parseArgs,
  readJson,
  repoRoot,
  writeJson,
  writeText,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const action = args._[0];
const bugRegistryPath = 'work/registry/bugs.json';

function required(name) {
  if (typeof args[name] !== 'string' || !args[name].trim()) throw new Error(`Missing --${name}`);
  return args[name].trim();
}

function run(command, commandArgs, allowFailure = false) {
  const executable = process.platform === 'win32' && command === 'gh' ? 'gh.exe' : command;
  const result = spawnSync(executable, commandArgs, { cwd: repoRoot, encoding: 'utf8', shell: false });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) throw new Error(`${command} ${commandArgs[0]} failed: ${(result.stderr ?? result.stdout ?? '').trim()}`);
  return result;
}

function repoName() {
  if (typeof args.repo === 'string') return args.repo;
  const remote = run('git', ['remote', 'get-url', 'origin']).stdout.trim();
  const match = /github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/.exec(remote);
  if (!match) throw new Error('Cannot derive OWNER/REPO from origin; pass --repo');
  return match[1];
}

function loadConfirmedBug() {
  const registry = readJson(bugRegistryPath);
  const bug = registry.bugs.find((item) => item.id === required('bug-id'));
  if (!bug) throw new Error(`Unknown bug: ${args['bug-id']}`);
  if (bug.status !== 'human-confirmed') throw new Error(`${bug.id} must have status human-confirmed`);
  for (const field of ['title', 'expected', 'actual', 'reproduction', 'confirmedBy', 'confirmedAt']) {
    if (typeof bug[field] !== 'string' || !bug[field].trim()) throw new Error(`${bug.id} is missing ${field}`);
  }
  if (!Array.isArray(bug.caseIds) || bug.caseIds.length === 0) throw new Error(`${bug.id} has no caseIds`);
  if (!Array.isArray(bug.screenshotPaths) || bug.screenshotPaths.length === 0) throw new Error(`${bug.id} has no screenshotPaths`);
  const evidence = readJson('work/registry/evidence.json').items;
  for (const screenshotPath of bug.screenshotPaths) {
    if (!fs.statSync(absoluteFromRepo(screenshotPath)).isFile()) throw new Error(`Missing screenshot: ${screenshotPath}`);
    const evidenceItem = evidence.find((item) => item.path === screenshotPath);
    if (!evidenceItem?.humanAttestation) throw new Error(`Screenshot is not human-attested: ${screenshotPath}`);
  }
  return { registry, bug };
}

function imageLink(commitSha, screenshotPath) {
  const encoded = screenshotPath.split('/').map(encodeURIComponent).join('/');
  return `../blob/${commitSha}/${encoded}?raw=true`;
}

function issueBody(bug, commitSha) {
  return [
    `# ${bug.id}: ${bug.title}`,
    '',
    `Test cases: ${bug.caseIds.join(', ')}`,
    `Confirmed by: ${bug.confirmedBy}`,
    `Confirmed at: ${bug.confirmedAt}`,
    `Evidence commit: ${commitSha}`,
    '',
    '## Expected behavior', '', bug.expected, '',
    '## Actual behavior', '', bug.actual, '',
    '## Reproduction', '', bug.reproduction, '',
    '## Evidence', '',
    ...(bug.evidencePaths ?? []).map((item) => `- \`${item}\``),
    '',
    ...bug.screenshotPaths.flatMap((item, index) => [`![${bug.id} evidence ${index + 1}](${imageLink(commitSha, item)})`, '']),
  ].join('\n');
}

function verifyAndPersist(registry, bug, repository, issueUrl) {
  const result = run('gh', ['issue', 'view', issueUrl, '--repo', repository, '--json', 'number,url,state,title,body']);
  const issue = JSON.parse(result.stdout);
  if (issue.url !== issueUrl || issue.state !== 'OPEN') throw new Error('Created issue could not be verified as open');
  if (!issue.title.includes(bug.id) || !issue.body.includes(bug.id)) throw new Error('Verified issue does not contain the canonical bug ID');
  for (const caseId of bug.caseIds) if (!issue.body.includes(caseId)) throw new Error(`Verified issue body lacks ${caseId}`);
  if (!/!\[[^\]]*\]\([^)]*\)/.test(issue.body)) throw new Error('Verified issue body has no rendered-image Markdown reference');
  bug.status = 'published';
  bug.githubIssueNumber = issue.number;
  bug.githubIssueUrl = issue.url;
  bug.publishedAt = new Date().toISOString();
  bug.publishedCommitSha = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  writeJson(bugRegistryPath, registry);
  process.stdout.write(`Verified and linked ${bug.id} to ${issue.url}\n`);
}

try {
  const { registry, bug } = loadConfirmedBug();
  const repository = repoName();
  if (action === 'preview') {
    const sha = run('git', ['rev-parse', 'HEAD']).stdout.trim();
    const bodyPath = `work/generated/issues/${bug.id}.md`;
    writeText(bodyPath, issueBody(bug, sha));
    process.stdout.write(`Preview ready: ${bodyPath}\nNo GitHub issue was created.\n`);
  } else if (action === 'publish') {
    if (args.confirm !== bug.id) throw new Error(`Publishing requires --confirm ${bug.id}`);
    run('gh', ['auth', 'status']);
    const sha = run('git', ['rev-parse', 'HEAD']).stdout.trim();
    for (const screenshotPath of bug.screenshotPaths) {
      run('git', ['ls-files', '--error-unmatch', '--', screenshotPath]);
      if (run('git', ['status', '--porcelain', '--', screenshotPath]).stdout.trim()) throw new Error(`Screenshot has uncommitted changes: ${screenshotPath}`);
    }
    run('gh', ['api', `repos/${repository}/commits/${sha}`, '--jq', '.sha']);
    const bodyPath = `work/generated/issues/${bug.id}.md`;
    writeText(bodyPath, issueBody(bug, sha));
    const created = run('gh', ['issue', 'create', '--repo', repository, '--title', `[HW06][${bug.id}] ${bug.title}`, '--body-file', absoluteFromRepo(bodyPath)]);
    const issueUrl = created.stdout.match(/https:\/\/github\.com\/[^\s]+\/issues\/\d+/)?.[0];
    if (!issueUrl) throw new Error(`GitHub did not return an issue URL: ${created.stdout.trim()}`);
    verifyAndPersist(registry, bug, repository, issueUrl);
  } else if (action === 'link') {
    run('gh', ['auth', 'status']);
    verifyAndPersist(registry, bug, repository, required('issue-url'));
  } else {
    throw new Error('Usage: publish-bug.mjs <preview|publish|link> [options]');
  }
} catch (caught) {
  process.stderr.write(`ERROR: ${caught.message}\n`);
  process.exitCode = 1;
}
