import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { runViewTransition } from '@/lib/motion';

/** Today, Inbox, Statistics… count as one page each; moving inside one (a thread, a segment) doesn't. */
export function pageSection(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'app') return `/app/${parts[1] ?? ''}`;
  return `/${parts[0] ?? ''}`;
}

function internalLinkTarget(event: MouseEvent): URL | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== '_self') return null;
  if (anchor.hasAttribute('download') || anchor.dataset.noTransition !== undefined) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  return url;
}

/**
 * Page-to-page transitions. Any in-app link that changes page runs inside a view
 * transition: the old page fades, the new one fades in, the nav stays put and the
 * active tab pill slides (motion.css). Navigation runs as a React transition
 * (BrowserRouter `v7_startTransition`), so a page whose code is still loading
 * keeps the old page on screen instead of flashing a skeleton.
 */
export function RouteTransitions() {
  const navigate = useNavigate();
  const location = useLocation();
  const pending = useRef<(() => void) | null>(null);
  const currentPath = useRef(location.pathname);
  currentPath.current = location.pathname;

  useLayoutEffect(() => {
    // The new page has committed; let the view transition capture it.
    pending.current?.();
    pending.current = null;
  }, [location.key]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const url = internalLinkTarget(event);
      if (!url) return;
      if (pageSection(url.pathname) === pageSection(currentPath.current)) return;

      event.preventDefault();
      const to = `${url.pathname}${url.search}${url.hash}`;
      void runViewTransition(
        'page',
        () =>
          new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 2500);
            pending.current = () => {
              window.clearTimeout(timer);
              resolve();
            };
            navigate(to);
          })
      );
    };

    // Capture phase: runs before React Router's Link handler, which then sees
    // defaultPrevented and leaves the navigation to us.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  return null;
}
