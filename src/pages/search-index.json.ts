import type { APIRoute } from 'astro';
import { createSearchIndex, getPostsIndex } from '../utils/posts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') || '';
  const { posts } = await getPostsIndex();
  const searchIndex = createSearchIndex(posts, baseUrl);

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};
