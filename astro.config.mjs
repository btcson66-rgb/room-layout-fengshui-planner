import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// wave2 batch articles are noindexed pending a content-quality rewrite;
// keep them out of the sitemap from the same single source (the CSV index).
const wave2NoindexBlogPaths = new Set(
  readFileSync(new URL('./wave2_article_index.csv', import.meta.url), 'utf8')
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(',')[0].trim())
    .filter(Boolean)
    .map((slug) => `/zh/blog/${slug}/`)
);

const normalizePath = (pathname) => (pathname.endsWith('/') ? pathname : `${pathname}/`);

export default defineConfig({
  output: 'static',
  site: 'https://roomfeng.win',
  prefetch: true,
  integrations: [
    sitemap({
      filter(page) {
        const path = new URL(page).pathname;
        if (wave2NoindexBlogPaths.has(normalizePath(path))) return false;
        return !path.startsWith('/tools/') && path !== '/zh/' && path !== '/404' && path !== '/404/' && path !== '/404.html';
      },
    }),
  ],
});
