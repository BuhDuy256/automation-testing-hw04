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

function issueDetails(bug) {
  if (bug.id === 'BUG-CANDIDATE-FR04-PHONE-FORMAT') {
    return {
      title: '[HW06][FR-04] PUT /api/users/me persists phone values outside the documented format',
      caseIds: bug.caseIds,
      expected: bug.expected,
      actual: bug.actual,
      reproduction: bug.reproduction,
      evidencePaths: [
        'work/runs/RUN-20260823022316955-fr04-phone-corrected/newman-report.json',
        'work/runs/RUN-20260823022316955-fr04-phone-corrected/newman-report.html',
        'work/runs/RUN-20260823022316955-fr04-phone-corrected/stdout.log'
      ],
      endpoint: 'PUT /api/users/me',
      requirement: 'FR-04 Personal profile management: the phone must begin with 0 and contain 10-11 digits (eshop-sut/README.md, FR-04). The selected operation is documented in eshop-sut/api_specification.md, §2.2.',
      preconditions: 'Freshly seeded local SUT; authenticate as test@eshop.com; capture the authenticated user profile baseline before mutation.',
      genuineDefect: 'The targeted run used the reviewed invalid-phone stimuli, reached the persisted round-trip assertion, and reproduced the same contract violation. The test did not assert an undocumented status or error schema; it asserted only that an invalid phone must not become the persisted valid profile value.',
      impact: 'Profile data can retain phone values outside the documented FR-04 format. This can make the user profile inconsistent with the stated contract and may affect downstream phone-based contact or validation flows. No severity level is asserted here because the assignment specification does not define one.',
      reproducibility: 'Reproduced in the original data-driven run and in the clean targeted phone run RUN-20260823022316955-fr04-phone-corrected, including FR04-AI-013 and FR04-H-004.'
    };
  }
  if (bug.id === 'BUG-CANDIDATE-FR04-ROLE-TAMPERING') {
    return {
      title: '[HW06][FR-04][SEC-06] PUT /api/users/me allows a client to persist role=admin',
      caseIds: ['FR04-AI-026'],
      expected: 'The authenticated ordinary user role must remain user; the client must not be able to change the protected role field under FR-04 and SEC-06.',
      actual: 'FR04-AI-026 submitted role=admin and the subsequent authenticated GET returned the user profile with persisted role=admin instead of the baseline role=user.',
      reproduction: 'Authenticate as test@eshop.com and verify the authenticated baseline role is user. Submit PUT /api/users/me with role=admin and otherwise valid editable fields, then GET /api/users/me. The clean targeted Newman run records the persisted role mutation.',
      evidencePaths: [
        'work/runs/RUN-20260823022329715-fr04-role-corrected/newman-report.json',
        'work/runs/RUN-20260823022329715-fr04-role-corrected/newman-report.html',
        'work/runs/RUN-20260823022329715-fr04-role-corrected/stdout.log'
      ],
      endpoint: 'PUT /api/users/me',
      requirement: 'FR-04 Personal profile management: a user cannot change the role attribute. SEC-06 states that the profile-update API must not allow the client to change role (eshop-sut/README.md, FR-04 and SEC-06). The selected operation is documented in eshop-sut/api_specification.md, §2.2.',
      preconditions: 'Freshly seeded local SUT; authenticate as test@eshop.com; verify the authenticated baseline role is user before submitting the mutation.',
      genuineDefect: 'The clean targeted run verified the ordinary-user baseline before the PUT, submitted role=admin, reached the protected-field persistence assertion, and observed the stored role become admin. This is not a setup or mapping failure.',
      impact: 'A client can mutate the protected role field from user to admin. This creates a privilege-boundary exposure because downstream authorization that trusts the stored role could treat the account as an administrator. This report does not claim that a separate admin action was executed.',
      reproducibility: 'Reproduced in the clean targeted run RUN-20260823022329715-fr04-role-corrected.'
    };
  }
  if (bug.id === 'BUG-CANDIDATE-FR08-CLIENT-TOTAL') {
    return {
      title: '[HW06][FR-08] POST /api/checkout persists the client-supplied total_amount instead of recalculating it from the cart',
      caseIds: ['FR08-AI-002', 'FR08-AI-003', 'FR08-AI-004', 'FR08-AI-005', 'FR08-AI-035', 'FR08-H-001'],
      expected: bug.expected,
      actual: bug.actual,
      reproduction: bug.reproduction,
      evidencePaths: [
        'work/runs/RUN-20260823080014785-fr08-canonical-full-suite/newman-report.json',
        'work/runs/RUN-20260823080014785-fr08-canonical-full-suite/newman-report.html',
        'work/runs/RUN-20260823080014785-fr08-canonical-full-suite/stdout.log'
      ],
      endpoint: 'POST /api/checkout',
      requirement: 'FR-08 Checkout states that the payable total is calculated automatically from the cart and that the backend must recalculate it and must not accept the client-supplied total_amount (eshop-sut/README.md, FR-08). The selected operation and its request body are documented in eshop-sut/api_specification.md, §4.3.',
      preconditions: 'Freshly seeded local SUT. Each case registers its own account through POST /api/register and logs in, because implementation cart state is per-user process memory, POST /api/cart only appends, and no cart-clearing endpoint is documented. The cart is then seeded and confirmed with GET /api/cart so the server-side cart total is known before checkout.',
      genuineDefect: 'The assertion compares the persisted order total against the total derived from the cart state the server itself reported immediately before checkout, so the expected value is never hardcoded. No HTTP status code and no response schema is asserted anywhere, because the API specification documents none for this endpoint. Sixteen independent input partitions reproduced the same behaviour in one run, including a cart worth 200000 charged as 1000 and an empty cart producing a paid order of 200000. This is a contract violation, not a setup, mapping, or harness failure: the run recorded zero harness defects, zero state contamination and zero blocked cases.',
      impact: 'The amount stored on an order is controlled by the caller rather than by the cart, so an order can be persisted for an arbitrary amount, including zero, a negative amount, or an amount unrelated to any real cart. Absent or non-numeric client values are stored as NULL instead of the derived total. No severity level is asserted here because the assignment specification does not define one.',
      reproducibility: 'Reproduced by 16 canonical cases in the single canonical run RUN-20260823080014785-fr08-canonical-full-suite, plus FR08-AI-040 and FR08-H-005 whose failures require this defect together with the cart-clearing defect. Note on scope: cases whose client value happened to equal the cart-derived total passed, and those passes do not prove that any server-side derivation occurs.'
    };
  }
  if (bug.id === 'BUG-CANDIDATE-FR08-CART-NOT-CLEARED') {
    return {
      title: '[HW06][FR-08] The cart is not cleared after a successful checkout',
      caseIds: ['FR08-AI-031'],
      expected: bug.expected,
      actual: bug.actual,
      reproduction: bug.reproduction,
      evidencePaths: [
        'work/runs/RUN-20260823080014785-fr08-canonical-full-suite/newman-report.json',
        'work/runs/RUN-20260823080014785-fr08-canonical-full-suite/newman-report.html',
        'work/runs/RUN-20260823080014785-fr08-canonical-full-suite/stdout.log'
      ],
      endpoint: 'POST /api/checkout',
      requirement: 'FR-08 Checkout states that after a successful checkout the cart is cleared (eshop-sut/README.md, FR-08). The cart read-back endpoint is documented in eshop-sut/api_specification.md, §4.1.',
      preconditions: 'Freshly seeded local SUT. The case registers its own account through POST /api/register and logs in, seeds exactly one cart line with POST /api/cart, and confirms that starting cart with GET /api/cart before checking out.',
      genuineDefect: 'The checkout returned 200 with {"message":"Checkout successful","orderId":27}, so the success precondition of the documented clearing rule was met. The immediate GET /api/cart read-back still returned the purchased line, and the assertion asserted only the documented state transition, not an undocumented empty-cart response shape. The stale line then changed the observed pre-checkout cart of the next checkout in FR08-AI-040 and FR08-H-005 from the rebuilt 50000 to 250000, which is a second-order consequence of the same defect rather than a separate finding.',
      impact: 'Purchased items remain in the cart after payment, so the next checkout derives from contaminated state and a user can be charged again for items already bought. No severity level is asserted here because the assignment specification does not define one.',
      reproducibility: 'Reproduced by FR08-AI-031 in the canonical run RUN-20260823080014785-fr08-canonical-full-suite, with the downstream contamination visible in FR08-AI-040 and FR08-H-005 in the same run.'
    };
  }
  if (bug.id === 'BUG-CANDIDATE-FR15-AUTHORIZATION') {
    return {
      title: bug.title,
      caseIds: bug.caseIds,
      expected: bug.expected,
      actual: bug.actual,
      reproduction: bug.reproduction,
      evidencePaths: [
        'work/runs/RUN-20260823102829114-fr15-auth-reproduction/newman-report.json',
        'work/runs/RUN-20260823102829114-fr15-auth-reproduction/newman-report.html',
        'work/runs/RUN-20260823102829114-fr15-auth-reproduction/stdout.log'
      ],
      endpoint: 'POST /api/products',
      requirement: 'FR-12 limits product data changes to administrators. SEC-02 requires a valid JWT for every authenticated endpoint, and SEC-03 requires role=admin for product creation (eshop-sut/README.md, FR-12, SEC-02, and SEC-03). The selected operation is documented in eshop-sut/api_specification.md, section 3.3.',
      preconditions: 'Freshly seeded local SUT. Capture the product-list baseline, prepare the authorization context under test, and use a run-unique otherwise-valid product body so persistence can be identified unambiguously.',
      genuineDefect: 'The canonical suite observed persistent product creation across ten invalid authorization contexts. The targeted reproduction then repeated five representative contexts, including an ordinary-user JWT, with five failed no-persistence oracles, 40/40 requests carrying X-Student-Id: 23127179, and no harness or setup failure. The oracle checks persistent state and does not require an undocumented HTTP rejection status or error schema.',
      impact: 'A caller without a valid admin authorization context can create persistent catalog products. This bypasses the documented product-management privilege boundary and can permit unauthorized catalog modification. No severity level is asserted because the assignment specification does not define one.',
      reproducibility: 'Reproduced by all ten mapped authorization cases in RUN-20260823102155874-fr15-canonical-full-suite and by five representative cases in RUN-20260823102829114-fr15-auth-reproduction.'
    };
  }
  if (bug.id === 'BUG-CANDIDATE-FR15-VALIDATION') {
    return {
      title: bug.title,
      caseIds: bug.caseIds,
      expected: bug.expected,
      actual: bug.actual,
      reproduction: bug.reproduction,
      evidencePaths: [
        'work/runs/RUN-20260823102841701-fr15-validation-reproduction/newman-report.json',
        'work/runs/RUN-20260823102841701-fr15-validation-reproduction/newman-report.html',
        'work/runs/RUN-20260823102841701-fr15-validation-reproduction/stdout.log'
      ],
      endpoint: 'POST /api/products',
      requirement: 'FR-15 requires a non-empty product name of at most 255 characters, a positive numeric price, and an existing category (eshop-sut/README.md, FR-15). The selected operation and request fields are documented in eshop-sut/api_specification.md, section 3.3.',
      preconditions: 'Freshly seeded local SUT. Authenticate as admin, capture the product-list baseline, and submit a run-unique request with one diagnostically isolated invalid name, price, or category condition.',
      genuineDefect: 'The canonical suite observed persistent rows for eighteen documented-invalid name, price, and category cases. The targeted reproduction repeated six representative partitions with six failed no-persistence oracles, 52/52 requests carrying X-Student-Id: 23127179, and no harness or setup failure. The oracle checks persistent state and does not require an undocumented HTTP rejection status or error schema.',
      impact: 'The catalog can retain products that violate its documented identity, pricing, or category constraints. This can expose malformed product data and invalid category relationships to later catalog and checkout flows. No severity level is asserted because the assignment specification does not define one.',
      reproducibility: 'Reproduced by all eighteen mapped validation cases in RUN-20260823102155874-fr15-canonical-full-suite and by six representative cases in RUN-20260823102841701-fr15-validation-reproduction.'
    };
  }
  throw new Error(`No publication details configured for ${bug.id}`);
}

function issueBody(bug, commitSha) {
  const details = issueDetails(bug);
  return [
    `# ${details.title}`,
    '',
    `Canonical bug ID: ${bug.id}`,
    `Affected endpoint: ${details.endpoint}`,
    `Requirement / specification: ${details.requirement}`,
    '',
    '## Preconditions', '', details.preconditions, '',
    `Related canonical test cases: ${details.caseIds.join(', ')}`,
    '',
    '## Expected behavior', '', details.expected, '',
    '## Actual behavior', '', details.actual, '',
    '## Why this is a genuine SUT defect', '', details.genuineDefect, '',
    '## Impact assessment', '', details.impact, '',
    '## Reproducibility', '', details.reproducibility, '',
    '## Reproduction', '', details.reproduction, '',
    `Evidence commit: ${commitSha}`,
    '',
    '## Evidence', '',
    ...(details.evidencePaths ?? []).map((item) => `- \`${item}\``),
    '',
    ...bug.screenshotPaths.flatMap((item, index) => [`![${bug.id} evidence ${index + 1}](${imageLink(commitSha, item)})`, '']),
  ].join('\n');
}

function verifyAndPersist(registry, bug, repository, issueUrl) {
  const result = run('gh', ['issue', 'view', issueUrl, '--repo', repository, '--json', 'number,url,state,title,body']);
  const issue = JSON.parse(result.stdout);
  if (issue.url !== issueUrl || issue.state !== 'OPEN') throw new Error('Created issue could not be verified as open');
  const details = issueDetails(bug);
  if (!issue.title.includes(details.title) || !issue.body.includes(bug.id)) throw new Error('Verified issue does not contain the expected public title or canonical bug ID');
  for (const caseId of details.caseIds) if (!issue.body.includes(caseId)) throw new Error(`Verified issue body lacks ${caseId}`);
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
    const created = run('gh', ['issue', 'create', '--repo', repository, '--title', issueDetails(bug).title, '--body-file', absoluteFromRepo(bodyPath)]);
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
