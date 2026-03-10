import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';

const humanize = (value = '') => value.replace(/_/g, ' ');

const Subcategory = () => {
  const { name, subcategory } = useParams();
  const decodedName = decodeURIComponent(name || '');
  const decodedSubcategory = decodeURIComponent(subcategory || '');

  const posts = useMemo(() => {
    const modules = import.meta.glob('../../content/posts/**/*.md');
    const matchedPosts = [];

    for (const path in modules) {
      const parts = path.split('/posts/')[1]?.split('/') || [];

      if (parts.length >= 3 && parts[0] === decodedName && parts[1] === decodedSubcategory) {
        const fileName = parts[parts.length - 1];
        const title = fileName.replace(/\.md$/, '').replace(/_/g, ' ');

        matchedPosts.push({
          path,
          title,
          date: new Date().toLocaleDateString(),
        });
      }
    }

    return matchedPosts;
  }, [decodedName, decodedSubcategory]);

  return (
    <div className="subcategory-page">
      <div className="page-header">
        <Link to={`/category/${encodeURIComponent(decodedName)}`} className="back-btn">
          <ArrowLeft size={16} /> Back to {decodedName}
        </Link>
        <h1 className="category-title">{humanize(decodedSubcategory)}</h1>
      </div>

      <div className="posts-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div
              key={post.path}
              className="category-card"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', animationDelay: `${index * 0.1}s` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FileText style={{ color: 'var(--secondary)' }} />
                <h3 className="category-name" style={{ margin: 0, fontSize: '1.2rem' }}>{post.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No posts found in this folder.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subcategory;
