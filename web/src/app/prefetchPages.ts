/**
 * Warms the code for the main pages once the app is idle, so the first visit to
 * each page switches instantly (and its page transition starts right away).
 * Vite reuses the same chunks that router.tsx lazy-loads.
 */
const loaders = [
  () => import('@/pages/TodayPage'),
  () => import('@/pages/InboxPage'),
  () => import('@/pages/StatsPage'),
  () => import('@/pages/AboutPage'),
  () => import('@/pages/SettingsAccountsPage'),
];

let started = false;

export function prefetchAppPages(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const run = () => loaders.forEach((load) => void load().catch(() => undefined));
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (idle) idle(run);
  else window.setTimeout(run, 1500);
}
