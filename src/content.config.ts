import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
  }),
});

export const collections = { blog };
