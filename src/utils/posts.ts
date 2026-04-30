import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

export interface PostMeta {
  entry: PostEntry;
  cat: string;
  sub: string;
  fileName: string;
  slug: string;
  title: string;
  dateRaw: string;
  dateLabel: string;
  excerpt: string;
  searchHay: string;
}

export interface CategoryMeta {
  slug: string;
  count: number;
  subs: { slug: string; count: number }[];
}

export interface PostsIndex {
  categories: CategoryMeta[];
  posts: PostMeta[];
  total: number;
}

export const humanize = (value = '') => value.replace(/_/g, ' ');

const stripExt = (name = '') => name.replace(/\.md$/, '').replace(/\.mdx$/, '');

export const formatPostDate = (date?: string | Date) => {
  if (!date) return '날짜 미정';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString('ko-KR');
};

const getPathParts = (entry: PostEntry) => {
  const parts = entry.id.split('/');
  if (parts.length < 3) return null;
  const fileName = parts[parts.length - 1];
  return { cat: parts[0], sub: parts[1], fileName };
};

const buildMeta = (entry: PostEntry): PostMeta | null => {
  const parts = getPathParts(entry);
  if (!parts) return null;
  const slug = stripExt(parts.fileName);
  const data = entry.data as Record<string, unknown>;
  const dateRaw = String(data.date || data.created || data.updated || '');
  const title = (data.title as string) || humanize(slug);
  const body = entry.body || '';
  const excerpt = body.slice(0, 280);
  const searchHay = `${title} ${parts.cat} ${parts.sub} ${body.slice(0, 1500)}`.toLowerCase();
  return {
    entry,
    cat: parts.cat,
    sub: parts.sub,
    fileName: parts.fileName,
    slug,
    title,
    dateRaw,
    dateLabel: formatPostDate(dateRaw),
    excerpt,
    searchHay,
  };
};

let _cached: PostsIndex | null = null;

export const getPostsIndex = async (): Promise<PostsIndex> => {
  if (_cached) return _cached;
  const all = await getCollection('posts');
  const posts: PostMeta[] = [];
  const catMap = new Map<string, CategoryMeta>();

  for (const entry of all) {
    const meta = buildMeta(entry);
    if (!meta) continue;
    posts.push(meta);

    if (!catMap.has(meta.cat)) {
      catMap.set(meta.cat, { slug: meta.cat, count: 0, subs: [] });
    }
    const catEntry = catMap.get(meta.cat)!;
    catEntry.count += 1;

    let subEntry = catEntry.subs.find((s) => s.slug === meta.sub);
    if (!subEntry) {
      subEntry = { slug: meta.sub, count: 0 };
      catEntry.subs.push(subEntry);
    }
    subEntry.count += 1;
  }

  posts.sort((a, b) => {
    const da = new Date(a.dateRaw).getTime();
    const db = new Date(b.dateRaw).getTime();
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return db - da;
  });

  const categories = Array.from(catMap.values()).sort((a, b) =>
    a.slug.localeCompare(b.slug, 'ko'),
  );

  _cached = { categories, posts, total: posts.length };
  return _cached;
};

export const sortByNumericPrefix = (a: string, b: string) => {
  const matchA = a.match(/^(\d+)/);
  const matchB = b.match(/^(\d+)/);
  if (matchA && matchB) return Number(matchA[1]) - Number(matchB[1]);
  return a.localeCompare(b, 'ko');
};

export const findPost = async (
  cat: string,
  sub: string,
  slug: string,
): Promise<PostMeta | null> => {
  const { posts } = await getPostsIndex();
  return posts.find((p) => p.cat === cat && p.sub === sub && p.slug === slug) || null;
};

export const buildPostHref = (post: PostMeta) =>
  `/category/${encodeURIComponent(post.cat)}/${encodeURIComponent(post.sub)}/${encodeURIComponent(
    post.slug,
  )}`;

export const buildSubHref = (cat: string, sub: string) =>
  `/category/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`;

export const buildCatHref = (cat: string) => `/category/${encodeURIComponent(cat)}`;
