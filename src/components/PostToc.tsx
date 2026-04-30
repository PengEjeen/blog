import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  targetSelector?: string;
}

const PostToc = ({ targetSelector = '.post-content' }: Props) => {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.querySelector(targetSelector) as HTMLElement | null;
    if (!root) return;

    const headings = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];
    const collected = headings
      .map((h) => ({
        id: h.id,
        text: (h.textContent || '').replace(/^#\s*/, '').trim(),
        level: Number(h.tagName.slice(1)),
      }))
      .filter((i) => i.id);
    setItems(collected);

    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: [0, 1] },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [targetSelector]);

  if (items.length < 2) return null;

  return (
    <nav className="post-toc" aria-label="목차">
      <h2 className="post-toc-title">On this page</h2>
      <ul className="post-toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`post-toc-item post-toc-item--l${item.level}${
              activeId === item.id ? ' post-toc-item--active' : ''
            }`}
          >
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default PostToc;
