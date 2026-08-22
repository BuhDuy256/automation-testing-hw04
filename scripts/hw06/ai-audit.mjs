import fs from 'node:fs';
import path from 'node:path';
import {
  absoluteFromRepo,
  parseArgs,
  readJson,
  relativeToRepo,
  requireFileArgument,
  sha256File,
  uniqueId,
  writeJson,
} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const action = args._[0];
const registryPath = 'work/registry/ai-interactions.json';

function requireText(name) {
  if (typeof args[name] !== 'string' || !args[name].trim()) throw new Error(`Missing --${name}`);
  return args[name].trim();
}

function capture() {
  const tool = requireText('tool');
  const task = requireText('task');
  const promptSource = requireFileArgument(args, 'prompt-file');
  const outputSource = requireFileArgument(args, 'output-file');
  const capturedAt = new Date();
  const id = args.id ? requireText('id') : uniqueId('AI', capturedAt);
  if (!/^AI-[A-Za-z0-9_-]+$/.test(id)) throw new Error('Interaction id must match ^AI-[A-Za-z0-9_-]+$');
  const registry = readJson(registryPath);
  if (registry.interactions.some((item) => item.id === id)) throw new Error(`Interaction already exists: ${id}`);

  const directory = absoluteFromRepo(`work/ai-audit/interactions/${id}`);
  fs.mkdirSync(directory, { recursive: true });
  const promptTarget = path.join(directory, 'prompt.md');
  const outputTarget = path.join(directory, 'output.md');
  fs.copyFileSync(promptSource, promptTarget, fs.constants.COPYFILE_EXCL);
  fs.copyFileSync(outputSource, outputTarget, fs.constants.COPYFILE_EXCL);
  const promptPath = relativeToRepo(promptTarget);
  const outputPath = relativeToRepo(outputTarget);
  const occurredAtUtc = args['occurred-at'] ? new Date(args['occurred-at']).toISOString() : capturedAt.toISOString();
  const timestampBasis = args['occurred-at']
    ? 'user-supplied interaction time; requires human verification'
    : 'capture time recorded immediately after interaction';

  const interaction = {
    id,
    tool,
    task,
    occurredAtUtc,
    capturedAtUtc: capturedAt.toISOString(),
    timestampBasis,
    promptPath,
    outputPath,
    promptSha256: sha256File(promptPath),
    outputSha256: sha256File(outputPath),
    humanReview: null,
  };
  registry.interactions.push(interaction);
  writeJson(registryPath, registry);
  writeJson(`work/ai-audit/interactions/${id}/metadata.json`, interaction);
  process.stdout.write(`Captured ${id}. Human review is still required.\n`);
}

function review() {
  const id = requireText('id');
  const verdict = requireText('verdict').toUpperCase();
  if (!['VALID', 'INVALID', 'INCOMPLETE'].includes(verdict)) throw new Error('Verdict must be VALID, INVALID, or INCOMPLETE');
  const reasoningFile = requireFileArgument(args, 'reasoning-file');
  const studentFixFile = requireFileArgument(args, 'student-fix-file');
  const reasoning = fs.readFileSync(reasoningFile, 'utf8').trim();
  const studentFix = fs.readFileSync(studentFixFile, 'utf8').trim();
  if (!reasoning || !studentFix) throw new Error('Reasoning and student-fix files must be non-empty');
  const registry = readJson(registryPath);
  const interaction = registry.interactions.find((item) => item.id === id);
  if (!interaction) throw new Error(`Unknown interaction: ${id}`);
  interaction.humanReview = {
    verdict,
    reasoning,
    studentFix,
    reviewedBy: requireText('reviewed-by'),
    reviewedAt: new Date().toISOString(),
  };
  writeJson(registryPath, registry);
  writeJson(`work/ai-audit/interactions/${id}/metadata.json`, interaction);
  process.stdout.write(`Recorded human review for ${id}.\n`);
}

try {
  if (action === 'capture') capture();
  else if (action === 'review') review();
  else throw new Error('Usage: ai-audit.mjs <capture|review> [options]');
} catch (caught) {
  process.stderr.write(`ERROR: ${caught.message}\n`);
  process.exitCode = 1;
}
