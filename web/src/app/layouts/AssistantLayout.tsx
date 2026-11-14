import { useQueryClient } from '@tanstack/react-query';
import {
  CircleHelp,
  Inbox,
  LogOut,
  MailPlus,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useCallback } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { KbdHint } from '@/components/common/KbdHint';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { GuidedTour } from '@/components/common/GuidedTour';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/features/accounts/api';
import { AccountStatusBadge } from '@/features/accounts/components/AccountStatusBadge';
import { useLogout, useMe } from '@/features/auth/api';
import { AskPanel } from '@/features/command/AskPanel';
import { CommandPalette } from '@/features/command/CommandPalette';
import { useSimulateEmail, useThreadCounts } from '@/features/inbox/api';
import { qk } from '@/lib/queryKeys';
import { SEGMENTS } from '@/lib/segments';
import { useSocketEvent } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { useCommandStore } from '@/stores/command';
import { useUiStore } from '@/stores/ui';
import type { ActivityItem, ThreadListItem } from '@/types/api';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export function AssistantLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const { data: me } = useMe();
  const { activeClientId, setActiveClientId, theme, toggleTheme, markNewThread } = useUiStore();
  const { setOpen: setPaletteOpen, openAsk } = useCommandStore();

  const clientId = activeClientId || me?.clients?.[0]?.id;
  const { data: counts } = useThreadCounts(clientId);
  const { data: accounts } = useAccounts(clientId);
  const simulateEmail = useSimulateEmail();

  // Realtime socket wiring (F2.9)
  const onThreadCreated = useCallback(
    (t: ThreadListItem) => {
      markNewThread(t.id);
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    [markNewThread, queryClient]
  );

  const onThreadUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.threads.all() });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const onCountsChanged = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.threads.counts(clientId) });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [clientId, queryClient]);

  const onActivityNew = useCallback(
    (act: ActivityItem) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (act.actor.type === 'client') {
        toast.info(`${act.actor.name}: ${act.type.replace(/_/g, ' ')}`);
      }
    },
    [queryClient]
  );

  useSocketEvent<ThreadListItem>('thread:created', onThreadCreated);
  useSocketEvent('thread:updated', onThreadUpdated);
  useSocketEvent('counts:changed', onCountsChanged);
  useSocketEvent<ActivityItem>('activity:new', onActivityNew);
  useSocketEvent('draft:created', onThreadUpdated);

  const primaryAccount = accounts?.find((a) => a.status !== 'disconnected') || accounts?.[0];
  const primarySegments = SEGMENTS.filter((s) => s.group === 'primary');
  const ownerSegments = SEGMENTS.filter((s) => s.group === 'owner');
  const statusSegments = SEGMENTS.filter((s) => s.group === 'status');

  const segmentPath = (id: string) => (id === 'today' ? '/app/today' : `/app/inbox/${id}`);

  const renderNavItem = (seg: (typeof SEGMENTS)[number]) => {
    const Icon = seg.icon;
    const count = seg.id === 'today' ? undefined : counts?.[seg.id];
    const to = segmentPath(seg.id);
    const active =
      seg.id === 'today'
        ? location.pathname === '/app/today'
        : location.pathname.startsWith(`/app/inbox/${seg.id}`);

    return (
      <NavLink
        key={seg.id}
        to={to}
        className={cn(
          'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors',
          active
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground/80 hover:bg-background hover:text-foreground'
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{seg.label}</span>
        </div>
        {count !== undefined && count > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <OfflineBanner />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link to="/app/today" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Inbox className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">Relay</span>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Ask AI"
              onClick={() => openAsk('')}
              className="h-8 w-8"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {/* Client switcher */}
          {me?.clients && me.clients.length > 0 && (
            <div className="border-b border-border p-3">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Client inbox
              </label>
              <select
                aria-label="Select client"
                value={clientId || ''}
                onChange={(e) => {
                  setActiveClientId(e.target.value);
                  queryClient.invalidateQueries({ queryKey: ['threads'] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                }}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {me.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Segment nav */}
          <nav className="flex-1 space-y-4 overflow-y-auto p-2.5">
            <div className="space-y-0.5">{primarySegments.map(renderNavItem)}</div>

            <div>
              <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Who replies
              </p>
              <div className="space-y-0.5">{ownerSegments.map(renderNavItem)}</div>
            </div>

            <div>
              <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <div className="space-y-0.5">{statusSegments.map(renderNavItem)}</div>
            </div>
          </nav>

          {/* Footer */}
          <div className="space-y-1 border-t border-border p-2.5">
            <AccountStatusBadge account={primaryAccount} />
            <div className="flex items-center justify-between px-1">
              <span className="truncate text-xs text-muted-foreground">{me?.user.name}</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="h-7 w-7"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 w-full max-w-sm items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                <span>Search or ask AI…</span>
              </span>
              <KbdHint keys="⌘K" />
            </button>

            <div className="flex items-center gap-1.5">
              {DEMO_MODE && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={simulateEmail.isPending}
                  onClick={() => simulateEmail.mutate(clientId)}
                >
                  <MailPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {simulateEmail.isPending ? 'Simulating…' : 'Simulate email'}
                  </span>
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                aria-label="Toggle dark mode"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Link to="/app/settings/accounts">
                <Button size="icon" variant="ghost" aria-label="Account settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </header>

          {/* Content */}
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="flex h-14 shrink-0 items-center justify-around border-t border-border bg-background lg:hidden">
        <NavLink
          to="/app/today"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 text-[11px]',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground'
            )
          }
        >
          <Sun className="h-4 w-4" />
          <span>Today</span>
        </NavLink>
        <NavLink
          to="/app/inbox/inbox"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 text-[11px]',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground'
            )
          }
        >
          <Inbox className="h-4 w-4" />
          <span>Inbox</span>
        </NavLink>
        <NavLink
          to="/app/inbox/review"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 text-[11px]',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground'
            )
          }
        >
          <CircleHelp className="h-4 w-4" />
          <span>Review</span>
        </NavLink>
        <button
          type="button"
          onClick={() => openAsk('')}
          className="flex flex-col items-center gap-0.5 text-[11px] text-muted-foreground"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask</span>
        </button>
        <NavLink
          to="/app/settings/accounts"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 text-[11px]',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground'
            )
          }
        >
          <Settings className="h-4 w-4" />
          <span>Accounts</span>
        </NavLink>
      </nav>

      <CommandPalette />
      <AskPanel />
      <GuidedTour />
    </div>
  );
}

