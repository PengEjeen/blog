import type { APIContext } from 'astro';
import { getSitemapUrls, renderUrlSet } from '../utils/sitemap';

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error('Missing Astro site config for sitemap generation.');
  }

  const urls = await getSitemapUrls(context.site);

  return new Response(renderUrlSet(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
