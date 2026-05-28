import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://pengejeen.github.io';
const BASE_PATH = '/blog';
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const postsRoot = path.join(projectRoot, 'src/content/posts');
const outputPath = path.join(projectRoot, 'public/sitemap.xml');

const xmlEscapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

const stripMarkdownExtension = (fileName) => fileName.replace(/\.(md|mdx)$/i, '');

const escapeXml = (value) => value.replace(/[&<>"']/g, (char) => xmlEscapeMap[char]);

const localeSort = (a, b) => a.localeCompare(b, 'ko');

const isMarkdownFile = (fileName) => MARKDOWN_EXTENSIONS.has(path.extname(fileName).toLowerCase());

const readDirectories = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(localeSort);
};

const readMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
    .map((entry) => entry.name)
    .sort(localeSort);
};

const buildUrl = (...segments) => {
  const baseSegments = BASE_PATH.split('/').filter(Boolean);
  const encodedSegments = [
    ...baseSegments,
    ...segments.map((segment) => encodeURIComponent(segment)),
  ];
  return `${SITE_ORIGIN}/${encodedSegments.join('/')}/`;
};

const collectPosts = async () => {
  const posts = [];
  const categories = await readDirectories(postsRoot);

  for (const category of categories) {
    const categoryDir = path.join(postsRoot, category);
    const subcategories = await readDirectories(categoryDir);

    for (const subcategory of subcategories) {
      const subcategoryDir = path.join(categoryDir, subcategory);
      const markdownFiles = await readMarkdownFiles(subcategoryDir);

      for (const fileName of markdownFiles) {
        posts.push({
          category,
          subcategory,
          slug: stripMarkdownExtension(fileName),
        });
      }
    }
  }

  return posts.sort((a, b) =>
    `${a.category}/${a.subcategory}/${a.slug}`.localeCompare(
      `${b.category}/${b.subcategory}/${b.slug}`,
      'ko',
    ),
  );
};

const getUniqueValues = (values) => [...new Set(values)].sort(localeSort);

const collectUrls = async () => {
  const posts = await collectPosts();
  const categories = getUniqueValues(posts.map((post) => post.category));
  const subcategoryKeys = getUniqueValues(
    posts.map((post) => `${post.category}\0${post.subcategory}`),
  );
  const urls = [buildUrl()];

  for (const category of categories) {
    urls.push(buildUrl('category', category));
  }

  if (categories.includes('AI') || categories.includes('ML')) {
    urls.push(buildUrl('category', 'MLAI'));
  }

  for (const key of subcategoryKeys) {
    const [category, subcategory] = key.split('\0');
    urls.push(buildUrl('category', category, subcategory));
  }

  for (const post of posts) {
    urls.push(buildUrl('category', post.category, post.subcategory, post.slug));
  }

  return [...new Set(urls)];
};

const createSitemapXml = (urls) => {
  const urlEntries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${urlEntries}\n</urlset>\n`;
};

const decodeXmlEntities = (value) =>
  value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

const validateSitemapXml = (xml) => {
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('sitemap.xml must start with an XML declaration.');
  }
  if (!xml.includes(`<urlset xmlns="${SITEMAP_NAMESPACE}">`)) {
    throw new Error('sitemap.xml must contain a urlset root element.');
  }
  if (/<\/?sitemapindex\b/i.test(xml)) {
    throw new Error('sitemap.xml must not use a sitemapindex root.');
  }
  if (/<!DOCTYPE html|<\/?html\b/i.test(xml)) {
    throw new Error('sitemap.xml must not contain an HTML document.');
  }

  const locMatches = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<\/url>/g)];
  if (locMatches.length === 0) {
    throw new Error('sitemap.xml must contain at least one url/loc entry.');
  }

  for (const [, escapedLoc] of locMatches) {
    const loc = decodeXmlEntities(escapedLoc);
    if (!loc.startsWith(`${SITE_ORIGIN}${BASE_PATH}/`)) {
      throw new Error(`Invalid sitemap URL prefix: ${loc}`);
    }
    if (/[^\x00-\x7F]/.test(loc)) {
      throw new Error(`Sitemap URL must be percent-encoded: ${loc}`);
    }
  }
};

const main = async () => {
  const urls = await collectUrls();
  const xml = createSitemapXml(urls);
  validateSitemapXml(xml);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml, 'utf8');

  const writtenXml = await readFile(outputPath, 'utf8');
  validateSitemapXml(writtenXml);

  console.log(`Generated public/sitemap.xml with ${urls.length} URLs.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
