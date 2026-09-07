import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { redirects, redirectSources, redirectTargets, renderRedirectsFile } from '../../src/data/redirects.mjs';
import { reviewReadyBlogSlugs } from '../../src/data/contentQuality.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const blogRoot = join(projectRoot, 'src', 'content', 'blog');

test('每條轉址的來源與目標格式正確', () => {
  for (const entry of redirects) {
    assert.match(entry.from, /^\/[\w\-/]+\/$/, `bad source: ${entry.from}`);
    assert.match(entry.to, /^\/([\w\-/]+\/)?$/, `bad target: ${entry.to}`);
    assert.notEqual(entry.from, entry.to, `self redirect: ${entry.from}`);
    assert.ok(entry.note && entry.note.length >= 4, `redirect needs a note: ${entry.from}`);
  }
});

test('沒有重複的轉址來源', () => {
  assert.equal(redirectSources.size, redirects.length);
});

test('沒有轉址鏈：目標不能同時是另一條的來源', () => {
  for (const entry of redirects) {
    assert.ok(!redirectSources.has(entry.to), `redirect chain: ${entry.from} -> ${entry.to} -> ...`);
  }
});

test('不得把合併的文章一律丟回首頁', () => {
  const articleRedirects = redirects.filter((entry) => entry.from.startsWith('/zh/blog/'));
  assert.ok(articleRedirects.length > 0, 'expected at least one merged article redirect');
  for (const entry of articleRedirects) {
    assert.notEqual(entry.to, '/', `${entry.from} must point at a topically related page, not the home page`);
  }
});

test('被轉走的文章不能還留在內容目錄或 review-ready 清單裡', async () => {
  const files = new Set(await readdir(blogRoot));
  for (const entry of redirects) {
    const match = entry.from.match(/^\/zh\/blog\/([^/]+)\/$/);
    if (!match) continue;
    const slug = match[1];
    assert.ok(!files.has(`${slug}.md`), `${slug}.md still exists; the 301 would never fire`);
    assert.ok(!reviewReadyBlogSlugs.has(slug), `${slug} is still listed as review-ready`);
  }
});

test('文章型轉址目標必須是仍然存在的文章或工具頁', async () => {
  const files = new Set(await readdir(blogRoot));
  for (const target of redirectTargets) {
    const match = target.match(/^\/zh\/blog\/([^/]+)\/$/);
    if (!match) continue;
    assert.ok(files.has(`${match[1]}.md`), `redirect target article missing: ${target}`);
    assert.ok(reviewReadyBlogSlugs.has(match[1]), `redirect target is not review-ready: ${target}`);
  }
});

test('內容目錄裡不再有任何連到被合併文章的連結', async () => {
  const names = (await readdir(blogRoot)).filter((name) => name.endsWith('.md'));
  // 只比對文章型轉址：/zh/ -> / 這種語系根目錄轉址的 `from` 是其他網址的
  // 前綴，拿它做子字串比對會把每一篇文章都誤判成違規。
  const mergedUrls = redirects
    .map((entry) => entry.from)
    .filter((from) => /^\/zh\/blog\/[^/]+\/$/.test(from));
  const mergedSlugs = mergedUrls.map((from) => from.slice('/zh/blog/'.length, -1));
  const offenders = [];
  for (const name of names) {
    const source = await readFile(join(blogRoot, name), 'utf8');
    for (const url of mergedUrls) {
      if (source.includes(url)) offenders.push(`${name} -> ${url}`);
    }
    for (const slug of mergedSlugs) {
      // frontmatter 的 relatedPosts 是裸 slug，沒有斜線可以當邊界。
      if (new RegExp(`(^|[\\s,\\[])${slug}([\\s,\\]]|$)`, 'm').test(source)) offenders.push(`${name} -> ${slug}`);
    }
  }
  assert.deepEqual(offenders, [], `stale references to merged pages:\n${offenders.join('\n')}`);
});

test('_redirects 內容每行都是 "from to 301"', () => {
  const lines = renderRedirectsFile()
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'));
  assert.equal(lines.length, redirects.length);
  for (const line of lines) {
    assert.match(line, /^\/\S* \/\S* 301$/, `bad rule: ${line}`);
  }
});
