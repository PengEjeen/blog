import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');

const homeHtml = await readFile(path.join(distRoot, 'index.html'), 'utf8');
assert.equal(
  homeHtml.includes('searchHay'),
  false,
  'The homepage must not serialize post search content.',
);

const rawIndex = await readFile(path.join(distRoot, 'search-index.json'), 'utf8');
const searchIndex = JSON.parse(rawIndex);
assert.ok(Array.isArray(searchIndex) && searchIndex.length > 0, 'Search index must contain posts.');

for (const entry of searchIndex) {
  assert.equal(typeof entry.title, 'string');
  assert.equal(typeof entry.searchHay, 'string');
  assert.match(entry.href, /^\/blog\/category\//);
}

const textSitemap = await readFile(path.join(distRoot, 'sitemap.txt'), 'utf8');
const sitemapUrls = textSitemap.trim().split('\n');
assert.ok(sitemapUrls.length > 0, 'Text sitemap must contain URLs.');
for (const url of sitemapUrls) {
  assert.match(url, /^https:\/\/pengejeen\.github\.io\/blog\//);
  assert.equal(/\s/.test(url), false, `Text sitemap URL contains whitespace: ${url}`);
}

console.log(
  `SEO build check passed with ${searchIndex.length} search entries and ${sitemapUrls.length} sitemap URLs.`,
);
