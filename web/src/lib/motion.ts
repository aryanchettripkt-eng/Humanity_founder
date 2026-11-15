import type { CSSProperties } from 'react';

/**
 * Motion helpers (DESIGN_SYSTEM §5). CSS lives in `styles/motion.css`; this file
 * holds the JS side: feature checks and the View Transitions wrapper used by
 * page switches and the theme toggle.
 */

export type CubicBezier = [number, number, number, number];
export const EASE_OUT: CubicBezier = [0.2, 0.8, 0.2, 1];
export const EASE_EMPH: CubicBezier = [0.16, 1, 0.3, 1];

export type ViewTransitionKind = 'page' | 'theme';

type ViewTransitionLike = { finished: Promise<void> };
type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransitionLike;
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function canViewTransition(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof (document as DocumentWithViewTransition).startViewTransition === 'function' &&
    !prefersReducedMotion()
  );
}

let running: ViewTransitionLike | null = null;

/**
 * Runs `update` inside a view transition tagged with `kind`, so motion.css can
 * pick the right animation (`html[data-vt='page' | 'theme']`). Falls back to a
 * plain update when the browser can't, the user prefers reduced motion, or
 * another transition is still running.
 */
export function runViewTransition(
  kind: ViewTransitionKind,
  update: () => void | Promise<void>
): Promise<void> {
  const doc = document as DocumentWithViewTransition;
  if (!canViewTransition() || running || !doc.startViewTransition) {
    return Promise.resolve(update());
  }

  const root = document.documentElement;
  root.dataset.vt = kind;
  const transition = doc.startViewTransition(update);
  running = transition;
  return transition.finished
    .catch(() => undefined)
    .finally(() => {
      running = null;
      delete root.dataset.vt;
    });
}

/** Stagger index for `[data-reveal]` (motion.css): each step adds 60ms of delay. */
export function revealDelay(index: number): CSSProperties {
  return { '--reveal-i': index } as CSSProperties;
}

/**
 * Names an element for page view transitions (motion.css `[data-vt]`). The name
 * only applies while a page switch runs, so the theme reveal stays one piece.
 * Spread onto the element: `<div {...vtName('app-nav')}>`.
 */
export function vtName(name: string): { 'data-vt': ''; style: CSSProperties } {
  return { 'data-vt': '', style: { '--vt-name': name } as CSSProperties };
}
