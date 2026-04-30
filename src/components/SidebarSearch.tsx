import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface IndexEntry {
  cat: string;
  sub: string;
  slug: string;
  title: string;
  href: string;
  searchHay: string;
}

interface Props {
  index: IndexEntry[];
}

const humanize = (value = '') => value.replace(/_/g, ' ');

const searchPosts = (index: IndexEntry[], query: string, limit = 8) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: { entry: IndexEntry; score: number }[] = [];
  for (const entry of index) {
    let score = 0;
    let matched = true;
    for (const token of tokens) {
      const inTitle = entry.title.toLowerCase().includes(token);
      const inHay = entry.searchHay.includes(token);
      if (!inTitle && !inHay) {
        matched = false;
        break;
      }
      if (inTitle) score += 4;
      if (inHay) score += 1;
    }
    if (matched) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
};

const SidebarSearch = ({ index }: Props) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<IndexEntry[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const stableIndex = useMemo(() => index, [index]);

  useEffect(() => {
    const id = setTimeout(() => {
      setResults(searchPosts(stableIndex, q, 8));
    }, 80);
    return () => clearTimeout(id);
  }, [q, stableIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      const isShortcut =
        e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k');
      if (isShortcut && tag !== 'INPUT' && tag !== 'TEXTAREA') {
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
    document.body.classList.remove('sidebar-open');
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
            onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }}
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
                <a href={p.href} className="sidebar-search-result" onClick={onSelect}>
                  <span className="sidebar-search-title">{p.title}</span>
                  <span className="sidebar-search-meta">
                    {humanize(p.cat)} / {humanize(p.sub)}
                  </span>
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SidebarSearch;
