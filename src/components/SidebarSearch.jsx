import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchPosts, humanize } from '../utils/posts';
import { useSidebar } from '../utils/sidebar';

const SidebarSearch = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const { close } = useSidebar();

  useEffect(() => {
    const id = setTimeout(() => {
      setResults(searchPosts(q, 8));
    }, 80);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k') || (e.ctrlKey && e.key === 'k'))
          && document.activeElement?.tagName !== 'INPUT'
          && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSelect = () => {
    setQ('');
    setResults([]);
    close();
  };

  return (
    <div className="sidebar-search">
      <div className="sidebar-search-input-wrap">
        <Search size={14} className="sidebar-search-icon" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts… (/)"
          aria-label="포스트 검색"
          className="sidebar-search-input"
        />
        {q && (
          <button
            type="button"
            className="sidebar-search-clear"
            onClick={() => { setQ(''); inputRef.current?.focus(); }}
            aria-label="검색어 지우기"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {q && (
        <ul className="sidebar-search-results">
          {results.length === 0 ? (
            <li className="sidebar-search-empty">결과 없음</li>
          ) : (
            results.map((p) => (
              <li key={`${p.cat}/${p.sub}/${p.slug}`}>
                <Link
                  to={`/category/${encodeURIComponent(p.cat)}/${encodeURIComponent(p.sub)}/${encodeURIComponent(p.slug)}`}
                  className="sidebar-search-result"
                  onClick={onSelect}
                >
                  <span className="sidebar-search-title">{p.title}</span>
                  <span className="sidebar-search-meta">
                    {humanize(p.cat)} / {humanize(p.sub)}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SidebarSearch;
