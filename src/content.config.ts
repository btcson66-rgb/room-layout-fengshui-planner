import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const wallSchema = z.enum(['top', 'bottom', 'left', 'right']);
const cm = z.number().min(0).max(1500);

// 文章內的平面示意圖（由 ArticlePlan / MeasuredPlan 依比例繪製）。座標單位為公分，
// 原點在房間左上角；x 向右、y 向下。所有數字必須來自文章自己的示範例，
// scripts/content-quality-audit.mjs 會檢查家具在房內、且尺寸與內文一致。
const planSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** 圖放在「文字完全相符」的 H2 標題之後；找不到該 H2 時 audit 失敗。 */
  after: z.string().min(2),
  roomWidthCm: z.number().min(100).max(1200),
  roomLengthCm: z.number().min(100).max(1200),
  caption: z.string().min(8),
  ariaLabel: z.string().min(12),
  furniture: z
    .array(
      z.object({
        x: cm,
        y: cm,
        width: z.number().positive().max(1500),
        depth: z.number().positive().max(1500),
        label: z.string().min(1),
        className: z.enum(['bed', 'desk', 'storage']).optional(),
        labelPlacement: z.enum(['inside', 'above', 'below']).optional(),
        hideSize: z.boolean().optional(),
      }),
    )
    .default([]),
  zones: z
    .array(
      z.object({
        x: cm,
        y: cm,
        width: z.number().positive(),
        depth: z.number().positive(),
        label: z.string(),
        kind: z.enum(['area', 'avoid']).optional(),
      }),
    )
    .default([]),
  openings: z
    .array(
      z.object({
        kind: z.enum(['door', 'window', 'opening']),
        wall: wallSchema,
        offset: cm,
        width: z.number().positive(),
        swing: z.enum(['in', 'out']).optional(),
        hinge: z.enum(['start', 'end']).optional(),
        label: z.string().optional(),
      }),
    )
    .default([]),
  wallItems: z
    .array(
      z.object({
        wall: wallSchema,
        offset: cm,
        width: z.number().positive(),
        label: z.string(),
        labelDx: z.number().optional(),
        labelDy: z.number().optional(),
      }),
    )
    .default([]),
  sightLines: z
    .array(
      z.object({
        points: z.array(z.tuple([cm, cm])).min(2),
        label: z.string().optional(),
        labelX: z.number().optional(),
        labelY: z.number().optional(),
      }),
    )
    .default([]),
  route: z.string().optional(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    relatedTools: z.array(z.string()).default([]),
    relatedPosts: z.array(z.string()).default([]),
    noindex: z.boolean().optional().default(false),
    howToName: z.string().optional(),
    howToSteps: z.array(z.string()).default([]),
    howToTotalTime: z.string().optional(),
    plans: z.array(planSchema).default([]),
  }),
});

export const collections = { blog };
