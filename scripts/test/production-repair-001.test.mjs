import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../dist/', import.meta.url);
const html = async (path) => readFile(new URL(`.${path}index.html`, root), 'utf8');
const trustPages = ['about', 'privacy', 'terms', 'contact', 'disclaimer', 'changelog'];
const origin = 'https://roomfeng.win';
const withoutLanguageSwitches = (markup) => markup.replace(/<div class="language-switcher"[^>]*>[\s\S]*?<\/div>/g, '');

test('English trust pages have reciprocal language links and unique self canonicals', async () => {
  const sitemap = await readFile(new URL('sitemap-0.xml', root), 'utf8');
  for (const page of trustPages) {
    const zh = await html(`/${page}/`);
    const en = await html(`/en/${page}/`);
    for (const [markup, self] of [[zh, `/${page}/`], [en, `/en/${page}/`]]) {
      assert.equal((markup.match(/rel="canonical"/g) || []).length, 1, self);
      assert.ok(markup.includes(`rel="canonical" href="${origin}${self}"`), self);
      assert.ok(markup.includes(`hreflang="zh" href="${origin}/${page}/"`), self);
      assert.ok(markup.includes(`hreflang="en" href="${origin}/en/${page}/"`), self);
      assert.doesNotMatch(markup, /<meta name="robots" content="noindex/i, self);
      assert.ok(markup.includes('application/ld+json'), self);
      assert.ok(markup.includes('<meta name="description"'), self);
    }
    assert.ok(sitemap.includes(`<loc>${origin}/en/${page}/</loc>`), page);
    assert.ok(en.includes(`href="/en/${page}/"`), `English footer ${page}`);
    assert.ok(!withoutLanguageSwitches(en).includes(`href="/${page}/"`), `English page points to Chinese ${page} outside the intentional language switch`);
  }
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(urls).size, urls.length, 'duplicate sitemap URL');
});

test('10 ft guide and 3 m guide keep their distinct room envelopes', async () => {
  for (const locale of ['en', 'zh']) {
    const feet = await html(`/${locale}/layout-guides/10x10-bedroom-layout/`);
    const metres = await html(`/${locale}/layout-guides/3x3m-bedroom-layout/`);
    assert.equal((feet.match(/3048 × 3048 mm<\/figcaption>/g) || []).length, 3, locale);
    assert.equal((metres.match(/3000 × 3000 mm<\/figcaption>/g) || []).length, 3, locale);
    assert.doesNotMatch(feet, /3000 × 3000 mm<\/figcaption>/, locale);
  }
});

test('home count and visitor-facing contact and privacy copy match the current site', async () => {
  assert.match(await html('/'), />10 tools<\/span>/);
  const contact = await html('/contact/');
  assert.doesNotMatch(contact, /license-audit\.md|reference repo|靜態網站骨架|部署文件|MIT repository/);
  const privacy = await html('/privacy/');
  assert.doesNotMatch(privacy, /後續工具會提供清空設計功能/);
});

test('English footer and trust links do not open Chinese trust routes', async () => {
  const pages = ['/en/', '/en/room-layout-planner/', '/en/furniture-fit-checker/', '/en/room-size-layout-templates/', '/en/layout-guides/10x10-bedroom-layout/', '/en/small-space-layout-vault/', ...trustPages.map((page) => `/en/${page}/`)];
  for (const path of pages) {
    const markup = withoutLanguageSwitches(await html(path));
    for (const page of trustPages) assert.ok(!markup.includes(`href="/${page}/"`), `${path} links to Chinese ${page}`);
  }
});
