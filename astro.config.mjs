import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE_URL = 'https://pengejeen.github.io';
const BASE_PATH = '/blog';
const POSTS_DIR = 'src/content/posts';

const stripMarkdownExt = (fileName) => fileName.replace(/\.mdx?$/, '');

const toSitemapKey = (url) => {
  const pathname = typeof url === 'string' ? new URL(url, SITE_URL).pathname : url.pathname;
  return decodeURIComponent(pathname.endsWith('/') ? pathname : `${pathname}/`);
};

const maxDate = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
};

const getFrontmatterDate = (source) => {
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatter) return undefined;
  const match = frontmatter[1].match(/^(updated|date|created):\s*['"]?([^'"\n]+)['"]?/m);
  if (!match) return undefined;
  const date = new Date(match[2].trim());
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const walkMarkdownFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(entryPath);
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) return [entryPath];
    return [];
  });

const createSitemapLastmodMap = () => {
  const lastmodByPath = new Map();

  for (const filePath of walkMarkdownFiles(POSTS_DIR)) {
    const date = getFrontmatterDate(readFileSync(filePath, 'utf8'));
    if (!date) continue;

    const parts = relative(POSTS_DIR, filePath).split('/');
    if (parts.length < 3) continue;

    const cat = parts[0];
    const sub = parts[1];
    const slug = stripMarkdownExt(parts.at(-1));
    const homePath = `${BASE_PATH}/`;
    const categoryPath = `${BASE_PATH}/category/${cat}/`;
    const subcategoryPath = `${BASE_PATH}/category/${cat}/${sub}/`;
    const postPath = `${BASE_PATH}/category/${cat}/${sub}/${slug}/`;

    lastmodByPath.set(homePath, maxDate(lastmodByPath.get(homePath), date));
    lastmodByPath.set(categoryPath, maxDate(lastmodByPath.get(categoryPath), date));
    lastmodByPath.set(subcategoryPath, maxDate(lastmodByPath.get(subcategoryPath), date));
    lastmodByPath.set(postPath, maxDate(lastmodByPath.get(postPath), date));

    if (cat === 'AI' || cat === 'ML') {
      const mlaiPath = `${BASE_PATH}/category/MLAI/`;
      lastmodByPath.set(mlaiPath, maxDate(lastmodByPath.get(mlaiPath), date));
    }
  }

  return lastmodByPath;
};

const sitemapLastmodByPath = createSitemapLastmodMap();

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      serialize(item) {
        const lastmod = sitemapLastmodByPath.get(toSitemapKey(item.url));
        return {
          ...item,
          ...(lastmod ? { lastmod } : {}),
        };
      },
    }),
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: false,
    },
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          properties: { className: ['markdown-anchor'], 'aria-label': '섹션 링크' },
          content: { type: 'text', value: '#' },
        },
      ],
    ],
  },
  vite: {
    ssr: {
      noExternal: ['lucide-react'],
    },
  },
});
