import { Crown, Inbox, Sparkles, Sun } from 'lucide-react';
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
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-[var(--frame-gap-x)] right-[var(--frame-gap-x)] z-40 flex items-center gap-1 rounded-[24px] border border-border bg-card p-1.5 shadow-lg md:hidden"
    >
      <NavLink to="/app/today" className={linkClass}>
        <Sun className="h-4 w-4" aria-hidden="true" />
        <span>Today</span>
      </NavLink>
      <NavLink to="/app/inbox/inbox" className={linkClass}>
        <Inbox className="h-4 w-4" aria-hidden="true" />
        <span>Inbox</span>
      </NavLink>
      <NavLink to="/c?preview=1" className={linkClass}>
        <Crown className="h-4 w-4" aria-hidden="true" />
        <span>Client</span>
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

