import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FolderOpen } from 'lucide-react';
import {
  formatPostDate,
  getPostsIndex,
  humanize,
  markdownToHtml,
  resolveMarkdownAssetUrls,
} from '../utils/posts';
import { usePageTitle } from '../utils/usePageTitle';
import ReadingProgress from '../components/ReadingProgress';
import PostToc from '../components/PostToc';
import ViewCount from '../components/ViewCount';

const IMAGE_ASSETS = import.meta.glob('../../content/posts/**/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  import: 'default',
});

const RAW_POSTS = import.meta.glob('../../content/posts/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const Post = () => {
  const { name, subcategory, post } = useParams();
  const decodedName = decodeURIComponent(name || '');
  const decodedSubcategory = decodeURIComponent(subcategory || '');
  const decodedPost = decodeURIComponent(post || '');
  const articleRef = useRef(null);
  const contentRef = useRef(null);

  const postData = useMemo(() => {
    const { posts } = getPostsIndex();
    const found = posts.find(
      (p) => p.cat === decodedName && p.sub === decodedSubcategory && p.slug === decodedPost,
    );
    if (!found) return null;
    const raw = RAW_POSTS[found.path];
    if (!raw) return null;
    return {
      title: found.title,
      date: formatPostDate(found.dateRaw),
      hasContent: raw.replace(/^---[\s\S]*?---/, '').trim().length > 0,
      html: resolveMarkdownAssetUrls(markdownToHtml(raw), found.path, IMAGE_ASSETS),
    };
  }, [decodedName, decodedPost, decodedSubcategory]);

  usePageTitle(postData?.title);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return undefined;
    const buttons = root.querySelectorAll('button[data-copy]');
    const onClick = async (event) => {
      const btn = event.currentTarget;
      const block = btn.closest('.codeblock');
      if (!block) return;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = block.getAttribute('data-code') || '';
      const text = wrapper.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        btn.classList.add('codeblock-copy--ok');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('codeblock-copy--ok');
        }, 1400);
      } catch {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
      }
    };
    buttons.forEach((b) => b.addEventListener('click', onClick));
    return () => buttons.forEach((b) => b.removeEventListener('click', onClick));
  }, [postData?.html]);

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
    <div className="post-shell">
      <article className="post-page" ref={articleRef}>
        <ReadingProgress targetRef={articleRef} />
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
            <ViewCount path={`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedSubcategory)}/${encodeURIComponent(decodedPost)}`} />
          </div>
        </div>

        {postData.hasContent ? (
          <div
            ref={contentRef}
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

      <aside className="post-toc-rail" aria-label="목차 영역">
        <PostToc contentRef={contentRef} />
      </aside>
    </div>
  );
};

export default Post;
