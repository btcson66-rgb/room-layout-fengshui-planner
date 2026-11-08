import { siteUrl } from '../data/site';

/** Team byline shared by every public page. Mirrors the author used by /zh/blog/[slug].astro. */
export const TEAM_AUTHOR_NAME = 'Btcson Project 編輯團隊';
export const TEAM_AUTHOR_NAME_EN = 'Btcson Project editorial team';
export const TEAM_AUTHOR_PATH = '/about/#btcson-project-team';

export const teamAuthorSchema = {
  '@type': 'Organization',
  name: TEAM_AUTHOR_NAME,
  url: `${siteUrl}${TEAM_AUTHOR_PATH}`,
};

export interface TechArticleInput {
  path: string;
  headline: string;
  description: string;
  /** Real first-publish date (YYYY-MM-DD). */
  datePublished: string;
  /** Last substantive change (YYYY-MM-DD). */
  dateModified: string;
  lang: 'zh' | 'en';
}

/** TechArticle JSON-LD node (author, datePublished, dateModified) for tool and guide pages. */
export function techArticleSchema(input: TechArticleInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: teamAuthorSchema,
    publisher: { '@type': 'Organization', name: 'RoomFeng', url: `${siteUrl}/` },
    inLanguage: input.lang === 'zh' ? 'zh-TW' : 'en-US',
    mainEntityOfPage: `${siteUrl}${input.path}`,
  };
}
