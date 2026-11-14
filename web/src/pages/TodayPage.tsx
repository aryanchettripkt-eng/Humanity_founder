import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { OwnerPill } from '@/components/common/OwnerPill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChangeOwner } from '@/features/inbox/api';
import { useDashboard, useRefreshBrief } from '@/features/today/api';
import { formatRelativeTime, formatShortDate, formatUpcomingDate } from '@/lib/format';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { Owner } from '@/types/api';

export function TodayPage() {
  const navigate = useNavigate();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const { data, isLoading, isError, refetch } = useDashboard(activeClientId);
  const refreshBrief = useRefreshBrief(activeClientId);
  const changeOwner = useChangeOwner();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} className="py-16" />;
  }

  const { counts, brief, upcoming, review, recent, nudges, activity } = data;

  const tiles: Array<{ label: string; count: number; href: string; owner?: Owner }> = [
    { label: 'Needs you', count: counts.assistant ?? 0, href: '/app/inbox/assistant', owner: 'assistant' },
    { label: 'Needs client', count: counts.client ?? 0, href: '/app/inbox/client', owner: 'client' },
    { label: 'Needs review', count: counts.review ?? 0, href: '/app/inbox/review', owner: 'review' },
    { label: 'Waiting on others', count: counts.waiting ?? 0, href: '/app/inbox/waiting' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Morning Brief */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Morning brief</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground sm:text-base">{brief.text}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Refresh brief"
            disabled={refreshBrief.isPending}
            onClick={() => refreshBrief.mutate()}
          >
            <RefreshCw className={cn('h-4 w-4', refreshBrief.isPending && 'animate-spin')} />
          </Button>
        </div>
      </Card>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => {
          const dotClass = tile.owner ? OWNER_META[tile.owner].dotClass : 'bg-muted-foreground';
          return (
            <Link
              key={tile.label}
              to={tile.href}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className={cn('h-2 w-2 rounded-full', dotClass)} />
                <span>{tile.label}</span>
              </div>
              <p
                className={cn(
                  'mt-2 text-3xl font-semibold tracking-tight tabular-nums',
                  tile.count === 0 ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {tile.count}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Secondary counts */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>
          Open inbox: <strong className="text-foreground tabular-nums">{counts.inbox ?? 0}</strong>
        </span>
        <span>
          Action required: <strong className="text-foreground tabular-nums">{counts.action ?? 0}</strong>
        </span>
        <span>
          Important: <strong className="text-foreground tabular-nums">{counts.important ?? 0}</strong>
        </span>
        <span>
          Meetings: <strong className="text-foreground tabular-nums">{counts.meetings ?? 0}</strong>
        </span>
      </div>

      {/* Needs review strip */}
      {review.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Quick review</h2>
            <Link to="/app/inbox/review" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {review.map((t) => (
              <Card key={t.id} className="w-72 shrink-0 space-y-2.5 p-3.5">
                <Link
                  to={`/app/inbox/review/${t.id}`}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {t.subject}
                </Link>
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.reason || t.snippet}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  {(['assistant', 'client', 'none'] as Owner[]).map((o) => (
                    <Button
                      key={o}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        changeOwner.mutate({ id: t.id, owner: o, previousOwner: t.owner })
                      }
                    >
                      {OWNER_META[o].label}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Main 2-column grid: Upcoming + Activity + Recent + Nudges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-foreground">Recent conversations</h2>
            <Card className="divide-y divide-border">
              {recent.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No conversations yet" />
              ) : (
                recent.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/app/inbox/inbox/${t.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.participants?.[0]?.name || t.participants?.[0]?.email} · {t.snippet}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <OwnerPill owner={t.owner} source={t.ownerSource} hideLabelOnSmall />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatShortDate(t.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </Card>
          </section>

          {nudges?.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Follow-up nudges (3+ days silent)</span>
              </div>
              <Card className="divide-y divide-border">
                {nudges.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/app/inbox/waiting/${t.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Sent {formatRelativeTime(t.lastMessageAt)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary">Follow up</span>
                  </button>
                ))}
              </Card>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-foreground">Upcoming (next 7 days)</h2>
            <Card className="p-3">
              {upcoming.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No dates in the next 7 days
                </p>
              ) : (
                <div className="space-y-2.5">
                  {upcoming.map((u, idx) => (
                    <div
                      key={`${u.threadId}-${idx}`}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border bg-surface p-2.5 text-xs"
                    >
                      <Link to={`/app/inbox/inbox/${u.threadId}`} className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground hover:underline">
                          {u.title}
                        </p>
                        <p className="text-muted-foreground">{formatUpcomingDate(u.startsAt)}</p>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => toast.success(`Added "${u.title}" to calendar (simulated)`)}
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-foreground">Activity</h2>
            <Card className="p-3">
              {activity.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activity.slice(0, 8).map((a) => (
                    <div key={a.id} className="text-xs">
                      <p className="text-foreground">
                        <span className="font-medium">{a.actor.name}</span>{' '}
                        <span className="text-muted-foreground">
                          {a.type.replace(/_/g, ' ')}
                        </span>
                        {typeof a.payload?.subject === 'string' && ` · ${a.payload.subject}`}
                      </p>
                      {typeof a.payload?.note === 'string' && (
                        <p className="mt-0.5 text-muted-foreground">“{a.payload.note}”</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelativeTime(a.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

