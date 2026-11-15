import { CircleHelp, Crown, Inbox, Settings, Sparkles, Sun } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type NavRailProps = {
  reviewCount?: number;
  onOpenAsk: () => void;
};

export function NavRail({ reviewCount = 0, onOpenAsk }: NavRailProps) {
  const location = useLocation();

  const items = [
    {
      id: 'today',
      label: 'Today',
      shortcut: 'G T',
      to: '/app/today',
      icon: Sun,
      active: location.pathname === '/app/today',
    },
    {
      id: 'inbox',
      label: 'Inbox',
      shortcut: 'G I',
      to: '/app/inbox/inbox',
      icon: Inbox,
      active:
        location.pathname.startsWith('/app/inbox') &&
        !location.pathname.startsWith('/app/inbox/review'),
    },
    {
      id: 'review',
      label: 'Needs review',
      shortcut: 'G R',
      to: '/app/inbox/review',
      icon: CircleHelp,
      badge: reviewCount > 0 ? reviewCount : undefined,
      active: location.pathname.startsWith('/app/inbox/review'),
    },
    {
      id: 'client-view',
      label: "Client view (Priya's preview)",
      shortcut: 'G C',
      to: '/c?preview=1',
      icon: Crown,
      active: location.pathname.startsWith('/c'),
    },
  ];

  const isSettings = location.pathname.startsWith('/app/settings');

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden w-16 shrink-0 flex-col items-center justify-between py-4 md:flex"
    >
      <nav className="flex flex-col items-center gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  aria-label={item.label}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.badge !== undefined && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-lime px-1 text-xs font-semibold text-accent-lime-foreground tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>{item.label}</span>{' '}
                <kbd className="ml-1 font-mono text-xs opacity-70">{item.shortcut}</kbd>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenAsk}
              aria-label="Ask AI"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>Ask AI</span> <kbd className="ml-1 font-mono text-xs opacity-70">⌘K</kbd>
          </TooltipContent>
        </Tooltip>
      </nav>

      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to="/app/settings/accounts"
            aria-label="Settings"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSettings
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">Settings · Accounts</TooltipContent>
      </Tooltip>
    </aside>
  );
}

