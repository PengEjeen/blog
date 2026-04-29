import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { fetchPathCount, isAnalyticsEnabled, trackPageView } from '../utils/analytics';

const ViewCount = ({ path }) => {
  const [count, setCount] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ok' | 'error'

  useEffect(() => {
    if (!path || !isAnalyticsEnabled()) {
      setState('error');
      return undefined;
    }

    let cancelled = false;
    setState('loading');
    setCount(null);
    (async () => {
      await trackPageView(path);
      const n = await fetchPathCount(path);
      if (cancelled) return;
      if (n == null) {
        setState('error');
      } else {
        setCount(n);
        setState('ok');
      }
    })();

    return () => { cancelled = true; };
  }, [path]);

  if (!isAnalyticsEnabled()) return null;

  // 'error'(서버 다운/네트워크 실패)도 0으로 표시 — 사라지지 않게.
  const display = state === 'ok' ? count : (state === 'error' ? 0 : null);

  return (
    <span
      className={`post-meta-item view-count${state === 'loading' ? ' view-count--loading' : ''}`}
      title="GoatCounter 누적 조회수"
      aria-label={display != null ? `조회 ${display}회` : '조회수 로딩 중'}
    >
      <Eye size={14} />
      {display != null ? `조회 ${display.toLocaleString('ko-KR')}회` : (
        <span className="view-count-skeleton" aria-hidden="true" />
      )}
    </span>
  );
};

export default ViewCount;
