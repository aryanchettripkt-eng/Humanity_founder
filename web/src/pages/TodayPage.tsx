import { CalendarDays, Flame, RefreshCw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterChips, type FilterChipItem } from '@/features/landing/components/FilterChips';
import { ReplyCard } from '@/features/landing/components/ReplyCard';
import { SectionHeader } from '@/features/landing/components/SectionHeader';
import { StatWithDelta } from '@/features/landing/components/StatWithDelta';
import { TaskCard } from '@/features/landing/components/TaskCard';
import { TASK_EMPTY_COPY, THREAD_EMPTY_COPY, type TaskFilterId } from '@/features/landing/sampleData';
import { useChangeOwner } from '@/features/inbox/api';
import { useDashboard, useRefreshBrief } from '@/features/today/api';
import { TodaySummaryPanel } from '@/features/today/components/TodaySummaryPanel';
import { buildTodayTasks, threadToReplyCard } from '@/features/today/mappers';
import { formatUpcomingDate } from '@/lib/format';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { Owner } from '@/types/api';

type OwnerFilter = 'all' | Owner;

const OWNER_CHIPS: FilterChipItem<OwnerFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'assistant', label: OWNER_META.assistant.label, icon: OWNER_META.assistant.icon },
  { id: 'client', label: OWNER_META.client.label, icon: OWNER_META.client.icon },
  { id: 'none', label: OWNER_META.none.label, icon: OWNER_META.none.icon },
  { id: 'review', label: OWNER_META.review.label, icon: OWNER_META.review.icon },
];

const TASK_CHIPS: FilterChipItem<TaskFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent', icon: Flame },
  { id: 'due-today', label: 'Due today' },
  { id: 'waiting', label: 'Waiting on client' },
  { id: 'done', label: 'Done' },
];

export function TodayPage() {
  const navigate = useNavigate();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const { data, isLoading, isError, refetch } = useDashboard(activeClientId);
  const refreshBrief = useRefreshBrief(activeClientId);
  const changeOwner = useChangeOwner();

  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilterId>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const allThreads = useMemo(() => {
    if (!data) return [];
    const byId = new Map<string, (typeof data.recent)[number]>();
    for (const item of [...data.review, ...data.recent]) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
    return Array.from(byId.values());
  }, [data]);

  const visibleThreads = useMemo(() => {
    if (ownerFilter === 'all') return allThreads.slice(0, 4);
    return allThreads.filter((t) => t.owner === ownerFilter);
  }, [allThreads, ownerFilter]);

  const tasks = useMemo(() => (data ? buildTodayTasks(data) : []), [data]);

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter((t) => t.tags.includes(taskFilter));
  }, [tasks, taskFilter]);

  const selectedThread =
    allThreads.find((t) => t.id === selectedThreadId) ?? visibleThreads[0] ?? allThreads[0] ?? null;

  if (isLoading) {
    return (
      <div className="w-full space-y-6 p-6">
        <Skeleton className="h-24 w-full rounded-[28px]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} className="py-16" />;
  }

  const { counts, brief, upcoming, activity } = data;
  const threadCountLabel = `${visibleThreads.length} ${visibleThreads.length === 1 ? 'thread' : 'threads'}`;
  const taskCountLabel = `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`;

  return (
    <div className="theme-landing min-h-full w-full bg-landing-surface px-4 py-5 text-landing-ink sm:px-6 lg:px-8">
      <section
        aria-label="Upcoming dates from emails"
        className="mb-6 flex flex-wrap items-center gap-2 rounded-full bg-landing-ink p-2 text-landing-ink-foreground"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-landing-ink-surface px-3 py-1.5 text-xs font-medium">
          <CalendarDays className="h-3.5 w-3.5 text-landing-accent" aria-hidden="true" />
          <span>Next 7 days</span>
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-full bg-landing-accent px-4 py-1.5 text-xs text-landing-accent-foreground">
          {upcoming.length === 0 ? (
            <span className="font-medium">No dates in the next 7 days</span>
          ) : (
            upcoming.slice(0, 3).map((u, idx) => (
              <Link
                key={`${u.threadId}-${idx}`}
                to={`/app/inbox/inbox/${u.threadId}`}
                className="truncate font-medium hover:underline"
              >
                <strong className="font-bold">{formatUpcomingDate(u.startsAt)}</strong> {u.title}
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-landing-ink sm:text-5xl">
              WHO REPLIES?
            </h1>
            <Link
              to="/app/inbox"
              className="inline-flex h-11 items-center rounded-full bg-landing-ink px-5 text-sm font-medium text-landing-ink-foreground transition-opacity hover:opacity-90"
            >
              Open inbox
            </Link>
          </div>
          <div className="flex items-start gap-2 rounded-[20px] border border-landing-line bg-landing-card p-3.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-landing-ink" aria-hidden="true" />
            <p className="flex-1 text-sm leading-relaxed text-landing-ink">{brief.text}</p>
            <button
              type="button"
              aria-label="Refresh brief"
              disabled={refreshBrief.isPending}
              onClick={() => refreshBrief.mutate()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-landing-line text-landing-muted hover:text-landing-ink"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshBrief.isPending && 'animate-spin')}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:flex sm:items-end sm:gap-8">
          <StatWithDelta
            stat={{
              id: 'you',
              value: counts.assistant ?? 0,
              label: 'for you',
              delta: `${counts.action ?? 0} action`,
              direction: 'up',
            }}
          />
          <StatWithDelta
            stat={{
              id: 'client',
              value: counts.client ?? 0,
              label: 'for client',
              delta: `${counts.waiting ?? 0} waiting`,
              direction: 'down',
            }}
          />
          <StatWithDelta
            stat={{
              id: 'review',
              value: counts.review ?? 0,
              label: 'needs review',
              delta: `${counts.inbox ?? 0} open`,
              direction: 'up',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="today-replies-heading" className="space-y-4">
            <SectionHeader
              id="today-replies-heading"
              title="Who needs to reply"
              countLabel={threadCountLabel}
              liveText={`Showing ${threadCountLabel}`}
            />
            <FilterChips items={OWNER_CHIPS} value={ownerFilter} onChange={setOwnerFilter} />

            {visibleThreads.length === 0 ? (
              <p className="rounded-[24px] border border-landing-line bg-landing-card/75 px-5 py-6 text-sm text-landing-muted">
                {THREAD_EMPTY_COPY[ownerFilter]}
              </p>
            ) : (
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
                {visibleThreads.map((thread) => (
                  <div key={thread.id} className="flex w-[82%] shrink-0 snap-start md:w-auto">
                    <ReplyCard
                      thread={threadToReplyCard(thread)}
                      selected={selectedThread?.id === thread.id}
                      onSelect={() => setSelectedThreadId(thread.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="today-tasks-heading" className="space-y-4">
            <SectionHeader
              id="today-tasks-heading"
              title="Your day"
              countLabel={taskCountLabel}
              liveText={`Showing ${taskCountLabel}`}
            />
            <FilterChips items={TASK_CHIPS} value={taskFilter} onChange={setTaskFilter} />

            {visibleTasks.length === 0 ? (
              <p className="rounded-[24px] border border-landing-line bg-landing-card px-5 py-6 text-sm text-landing-muted">
                {TASK_EMPTY_COPY[taskFilter]}
              </p>
            ) : (
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
                {visibleTasks.map((task) => (
                  <div key={task.id} className="flex w-[82%] shrink-0 snap-start md:w-auto">
                    <TaskCard
                      task={task}
                      onTryDemo={() =>
                        task.isCalendar
                          ? toast.success(`Added "${task.title}" to calendar (simulated)`)
                          : navigate(task.href)
                      }
                    />
                  </div>
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
