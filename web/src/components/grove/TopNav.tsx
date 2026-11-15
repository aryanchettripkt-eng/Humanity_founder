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
          className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
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
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setClientOpen((v) => !v);
                  setUserOpen(false);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 bg-white/15 pl-1.5 pr-3 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <Avatar name={activeClient.name} initials={activeClient.initials} size="sm" />
                <span>{clientFirstName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-white/80" />
              </button>

              {clientOpen ? (
                <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-xl">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClientOpen(false);
                        onSelectClient?.(c.id);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-surface"
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
                </div>
              ) : null}
            </div>
          ) : null}

          {onOpenSearch ? (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search or ask AI (Command K)"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : null}

          <Link
            to={settingsHref}
            aria-label="Settings"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 sm:flex"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserOpen((v) => !v);
                setClientOpen(false);
              }}
              aria-label="User menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
            >
              <Avatar name={userName} initials={userInitials} size="sm" />
            </button>

            {userOpen ? (
              <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-xl">
                <div className="border-b border-border px-2.5 py-2">
                  <p className="truncate text-xs font-semibold">{userName}</p>
                  {userEmail ? (
                    <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                  ) : null}
                </div>
                {onToggleTheme ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      onToggleTheme();
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-surface"
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
                  onClick={() => setUserOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-surface sm:hidden"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                {showSendTestEmail && onSendTestEmail ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      onSendTestEmail();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium hover:bg-surface"
                  >
                    <MailPlus className="h-3.5 w-3.5" />
                    Send test email
                  </button>
                ) : null}
                {onSignOut ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-destructive hover:bg-surface"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

