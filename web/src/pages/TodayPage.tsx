import { CalendarDays, Clock, Crown, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ChipRowItem } from '@/components/common/ChipRow';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceGrid } from '@/components/workspace/WorkspaceGrid';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { useMe } from '@/features/auth/api';
import { useChangeOwner, usePatchThread, useThreadCounts } from '@/features/inbox/api';
import { ThreadRow } from '@/features/inbox/components/ThreadRow';
import { useDashboard, useRefreshBrief } from '@/features/today/api';
import {
  buildFocusPanelModel,
  buildPersonCards,
  buildTaskCards,
  buildWorkspaceStats,
  getTimeGreeting,
  type TodayPersonFilter,
  type TodayTaskFilter,
} from '@/features/today/mappers';
import { useCommandStore } from '@/stores/command';
import { useUiStore } from '@/stores/ui';
import type { Owner, ThreadStatus } from '@/types/api';

const PEOPLE_CHIPS: ChipRowItem<TodayPersonFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'Needs review' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'client', label: 'Client' },
  { id: 'none', label: 'No reply' },
];

const TASK_CHIPS: ChipRowItem<TodayTaskFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'dates', label: 'Dates', icon: CalendarDays },
  { id: 'follow-ups', label: 'Follow-ups', icon: Clock },
  { id: 'client', label: 'Waiting on client', icon: Crown },
];

export function TodayPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const lastSeenCounts = useUiStore((s) => s.lastSeenCounts);
  const setLastSeenCounts = useUiStore((s) => s.setLastSeenCounts);
  const openAsk = useCommandStore((s) => s.openAsk);

  const activeClient =
    me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];

  const { data, isLoading, isError, refetch } = useDashboard(activeClient?.id);
  const { data: counts } = useThreadCounts(activeClient?.id);
  const refreshBrief = useRefreshBrief(activeClient?.id);
  const changeOwner = useChangeOwner();
  const patchThread = usePatchThread();

  const [peopleFilter, setPeopleFilter] = useState<TodayPersonFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TodayTaskFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<{ id: string; owner: Owner } | null>(null);

  const latestCountsRef = useRef(counts);
  latestCountsRef.current = counts;

  useEffect(() => {
    const id = activeClient?.id;
    return () => {
      const c = latestCountsRef.current;
      if (id && c) {
        setLastSeenCounts(id, {
          assistant: c.assistant ?? 0,
          client: c.client ?? 0,
          review: c.review ?? 0,
        });
      }
    };
  }, [activeClient?.id, setLastSeenCounts]);

  const stats = useMemo(
    () => buildWorkspaceStats(counts, activeClient?.id ? lastSeenCounts[activeClient.id] : undefined),
    [counts, activeClient?.id, lastSeenCounts]
  );

  const people = useMemo(
    () => (data ? buildPersonCards(data, peopleFilter) : []),
    [data, peopleFilter]
  );

  const tasks = useMemo(
    () => (data ? buildTaskCards(data, activeClient?.timezone, taskFilter) : []),
    [data, activeClient?.timezone, taskFilter]
  );

  const focusModel = useMemo(
    () => (data ? buildFocusPanelModel(selectedId, data, activeClient?.timezone) : null),
    [selectedId, data, activeClient?.timezone]
  );

  const handleQuickAssign = useCallback(
    (id: string, owner: Exclude<Owner, 'review'>) => {
      setAssigning({ id, owner });
      changeOwner.mutate(
        { id, owner },
        {
          onSettled: () => setAssigning(null),
        }
      );
    },
    [changeOwner]
  );

  // Keyboard quick-assign 1/2/3 for selected review card
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const targetId = selectedId ?? people.find((p) => p.owner === 'review')?.id;
      const target = people.find((p) => p.id === targetId);
      if (!target || target.owner !== 'review') return;

      if (e.key === '1') handleQuickAssign(target.id, 'assistant');
      if (e.key === '2') handleQuickAssign(target.id, 'client');
      if (e.key === '3') handleQuickAssign(target.id, 'none');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, people, handleQuickAssign]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-2 sm:p-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const userFirstName = me?.user.name.split(' ')[0] || 'Alex';
  const clientFirstName = activeClient?.name.split(' ')[0] || 'Client';

  return (
    <div className="space-y-8 pb-6">
      <WorkspaceHeader
        eyebrow={`${getTimeGreeting()}, ${userFirstName}`}
        title={`${clientFirstName.toUpperCase()}'S INBOX`}
        primaryLabel="Ask AI"
        primaryHint="⌘K"
        onPrimaryAction={() => openAsk('')}
        stats={stats}
        briefText={data.brief?.text}
        briefRefreshing={refreshBrief.isPending}
        onRefreshBrief={() => refreshBrief.mutate()}
      />

      <WorkspaceGrid
        peopleCountLabel={`${people.length} shown`}
        peopleChips={PEOPLE_CHIPS}
        activePeopleChip={peopleFilter}
        onPeopleChipChange={setPeopleFilter}
        people={people}
        onViewAll={() => navigate('/app/inbox/inbox')}
        tasksCountLabel={`${tasks.length} items`}
        tasksChips={TASK_CHIPS}
        activeTasksChip={taskFilter}
        onTasksChipChange={setTaskFilter}
        tasks={tasks}
        selectedId={selectedId ?? focusModel?.id ?? null}
        onSelectCard={(id) => setSelectedId(id)}
        onOpenPerson={(item) => item.href && navigate(item.href)}
        onQuickAssign={handleQuickAssign}
        assigningId={assigning?.id ?? null}
        assigningOwner={assigning?.owner ?? null}
        onOpenTask={(item) => item.href && navigate(item.href)}
        onTaskPrimaryAction={(item) => item.href && navigate(item.href)}
        onTaskStatusChange={(item, statusId) => {
          patchThread.mutate({
            id: item.threadId ?? item.id,
            patch: { status: statusId as ThreadStatus },
          });
        }}
        focusModel={focusModel}
        onOpenFocusThread={(id) => navigate(`/app/inbox/inbox/${id}`)}
        onChangeOwner={(id) => navigate(`/app/inbox/inbox/${id}`)}
        onAddDate={(_dateId, title) => toast.success(`Added "${title}" to calendar`)}
      />

      <section aria-label="Recent threads" className="space-y-3">
        <SectionHeader
          id="recent-conversations"
          title="Recent conversations"
          countLabel={`${Math.min(5, data.recent.length)} latest`}
        />
        {data.recent.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Inbox is clear"
            description="No recent conversations yet for this client."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            {data.recent.slice(0, 5).map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                selected={selectedId === thread.id}
                onSelect={() => navigate(`/app/inbox/inbox/${thread.id}`)}
                onToggleImportant={(important) =>
                  patchThread.mutate({ id: thread.id, patch: { important } })
                }
                onChangeOwner={(owner) => changeOwner.mutate({ id: thread.id, owner })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
