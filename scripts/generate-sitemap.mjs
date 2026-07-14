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
const xmlOutputPath = path.join(projectRoot, 'public/sitemap.xml');
const textOutputPath = path.join(projectRoot, 'public/sitemap.txt');

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

const normalizeLastModified = (value, filePath) => {
  const unquoted = value.trim().replace(/^['"]|['"]$/g, '');
  const match = unquoted.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match || Number.isNaN(new Date(`${match[1]}T00:00:00Z`).getTime())) {
    throw new Error(`Invalid sitemap date in ${filePath}: ${value}`);
  }
  return match[1];
};

const readLastModified = async (filePath) => {
  const markdown = await readFile(filePath, 'utf8');
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    throw new Error(`Post must define frontmatter with a date: ${filePath}`);
  }

  const fields = new Map();
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const match = line.match(/^(updated|date|created):\s*(.+)$/);
    if (match) fields.set(match[1], match[2]);
  }

  for (const field of ['updated', 'date', 'created']) {
    const value = fields.get(field);
    if (value) return normalizeLastModified(value, filePath);
  }
  throw new Error(`Post must define updated, date, or created: ${filePath}`);
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
        const filePath = path.join(subcategoryDir, fileName);
        posts.push({
          category,
          subcategory,
          slug: stripMarkdownExtension(fileName),
          lastmod: await readLastModified(filePath),
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

const getLatestDate = (posts) => posts.reduce(
  (latest, post) => (post.lastmod > latest ? post.lastmod : latest),
  '',
);

const collectSitemapEntries = async () => {
  const posts = await collectPosts();
  const categories = getUniqueValues(posts.map((post) => post.category));
  const subcategoryKeys = getUniqueValues(
    posts.map((post) => `${post.category}\0${post.subcategory}`),
  );
  const entries = [{ url: buildUrl(), lastmod: getLatestDate(posts) }];

  for (const category of categories) {
    const categoryPosts = posts.filter((post) => post.category === category);
    entries.push({
      url: buildUrl('category', category),
      lastmod: getLatestDate(categoryPosts),
    });
  }

  if (categories.includes('AI') || categories.includes('ML')) {
    const mlaiPosts = posts.filter((post) => ['AI', 'ML'].includes(post.category));
    entries.push({ url: buildUrl('category', 'MLAI'), lastmod: getLatestDate(mlaiPosts) });
  }

  for (const key of subcategoryKeys) {
    const [category, subcategory] = key.split('\0');
    const subcategoryPosts = posts.filter(
      (post) => post.category === category && post.subcategory === subcategory,
    );
    entries.push({
      url: buildUrl('category', category, subcategory),
      lastmod: getLatestDate(subcategoryPosts),
    });
  }

  for (const post of posts) {
    entries.push({
      url: buildUrl('category', post.category, post.subcategory, post.slug),
      lastmod: post.lastmod,
    });
  }

  return entries;
};

const createSitemapXml = (entries) => {
  const urlEntries = entries
    .map(({ url, lastmod }) =>
      `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${urlEntries}\n</urlset>\n`;
};

const createTextSitemap = (urls) => `${urls.join('\n')}\n`;

const decodeXmlEntities = (value) =>
  value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

const validateSitemapXml = (xml, expectedEntries) => {
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

  const entryMatches = [
    ...xml.matchAll(
      /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g,
    ),
  ];
  if (entryMatches.length !== expectedEntries.length) {
    throw new Error(`Sitemap entry count mismatch: ${entryMatches.length}`);
  }

  for (const [, escapedLoc, lastmod] of entryMatches) {
    const loc = decodeXmlEntities(escapedLoc);
    if (!loc.startsWith(`${SITE_ORIGIN}${BASE_PATH}/`)) {
      throw new Error(`Invalid sitemap URL prefix: ${loc}`);
    }
    if (/[^\x00-\x7F]/.test(loc)) {
      throw new Error(`Sitemap URL must be percent-encoded: ${loc}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
      throw new Error(`Invalid sitemap lastmod: ${lastmod}`);
    }
  }
};

const validateTextSitemap = (text, expectedUrls) => {
  const urls = text.trim().split('\n');
  if (urls.length !== expectedUrls.length) {
    throw new Error(`Text sitemap URL count mismatch: ${urls.length}`);
  }

  for (const url of urls) {
    if (!url.startsWith(`${SITE_ORIGIN}${BASE_PATH}/`)) {
      throw new Error(`Invalid text sitemap URL prefix: ${url}`);
    }
    if (/\s/.test(url) || /[^\x00-\x7F]/.test(url)) {
      throw new Error(`Text sitemap URL must be ASCII and contain no spaces: ${url}`);
    }
  }
};

const main = async () => {
  const entries = await collectSitemapEntries();
  const urls = entries.map((entry) => entry.url);
  const xml = createSitemapXml(entries);
  const text = createTextSitemap(urls);
  validateSitemapXml(xml, entries);
  validateTextSitemap(text, urls);

  await mkdir(path.dirname(xmlOutputPath), { recursive: true });
  await Promise.all([
    writeFile(xmlOutputPath, xml, 'utf8'),
    writeFile(textOutputPath, text, 'utf8'),
  ]);

  const [writtenXml, writtenText] = await Promise.all([
    readFile(xmlOutputPath, 'utf8'),
    readFile(textOutputPath, 'utf8'),
  ]);
  validateSitemapXml(writtenXml, entries);
  validateTextSitemap(writtenText, urls);

  console.log(`Generated XML and text sitemaps with ${urls.length} URLs.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
