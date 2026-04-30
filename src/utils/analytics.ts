declare global {
  interface Window {
    goatcounter?: {
      no_onload?: boolean;
      allow_local?: boolean;
      count?: (opts: { path: string; event?: boolean; title?: string }) => void;
    };
  }
}

const CODE = 'pengejeen';
const HOST = CODE ? `https://${CODE}.goatcounter.com` : '';

let scriptLoaded = false;
let scriptLoading: Promise<unknown> | null = null;

const loadScript = () => {
  if (!CODE) return Promise.resolve(null);
  if (scriptLoaded) return Promise.resolve(window.goatcounter);
  if (scriptLoading) return scriptLoading;

  window.goatcounter = window.goatcounter || { no_onload: true, allow_local: true };

  scriptLoading = new Promise((resolve) => {
    const s = document.createElement('script');
    s.async = true;
    s.dataset.goatcounter = `${HOST}/count`;
    s.src = '//gc.zgo.at/count.js';
    s.onload = () => {
      scriptLoaded = true;
      resolve(window.goatcounter);
    };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });

  return scriptLoading;
};

const normalizePath = (p: string) => {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
};

export const trackPageView = async (path: string) => {
  if (!CODE) return;
  const gc = (await loadScript()) as Window['goatcounter'] | null;
  if (!gc || typeof gc.count !== 'function') return;
  gc.count({ path: normalizePath(path), event: false, title: document.title });
};

export const fetchPathCount = async (path: string): Promise<number | null> => {
  if (!CODE) return null;
  const url = `${HOST}/counter/${encodeURIComponent(normalizePath(path))}.json`;
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (res.status >= 500) return null;
    if (!res.ok) return 0;
    const data = await res.json();
    const count = Number((data as { count?: number })?.count ?? 0);
    return Number.isFinite(count) ? count : 0;
  } catch {
    return null;
  }
};

export const isAnalyticsEnabled = () => Boolean(CODE);
