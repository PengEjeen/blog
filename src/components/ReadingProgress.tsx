import { useEffect, useState } from 'react';

interface Props {
  targetSelector?: string;
}

const ReadingProgress = ({ targetSelector = '.post-page' }: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.querySelector(targetSelector) as HTMLElement | null;
    if (!target) return;

    const compute = () => {
      const rect = target.getBoundingClientRect();
      const total = target.offsetHeight - window.innerHeight;
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
  }, [targetSelector]);

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="reading-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
};

export default ReadingProgress;
