/**
 * 把 Markdown 內文裡指向 301 來源的連結，在 build 時改寫成轉址目標。
 *
 * 為什麼在 build 時改而不是改 .md：2026-10-19 需求閘門合併刪了 904 篇文章，
 * 保留文章的內文共有 210 個連結指向它們。直接改 145 個 .md 會讓每天同步 main 的
 * 14 天內容行事曆 PR 全部衝突。改在 Markdown AST 階段處理，來源檔不動、輸出的 HTML
 * 仍然直接連到最終頁面（不經過 301 一跳）。
 *
 * - 連結路徑是 redirects.mjs 的 `from` → 改成 `to`（舊文章的 #錨點在新頁沒有意義，一併去掉）。
 * - 改寫後等於本篇自己的網址 → 拆掉連結、只留文字，避免文章連回自己。
 *
 * Astro 7 預設的 Markdown 處理器是 Sätteri，外掛是 mdast visitor（跟 remark 外掛同一種
 * AST），在 astro.config.mjs 以 `satteri({ mdastPlugins: [...] })` 註冊。
 * content-quality-audit.mjs 的 `no-href-to-redirect-source` 檢查會擋下任何漏網之魚。
 */
import { fileURLToPath } from 'node:url';
import { redirects } from '../data/redirects.mjs';

const SITE_ORIGIN = 'https://roomfeng.win';
const defaultRedirectMap = new Map(redirects.map((entry) => [entry.from, entry.to]));

/** 回傳改寫後的網址；不是轉址來源時回傳 null。 */
export function resolveRedirectedHref(href, map = defaultRedirectMap) {
  if (typeof href !== 'string') return null;
  let pathname = href;
  if (pathname.startsWith(SITE_ORIGIN)) pathname = pathname.slice(SITE_ORIGIN.length) || '/';
  if (!pathname.startsWith('/')) return null;
  pathname = pathname.split(/[?#]/)[0];
  if (!pathname.endsWith('/')) pathname = `${pathname}/`;
  return map.get(pathname) ?? null;
}

/** src/content/blog/<slug>.md → /zh/blog/<slug>/；其他檔案回傳 null。 */
export function selfPathForFile(fileURL) {
  if (!fileURL) return null;
  const filePath = fileURLToPath(fileURL).replace(/\\/g, '/');
  const slug = filePath.match(/\/src\/content\/blog\/([^/]+)\.md$/)?.[1];
  return slug ? `/zh/blog/${slug}/` : null;
}

/** Sätteri mdast 外掛工廠；`map` 只給測試注入用。 */
export function redirectLinksPlugin(map = defaultRedirectMap) {
  return (factoryContext) => {
    const selfPath = selfPathForFile(factoryContext.fileURL);
    return {
      name: 'roomfeng-redirect-links',
      link(node, ctx) {
        const target = resolveRedirectedHref(node.url, map);
        if (!target) return;
        if (target === selfPath) ctx.replaceNode(node, [...node.children]);
        else ctx.setProperty(node, 'url', target);
      },
      definition(node, ctx) {
        const target = resolveRedirectedHref(node.url, map);
        if (target) ctx.setProperty(node, 'url', target);
      },
      html(node, ctx) {
        const value = node.value.replace(/href="([^"]+)"/g, (whole, href) => {
          const target = resolveRedirectedHref(href, map);
          return target ? `href="${target}"` : whole;
        });
        if (value !== node.value) ctx.setProperty(node, 'value', value);
      },
    };
  };
}
