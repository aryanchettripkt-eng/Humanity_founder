import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bell,
  Calendar,
  ChevronDown,
  Crown,
  LogOut,
  MailPlus,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GuidedTour } from '@/components/common/GuidedTour';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppTopBar } from '@/components/workspace/AppTopBar';
import { Avatar } from '@/components/workspace/Avatar';
import { MobileTabBar } from '@/components/workspace/MobileTabBar';
import { NavRail } from '@/components/workspace/NavRail';
import { useLogout, useMe } from '@/features/auth/api';
import { AskPanel } from '@/features/command/AskPanel';
import { CommandPalette } from '@/features/command/CommandPalette';
import { useSimulateEmail, useThreadCounts } from '@/features/inbox/api';
import { useDashboard } from '@/features/today/api';
import { buildScheduleSlots, collapseActivity } from '@/features/today/mappers';
import { formatRelativeTime, formatUpcomingDate, getInitials } from '@/lib/format';
import { qk } from '@/lib/queryKeys';
import { useSocketEvent } from '@/lib/socket';
import { useCommandStore } from '@/stores/command';
import { useUiStore } from '@/stores/ui';
import type { ActivityItem, ThreadListItem } from '@/types/api';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export function AssistantLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: me } = useMe();
  const {
    activeClientId,
    setActiveClientId,
    theme,
    toggleTheme,
    markNewThread,
    lastSeenActivityAt,
    markActivitySeen,
  } = useUiStore();
  const { setOpen: setPaletteOpen, openAsk } = useCommandStore();

  const [moreOpen, setMoreOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const validClientIds = new Set(me?.clients?.map((c) => c.id) ?? []);
  const clientId =
    (activeClientId && (!me || validClientIds.has(activeClientId))
      ? activeClientId
      : me?.clients?.[0]?.id) || undefined;

  const activeClient =
    me?.clients?.find((c) => c.id === clientId) ?? me?.clients?.[0];

  const { data: counts } = useThreadCounts(clientId);
  const { data: dashboard } = useDashboard(clientId);
  const simulateEmail = useSimulateEmail();

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

  const slots = useMemo(
    () => buildScheduleSlots(dashboard?.upcoming ?? [], activeClient?.timezone),
    [dashboard?.upcoming, activeClient?.timezone]
  );

  const collapsedActivity = useMemo(
    () => collapseActivity(dashboard?.activity ?? []),
    [dashboard?.activity]
  );

  const hasUnseenActivity = useMemo(() => {
    const latest = dashboard?.activity?.[0]?.createdAt;
    if (!latest) return false;
    if (!lastSeenActivityAt) return true;
    return new Date(latest).getTime() > new Date(lastSeenActivityAt).getTime();
  }, [dashboard?.activity, lastSeenActivityAt]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowPercent = Math.min(92, Math.max(8, Math.round((nowMinutes / (24 * 60)) * 100)));
  const nowTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const clientFirstName = activeClient?.name.split(' ')[0] || 'Client';
  const userName = me?.user.name || 'Alex Morgan';

  const handleSimulate = () => {
    if (!clientId) return;
    simulateEmail.mutate(clientId);
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <OfflineBanner />

      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1440px] flex-col rounded-[28px] border border-border/60 bg-surface px-3 pb-20 pt-2 shadow-sm sm:min-h-[calc(100vh-2rem)] sm:rounded-[32px] sm:px-6 sm:pb-6">
        <AppTopBar
          logoHref="/app/today"
          dateLabel={dateLabel}
          slots={slots}
          nowTime={nowTime}
          nowPercent={nowPercent}
          scheduleActionSlot={
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDatesOpen((v) => !v);
                  setActivityOpen(false);
                  setClientMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                aria-label="Open 7-day extracted dates"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-ink-foreground transition-colors hover:bg-white/20"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>

              {datesOpen ? (
                <div className="absolute right-0 top-11 z-40 w-72 rounded-2xl border border-border bg-surface p-3 text-foreground shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-bold">Upcoming (next 7 days)</p>
                    <button
                      type="button"
                      onClick={() => setDatesOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {(dashboard?.upcoming ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No upcoming dates.</p>
                    ) : (
                      dashboard?.upcoming.slice(0, 5).map((u, idx) => (
                        <div
                          key={`${u.threadId}-${idx}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 p-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{u.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatUpcomingDate(u.startsAt, activeClient?.timezone)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              toast.success(`Added "${u.title}" to calendar`);
                              setDatesOpen(false);
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground"
                          >
                            <Calendar className="h-3 w-3" />
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search or ask AI (Command K)"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Activity bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const next = !activityOpen;
                    setActivityOpen(next);
                    setDatesOpen(false);
                    setClientMenuOpen(false);
                    setUserMenuOpen(false);
                    if (next && dashboard?.activity?.[0]?.createdAt) {
                      markActivitySeen(dashboard.activity[0].createdAt);
                    }
                  }}
                  aria-label="Activity notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted"
                >
                  <Bell className="h-4 w-4" />
                  {hasUnseenActivity ? (
                    <span
                      aria-hidden="true"
                      className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-lime ring-2 ring-surface"
                    />
                  ) : null}
                </button>

                {activityOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-border bg-surface p-3 shadow-xl">
                    <p className="font-display text-sm font-bold text-foreground">Activity</p>
                    <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                      {collapsedActivity.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                          No recent activity.
                        </p>
                      ) : (
                        collapsedActivity.map((act) => (
                          <div
                            key={act.id}
                            className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">
                                {act.actorName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatRelativeTime(act.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-muted-foreground">
                              {act.label}
                              {act.count > 1 ? ` (×${act.count})` : ''}
                              {act.subject ? ` · ${act.subject}` : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Client switcher pill */}
              {me?.clients && me.clients.length > 0 ? (
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => {
                      setClientMenuOpen((v) => !v);
                      setDatesOpen(false);
                      setActivityOpen(false);
                      setUserMenuOpen(false);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface pl-1.5 pr-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Avatar
                      initials={getInitials(activeClient?.name || 'Client')}
                      name={activeClient?.name || 'Client'}
                      size="sm"
                    />
                    <span>{clientFirstName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {clientMenuOpen ? (
                    <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
                      {me.clients.map((c) => {
                        const isSelected = c.id === clientId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setActiveClientId(c.id);
                              setClientMenuOpen(false);
                              queryClient.invalidateQueries({ queryKey: ['threads'] });
                              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted"
                          >
                            <span className="flex items-center gap-2 font-medium text-foreground">
                              <Avatar initials={getInitials(c.name)} name={c.name} size="sm" />
                              {c.name}
                            </span>
                            {isSelected && counts?.inbox !== undefined ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                                {counts.inbox}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* User avatar menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen((v) => !v);
                    setDatesOpen(false);
                    setActivityOpen(false);
                    setClientMenuOpen(false);
                  }}
                  aria-label="User menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-muted"
                >
                  <Avatar initials={getInitials(userName)} name={userName} size="sm" />
                </button>

                {userMenuOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
                    <div className="border-b border-border px-2.5 py-2">
                      <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {me?.user.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setUserMenuOpen(false);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      {theme === 'light' ? (
                        <Moon className="h-3.5 w-3.5" />
                      ) : (
                        <Sun className="h-3.5 w-3.5" />
                      )}
                      {theme === 'light' ? 'Dark mode' : 'Light mode'}
                    </button>
                    <Link
                      to="/app/settings/accounts"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings &amp; accounts
                    </Link>
                    {DEMO_MODE ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleSimulate();
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MailPlus className="h-3.5 w-3.5" />
                          Simulate email
                        </span>
                        <span className="text-[10px] text-muted-foreground">Demo</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate('/login', { replace: true });
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />

        <div className="mt-4 flex flex-1 gap-4 sm:gap-6">
          <NavRail reviewCount={counts?.review ?? 0} onOpenAsk={() => openAsk('')} />

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating demo Simulate pill */}
      {DEMO_MODE ? (
        <div className="fixed bottom-20 right-4 z-30 md:bottom-5 md:right-6">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={simulateEmail.isPending || !clientId}
            title="Simulated in prototype"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
          >
            <MailPlus className="h-3.5 w-3.5 text-accent-lime" />
            <span>{simulateEmail.isPending ? 'Simulating…' : '+ Simulate'}</span>
            <span className="hidden text-[10px] font-normal text-ink-muted sm:inline">
              Simulated in prototype
            </span>
          </button>
        </div>
      ) : null}

      <MobileTabBar
        reviewCount={counts?.review ?? 0}
        onOpenAsk={() => openAsk('')}
        onOpenMore={() => setMoreOpen(true)}
      />

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>Workspace menu</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            {me?.clients && me.clients.length > 0 ? (
              <div>
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
                    setMoreOpen(false);
                  }}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {me.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-1">
              <Link
                to="/c?preview=1"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Crown className="h-4 w-4" />
                Client view ({clientFirstName}&apos;s preview)
              </Link>
              <Link
                to="/app/settings/accounts"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                Settings &amp; accounts
              </Link>
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setMoreOpen(false);
                }}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
            </div>

            <div className="flex items-center justify-end border-t border-border pt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CommandPalette />
      <AskPanel />
      <GuidedTour />
    </div>
  );
}
