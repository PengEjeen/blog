#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'content', 'posts');
const PUBLIC_DIR = join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || 'https://pengejeen.github.io/blog').replace(/\/$/, '');
const SITE_TITLE = "PenGejeen's Blog";
const SITE_DESC = '개발 공부 중 배운 것들을 정리하고 경험을 아카이빙하는 개인 블로그.';

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
};

const parseFrontmatter = (raw) => {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw.trim() };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw.trim() };
  const fm = raw.slice(4, end);
  const body = raw.slice(end + 5).trim();
  const data = {};
  fm.split('\n').forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  });
  return { data, body };
};

const escapeXml = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const enc = (s) => encodeURIComponent(s);

const collect = () => {
  const files = walk(POSTS_DIR);
  return files.map((file) => {
    const raw = readFileSync(file, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const rel = relative(POSTS_DIR, file);
    const parts = rel.split(/[/\\]/);
    if (parts.length < 3) return null;
    const [cat, sub, name] = [parts[0], parts[1], parts[parts.length - 1]];
    const slug = name.replace(/\.md$/, '');
    const title = data.title || slug.replace(/_/g, ' ');
    const dateRaw = data.date || data.created || data.updated || '';
    const date = dateRaw ? new Date(dateRaw) : statSync(file).mtime;
    const url = `${SITE_URL}/category/${enc(cat)}/${enc(sub)}/${enc(slug)}`;
    const description = body.slice(0, 280).replace(/\s+/g, ' ');
    return { title, url, date, description, cat, sub };
  }).filter(Boolean).sort((a, b) => b.date - a.date);
};

const writeRss = (posts) => {
  const items = posts.slice(0, 30).map((p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(p.url)}</link>
      <guid isPermaLink="true">${escapeXml(p.url)}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <category>${escapeXml(p.cat)}</category>
      <description>${escapeXml(p.description)}</description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(SITE_URL)}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>
`;
  writeFileSync(join(PUBLIC_DIR, 'rss.xml'), xml);
};

const writeSitemap = (posts) => {
  const cats = new Set();
  const subs = new Set();
  posts.forEach((p) => {
    cats.add(`${SITE_URL}/category/${enc(p.cat)}`);
    subs.add(`${SITE_URL}/category/${enc(p.cat)}/${enc(p.sub)}`);
  });
  const urls = [
    SITE_URL,
    ...cats,
    ...subs,
    ...posts.map((p) => p.url),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const body = urls.map((u) => `
  <url>
    <loc>${escapeXml(u)}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>
`;
  writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), xml);
};

const writeRobots = () => {
  const txt = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync(join(PUBLIC_DIR, 'robots.txt'), txt);
};

mkdirSync(PUBLIC_DIR, { recursive: true });
const posts = collect();
writeRss(posts);
writeSitemap(posts);
writeRobots();
console.log(`[feeds] ${posts.length} posts → public/rss.xml, public/sitemap.xml, public/robots.txt`);
