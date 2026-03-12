import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FolderOpen } from 'lucide-react';
import {
  extractFrontmatter,
  formatPostDate,
  getPostSlugFromFileName,
  getPostTitleFromFileName,
  humanize,
  markdownToHtml,
  resolveMarkdownAssetUrls,
} from '../utils/posts';

const Post = () => {
  const { name, subcategory, post } = useParams();
  const decodedName = decodeURIComponent(name || '');
  const decodedSubcategory = decodeURIComponent(subcategory || '');
  const decodedPost = decodeURIComponent(post || '');

  const postData = useMemo(() => {
    const modules = import.meta.glob('../../content/posts/**/*.md', {
      eager: true,
      query: '?raw',
      import: 'default',
    });
    const imageAssets = import.meta.glob('../../content/posts/**/*.{png,jpg,jpeg,gif,webp,svg}', {
      eager: true,
      import: 'default',
    });

    for (const [path, raw] of Object.entries(modules)) {
      const parts = path.split('/posts/')[1]?.split('/') || [];
      if (parts.length >= 3 && parts[0] === decodedName && parts[1] === decodedSubcategory) {
        const fileName = parts[parts.length - 1];
        if (getPostSlugFromFileName(fileName) === decodedPost) {
          const { data, content } = extractFrontmatter(raw);
          return {
            title: data.title || getPostTitleFromFileName(fileName),
            date: formatPostDate(data.date || data.created || data.updated),
            content,
            html: resolveMarkdownAssetUrls(markdownToHtml(raw), path, imageAssets),
          };
        }
      }
    }
    return null;
  }, [decodedName, decodedPost, decodedSubcategory]);

  if (!postData) {
    return (
      <div className="post-page">
        <div className="page-header">
          <Link to={`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedSubcategory)}`} className="back-btn">
            <ArrowLeft size={16} /> {humanize(decodedSubcategory)}
          </Link>
        </div>
        <div className="empty-state">
          <h2>포스트를 찾을 수 없습니다</h2>
          <p>해당 포스트가 존재하지 않거나 삭제된 것 같습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="post-page">
      <div className="page-header post-header">
        <Link
          to={`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedSubcategory)}`}
          className="back-btn"
        >
          <ArrowLeft size={16} /> {humanize(decodedSubcategory)}
        </Link>

        <div className="post-path">
          <span className="post-path-chip">
            <FolderOpen size={13} />
            {humanize(decodedName)}
          </span>
          <span className="post-path-separator">/</span>
          <span className="post-path-chip muted">{humanize(decodedSubcategory)}</span>
        </div>

        <h1 className="post-title">{postData.title}</h1>

        <div className="post-meta">
          <span className="post-meta-item">
            <Calendar size={14} />
            {postData.date}
          </span>
        </div>
      </div>

      {postData.content ? (
        <div
          className="post-content markdown-body"
          dangerouslySetInnerHTML={{ __html: postData.html }}
        />
      ) : (
        <div className="empty-state">
          <h2>본문이 아직 없습니다</h2>
          <p>이 포스트 파일은 생성되었지만 내용이 비어 있습니다.</p>
        </div>
      )}
    </article>
  );
};

export default Post;
