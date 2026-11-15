import { BarChart3, Inbox, Info, Sparkles, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type BottomTabBarProps = {
  onOpenAsk: () => void;
};

export function BottomTabBar({ onOpenAsk }: BottomTabBarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[11px] font-medium transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground font-semibold'
        : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <nav
      aria-label="Mobile navigation"
      className="mx-3 mb-[calc(env(safe-area-inset-bottom)+10px)] mt-2 flex shrink-0 items-center gap-1 rounded-[24px] border border-[var(--pane-border)] bg-[var(--card-glass-bg)] p-1.5 shadow-sm md:hidden"
    >
      <NavLink to="/app/today" className={linkClass}>
        <Sun className="h-4 w-4" aria-hidden="true" />
        <span>Today</span>
      </NavLink>
      <NavLink to="/app/inbox/inbox" className={linkClass}>
        <Inbox className="h-4 w-4" aria-hidden="true" />
        <span>Inbox</span>
      </NavLink>
      <NavLink to="/app/stats" className={linkClass}>
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        <span>Stats</span>
      </NavLink>
      <NavLink to="/app/about" className={linkClass}>
        <Info className="h-4 w-4" aria-hidden="true" />
        <span>About</span>
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

