import { animate } from 'framer-motion';
import { useLayoutEffect, useRef } from 'react';
import { EASE_EMPH, prefersReducedMotion } from '@/lib/motion';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  /** Milliseconds for the count. */
  duration?: number;
};

/**
 * A number that counts up when it first appears and glides to new values
 * (e.g. when a live update changes a count). React renders the real value; the
 * count only rewrites the text while it runs, and is skipped for reduced motion.
 */
export function AnimatedNumber({ value, className, duration = 700 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useLayoutEffect(() => {
    const el = ref.current;
    const from = shown.current;
    if (!el || from === value) return;
    if (typeof window.matchMedia !== 'function' || prefersReducedMotion()) {
      shown.current = value;
      return;
    }

    // Before paint, so the final number never flashes ahead of the count.
    el.textContent = String(Math.round(from));
    const controls = animate(from, value, {
      duration: duration / 1000,
      ease: EASE_EMPH,
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = String(Math.round(v));
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = String(value);
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
