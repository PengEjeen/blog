import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronDown, Calendar } from 'lucide-react';
import {
  extractFrontmatter,
  formatPostDate,
  getPostSlugFromFileName,
  getPostTitleFromFileName,
  humanize,
  sortByNumericPrefix,
} from '../utils/posts';

// one accent color per section, cycling
const ACCENTS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#0ea5e9', '#f97316', '#6366f1',
];

const Category = () => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name || '');
  const [openSlug, setOpenSlug] = useState(null);

  const folderCards = useMemo(() => {
    const modules = import.meta.glob('../../content/posts/**/*.md', {
      eager: true,
      query: '?raw',
      import: 'default',
    });
    const keepModules = import.meta.glob('../../content/posts/**/.gitkeep');
    const grouped = new Map();

    const ensure = (fn) => { if (!grouped.has(fn)) grouped.set(fn, []); };

    for (const path in keepModules) {
      const parts = path.split('/posts/')[1]?.split('/') || [];
      if (parts.length >= 3 && parts[0] === decodedName) ensure(parts[1]);
    }

    for (const [path, raw] of Object.entries(modules)) {
      const parts = path.split('/posts/')[1]?.split('/') || [];
      if (parts.length >= 3 && parts[0] === decodedName) {
        const fn = parts[1];
        const fileName = parts[parts.length - 1];
        const { data } = extractFrontmatter(raw);
        ensure(fn);
        grouped.get(fn).push({
          path,
          fileName,
          slug: getPostSlugFromFileName(fileName),
          title: data.title || getPostTitleFromFileName(fileName),
          date: formatPostDate(data.date || data.created || data.updated),
        });
      }
    }

    return Array.from(grouped.entries())
      .map(([fn, posts]) => ({
        slug: fn,
        title: humanize(fn),
        posts: posts.sort((a, b) => sortByNumericPrefix(a.fileName, b.fileName)),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [decodedName]);

  const toggle = (slug) => setOpenSlug((prev) => (prev === slug ? null : slug));

  return (
    <div className="category-page">
      <div className="page-header">
        <Link to="/" className="back-btn">
          <ArrowLeft size={16} /> 홈으로
        </Link>
        <h1 className="page-title">{humanize(decodedName)}</h1>
        <p className="page-subtitle">총 {folderCards.length}개의 주제</p>
      </div>

      {folderCards.length > 0 ? (
        <div className="accordion">
          {folderCards.map((folder, fi) => {
            const isOpen = openSlug === folder.slug;
            const accent = ACCENTS[fi % ACCENTS.length];
            return (
              <div
                key={folder.slug}
                className={`accordion-item${isOpen ? ' open' : ''}`}
                style={{ '--accent-color': accent, animationDelay: `${fi * 0.05}s` }}
              >
                <button
                  className="accordion-trigger"
                  onClick={() => toggle(folder.slug)}
                  aria-expanded={isOpen}
                >
                  <div className="accordion-trigger-left">
                    <h2 className="accordion-section-name">{folder.title}</h2>
                    <span className="accordion-badge">{folder.posts.length}</span>
                  </div>
                  <ChevronDown size={17} className="accordion-chevron" />
                </button>

                <div className="accordion-content">
                  <div className="accordion-post-list">
                    {folder.posts.map((post, pi) => (
                      <Link
                        key={post.path}
                        to={`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(folder.slug)}/${encodeURIComponent(post.slug)}`}
                        className="accordion-post-item"
                      >
                        <div className="accordion-post-left">
                          <span className="accordion-post-title">{post.title}</span>
                        </div>
                        <span className="accordion-post-date">
                          <Calendar size={12} />
                          {post.date}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen size={40} color="#6366f1" style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h2>아직 게시글이 없습니다</h2>
          <p>이 카테고리는 비어 있어요.</p>
        </div>
      )}
    </div>
  );
};

export default Category;
