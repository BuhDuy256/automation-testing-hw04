import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

export function absoluteFromRepo(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error('Expected a non-empty repository-relative path');
  }
  const absolute = path.resolve(repoRoot, relativePath);
  const relative = path.relative(repoRoot, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repository: ${relativePath}`);
  }
  return absolute;
}

export function relativeToRepo(absolutePath) {
  const relative = path.relative(repoRoot, path.resolve(absolutePath));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path is outside repository: ${absolutePath}`);
  }
  return relative.split(path.sep).join('/');
}

export function readJson(relativePath) {
  const absolute = absoluteFromRepo(relativePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

export function writeJson(relativePath, value) {
  const absolute = absoluteFromRepo(relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function writeText(relativePath, value) {
  const absolute = absoluteFromRepo(relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, value, 'utf8');
}

export function fileExists(relativePath) {
  try {
    return fs.statSync(absoluteFromRepo(relativePath)).isFile();
  } catch (_) {
    return false;
  }
}

export function sha256File(relativePath) {
  const content = fs.readFileSync(absoluteFromRepo(relativePath));
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function uniqueId(prefix, date = new Date()) {
  const timestamp = date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17);
  return `${prefix}-${timestamp}`;
}

export function requireFileArgument(args, name) {
  if (typeof args[name] !== 'string') {
    throw new Error(`Missing --${name}`);
  }
  const absolute = path.resolve(args[name]);
  if (!fs.statSync(absolute).isFile()) {
    throw new Error(`Not a file: ${args[name]}`);
  }
  return absolute;
}

export function markdownCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
}
