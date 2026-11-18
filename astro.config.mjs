import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const SITE_URL = 'https://pengejeen.github.io';
const BASE_PATH = '/blog';
const JAVA4SHELL_POST = '2026-11-19-java4shell-cve-2026-114938';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  redirects: {
    '/category/Cloud': `${BASE_PATH}/category/DevOps/Cloud/`,
    '/category/Cloud/GCP': `${BASE_PATH}/category/DevOps/Cloud/`,
    '/category/Cloud/GCP/1.CloudRun': `${BASE_PATH}/category/DevOps/Cloud/1.CloudRun/`,
    '/category/DevOps/보안': `${BASE_PATH}/category/보안/`,
    [`/category/DevOps/보안/${JAVA4SHELL_POST}`]: `${BASE_PATH}/category/보안/취약점_대응/${JAVA4SHELL_POST}/`,
  },
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
