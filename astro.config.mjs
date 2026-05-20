import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const SITE_URL = 'https://pengejeen.github.io';
const BASE_PATH = '/blog';

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
