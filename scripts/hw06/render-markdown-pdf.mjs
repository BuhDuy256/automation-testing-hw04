import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function inline(value) {
  let result = escapeHtml(value);
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  result = result.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>');
  return result;
}

function splitTableRow(line) {
  const placeholder = '\u0000PIPE\u0000';
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').replaceAll('\\|', placeholder)
    .split('|').map((cell) => cell.trim().replaceAll(placeholder, '|'));
}

function markdownToHtml(markdown, title) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const body = [];
  let index = 0;
  let inCode = false;
  let codeLines = [];
  let listType = null;
  const closeList = () => {
    if (listType) body.push(`</${listType}>`);
    listType = null;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith('```')) {
      closeList();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        body.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
      }
      index += 1;
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      index += 1;
      continue;
    }
    if (/^\s*\|/.test(line) && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      closeList();
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      body.push('<table><thead><tr>' + headers.map((cell) => `<th>${inline(cell)}</th>`).join('') + '</tr></thead><tbody>');
      for (const row of rows) body.push('<tr>' + row.map((cell) => `<td>${inline(cell)}</td>`).join('') + '</tr>');
      body.push('</tbody></table>');
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      body.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }
    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (bullet || ordered) {
      const wanted = bullet ? 'ul' : 'ol';
      if (listType !== wanted) {
        closeList();
        listType = wanted;
        body.push(`<${wanted}>`);
      }
      body.push(`<li>${inline((bullet ?? ordered)[1])}</li>`);
      index += 1;
      continue;
    }
    closeList();
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith('> ')) body.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else body.push(`<p>${inline(line)}</p>`);
    index += 1;
  }
  closeList();
  if (inCode) body.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
  @page { size: A4; margin: 14mm 12mm; }
  body { font-family: Arial, sans-serif; color: #172033; font-size: 10pt; line-height: 1.35; }
  h1 { color: #12355b; border-bottom: 2px solid #2f6f9f; padding-bottom: 4px; }
  h2 { color: #174f7a; margin-top: 18px; }
  h3 { color: #245f88; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 7.4pt; table-layout: fixed; }
  th, td { border: 1px solid #9eafbf; padding: 4px; vertical-align: top; overflow-wrap: anywhere; }
  th { background: #e8f0f7; }
  code { font-family: Consolas, monospace; font-size: 0.92em; background: #f2f4f6; padding: 1px 3px; }
  pre { white-space: pre-wrap; background: #f2f4f6; border: 1px solid #ccd5dd; padding: 8px; }
  blockquote { margin: 8px 0; border-left: 4px solid #8ba9c2; padding: 4px 10px; background: #f6f9fb; }
  a { color: #075c9f; text-decoration: none; }
  </style></head><body>${body.join('\n')}</body></html>`;
}

function render(inputRelative, outputRelative) {
  const input = path.resolve(repoRoot, inputRelative);
  const output = path.resolve(repoRoot, outputRelative);
  const outRoot = path.resolve(repoRoot, 'out');
  if (!input.startsWith(outRoot + path.sep) || !output.startsWith(outRoot + path.sep)) throw new Error('Input and output must stay inside out/');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hw06-pdf-'));
  try {
    const htmlPath = path.join(tempRoot, 'document.html');
    const profilePath = path.join(tempRoot, 'edge-profile');
    fs.mkdirSync(profilePath);
    const markdown = fs.readFileSync(input, 'utf8');
    fs.writeFileSync(htmlPath, markdownToHtml(markdown, path.basename(input)), 'utf8');
    const result = spawnSync(edgePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      `--user-data-dir=${profilePath}`,
      '--print-to-pdf-no-header',
      `--print-to-pdf=${output}`,
      pathToFileURL(htmlPath).href,
    ], { encoding: 'utf8', timeout: 120000 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Edge PDF render failed (${result.status}): ${result.stderr || result.stdout}`);
    const header = fs.readFileSync(output).subarray(0, 5).toString('ascii');
    if (header !== '%PDF-') throw new Error(`Invalid PDF output: ${output}`);
    process.stdout.write(`Created ${outputRelative}\n`);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

render('out/main-report.md', 'out/main-report.pdf');
render('out/ai-audit-report.md', 'out/ai-audit-report.pdf');
render('out/ai-critique.md', 'out/ai-critique.pdf');
