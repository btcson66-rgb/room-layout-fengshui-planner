import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toPosixPath(path) {
  return path.split(sep).join('/');
}

function normalizeRoute(pathname) {
  return pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
}

function walkFiles(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(path, extension);
    return extname(entry.name) === extension ? [path] : [];
  });
}

function routeForAstroPage(sourceFile, pagesDirectory) {
  let routePath = toPosixPath(relative(pagesDirectory, sourceFile)).replace(/\.astro$/, '');
  if (routePath.split('/').some((segment) => segment.includes('['))) return null;
  if (routePath === '404') return '/404/';
  routePath = routePath.replace(/(^|\/)index$/, '');
  return normalizeRoute(`/${routePath}`.replace(/\/{2,}/g, '/'));
}

function parseFrontmatter(sourceFile) {
  const source = readFileSync(sourceFile, 'utf8');
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`[sitemap-lastmod] Missing frontmatter in ${sourceFile}`);

  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/);
    if (!field) continue;
    values[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return values;
}

function requireDate(value, field, sourceFile) {
  if (!DATE_PATTERN.test(value ?? '')) {
    throw new Error(`[sitemap-lastmod] ${sourceFile} has no valid ${field} date (expected YYYY-MM-DD).`);
  }
  return value;
}

function gitAuthorDate(projectRoot, sourceFile) {
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%aI', '--', toPosixPath(relative(projectRoot, sourceFile))],
      { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (!output) return null;
    const date = output.slice(0, 10);
    return DATE_PATTERN.test(date) ? date : null;
  } catch {
    return null;
  }
}

function mtimeDate(sourceFile) {
  return statSync(sourceFile).mtime.toISOString().slice(0, 10);
}

function newestDate(posts) {
  return posts.reduce((newest, post) => (post.updated > newest ? post.updated : newest), '0000-00-00');
}

export function createSitemapLastmodLookup(projectRoot) {
  const pagesDirectory = join(projectRoot, 'src', 'pages');
  const blogDirectory = join(projectRoot, 'src', 'content', 'blog');
  const routeDates = new Map();
  const routeSources = new Map();
  const fallbackRoutes = [];

  for (const sourceFile of walkFiles(pagesDirectory, '.astro')) {
    const route = routeForAstroPage(sourceFile, pagesDirectory);
    if (!route) continue;
    const committedDate = gitAuthorDate(projectRoot, sourceFile);
    const date = committedDate ?? mtimeDate(sourceFile);
    routeDates.set(route, date);
    routeSources.set(route, sourceFile);
    if (!committedDate) fallbackRoutes.push({ route, sourceFile, date });
  }

  const blogPosts = walkFiles(blogDirectory, '.md').map((sourceFile) => {
    const frontmatter = parseFrontmatter(sourceFile);
    const slug = toPosixPath(relative(blogDirectory, sourceFile)).replace(/\.md$/, '');
    const updated = requireDate(frontmatter.updated ?? frontmatter.date, frontmatter.updated ? 'updated' : 'date', sourceFile);
    const route = normalizeRoute(`/zh/blog/${slug}/`);
    routeDates.set(route, updated);
    routeSources.set(route, sourceFile);
    return {
      sourceFile,
      route,
      updated,
      category: frontmatter.category,
      noindex: frontmatter.noindex === 'true',
    };
  });

  const indexablePosts = blogPosts.filter((post) => !post.noindex);
  if (indexablePosts.length === 0) {
    throw new Error('[sitemap-lastmod] No indexable blog content was found for collection-derived routes.');
  }

  const newestBlogDate = newestDate(indexablePosts);
  for (const route of ['/', '/zh/blog/']) routeDates.set(route, newestBlogDate);

  const postsByCategory = new Map();
  for (const post of indexablePosts) {
    if (!post.category) continue;
    const categoryPosts = postsByCategory.get(post.category) ?? [];
    categoryPosts.push(post);
    postsByCategory.set(post.category, categoryPosts);
  }
  for (const [category, posts] of postsByCategory) {
    const route = normalizeRoute(`/zh/category/${category}/`);
    routeDates.set(route, newestDate(posts));
    routeSources.set(route, join(pagesDirectory, 'zh', 'category', '[category].astro'));
  }

  if (fallbackRoutes.length === 0) {
    console.info('[sitemap-lastmod] mtime fallback routes: none');
  } else {
    console.warn('[sitemap-lastmod] mtime fallback routes:');
    for (const fallback of fallbackRoutes) {
      console.warn(`  ${fallback.route} <- ${toPosixPath(relative(projectRoot, fallback.sourceFile))} (${fallback.date})`);
    }
  }

  return (url) => {
    const route = normalizeRoute(new URL(url).pathname);
    const lastmod = routeDates.get(route);
    if (!lastmod) {
      throw new Error(`[sitemap-lastmod] No content or source-file signal mapped for ${route}`);
    }
    return { lastmod, sourceFile: routeSources.get(route) };
  };
}
