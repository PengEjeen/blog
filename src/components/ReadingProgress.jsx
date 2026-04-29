import React, { useEffect, useState } from 'react';

const ReadingProgress = ({ targetRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const compute = () => {
      const el = targetRef?.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(rect.top < 0 ? 100 : 0);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress((scrolled / total) * 100);
    };

    compute();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', compute);
    };
  }, [targetRef]);

  return (
    <div className="reading-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100">
      <span className="reading-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
};

export default ReadingProgress;
