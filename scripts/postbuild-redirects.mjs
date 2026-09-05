/**
 * 把 src/data/redirects.mjs 寫成 Cloudflare Pages 的 dist/_redirects。
 *
 * 在 postbuild 產生而不是放進 public/，是為了讓「轉址表」只有一份來源：
 * 測試、內容稽核與這個產出器都讀同一個 mjs，不會出現 public/_redirects
 * 與程式碼各說各話的情況。
 *
 * 同時在這裡做最後一道防線：Cloudflare Pages 對存在的靜態檔案優先回傳檔案，
 * 所以任何 `from` 只要 build 出了 HTML，轉址就不會生效——那是靜默失效，
 * 必須讓 build 失敗而不是上線後才發現。
 */
import { access, readFile, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redirects, renderRedirectsFile } from '../src/data/redirects.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = join(projectRoot, 'dist');
const outputPath = join(distDirectory, '_redirects');

const exists = async (path) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const outputPathForRoute = (route) => join(distDirectory, ...route.split('/').filter(Boolean), 'index.html');

const seen = new Set();
for (const entry of redirects) {
  if (!entry.from.startsWith('/') || !entry.from.endsWith('/')) {
    throw new Error(`[postbuild-redirects] redirect source must be an absolute path ending in "/": ${entry.from}`);
  }
  if (!entry.to.startsWith('/')) {
    throw new Error(`[postbuild-redirects] redirect target must be an absolute path: ${entry.to}`);
  }
  if (seen.has(entry.from)) {
    throw new Error(`[postbuild-redirects] duplicate redirect source: ${entry.from}`);
  }
  seen.add(entry.from);

  if (entry.from !== '/' && (await exists(outputPathForRoute(entry.from)))) {
    throw new Error(
      `[postbuild-redirects] ${entry.from} still builds a page; Cloudflare Pages serves the file and the 301 never fires. Delete the source page first.`,
    );
  }
  if (entry.to !== '/' && !(await exists(outputPathForRoute(entry.to)))) {
    throw new Error(`[postbuild-redirects] redirect target does not exist in dist: ${entry.to}`);
  }
}

const content = renderRedirectsFile();
const current = await exists(outputPath) ? await readFile(outputPath, 'utf8') : null;
if (current === content) {
  console.info(`[postbuild-redirects] unchanged; ${redirects.length} rule(s)`);
} else {
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, content, 'utf8');
  await rename(temporaryPath, outputPath);
  console.info(`[postbuild-redirects] written; ${redirects.length} rule(s)`);
}
