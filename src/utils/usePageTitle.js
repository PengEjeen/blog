import { useEffect } from 'react';

const SITE = "PenGejeen's Blog";

export const usePageTitle = (title) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SITE}` : SITE;
    return () => { document.title = previous; };
  }, [title]);
};
