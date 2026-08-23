import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outRoot = path.join(repoRoot, 'out');

function copy(source, target) {
  const sourcePath = path.join(repoRoot, source);
  const targetPath = path.join(repoRoot, target);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDirectory(source, target) {
  const sourcePath = path.join(repoRoot, source);
  if (!fs.existsSync(sourcePath)) return;
  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const childSource = path.join(source, entry.name);
    const childTarget = path.join(target, entry.name);
    if (entry.isDirectory()) copyDirectory(childSource, childTarget);
    else copy(childSource, childTarget);
  }
}

for (const name of ['test-cases.json', 'human-reviews.json', 'bugs.json', 'ci-runs.json', 'evidence.json']) {
  copy(`work/registry/${name}`, `out/provenance/${name}`);
}
copy('work/generated/test-summary.json', 'out/provenance/test-summary.json');
copy('work/generated/traceability.md', 'out/provenance/traceability.md');
copy('docs/hw06-req/2026.HW06.API Testing_En.md', 'out/sources/hw06-requirements.md');
copy('eshop-sut/api_specification.md', 'out/sources/eshop-api-specification.md');
copy('eshop-sut/README.md', 'out/sources/eshop-requirements.md');
copy('work/selection/HW06-A-FR04-PUT-USERS-ME-verified-spec.md', 'out/sources/fr04-verified-spec.md');
copy('work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md', 'out/sources/fr08-verified-spec.md');
copy('work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md', 'out/sources/fr15-verified-spec.md');
copyDirectory('.codex/skills/hw06-api-test-generator', 'out/generator/agent-skill');
for (const removable of [
  'out/fr04/ci/hw06-fr04-ci.yml',
  'out/fr04/ci/hw06-fr04-canonical-full-suite.yml',
  'out/fr08/ci/hw06-fr08-ci.yml',
  'out/fr15/ci/hw06-fr15-ci.yml',
  'out/fr04/ci/source-inputs',
  'out/fr08/ci/source-inputs',
  'out/fr15/ci/source-inputs',
  'out/fr15/postman/build.mjs',
  'out/generator/agent-skill/openai.yaml',
]) {
  fs.rmSync(path.join(repoRoot, removable), { recursive: true, force: true });
}

const runs = JSON.parse(fs.readFileSync(path.join(repoRoot, 'work/registry/runs.json'), 'utf8')).runs;
const runLines = [
  '# Canonical Run Index',
  '',
  'This index preserves historical run identifiers used by the AI Audit Report. Submission-facing Newman bundles are curated in the feature folders; internal-only intermediate run directories are not required by this standalone submission.',
  '',
  '| Run ID | API | Started UTC | Completed UTC | Curated submission location |',
  '|---|---|---|---|---|',
];
const curatedRunLocations = {
  'RUN-20260823040227192-fr04-canonical-input': 'fr04/newman/FR04-canonical-input.*',
  'RUN-20260823035912444-fr04-final-stateful': 'fr04/newman/FR04-final-stateful.*',
  'RUN-20260823040119709-fr04-final-closure': 'fr04/newman/FR04-final-closure.*',
  'RUN-20260823022342040-fr04-ai027-corrected': 'fr04/newman/FR04-ai027-corrected.*',
  'RUN-20260823080014785-fr08-canonical-full-suite': 'fr08/newman/FR08-canonical-full-suite.*',
  'RUN-20260823102155874-fr15-canonical-full-suite': 'fr15/newman/FR15-canonical-full-suite.*',
  'RUN-20260823102829114-fr15-auth-reproduction': 'fr15/newman/FR15-authorization-reproduction.*',
  'RUN-20260823102841701-fr15-validation-reproduction': 'fr15/newman/FR15-validation-reproduction.*',
};
for (const run of runs) {
  runLines.push(`| ${run.id} | ${run.apiId ?? ''} | ${run.startedAtUtc ?? ''} | ${run.completedAtUtc ?? ''} | ${curatedRunLocations[run.id] ?? 'Intermediate run retained by identifier; final conclusions and evidence are in the matching feature folder.'} |`);
}
fs.writeFileSync(path.join(outRoot, 'provenance', 'run-index.md'), `${runLines.join('\n')}\n`, 'utf8');

const ciRuns = JSON.parse(fs.readFileSync(path.join(repoRoot, 'work/registry/ci-runs.json'), 'utf8')).runs;
const ciLines = [
  '# CI Run Index',
  '',
  '| Run ID | Purpose | Commit | Conclusion | Public URL | Screenshot |',
  '|---|---|---|---|---|---|',
  ...ciRuns.map((run) => `| ${run.id} | ${run.purpose} | ${run.commitSha} | ${run.conclusion} | ${run.url} | ${run.screenshotEvidenceId} |`),
  '',
];
fs.writeFileSync(path.join(outRoot, 'provenance', 'ci-index.md'), ciLines.join('\n'), 'utf8');

fs.writeFileSync(path.join(outRoot, 'provenance', 'README.md'), `# Submission Provenance\n\nThis folder contains the canonical test candidates, human review records, traceability, and compact run/CI indexes needed to interpret the submission without the development workspace. Historical internal review packets, temporary files, and duplicate raw runs are intentionally omitted.\n`, 'utf8');

const textExtensions = new Set(['.md', '.txt', '.json', '.html', '.yml', '.yaml', '.mjs', '.log']);
const specificRunTargets = new Map([
  ['RUN-20260823040227192-fr04-canonical-input', 'fr04/newman/FR04-canonical-input'],
  ['RUN-20260823035912444-fr04-final-stateful', 'fr04/newman/FR04-final-stateful'],
  ['RUN-20260823040119709-fr04-final-closure', 'fr04/newman/FR04-final-closure'],
  ['RUN-20260823022342040-fr04-ai027-corrected', 'fr04/newman/FR04-ai027-corrected'],
  ['RUN-20260823080014785-fr08-canonical-full-suite', 'fr08/newman/FR08-canonical-full-suite'],
  ['RUN-20260823102155874-fr15-canonical-full-suite', 'fr15/newman/FR15-canonical-full-suite'],
  ['RUN-20260823102829114-fr15-auth-reproduction', 'fr15/newman/FR15-authorization-reproduction'],
  ['RUN-20260823102841701-fr15-validation-reproduction', 'fr15/newman/FR15-validation-reproduction'],
]);

const repositoryBlobBase = 'https://github.com/BuhDuy256/automation-testing-hw04/blob/hw06-api-testing/';
const workflowFiles = [
  'hw06-fr04-ci.yml',
  'hw06-fr04-canonical-full-suite.yml',
  'hw06-fr08-ci.yml',
  'hw06-fr15-ci.yml',
];
const workflowLocalFolders = {
  'hw06-fr04-ci.yml': 'fr04/ci',
  'hw06-fr04-canonical-full-suite.yml': 'fr04/ci',
  'hw06-fr08-ci.yml': 'fr08/ci',
  'hw06-fr15-ci.yml': 'fr15/ci',
};

const regExpSpecialCharacters = new Set(['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '/', String.fromCharCode(92)]);

function escapeRegExp(value) {
  return Array.from(value)
    .map((character) => (regExpSpecialCharacters.has(character) ? String.fromCharCode(92) + character : character))
    .join('');
}

// Prefix a workflow path with the public repository URL, but never a path that already carries it.
function linkWorkflow(text, workflowPath) {
  const pattern = new RegExp(`(?<!${escapeRegExp(repositoryBlobBase)})${escapeRegExp(workflowPath)}`, 'g');
  return text.replace(pattern, `${repositoryBlobBase}${workflowPath}`);
}

function normalizeSubmissionText(value) {
  let text = value;
  text = text.replace(/[A-Za-z]:\\Users\\[^\\]+\\Desktop\\automation-testing-hw04\\/g, '<LOCAL_REPOSITORY>\\');
  text = text.replace(/\/Users\/[^/]+\//g, '<LOCAL_HOME>/');
  for (const [runId, targetBase] of specificRunTargets) {
    text = text.replaceAll(`work/runs/${runId}/newman-report.json`, `${targetBase}.json`);
    text = text.replaceAll(`work/runs/${runId}/newman-report.html`, `${targetBase}.html`);
    text = text.replaceAll(`work/runs/${runId}/stdout.log`, `${targetBase}.stdout.log`);
    text = text.replaceAll(`work/runs/${runId}/metadata.json`, `${targetBase}.metadata.json`);
  }
  text = text.replace(/work\/runs\/(RUN-[A-Za-z0-9-]+)(?:\/[A-Za-z0-9._/-]+)?/g, 'provenance/run-index.md ($1)');
  text = text.replace(/work\/ci\/runs\/(CI-[A-Za-z0-9-]+)(?:\/[A-Za-z0-9._/-]+)?/g, 'provenance/ci-index.md ($1)');
  text = text.replaceAll('work/registry/test-cases.json', 'provenance/test-cases.json');
  text = text.replaceAll('work/registry/human-reviews.json', 'provenance/human-reviews.json');
  text = text.replaceAll('work/registry/bugs.json', 'provenance/bugs.json');
  text = text.replaceAll('work/registry/ci-runs.json', 'provenance/ci-runs.json');
  text = text.replaceAll('work/registry/evidence.json', 'provenance/evidence.json');
  text = text.replaceAll('work/generated/test-summary.json', 'provenance/test-summary.json');
  text = text.replaceAll('work/generated/test-summary.md', 'provenance/test-summary.json');
  text = text.replaceAll('work/generated/traceability.md', 'provenance/traceability.md');
  text = text.replace(/work\/evidence\/screenshots\/(EVID-(?:CI-)?FR04-[A-Za-z0-9-]+\.png)/g, 'fr04/evidence/$1');
  text = text.replace(/work\/evidence\/screenshots\/(EVID-(?:CI-)?FR08-[A-Za-z0-9-]+\.png)/g, 'fr08/evidence/$1');
  text = text.replace(/work\/evidence\/screenshots\/(EVID-(?:CI-)?FR15-[A-Za-z0-9-]+\.png)/g, 'fr15/evidence/$1');
  text = text.replaceAll('work/postman/fr04/', 'fr04/postman/');
  text = text.replaceAll('work/postman/fr08/', 'fr08/postman/');
  text = text.replaceAll('work/postman/fr15/', 'fr15/postman/');
  text = text.replace(/work\/ci\/fr(?:04|08|15)\/[A-Za-z0-9._/-]+/g, 'provenance/ci-index.md');
  for (const workflow of workflowFiles) {
    text = linkWorkflow(text, `.github/workflows/${workflow}`);
    text = text.replaceAll(`${workflowLocalFolders[workflow]}/${workflow}`, `${repositoryBlobBase}.github/workflows/${workflow}`);
  }
  // Collapse any repository-blob prefix that an earlier non-idempotent curation run duplicated.
  text = text.replace(new RegExp(`(?:${escapeRegExp(repositoryBlobBase)})+(?=${escapeRegExp(repositoryBlobBase)})`, 'g'), '');
  text = text.replaceAll('docs/hw06-req/2026.HW06.API Testing_En.md', 'sources/hw06-requirements.md');
  text = text.replaceAll('eshop-sut/api_specification.md', 'sources/eshop-api-specification.md');
  text = text.replaceAll('eshop-sut/README.md', 'sources/eshop-requirements.md');
  text = text.replaceAll('work/selection/HW06-A-FR04-PUT-USERS-ME-verified-spec.md', 'sources/fr04-verified-spec.md');
  text = text.replaceAll('work/selection/HW06-B-FR08-POST-CHECKOUT-verified-spec.md', 'sources/fr08-verified-spec.md');
  text = text.replaceAll('work/selection/HW06-C-FR15-POST-PRODUCTS-verified-spec.md', 'sources/fr15-verified-spec.md');
  text = text.replaceAll('.codex/skills/hw06-api-test-generator/', 'generator/agent-skill/');
  text = text.replace(/scripts\/hw06\/[A-Za-z0-9._/-]+/g, 'provenance/README.md');
  text = text.replaceAll('docs/hw06-standard-actions.md', 'provenance/README.md');
  text = text.replaceAll('HW06_ORCHESTRATOR.md', 'provenance/README.md');
  text = text.replaceAll('HANDOFF.md', 'submission-checklist.md');
  text = text.replaceAll('AGENTS.md', 'provenance/README.md');
  text = text.replaceAll('CLAUDE.md', 'provenance/README.md');
  text = text.replace(/work\/reviews\/[A-Za-z0-9._/-]+/g, 'provenance/README.md');
  text = text.replace(/work\/[A-Za-z0-9._/-]+/g, 'provenance/README.md');
  text = text.replaceAll('../work/', 'provenance/');
  text = text.replaceAll('.scratch/', 'provenance/README.md');
  for (const prefix of ['fr04/', 'fr08/', 'fr15/', 'generator/', 'provenance/', 'sources/']) text = text.replaceAll(`out/${prefix}`, prefix);
  for (const fileName of ['README.md', 'main-report.md', 'main-report.pdf', 'test-cases.xlsx', 'submission-checklist.md', 'bug-report.md', 'ci-cd-report.md', 'postman-features.md', 'ai-audit-report.md', 'ai-audit-report.pdf', 'ai-critique.md', 'git-commit-log.txt', 'github-repo-link.txt']) text = text.replaceAll(`out/${fileName}`, fileName);
  return text;
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      const source = fs.readFileSync(target, 'utf8');
      let normalized = normalizeSubmissionText(source);
      if (['.md', '.txt'].includes(path.extname(entry.name).toLowerCase())) {
        normalized = normalized.replace(/[ \t]+$/gm, '').replace(/\n+$/, '\n');
      }
      if (normalized !== source) fs.writeFileSync(target, normalized, 'utf8');
    }
  }
}
walk(outRoot);

fs.writeFileSync(path.join(outRoot, 'fr15', 'postman', 'README.md'), `# FR-15 Postman submission package\n\nThis folder contains the final executable inputs for all 59 reviewed FR-15 cases.\n\n| File | Purpose |\n|---|---|\n| \`FR15-products.postman_collection.json\` | Canonical Postman v2.1 collection with data-driven and optional stateful phases. |\n| \`FR15-products.postman_environment.json\` | Base URL, student ID, test accounts, synthetic JWT fixtures, and runtime slots. |\n| \`FR15-products.postman_data.json\` | One row per reviewed-usable canonical case. |\n| \`FR15-target-authorization.postman_data.json\` | Representative authorization cases for clean reproduction. |\n| \`FR15-target-validation.postman_data.json\` | Representative validation cases for clean reproduction. |\n\nEvery direct request receives \`X-Student-Id: 23127179\` through the collection pre-request script, and asynchronous cleanup helpers carry the same header explicitly. The collection asserts documented persistence and authorization invariants, records unspecified behavior as \`SPEC GAP\`, keeps SEC-04 display evidence separate, and does not claim that black-box behavior proves SEC-05 internals.\n\nThe repository builder and official execution harness are available in the [public HW06 branch](https://github.com/BuhDuy256/automation-testing-hw04/tree/hw06-api-testing); they are not required to inspect or import this standalone final package.\n`, 'utf8');

process.stdout.write('Curated submission-facing copies and normalized local provenance paths.\n');
