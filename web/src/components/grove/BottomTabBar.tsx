import { BarChart3, Inbox, Info, Sparkles, Sun } from 'lucide-react';
import { m } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { EASE_EMPH, vtName } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type BottomTabBarProps = {
  onOpenAsk: () => void;
};

export function BottomTabBar({ onOpenAsk }: BottomTabBarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[11px] font-medium transition-colors',
      'relative isolate',
      isActive
        ? 'text-primary-foreground font-semibold'
        : 'text-muted-foreground hover:text-foreground'
    );

  // The active background is its own layer so it can slide between tabs.
  const pill = ({ isActive }: { isActive: boolean }) =>
    isActive ? (
      <m.span
        aria-hidden="true"
        layoutId="bottom-tab-pill"
        transition={{ duration: 0.38, ease: EASE_EMPH }}
        className="absolute inset-0 -z-10 rounded-full bg-primary"
      />
    ) : null;

  return (
    <nav
      aria-label="Mobile navigation"
      {...vtName('tab-bar')}
      className="mx-3 mb-[calc(env(safe-area-inset-bottom)+10px)] mt-2 flex shrink-0 items-center gap-1 rounded-[24px] border border-[var(--pane-border)] bg-[var(--card-glass-bg)] p-1.5 shadow-sm md:hidden"
    >
      <NavLink to="/app/today" className={linkClass}>
        {(state) => (
          <>
            {pill(state)}
            <Sun className="h-4 w-4" aria-hidden="true" />
            <span>Today</span>
          </>
        )}
      </NavLink>
      <NavLink to="/app/inbox/inbox" className={linkClass}>
        {(state) => (
          <>
            {pill(state)}
            <Inbox className="h-4 w-4" aria-hidden="true" />
            <span>Inbox</span>
          </>
        )}
      </NavLink>
      <NavLink to="/app/stats" className={linkClass}>
        {(state) => (
          <>
            {pill(state)}
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span>Stats</span>
          </>
        )}
      </NavLink>
      <NavLink to="/app/about" className={linkClass}>
        {(state) => (
          <>
            {pill(state)}
            <Info className="h-4 w-4" aria-hidden="true" />
            <span>About</span>
          </>
        )}
      </NavLink>
      <button
        type="button"
        onClick={onOpenAsk}
        className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>Ask</span>
      </button>
    </nav>
  );
}

