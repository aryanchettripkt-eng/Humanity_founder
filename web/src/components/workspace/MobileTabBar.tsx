import { CircleHelp, Inbox, Menu, Sparkles, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

type MobileTabBarProps = {
  reviewCount?: number;
  onOpenAsk: () => void;
  onOpenMore: () => void;
};

export function MobileTabBar({
  reviewCount = 0,
  onOpenAsk,
  onOpenMore,
}: MobileTabBarProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full bg-ink px-2 py-1.5 text-ink-foreground shadow-lg md:hidden"
    >
      <NavLink
        to="/app/today"
        className={({ isActive }) =>
          cn(
            'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-xs transition-colors',
            isActive
              ? 'bg-accent-lime font-semibold text-accent-lime-foreground'
              : 'text-ink-muted hover:text-ink-foreground'
          )
        }
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
        <span>Today</span>
      </NavLink>

      <NavLink
        to="/app/inbox/inbox"
        className={({ isActive }) =>
          cn(
            'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-xs transition-colors',
            isActive
              ? 'bg-accent-lime font-semibold text-accent-lime-foreground'
              : 'text-ink-muted hover:text-ink-foreground'
          )
        }
      >
        <Inbox className="h-4 w-4" aria-hidden="true" />
        <span>Inbox</span>
      </NavLink>

      <NavLink
        to="/app/inbox/review"
        className={({ isActive }) =>
          cn(
            'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-xs transition-colors',
            isActive
              ? 'bg-accent-lime font-semibold text-accent-lime-foreground'
              : 'text-ink-muted hover:text-ink-foreground'
          )
        }
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
        <span>Review</span>
        {reviewCount > 0 && (
          <span className="absolute right-1.5 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-lime px-1 text-xs font-bold text-accent-lime-foreground tabular-nums">
            {reviewCount}
          </span>
        )}
      </NavLink>

      <button
        type="button"
        onClick={onOpenAsk}
        className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-xs text-ink-muted transition-colors hover:text-ink-foreground"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>Ask</span>
      </button>

      <button
        type="button"
        onClick={onOpenMore}
        aria-label="More navigation and client switcher"
        className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-xs text-ink-muted transition-colors hover:text-ink-foreground"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}

