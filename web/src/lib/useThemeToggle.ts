import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { runViewTransition } from '@/lib/motion';
import { useUiStore } from '@/stores/ui';

type Origin = { clientX: number; clientY: number };

/**
 * Light ↔ dark with a circular reveal that grows from where the user clicked
 * (motion.css `data-vt='theme'`). Without View Transitions support, or with
 * reduced motion, the theme swaps at once.
 */
export function useThemeToggle() {
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return useCallback(
    (origin?: Origin | null) => {
      const root = document.documentElement;
      const x = origin && origin.clientX > 0 ? origin.clientX : window.innerWidth - 48;
      const y = origin && origin.clientY > 0 ? origin.clientY : 48;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.style.setProperty('--vt-x', `${x}px`);
      root.style.setProperty('--vt-y', `${y}px`);
      root.style.setProperty('--vt-r', `${Math.ceil(r)}px`);

      root.classList.add('theme-switching');
      const apply = () => {
        flushSync(() => toggleTheme());
        root.classList.toggle('dark', useUiStore.getState().theme === 'dark');
      };

      void runViewTransition('theme', apply).finally(() => {
        // Two frames so the new colours settle before transitions come back.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => root.classList.remove('theme-switching'))
        );
      });
    },
    [toggleTheme]
  );
}
