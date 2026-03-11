import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import {
  extractFrontmatter,
  formatPostDate,
  getPostSlugFromFileName,
  getPostTitleFromFileName,
  humanize,
  sortByNumericPrefix,
} from '../utils/posts';

const Subcategory = () => {
  const { name, subcategory } = useParams();
  const decodedName = decodeURIComponent(name || '');
  const decodedSubcategory = decodeURIComponent(subcategory || '');

  const posts = useMemo(() => {
    const modules = import.meta.glob('../../content/posts/**/*.md', {
      eager: true,
      query: '?raw',
      import: 'default',
    });
    const matchedPosts = [];

    for (const [path, raw] of Object.entries(modules)) {
      const parts = path.split('/posts/')[1]?.split('/') || [];

      if (parts.length >= 3 && parts[0] === decodedName && parts[1] === decodedSubcategory) {
        const fileName = parts[parts.length - 1];
        const { data } = extractFrontmatter(raw);

        matchedPosts.push({
          path,
          fileName,
          slug: getPostSlugFromFileName(fileName),
          title: data.title || getPostTitleFromFileName(fileName),
          date: formatPostDate(data.date || data.created || data.updated),
        });
      }
    }

    return matchedPosts.sort((a, b) => sortByNumericPrefix(a.fileName, b.fileName));
  }, [decodedName, decodedSubcategory]);

  return (
    <div className="subcategory-page">
      <div className="page-header">
        <Link to={`/category/${encodeURIComponent(decodedName)}`} className="back-btn">
          <ArrowLeft size={16} /> Back to {decodedName}
        </Link>
        <h1 className="category-title">{humanize(decodedSubcategory)}</h1>
      </div>

      <div className="posts-list post-list-grid">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <Link
              key={post.path}
              to={`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedSubcategory)}/${encodeURIComponent(post.slug)}`}
              className="post-list-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="post-list-main">
                <FileText style={{ color: 'var(--primary)' }} />
                <h3 className="category-name post-list-title">{post.title}</h3>
              </div>
              <div className="post-list-date">
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
            </Link>
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
