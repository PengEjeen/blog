import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  site: 'https://pengejeen.github.io',
  base: '/blog',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  image: {
    service: passthroughImageService(),
  },
  integrations: [react(), mdx(), sitemap()],
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
