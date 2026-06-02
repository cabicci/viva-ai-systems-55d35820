import { useEffect, useState } from "react";

/**
 * Sticky reading-progress bar shown at the very top of a lesson page.
 * Visual feedback that keeps short-attention learners moving — they can
 * see how close they are to the end of the lesson at all times.
 */
export function ReadingProgressBar() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const max = doc.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(100, Math.max(0, (scrolled / max) * 100)) : 0;
      setPct(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 inset-x-0 z-40 h-1 bg-transparent pointer-events-none"
      aria-hidden
    >
      <div
        className="h-full bg-[image:var(--gradient-primary)] transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}