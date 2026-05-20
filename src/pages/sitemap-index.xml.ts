import type { APIContext } from 'astro';
import { getSitemapUrls, renderSitemapIndex } from '../utils/sitemap';

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error('Missing Astro site config for sitemap generation.');
  }

  const urls = await getSitemapUrls(context.site);
  const lastmod = urls.reduce<Date | undefined>((latest, url) => {
    if (!latest) return url.lastmod;
    if (!url.lastmod) return latest;
    return url.lastmod > latest ? url.lastmod : latest;
  }, undefined);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') || '';

  return new Response(
    renderSitemapIndex([
      {
        loc: new URL(`${baseUrl}/sitemap-0.xml`, context.site).toString(),
        lastmod,
      },
    ]),
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
}
