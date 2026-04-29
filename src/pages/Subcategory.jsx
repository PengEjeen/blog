import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import {
  getPostsIndex,
  humanize,
  sortByNumericPrefix,
} from '../utils/posts';
import { usePageTitle } from '../utils/usePageTitle';

const Subcategory = () => {
  const { name, subcategory } = useParams();
  const decodedName = decodeURIComponent(name || '');
  const decodedSubcategory = decodeURIComponent(subcategory || '');

  const posts = useMemo(() => {
    const { posts: all } = getPostsIndex();
    return all
      .filter((p) => p.cat === decodedName && p.sub === decodedSubcategory)
      .slice()
      .sort((a, b) => sortByNumericPrefix(a.fileName, b.fileName));
  }, [decodedName, decodedSubcategory]);

  usePageTitle(`${humanize(decodedSubcategory)} — ${humanize(decodedName)}`);

  return (
    <div className="category-page">
      <div className="page-header">
        <Link to={`/category/${encodeURIComponent(decodedName)}`} className="back-btn">
          <ArrowLeft size={16} /> {humanize(decodedName)}
        </Link>
        <h1 className="page-title">{humanize(decodedSubcategory)}</h1>
        <p className="page-subtitle">{posts.length}개의 포스트</p>
      </div>

      <div className="post-list-grid">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <Link
              key={post.path}
              to={`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedSubcategory)}/${encodeURIComponent(post.slug)}`}
              className="post-list-card"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="post-list-main">
                <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <h3 className="post-list-title">{post.title}</h3>
              </div>
              <div className="post-list-date">
                <Calendar size={13} />
                <span>{post.dateLabel}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>게시글이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subcategory;
