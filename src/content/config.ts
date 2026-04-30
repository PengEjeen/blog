import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string().optional(),
      date: z.union([z.string(), z.date()]).optional(),
      created: z.union([z.string(), z.date()]).optional(),
      updated: z.union([z.string(), z.date()]).optional(),
    })
    .passthrough(),
});

export const collections = { posts };
