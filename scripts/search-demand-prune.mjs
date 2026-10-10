import { demandHeldBlogSlugs } from '../src/data/searchDemandPolicy.mjs';

/**
 * 2026-10-10 搜尋需求閘門允許從 sitemap 移除的 URL：被暫停索引的文章，
 * 以及因文章變少而不再產生的文章索引／分類分頁。其他任何移除都要擋下。
 */
export function isSearchDemandPruneRemoval(url) {
  const pathname = new URL(url).pathname;
  const slug = pathname.match(/^\/zh\/blog\/([^/]+)\/$/)?.[1];
  if (slug && demandHeldBlogSlugs.has(slug)) return true;
  return /^\/zh\/(?:blog|category\/[a-z-]+)\/\d+\/$/.test(pathname);
}
