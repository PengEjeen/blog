import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPostsIndex, buildPostHref } from '../utils/posts';

export async function GET(context: APIContext) {
  const { posts } = await getPostsIndex();
  return rss({
    title: "PenGejeen's Blog",
    description: '개발 공부 중 배운 것들을 정리하고 경험을 아카이빙하는 개인 블로그입니다.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.title,
      pubDate: p.dateRaw ? new Date(p.dateRaw) : new Date(0),
      description: p.excerpt,
      link: buildPostHref(p),
      categories: [p.cat, p.sub],
    })),
    customData: '<language>ko-kr</language>',
  });
}
