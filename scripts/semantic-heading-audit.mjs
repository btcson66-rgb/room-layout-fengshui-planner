import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const headingPattern = /<h([1-6])\b[^>]*>/gi;

export function auditHtml(html, file = '<html>') {
  const robotsMatch = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const robots = robotsMatch?.[1]?.toLowerCase() ?? '';
  const indexable = !robots.includes('noindex');
  const headings = [];
  let match;
  while ((match = headingPattern.exec(html)) !== null) {
    headings.push({ level: Number(match[1]), index: match.index });
  }

  const failures = [];
  if (indexable && headings.filter((heading) => heading.level === 1).length !== 1) {
    failures.push(`expected exactly one H1, found ${headings.filter((heading) => heading.level === 1).length}`);
  }
  const firstH1 = headings.find((heading) => heading.level === 1);
  const firstH2 = headings.find((heading) => heading.level === 2);
  const firstH3 = headings.find((heading) => heading.level === 3);
  if (indexable && firstH2 && (!firstH1 || firstH1.index > firstH2.index)) {
    failures.push('first H1 must precede first H2');
  }
  if (indexable && firstH3 && !firstH2) {
    failures.push('H3 must not appear without an H2');
  } else if (indexable && firstH3 && firstH2.index > firstH3.index) {
    failures.push('H2 must precede first H3');
  }
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level - headings[index - 1].level > 1) {
      failures.push(`heading level jumps from H${headings[index - 1].level} to H${headings[index].level}`);
      break;
    }
  }

  return { file, indexable, robots, headings, failures, pass: failures.length === 0 };
}

async function htmlFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

export async function auditDist(root = 'dist') {
  const files = await htmlFiles(root);
  const results = await Promise.all(files.map(async (file) => auditHtml(await fs.readFile(file, 'utf8'), path.relative(root, file))));
  return {
    root,
    files: results.length,
    indexable: results.filter((result) => result.indexable).length,
    failures: results.filter((result) => !result.pass),
    results,
    pass: results.every((result) => result.pass),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'dist';
  const result = await auditDist(root);
  const json = process.argv.includes('--json');
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.pass) {
    console.log(`Semantic heading audit PASS: ${result.files} HTML files, ${result.indexable} indexable documents.`);
  } else {
    console.error(`Semantic heading audit FAIL: ${result.failures.length} file(s).`);
    for (const failure of result.failures) console.error(`- ${failure.file}: ${failure.failures.join('; ')}`);
  }
  process.exitCode = result.pass ? 0 : 1;
}
