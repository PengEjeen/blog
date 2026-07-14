import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SearchIndexEntry } from '../utils/posts';

interface Props {
  indexUrl: string;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const humanize = (value = '') => value.replace(/_/g, ' ');

const searchPosts = (index: SearchIndexEntry[], query: string, limit = 8) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: { entry: SearchIndexEntry; score: number }[] = [];
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

const isSearchIndex = (value: unknown): value is SearchIndexEntry[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      ['cat', 'sub', 'slug', 'title', 'href', 'searchHay'].every(
        (key) => typeof (entry as Record<string, unknown>)[key] === 'string',
      ),
  );

const SidebarSearch = ({ indexUrl }: Props) => {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SearchIndexEntry[]>([]);
  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef<Promise<void> | null>(null);

  const loadIndex = useCallback(() => {
    if (loadState === 'ready' || requestRef.current) return;

    setLoadState('loading');
    const request = fetch(indexUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
        const data: unknown = await response.json();
        if (!isSearchIndex(data)) throw new Error('Search index response is invalid.');
        setIndex(data);
        setLoadState('ready');
      })
      .catch(() => {
        setLoadState('error');
      })
      .finally(() => {
        requestRef.current = null;
      });

    requestRef.current = request;
  }, [indexUrl, loadState]);

  useEffect(() => {
    const id = setTimeout(() => {
      setResults(loadState === 'ready' ? searchPosts(index, q, 8) : []);
    }, 80);
    return () => clearTimeout(id);
  }, [index, loadState, q]);

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
          onFocus={loadIndex}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQ(nextQuery);
            if (nextQuery.trim()) loadIndex();
          }}
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
          {loadState === 'loading' || loadState === 'idle' ? (
            <li className="sidebar-search-empty">검색 데이터 불러오는 중…</li>
          ) : loadState === 'error' ? (
            <li className="sidebar-search-empty">검색 데이터를 불러오지 못했습니다</li>
          ) : results.length === 0 ? (
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
