import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, Table2 } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { GlassTabs } from '@/components/grove/GlassTabs';
import { HeroBand } from '@/components/grove/HeroBand';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { useActivityFeed, useStatsThreads } from '@/features/stats/api';
import { BarList } from '@/features/stats/components/BarList';
import { SeriesLegend, VolumeChart } from '@/features/stats/components/VolumeChart';
import {
  activityLine,
  CATEGORY_LABELS,
  confidenceBuckets,
  countBy,
  handoffStats,
  inRange,
  OWNER_SERIES_VAR,
  pct,
  sortingStats,
  STATS_OWNER_ORDER,
  volumeByDay,
  type StatsRange,
} from '@/features/stats/mappers';
import { formatRelativeTime } from '@/lib/format';
import { getOwnerShortLabel } from '@/lib/owners';
import { useSocketEvent } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { Category, Owner } from '@/types/api';

function Card({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('glass-card min-w-0 rounded-[20px] p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[20px] font-semibold leading-tight text-[var(--fg)]">
            {title}
          </h2>
          {hint ? <p className="mt-1 text-sm text-[var(--fg-muted)]">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  to,
  loading,
}: {
  label: string;
  value: string | number;
  sub: string;
  to?: string;
  loading?: boolean;
}) {
  const body = (
    <>
      <span className="text-sm font-medium leading-snug text-[var(--fg-muted)]">{label}</span>
      {loading ? (
        <Skeleton className="mt-2 h-10 w-20 rounded-xl bg-[var(--card-glass-bg)]" />
      ) : (
        <span className="mt-1 font-display text-[32px] font-bold sm:text-[40px] leading-none tracking-tight tabular-nums text-[var(--fg)]">
          {value}
        </span>
      )}
      <span className="mt-2 text-sm text-[var(--fg-muted)]">{sub}</span>
    </>
  );
  const cls = 'glass-card flex min-w-0 flex-col rounded-[20px] p-4 sm:p-5';
  return to ? (
    <Link to={to} className={cn(cls, 'transition-colors hover:bg-[var(--glass-hover)]')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Statistics (/app/stats): how the AI sorted, how much you corrected, what went
 * to the client and what came back. Computed from the latest threads in the
 * open, done and archived segments.
 */
export function StatsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const activeClient = me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];
  const clientFirstName = activeClient?.name.split(' ')[0] || 'Client';

  const range: StatsRange = searchParams.get('range') === '30' ? 30 : 7;
  const setRange = (r: StatsRange) => {
    const next = new URLSearchParams(searchParams);
    if (r === 7) next.delete('range');
    else next.set('range', '30');
    setSearchParams(next, { replace: true });
  };
  const [showTable, setShowTable] = useState(false);

  const statsQuery = useStatsThreads(activeClient?.id);
  const activityQuery = useActivityFeed(activeClient?.id, 12);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  }, [queryClient]);
  useSocketEvent('thread:created', refresh);
  useSocketEvent('thread:updated', refresh);
  useSocketEvent('activity:new', refresh);

  const all = statsQuery.data?.threads;
  const threads = useMemo(() => inRange(all ?? [], range), [all, range]);
  const days = useMemo(() => volumeByDay(threads, range), [threads, range]);
  const sorting = useMemo(() => sortingStats(threads), [threads]);
  const handoffs = useMemo(() => handoffStats(threads), [threads]);
  const owners = useMemo(() => countBy(threads, (t) => t.owner), [threads]);
  const categories = useMemo(() => countBy(threads, (t) => t.category), [threads]);
  const confidence = useMemo(() => confidenceBuckets(threads), [threads]);

  const ownerLabel = (o: Owner) => getOwnerShortLabel(o, clientFirstName);
  const loading = statsQuery.isLoading;
  const fetched = all?.length ?? 0;
  const totalAll = statsQuery.data?.total ?? 0;

  const summary = loading
    ? ' '
    : sorting.total === 0
      ? `No email in the last ${range} days.`
      : `${sorting.total} emails in the last ${range} days. You kept the AI's call on ${pct(
          sorting.keptAsSorted,
          sorting.total
        )} of them.`;

  const categoryItems = (Object.keys(CATEGORY_LABELS) as Category[])
    .map((c) => ({ id: c, label: CATEGORY_LABELS[c], value: categories[c] ?? 0 }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <HeroBand
        size="short"
        nav={<AssistantTopNav />}
        left={
          <div className="space-y-1">
            <h1
              style={{ textShadow: 'var(--hero-text-shadow)' }}
              className="font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-[var(--fg)] md:text-[48px]"
            >
              Statistics
            </h1>
            <p className="text-base text-[var(--fg-muted)] md:text-lg">{summary}</p>
          </div>
        }
        right={
          <div className="flex xl:justify-end">
            <GlassTabs<'7' | '30'>
              ariaLabel="Date range"
              items={[
                { id: '7', label: 'Last 7 days' },
                { id: '30', label: 'Last 30 days' },
              ]}
              activeId={String(range) as '7' | '30'}
              onChange={(id) => setRange(id === '30' ? 30 : 7)}
            />
          </div>
        }
      />

      <div className="mx-[clamp(16px,2.5vw,32px)] mb-[clamp(16px,2.5vw,32px)] flex min-h-0 flex-1 flex-col">
        <div className="working-panel grove-scroll min-h-0 flex-1 space-y-4 overflow-y-auto">
          {statsQuery.isError ? (
            <ErrorState
              message="Couldn't load your statistics."
              onRetry={() => statsQuery.refetch()}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Kpi
                  label="Emails sorted"
                  value={sorting.total}
                  sub={`Last ${range} days`}
                  loading={loading}
                />
                <Kpi
                  label="Kept as the AI sorted"
                  value={pct(sorting.keptAsSorted, sorting.total)}
                  sub={`${sorting.keptAsSorted} of ${sorting.total}, no change by you`}
                  loading={loading}
                />
                <Kpi
                  label="Corrected by you"
                  value={sorting.correctedByYou}
                  sub={`${sorting.byYourRules} more sorted by your rules`}
                  loading={loading}
                />
                <Kpi
                  label="Needed your call"
                  value={sorting.neededYourCall}
                  sub="The AI wasn't sure, so it asked you"
                  to="/app/inbox/review"
                  loading={loading}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
                <Card
                  title="Emails per day"
                  hint="By the day of the latest message, split by who they're for now."
                  action={
                    <div className="flex items-center gap-1" role="group" aria-label="View">
                      <button
                        type="button"
                        aria-pressed={!showTable}
                        aria-label="Chart view"
                        onClick={() => setShowTable(false)}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                          !showTable
                            ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                            : 'text-[var(--fg-muted)] hover:bg-[var(--glass-hover)]'
                        )}
                      >
                        <BarChart3 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-pressed={showTable}
                        aria-label="Table view"
                        onClick={() => setShowTable(true)}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                          showTable
                            ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                            : 'text-[var(--fg-muted)] hover:bg-[var(--glass-hover)]'
                        )}
                      >
                        <Table2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  }
                >
                  {loading ? (
                    <Skeleton className="h-[220px] w-full rounded-2xl bg-[var(--card-glass-bg)]" />
                  ) : (
                    <div className="space-y-3">
                      {!showTable ? <SeriesLegend ownerLabel={ownerLabel} /> : null}
                      <VolumeChart days={days} ownerLabel={ownerLabel} showTable={showTable} />
                    </div>
                  )}
                </Card>

                <Card title="Who it's for" hint="Where each email sits now.">
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl bg-[var(--card-glass-bg)]" />
                  ) : (
                    <BarList
                      items={STATS_OWNER_ORDER.map((o) => ({
                        id: o,
                        label: ownerLabel(o),
                        value: owners[o] ?? 0,
                        color: OWNER_SERIES_VAR[o],
                      }))}
                    />
                  )}
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card title="Categories">
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl bg-[var(--card-glass-bg)]" />
                  ) : (
                    <BarList items={categoryItems} />
                  )}
                </Card>

                <Card title="AI confidence" hint="Emails the AI sorted on its own.">
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl bg-[var(--card-glass-bg)]" />
                  ) : (
                    <BarList items={confidence} emptyText="The AI hasn't sorted anything yet." />
                  )}
                </Card>

                <Card
                  title={`${clientFirstName}'s side`}
                  hint={`What ${clientFirstName} did with emails in their queue.`}
                  className="md:col-span-2 xl:col-span-1"
                >
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl bg-[var(--card-glass-bg)]" />
                  ) : (
                    <BarList
                      emptyText={`${clientFirstName} hasn't acted on anything yet.`}
                      items={[
                        { id: 'handling', label: `${clientFirstName}'s on it`, value: handoffs.handling },
                        { id: 'back', label: 'Handed back to you', value: handoffs.handedBack },
                        { id: 'handled', label: `Handled by ${clientFirstName}`, value: handoffs.handled },
                      ]}
                    />
                  )}
                </Card>
              </div>

              <Card title="Recent activity">
                {activityQuery.isLoading ? (
                  <Skeleton className="h-32 w-full rounded-2xl bg-[var(--card-glass-bg)]" />
                ) : activityQuery.isError ? (
                  <p className="text-sm text-[var(--fg-muted)]">Couldn&apos;t load activity.</p>
                ) : (activityQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--fg-muted)]">Nothing has happened yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--glass-divider)]">
                    {(activityQuery.data ?? []).map((a) => {
                      const line = activityLine(a);
                      const row = (
                        <>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] text-[var(--fg)]">
                              {line.text}
                            </span>
                            {line.detail ? (
                              <span className="block truncate text-sm text-[var(--fg-muted)]">
                                {line.detail}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-[var(--fg-subtle)]">
                            {formatRelativeTime(a.createdAt)}
                          </span>
                        </>
                      );
                      const cls =
                        'flex min-h-[44px] items-center justify-between gap-4 py-2.5';
                      return (
                        <li key={a.id}>
                          {a.threadId ? (
                            <Link
                              to={`/app/inbox/inbox/${a.threadId}`}
                              className={cn(cls, 'rounded-lg hover:text-[var(--fg)]')}
                            >
                              {row}
                            </Link>
                          ) : (
                            <div className={cls}>{row}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              {!loading && totalAll > fetched ? (
                <p className="text-sm text-[var(--fg-muted)]">
                  Based on the latest {fetched} of {totalAll} emails.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
