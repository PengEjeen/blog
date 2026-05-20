import { buildCatHref, buildPostHref, buildSubHref, getPostsIndex, type PostMeta } from './posts';

export interface SitemapUrl {
  loc: string;
  lastmod?: Date;
}

const maxDate = (a?: Date, b?: Date) => {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
};

const parsePostDate = (post: PostMeta) => {
  const date = new Date(post.dateRaw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toAbsoluteUrl = (contextSite: URL, path: string) => {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') || '';
  return new URL(`${baseUrl}${path}`, contextSite).toString();
};

export const formatSitemapDate = (date?: Date) => date?.toISOString();

export const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const getSitemapUrls = async (contextSite: URL): Promise<SitemapUrl[]> => {
  const { categories, posts } = await getPostsIndex();
  const urls: SitemapUrl[] = [];
  const categoryLastmod = new Map<string, Date>();
  const subcategoryLastmod = new Map<string, Date>();
  let siteLastmod: Date | undefined;

  for (const post of posts) {
    const postDate = parsePostDate(post);
    siteLastmod = maxDate(siteLastmod, postDate);
    const categoryDate = maxDate(categoryLastmod.get(post.cat), postDate);
    const subcategoryKey = `${post.cat}/${post.sub}`;
    const subcategoryDate = maxDate(subcategoryLastmod.get(subcategoryKey), postDate);

    if (categoryDate) categoryLastmod.set(post.cat, categoryDate);
    if (subcategoryDate) subcategoryLastmod.set(subcategoryKey, subcategoryDate);

    if (post.cat === 'AI' || post.cat === 'ML') {
      const mlaiDate = maxDate(categoryLastmod.get('MLAI'), postDate);
      if (mlaiDate) categoryLastmod.set('MLAI', mlaiDate);
    }
  }

  urls.push({ loc: toAbsoluteUrl(contextSite, '/'), lastmod: siteLastmod });

  for (const category of categories) {
    urls.push({
      loc: toAbsoluteUrl(contextSite, buildCatHref(category.slug)),
      lastmod: categoryLastmod.get(category.slug),
    });

    for (const subcategory of category.subs) {
      urls.push({
        loc: toAbsoluteUrl(contextSite, buildSubHref(category.slug, subcategory.slug)),
        lastmod: subcategoryLastmod.get(`${category.slug}/${subcategory.slug}`),
      });
    }
  }

  if (categoryLastmod.has('MLAI')) {
    urls.push({
      loc: toAbsoluteUrl(contextSite, buildCatHref('MLAI')),
      lastmod: categoryLastmod.get('MLAI'),
    });
  }

  for (const post of posts) {
    urls.push({
      loc: toAbsoluteUrl(contextSite, buildPostHref(post)),
      lastmod: parsePostDate(post),
    });
  }

  return urls;
};

export const renderUrlSet = (urls: SitemapUrl[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    const lastmod = formatSitemapDate(url.lastmod);
    return `  <url>
    <loc>${escapeXml(url.loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
  })
  .join('\n')}
</urlset>
`;

export const renderSitemapIndex = (sitemaps: SitemapUrl[]) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map((sitemap) => {
    const lastmod = formatSitemapDate(sitemap.lastmod);
    return `  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </sitemap>`;
  })
  .join('\n')}
</sitemapindex>
`;
