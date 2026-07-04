import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

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
  integrations: [
    sitemap({
      filter(page) {
        const { pathname } = new URL(page);
        return !wave2NoindexBlogPaths.has(normalizePath(pathname));
      },
    }),
  ],
});
