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

        // 索引與分類的分頁網址（/zh/blog/2/、/zh/category/feng-shui/3/）要先認出來，
        // 否則下面的 blogMatch 會把 "2" 當成文章 slug、查不到而整頁被排除。
        const blogPageMatch = normalizedPath.match(/^\/zh\/blog\/(\d+)\/$/);
        if (blogPageMatch) return true;
        const categoryPageMatch = normalizedPath.match(/^\/zh\/category\/([^/]+)\/(\d+)\/$/);
        if (categoryPageMatch) return reviewReadyCategorySlugs.has(categoryPageMatch[1]);

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
