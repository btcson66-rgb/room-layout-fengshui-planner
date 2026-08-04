import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { reviewReadyBlogSlugs, reviewReadyCategorySlugs } from './src/data/contentQuality.mjs';
import { createSitemapLastmodLookup } from './scripts/sitemap-lastmod.mjs';

const normalizePath = (pathname) => (pathname.endsWith('/') ? pathname : `${pathname}/`);
const lastmodForUrl = createSitemapLastmodLookup(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  output: 'static',
  site: 'https://roomfeng.win',
  prefetch: true,
  integrations: [
    sitemap({
      filter(page) {
        const path = new URL(page).pathname;
        const normalizedPath = normalizePath(path);
        if (normalizedPath === '/zh/bed-facing-door-feng-shui/') return false;
        const blogMatch = normalizedPath.match(/^\/zh\/blog\/([^/]+)\/$/);
        if (blogMatch && !reviewReadyBlogSlugs.has(blogMatch[1])) return false;
        const categoryMatch = normalizedPath.match(/^\/zh\/category\/([^/]+)\/$/);
        if (categoryMatch && !reviewReadyCategorySlugs.has(categoryMatch[1])) return false;
        return !path.startsWith('/tools/') && path !== '/zh/' && path !== '/404' && path !== '/404/' && path !== '/404.html';
      },
      serialize(item) {
        return { ...item, lastmod: lastmodForUrl(item.url).lastmod };
      },
    }),
  ],
});
