import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({ theme: 'auto', resolved: 'light', setTheme: () => {} });

const STORAGE_KEY = 'blog-theme';
const VALID = new Set(['light', 'dark', 'auto']);

const detectSystem = () =>
  (typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light';

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStored);
  const [systemDark, setSystemDark] = useState(detectSystem);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved = theme === 'auto' ? systemDark : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setTheme = (next) => {
    if (!VALID.has(next)) return;
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
  };

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
