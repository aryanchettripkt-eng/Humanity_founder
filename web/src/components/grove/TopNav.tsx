import {
  ChevronDown,
  LogOut,
  MailCheck,
  MailPlus,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/grove/Avatar';
import { GlassTabs, type GlassTabItem } from '@/components/grove/GlassTabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type TopNavClientOption = {
  id: string;
  name: string;
  initials: string;
  openCount?: number;
};

export type TopNavProps = {
  variant?: 'app' | 'public';
  logoHref?: string;
  tabs: GlassTabItem[];
  activeTabId: string;
  onTabChange?: (id: string) => void;
  clients?: TopNavClientOption[];
  activeClientId?: string;
  onSelectClient?: (id: string) => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenSearch?: () => void;
  settingsHref?: string;
  showSendTestEmail?: boolean;
  onSendTestEmail?: () => void;
  onSignOut?: () => void;
  rightSlot?: ReactNode;
  className?: string;
};

export function TopNav({
  variant = 'app',
  logoHref = '/app/today',
  tabs,
  activeTabId,
  onTabChange,
  clients = [],
  activeClientId,
  onSelectClient,
  userName = 'Alex Morgan',
  userEmail,
  userInitials = 'AM',
  theme = 'light',
  onToggleTheme,
  onOpenSearch,
  settingsHref = '/app/settings/accounts',
  showSendTestEmail = false,
  onSendTestEmail,
  onSignOut,
  rightSlot,
  className,
}: TopNavProps) {
  const [clientOpen, setClientOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const activeClient = clients.find((c) => c.id === activeClientId) ?? clients[0];
  const clientFirstName = activeClient?.name.split(' ')[0] || 'Client';

  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-3">
        <Link
          to={logoHref}
          className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-white">
            Relay
          </span>
        </Link>

        <GlassTabs
          items={tabs}
          activeId={activeTabId}
          onChange={onTabChange}
          className="hidden md:inline-flex"
        />
      </div>

      {variant === 'public' ? (
        <div className="flex items-center gap-2">{rightSlot}</div>
      ) : (
        <div className="flex items-center gap-2">
          {clients.length > 0 && activeClient ? (
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={clientOpen}
                  className="glass inline-flex h-11 items-center gap-2 rounded-full pl-2 pr-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
                >
                  <Avatar name={activeClient.name} initials={activeClient.initials} size="sm" />
                  <span>{clientFirstName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/80" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" role="menu" className="w-56 rounded-2xl p-1.5">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setClientOpen(false);
                      onSelectClient?.(c.id);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-surface"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Avatar name={c.name} initials={c.initials} size="sm" tone="surface" />
                      {c.name}
                    </span>
                    {c.openCount !== undefined ? (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                        {c.openCount}
                      </span>
                    ) : null}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          ) : null}

          {onOpenSearch ? (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search or ask AI (Command K)"
              className="glass flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/25"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : null}

          <Link
            to={settingsHref}
            aria-label="Settings"
            className="glass hidden h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/25 sm:flex"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <Popover open={userOpen} onOpenChange={setUserOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="User menu"
                aria-haspopup="menu"
                aria-expanded={userOpen}
                className="glass flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/25"
              >
                <Avatar name={userName} initials={userInitials} size="sm" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" role="menu" className="w-56 rounded-2xl p-1.5">
              <div className="border-b border-border px-2.5 py-2">
                <p className="truncate text-xs font-semibold">{userName}</p>
                {userEmail ? (
                  <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                ) : null}
              </div>
              {onToggleTheme ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserOpen(false);
                    onToggleTheme();
                  }}
                  className="mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-surface"
                >
                  {theme === 'light' ? (
                    <Moon className="h-3.5 w-3.5" />
                  ) : (
                    <Sun className="h-3.5 w-3.5" />
                  )}
                  {theme === 'light' ? 'Dark mode' : 'Light mode'}
                </button>
              ) : null}
              <Link
                to={settingsHref}
                role="menuitem"
                onClick={() => setUserOpen(false)}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-surface sm:hidden"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              {showSendTestEmail && onSendTestEmail ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserOpen(false);
                    onSendTestEmail();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-surface"
                >
                  <MailPlus className="h-3.5 w-3.5" />
                  Send test email
                </button>
              ) : null}
              {onSignOut ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserOpen(false);
                    onSignOut();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-destructive hover:bg-surface"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </header>
  );
}
