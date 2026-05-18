interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BlogPostingInput {
  title: string;
  description: string;
  url: string;
  datePublished?: string | Date;
  dateModified?: string | Date;
}

const SITE_NAME = "PenGejeen's Blog";
const AUTHOR_NAME = '조남영';

const toIsoDate = (value?: string | Date) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

export const createBlogPostingJsonLd = ({
  title,
  description,
  url,
  datePublished,
  dateModified,
}: BlogPostingInput) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description,
  url,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': url,
  },
  author: {
    '@type': 'Person',
    name: AUTHOR_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
  datePublished: toIsoDate(datePublished),
  dateModified: toIsoDate(dateModified || datePublished),
});

export const createBreadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const serializeJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, '\\u003c');
