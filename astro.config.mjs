import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { reviewReadyBlogSlugs, reviewReadyCategorySlugs } from './src/data/contentQuality.mjs';

const normalizePath = (pathname) => (pathname.endsWith('/') ? pathname : `${pathname}/`);

export default defineConfig({
  output: 'static',
  site: 'https://roomfeng.win',
  prefetch: true,
  integrations: [
    sitemap({
      filter(page) {
        const path = new URL(page).pathname;
        const normalizedPath = normalizePath(path);
        const blogMatch = normalizedPath.match(/^\/zh\/blog\/([^/]+)\/$/);
        if (blogMatch && !reviewReadyBlogSlugs.has(blogMatch[1])) return false;
        const categoryMatch = normalizedPath.match(/^\/zh\/category\/([^/]+)\/$/);
        if (categoryMatch && !reviewReadyCategorySlugs.has(categoryMatch[1])) return false;
        return !path.startsWith('/tools/') && path !== '/zh/' && path !== '/404' && path !== '/404/' && path !== '/404.html';
      },
    }),
  ],
});
