import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, ChevronRight, Calendar } from 'lucide-react';

const humanize = (value = '') => value.replace(/_/g, ' ');
const FALLBACK_POST_DATE = '날짜 미정';

const sortByNumericPrefix = (a, b) => {
  const matchA = a.match(/^(\d+)/);
  const matchB = b.match(/^(\d+)/);

  if (matchA && matchB) {
    return Number(matchA[1]) - Number(matchB[1]);
  }

  return a.localeCompare(b, 'ko');
};

const formatPostDate = (date) => {
  if (!date) {
    return FALLBACK_POST_DATE;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('ko-KR');
};

const Category = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || '');

  const folderCards = useMemo(() => {
    const markdownModules = import.meta.glob('../../content/posts/**/*.md', {
      query: '?raw',
      import: 'default',
    });
    const keepModules = import.meta.glob('../../content/posts/**/.gitkeep');
    const grouped = new Map();

    const ensureFolder = (folderName) => {
      if (!grouped.has(folderName)) {
        grouped.set(folderName, []);
      }
    };

    for (const path in keepModules) {
      const parts = path.split('/posts/')[1]?.split('/') || [];

      if (parts.length >= 3 && parts[0] === decodedName) {
        ensureFolder(parts[1]);
      }
    }

    for (const path in markdownModules) {
      const parts = path.split('/posts/')[1]?.split('/') || [];

      if (parts.length >= 3 && parts[0] === decodedName) {
        const folderName = parts[1];
        const fileName = parts[parts.length - 1];
        const title = humanize(fileName.replace(/\.md$/, ''));

        ensureFolder(folderName);
        grouped.get(folderName).push({
          fileName,
          title,
          date: null,
        });
      }
    }

    return Array.from(grouped.entries())
      .map(([folderName, posts]) => {
        const sortedPosts = [...posts].sort((a, b) => sortByNumericPrefix(a.fileName, b.fileName));
        const latest = sortedPosts[sortedPosts.length - 1];

        return {
          slug: folderName,
          title: humanize(folderName),
          count: posts.length,
          latestTitle: latest?.title,
          latestDate: formatPostDate(latest?.date),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [decodedName]);

  const handleOpenSubcategory = (slug) => {
    navigate(`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(slug)}`);
  };

  return (
    <div className="category-page blog-category-page">
      <div className="page-header blog-category-header">
        <Link to="/" className="back-btn">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <h1 className="category-title">{humanize(decodedName)} Archive</h1>
        <p className="category-subtitle">하위 폴더를 자동으로 불러와 카드로 렌더링합니다.</p>
      </div>

      {folderCards.length > 0 ? (
        <div className="folder-card-grid">
          {folderCards.map((folder, index) => (
            <article
              key={folder.slug}
              className="folder-blog-card"
              style={{ animationDelay: `${index * 0.06}s` }}
              onClick={() => handleOpenSubcategory(folder.slug)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOpenSubcategory(folder.slug);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${folder.title} 폴더 열기`}
            >
              <div className="folder-card-main">
                <div className="folder-blog-card-top">
                  <span className="folder-count">{folder.count} posts</span>
                </div>

                <h3 className="folder-title">{folder.title}</h3>

                <div className="folder-card-cta">
                  <span>바로가기</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="folder-card-side">
                <div className="folder-meta-list">
                  <p className="folder-preview">
                    <FileText size={14} />
                    <span>
                      최근 포스트: {folder.latestTitle || '아직 게시글이 없습니다.'}
                    </span>
                  </p>

                  <p className="folder-preview">
                    <Calendar size={14} />
                    <span>포스트 날짜: {folder.latestDate}</span>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen size={48} color="#6366f1" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h2>No folders in {decodedName} yet</h2>
          <p>Looks like this category is currently empty.</p>
        </div>
      )}
    </div>
  );
};

export default Category;
