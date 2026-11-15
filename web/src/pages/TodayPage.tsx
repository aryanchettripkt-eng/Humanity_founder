import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChipRow, type ChipRowItem } from '@/components/common/ChipRow';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { NotchedCard } from '@/components/common/NotchedCard';
import { PillBar } from '@/components/common/PillBar';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatWithBadge } from '@/components/common/StatWithBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { useChangeOwner, usePatchThread } from '@/features/inbox/api';
import { ThreadRow } from '@/features/inbox/components/ThreadRow';
import { useDashboard, useRefreshBrief } from '@/features/today/api';
import { TodaySummaryPanel } from '@/features/today/components/TodaySummaryPanel';
import {
  buildScheduleSlots,
  buildTodayTasks,
  getTimeGreeting,
  type TodayTaskFilter,
} from '@/features/today/mappers';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { Owner } from '@/types/api';

const TASK_FILTERS: ChipRowItem<TodayTaskFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'dates', label: 'Dates', icon: CalendarDays },
  { id: 'follow-ups', label: 'Follow-ups', icon: Clock },
  { id: 'client', label: 'Waiting on client', icon: Crown },
];

const TASK_EMPTY: Record<TodayTaskFilter, string> = {
  all: 'Nothing scheduled for today.',
  dates: 'No dates in the next 7 days.',
  'follow-ups': 'No follow-up nudges right now.',
  client: 'Nothing waiting on your client.',
};

export function TodayPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const activeClient =
    me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];

  const { data, isLoading, isError, refetch } = useDashboard(activeClient?.id);
  const refreshBrief = useRefreshBrief(activeClient?.id);
  const changeOwner = useChangeOwner();
  const patchThread = usePatchThread();

  const [taskFilter, setTaskFilter] = useState<TodayTaskFilter>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const tasks = useMemo(
    () => (data ? buildTodayTasks(data, activeClient?.timezone) : []),
    [data, activeClient?.timezone]
  );

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    const filterKind =
      taskFilter === 'dates' ? 'date' : taskFilter === 'follow-ups' ? 'nudge' : 'client';
    return tasks.filter((t) => t.kind === filterKind);
  }, [tasks, taskFilter]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-28 w-full rounded-[24px]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} className="py-16" />;
  }

  const { counts, brief, upcoming, review, recent, activity } = data;
  const firstName = me?.user.name?.split(/\s+/)[0] || 'there';
  const clientFirstName = activeClient?.name?.split(/\s+/)[0] || 'Client';
  const scheduleSlots = buildScheduleSlots(upcoming, activeClient?.timezone);

  const allThreads = [...review, ...recent];
  const selectedThread =
    allThreads.find((t) => t.id === selectedThreadId) ?? recent[0] ?? review[0] ?? null;

  return (
    <div className="min-h-full w-full space-y-8 bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <PillBar
        ariaLabel="Upcoming dates from emails"
        dateLabel="Next 7 days"
        slots={scheduleSlots}
        emptyText="No dates in the next 7 days"
      />

      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {getTimeGreeting()}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {clientFirstName}&apos;s inbox · {counts.inbox ?? 0} open
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-[24px] border border-border bg-card p-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
            <p className="flex-1 text-sm leading-relaxed text-foreground">{brief.text}</p>
            <button
              type="button"
              aria-label="Refresh brief"
              title="Refresh brief"
              disabled={refreshBrief.isPending}
              onClick={() => refreshBrief.mutate()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshBrief.isPending && 'animate-spin')}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:flex sm:items-end sm:gap-8">
          <StatWithBadge value={counts.assistant ?? 0} label="for you" />
          <StatWithBadge value={counts.client ?? 0} label="for client" />
          <StatWithBadge value={counts.review ?? 0} label="needs review" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="needs-call-heading" className="space-y-4">
            <SectionHeader
              id="needs-call-heading"
              title="Needs your call"
              countLabel={`${review.length} ${review.length === 1 ? 'thread' : 'threads'}`}
            />

            {review.length === 0 ? (
              <div className="rounded-[24px] border border-border bg-card p-5">
                <EmptyState
                  icon={CheckCircle2}
                  title="AI is confident about everything right now."
                />
              </div>
            ) : (
              <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
                {review.map((thread) => (
                  <div key={thread.id} className="flex w-[82%] shrink-0 snap-start md:w-auto">
                    <NotchedCard
                      tone="default"
                      selected={selectedThread?.id === thread.id}
                      notch={
                        <Link
                          to={`/app/inbox/review/${thread.id}`}
                          aria-label={`Open ${thread.subject}`}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      }
                    >
                      <Link
                        to={`/app/inbox/review/${thread.id}`}
                        className="line-clamp-1 pr-12 text-base font-semibold text-foreground hover:underline"
                      >
                        {thread.subject}
                      </Link>
                      <p className="mt-1.5 line-clamp-2 min-h-[36px] text-xs leading-relaxed text-muted-foreground">
                        {thread.reason || thread.snippet}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                        {(['assistant', 'client', 'none'] as Owner[]).map((owner) => (
                          <button
                            key={owner}
                            type="button"
                            onClick={() =>
                              changeOwner.mutate({
                                id: thread.id,
                                owner,
                                previousOwner: thread.owner,
                              })
                            }
                            className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            {OWNER_META[owner].label}
                          </button>
                        ))}
                      </div>
                    </NotchedCard>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="today-tasks-heading" className="space-y-4">
            <SectionHeader
              id="today-tasks-heading"
              title="Your day"
              countLabel={`${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`}
              liveText={`Showing ${visibleTasks.length} tasks`}
            />
            <ChipRow items={TASK_FILTERS} value={taskFilter} onChange={setTaskFilter} />

            {visibleTasks.length === 0 ? (
              <p className="rounded-[24px] border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
                {TASK_EMPTY[taskFilter]}
              </p>
            ) : (
              <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
                {visibleTasks.map((task) => {
                  const isLime = Boolean(task.highlighted);
                  return (
                    <div key={task.id} className="flex w-[82%] shrink-0 snap-start md:w-auto">
                      <NotchedCard
                        tone={isLime ? 'lime' : 'default'}
                        className="min-h-[196px] justify-between"
                        notch={
                          <button
                            type="button"
                            onClick={() => navigate(task.href)}
                            aria-label={`Open ${task.title}`}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        }
                      >
                        <div className="pr-12">
                          <p className="truncate text-xs font-medium opacity-75">{task.role}</p>
                          <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug">
                            {task.title}
                          </h3>
                          {task.timeLabel && (
                            <p className="mt-1.5 text-xs font-medium opacity-85 tabular-nums">
                              {task.timeLabel}
                            </p>
                          )}
                          {task.subtitle && (
                            <p className="mt-1.5 line-clamp-2 text-xs opacity-80">
                              {task.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="mt-auto pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              task.kind === 'date'
                                ? toast.success(`Added "${task.title}" to calendar (simulated)`)
                                : navigate(task.href)
                            }
                            className={cn(
                              'inline-flex h-10 items-center rounded-full px-4 text-xs font-medium transition-opacity hover:opacity-90',
                              isLime
                                ? 'bg-ink text-ink-foreground'
                                : 'border border-border bg-background text-foreground'
                            )}
                          >
                            {task.statusLabel}
                          </button>
                        </div>
                      </NotchedCard>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="recent-threads-heading" className="space-y-4">
            <SectionHeader
              id="recent-threads-heading"
              title="Recent threads"
              countLabel={`${recent.slice(0, 5).length} threads`}
            />
            {recent.length === 0 ? (
              <div className="rounded-[24px] border border-border bg-card p-5">
                <EmptyState icon={CheckCircle2} title="No conversations yet" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-border bg-card">
                {recent.slice(0, 5).map((thread) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    selected={selectedThread?.id === thread.id}
                    onSelect={() => setSelectedThreadId(thread.id)}
                    onToggleImportant={(important) =>
                      patchThread.mutate({ id: thread.id, patch: { important } })
                    }
                    onChangeOwner={(owner) =>
                      changeOwner.mutate({
                        id: thread.id,
                        owner,
                        previousOwner: thread.owner,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <TodaySummaryPanel
          thread={selectedThread}
          activity={activity}
          onAssignOwner={(thread, owner) =>
            changeOwner.mutate({ id: thread.id, owner, previousOwner: thread.owner })
          }
        />
      </div>
    </div>
  );
}
