import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { markdownToHtml } from 'satteri';
import {
  CLOUDFLARE_STATIC_REDIRECT_LIMIT,
  redirects,
  redirectSources,
  redirectTargets,
  renderRedirectsFile,
} from '../../src/data/redirects.mjs';
import { reviewReadyBlogSlugs, reviewReadyCategorySlugs } from '../../src/data/contentQuality.mjs';
import { demandConsolidation, demandConsolidatedBlogSlugs } from '../../src/data/demandConsolidation.mjs';
import { demandHeldBlogSlugs } from '../../src/data/searchDemandPolicy.mjs';
import { redirectLinksPlugin, resolveRedirectedHref, selfPathForFile } from '../../src/lib/remark-redirect-links.mjs';

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
  // 2026-10-19 需求閘門合併的 904 篇例外：為了不讓 14 天行事曆 PR 衝突，來源 .md
  // 不改，內文連結由 remark-redirect-links 在 build 時改寫、relatedPosts 由 [slug].astro
  // 過濾，最終 HTML 由 content-quality-audit 的 no-href-to-redirect-source 把關。
  const mergedUrls = redirects
    .map((entry) => entry.from)
    .filter((from) => /^\/zh\/blog\/[^/]+\/$/.test(from))
    .filter((from) => !demandConsolidatedBlogSlugs.has(from.slice('/zh/blog/'.length, -1)));
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

test('轉址總數不超過 Cloudflare Pages 靜態規則上限', () => {
  assert.ok(redirects.length <= CLOUDFLARE_STATIC_REDIRECT_LIMIT, `${redirects.length} > ${CLOUDFLARE_STATIC_REDIRECT_LIMIT}`);
});

test('需求閘門合併：904 篇各有一個可 build 的目標，且暫停清單已清空', () => {
  assert.equal(demandConsolidation.length, 904);
  assert.equal(demandConsolidatedBlogSlugs.size, 904);
  assert.equal(demandHeldBlogSlugs.size, 0, 'held list must be empty once the held articles are consolidated');
  for (const entry of demandConsolidation) {
    assert.ok(!reviewReadyBlogSlugs.has(entry.slug), `${entry.slug} is consolidated but still review-ready`);
    const article = entry.to.match(/^\/zh\/blog\/([^/]+)\/$/)?.[1];
    const hub = entry.to.match(/^\/zh\/category\/([^/]+)\/$/)?.[1];
    assert.ok(article || hub, `${entry.slug} -> ${entry.to} must be an article or a category hub`);
    if (article) assert.ok(reviewReadyBlogSlugs.has(article), `${entry.slug} -> ${entry.to} is not a kept article`);
    if (hub) assert.ok(reviewReadyCategorySlugs.has(hub), `${entry.slug} -> ${entry.to} hub is not built`);
  }
});

test('Markdown 連結改寫外掛只改寫轉址來源，連回自己時拆掉連結', () => {
  const map = new Map([
    ['/zh/blog/old-a/', '/zh/blog/kept/'],
    ['/zh/blog/old-b/', '/zh/blog/self/'],
  ]);
  assert.equal(resolveRedirectedHref('/zh/blog/old-a/', map), '/zh/blog/kept/');
  assert.equal(resolveRedirectedHref('/zh/blog/old-a/#section', map), '/zh/blog/kept/');
  assert.equal(resolveRedirectedHref('/zh/blog/old-a', map), '/zh/blog/kept/');
  assert.equal(resolveRedirectedHref('https://roomfeng.win/zh/blog/old-a/', map), '/zh/blog/kept/');
  assert.equal(resolveRedirectedHref('/zh/blog/kept/', map), null);
  assert.equal(resolveRedirectedHref('https://example.com/zh/blog/old-a/', map), null);

  // 走真正的 Sätteri 管線（Astro 7 預設的 Markdown 處理器），不是手刻的 AST。
  const markdown = [
    '看 [A](/zh/blog/old-a/#x)，或 [B](/zh/blog/old-b/)，或 [工具](/zh/room-layout-planner/)。',
    '',
    '參考 [C][ref]。',
    '',
    '[ref]: /zh/blog/old-a/',
    '',
    '<a href="/zh/blog/old-a/">D</a>',
  ].join('\n');
  const fileURL = pathToFileURL(join(projectRoot, 'src', 'content', 'blog', 'self.md'));
  const result = markdownToHtml(markdown, { fileURL, mdastPlugins: [redirectLinksPlugin(map)] });
  const html = typeof result === 'string' ? result : result.html;
  assert.match(html, /<a href="\/zh\/blog\/kept\/">A<\/a>/);
  assert.match(html, /，或 B，或 /, 'self link must be unwrapped to its text');
  assert.match(html, /<a href="\/zh\/room-layout-planner\/">工具<\/a>/);
  assert.match(html, /<a href="\/zh\/blog\/kept\/">C<\/a>/);
  assert.match(html, /<a href="\/zh\/blog\/kept\/">D<\/a>/);
  assert.doesNotMatch(html, /old-a|old-b/);
  assert.equal(selfPathForFile(fileURL), '/zh/blog/self/');
});