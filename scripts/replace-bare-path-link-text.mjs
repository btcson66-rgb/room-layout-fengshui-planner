import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const zhPagesDir = path.join(root, 'src', 'pages', 'zh');
const blogDir = path.join(root, 'src', 'content', 'blog');

const conciseTitles = new Map([
  ['/zh/room-layout-planner/', '房間家具配置工具'],
  ['/zh/furniture-fit-checker/', '家具尺寸適配檢查'],
  ['/zh/feng-shui-bedroom-checker/', '臥室風水格局檢查'],
  ['/zh/moving-furniture-size-check/', '搬家家具尺寸檢查'],
  ['/zh/small-bedroom-layout/', '小房間配置指南'],
  ['/zh/bed-desk-wardrobe-layout/', '床桌衣櫃配置'],
  ['/zh/studio-apartment-layout/', '套房格局配置'],
  ['/zh/rental-room-layout/', '租屋房間配置'],
  ['/zh/blog/', '房間規劃文章'],
]);

function normalizeRoute(route) {
  if (!route.startsWith('/')) return route;
  const withoutHash = route.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery.endsWith('/') ? withoutQuery : `${withoutQuery}/`;
}

function conciseFromTitle(title) {
  return title
    .replace(/｜RoomFeng$/, '')
    .split(/[｜：|]/)[0]
    .trim();
}

function frontmatterTitle(markdown) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return null;
  const title = frontmatter[1].match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return title?.[1]?.trim() ?? null;
}

async function collectFiles(dir, extension) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [fullPath] : [];
  }));
  return files.flat();
}

async function buildPageTitleMap() {
  const titles = new Map(conciseTitles);
  const astroFiles = await collectFiles(zhPagesDir, '.astro');

  for (const file of astroFiles) {
    if (file.includes(`${path.sep}[`)) continue;
    const source = await readFile(file, 'utf8');
    const match = source.match(/const\s+title\s*=\s*['"`]([^'"`]+)['"`]/);
    if (!match) continue;

    const relative = path.relative(zhPagesDir, file).replace(/\\/g, '/');
    const withoutExtension = relative.replace(/\.astro$/, '');
    const route = withoutExtension === 'index'
      ? '/zh/'
      : withoutExtension.endsWith('/index')
        ? `/zh/${withoutExtension.replace(/\/index$/, '/')}`
        : `/zh/${withoutExtension}/`;
    titles.set(normalizeRoute(route), titles.get(normalizeRoute(route)) ?? conciseFromTitle(match[1]));
  }

  return titles;
}

async function buildBlogTitleMap() {
  const titles = new Map();
  const markdownFiles = await collectFiles(blogDir, '.md');

  for (const file of markdownFiles) {
    const source = await readFile(file, 'utf8');
    const title = frontmatterTitle(source);
    if (!title) continue;
    const slug = path.basename(file, '.md');
    titles.set(`/zh/blog/${slug}/`, title);
  }

  return titles;
}

function replacementFor(text, href, pageTitles, blogTitles) {
  if (!text.startsWith('/')) return null;
  const route = normalizeRoute(text);
  if (blogTitles.has(route)) return blogTitles.get(route);
  if (pageTitles.has(route)) return pageTitles.get(route);

  const hrefRoute = normalizeRoute(href);
  if (blogTitles.has(hrefRoute)) return blogTitles.get(hrefRoute);
  if (pageTitles.has(hrefRoute)) return pageTitles.get(hrefRoute);

  return null;
}

const pageTitles = await buildPageTitleMap();
const blogTitles = await buildBlogTitleMap();
const markdownFiles = await collectFiles(blogDir, '.md');
let fileCount = 0;
let linkCount = 0;

for (const file of markdownFiles) {
  const source = await readFile(file, 'utf8');
  let changedLinks = 0;
  const updated = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
    const replacement = replacementFor(text, href, pageTitles, blogTitles);
    if (!replacement || replacement === text) return match;
    changedLinks += 1;
    return `[${replacement}](${href})`;
  });

  if (updated !== source) {
    await writeFile(file, updated, 'utf8');
    fileCount += 1;
    linkCount += changedLinks;
  }
}

console.log(`Updated ${linkCount} bare-path link text values in ${fileCount} markdown files.`);
