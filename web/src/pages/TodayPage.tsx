import { CalendarDays, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { FilterBar, type FilterDropdownDef } from '@/components/grove/FilterBar';
import { GlassList } from '@/components/grove/GlassList';
import { GlassStat } from '@/components/grove/GlassStat';
import { HeroBand } from '@/components/grove/HeroBand';
import type { GroveThreadCardModel } from '@/components/grove/models';
import { StackedBars } from '@/components/grove/StackedBars';
import { ThreadCard } from '@/components/grove/ThreadCard';
import { ThreadListRow } from '@/components/grove/ThreadListRow';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { useCreateDraft } from '@/features/composer/api';
import { useChangeOwner, usePatchThread, useThreadCounts, useThreads } from '@/features/inbox/api';
import { useDashboard, useRefreshBrief } from '@/features/today/api';
import {
  buildGroveRecentRows,
  buildGroveStats,
  buildGroveThreadCards,
  buildNeedsYourCallList,
  buildWeeklyBars,
  getTimeGreeting,
  splitFirstSentence,
  type TodayGroveFilters,
} from '@/features/today/mappers';
import { getOwnerShortLabel } from '@/lib/owners';
import { useUiStore } from '@/stores/ui';
import type { Category, Owner } from '@/types/api';

function getResponsivePageSize(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 4;
  if (window.matchMedia('(min-width: 1280px)').matches) return 4;
  if (window.matchMedia('(min-width: 768px)').matches) return 2;
  return 1;
}

function useResponsivePageSize(): number {
  const [pageSize, setPageSize] = useState<number>(getResponsivePageSize);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const xlQuery = window.matchMedia('(min-width: 1280px)');
    const mdQuery = window.matchMedia('(min-width: 768px)');
    const sync = () => setPageSize(getResponsivePageSize());
    xlQuery.addEventListener('change', sync);
    mdQuery.addEventListener('change', sync);
    return () => {
      xlQuery.removeEventListener('change', sync);
      mdQuery.removeEventListener('change', sync);
    };
  }, []);

  return pageSize;
}

export function TodayPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const lastSeenCounts = useUiStore((s) => s.lastSeenCounts);
  const setLastSeenCounts = useUiStore((s) => s.setLastSeenCounts);

  const activeClient =
    me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];
  const clientFirstName = activeClient?.name.split(' ')[0] || 'Priya';
  const userFirstName = me?.user.name.split(' ')[0] || 'Alex';

  const { data, isLoading, isError, refetch } = useDashboard(activeClient?.id);
  const { data: counts } = useThreadCounts(activeClient?.id);
  const { data: threadsRes } = useThreads({
    segment: 'inbox',
    clientId: activeClient?.id,
  });
  const refreshBrief = useRefreshBrief(activeClient?.id);
  const createDraft = useCreateDraft();
  const patchThread = usePatchThread();
  const changeOwner = useChangeOwner();
  const pageSize = useResponsivePageSize();

  const [briefOpen, setBriefOpen] = useState(false);
  const [weekChartOpen, setWeekChartOpen] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const filters = useMemo<TodayGroveFilters>(
    () => ({
      owner: (searchParams.get('owner') as TodayGroveFilters['owner']) || 'all',
      category: (searchParams.get('category') as TodayGroveFilters['category']) || 'all',
      date: (searchParams.get('date') as TodayGroveFilters['date']) || 'week',
      confidence: (searchParams.get('confidence') as TodayGroveFilters['confidence']) || 'all',
      source: (searchParams.get('source') as TodayGroveFilters['source']) || 'all',
    }),
    [searchParams]
  );
  const pageParam = Math.max(1, Number(searchParams.get('page') || '1') || 1);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    const isDefault =
      (key === 'date' && value === 'week') ||
      (key !== 'date' && value === 'all') ||
      (key === 'page' && value === '1');
    if (isDefault) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

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

  const allThreads = useMemo(() => {
    if (threadsRes?.data && threadsRes.data.length > 0) return threadsRes.data;
    if (!data) return [];
    const seen = new Set<string>();
    return [...data.review, ...data.recent, ...data.nudges].filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [threadsRes?.data, data]);

  const weeklyBars = useMemo(
    () => buildWeeklyBars(allThreads, activeClient?.timezone),
    [allThreads, activeClient?.timezone]
  );

  const groveStats = useMemo(
    () =>
      buildGroveStats(
        counts,
        activeClient?.id ? lastSeenCounts[activeClient.id] : undefined,
        clientFirstName,
        allThreads
      ),
    [counts, activeClient?.id, lastSeenCounts, clientFirstName, allThreads]
  );

  const callList = useMemo(
    () =>
      buildNeedsYourCallList(
        data?.review ?? [],
        data?.upcoming ?? [],
        activeClient?.timezone
      ),
    [data?.review, data?.upcoming, activeClient?.timezone]
  );

  const cards = useMemo(
    () => buildGroveThreadCards(allThreads, filters, clientFirstName, activeClient?.timezone),
    [allThreads, filters, clientFirstName, activeClient?.timezone]
  );

  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  const safePage = Math.min(pageParam, totalPages);
  const pageCards = cards.slice((safePage - 1) * pageSize, safePage * pageSize);

  const recentRows = useMemo(
    () => buildGroveRecentRows(data?.recent ?? allThreads),
    [data?.recent, allThreads]
  );

  const briefParts = data?.brief?.text ? splitFirstSentence(data.brief.text) : null;
  const dateChip = new Date().toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: activeClient?.timezone || undefined,
  });

  const handlePrimaryAction = (card: GroveThreadCardModel) => {
    const thread = allThreads.find((t) => t.id === card.id);
    setPendingCardId(card.id);

    if (card.owner === 'assistant') {
      createDraft.mutate(
        { threadId: card.id, tone: 'formal' },
        {
          onSuccess: () => {
            toast.success('Draft ready');
            navigate(`/app/inbox/inbox/${card.id}`);
          },
          onSettled: () => setPendingCardId(null),
        }
      );
      return;
    }

    if (card.owner === 'client') {
      if (!thread?.important && thread?.handoff?.state !== 'client_handling') {
        patchThread.mutate(
          {
            id: card.id,
            patch: { important: true },
            undoPatch: { important: false },
            label: `Moved to the top of ${clientFirstName}'s queue`,
          },
          { onSettled: () => setPendingCardId(null) }
        );
      } else {
        setPendingCardId(null);
        navigate('/c?preview=1');
      }
      return;
    }

    if (card.owner === 'review') {
      changeOwner.mutate(
        {
          id: card.id,
          owner: thread?.suggestedOwner ?? 'assistant',
          previousOwner: 'review',
        },
        { onSettled: () => setPendingCardId(null) }
      );
      return;
    }

    setPendingCardId(null);
    if (card.href) navigate(card.href);
  };

  const handleCardTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };

  const handleCardTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || totalPages <= 1) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== 'number') return;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (deltaX < -48 && safePage < totalPages) {
      updateFilter('page', String(safePage + 1));
    } else if (deltaX > 48 && safePage > 1) {
      updateFilter('page', String(safePage - 1));
    }
  };

  const filterDefs: FilterDropdownDef[] = [
    {
      id: 'owner',
      label: 'Owner',
      value: filters.owner,
      onChange: (v) => updateFilter('owner', v),
      options: [
        { value: 'all', label: 'Owner: All' },
        { value: 'assistant' as Owner, label: 'Owner: For you' },
        { value: 'client' as Owner, label: `Owner: For ${clientFirstName}` },
        { value: 'review' as Owner, label: 'Owner: Needs your call' },
        { value: 'none' as Owner, label: 'Owner: No reply' },
      ],
    },
    {
      id: 'category',
      label: 'Category',
      value: filters.category,
      onChange: (v) => updateFilter('category', v),
      options: [
        { value: 'all', label: 'Category: All' },
        { value: 'meeting' as Category, label: 'Meeting' },
        { value: 'action' as Category, label: 'Action' },
        { value: 'finance' as Category, label: 'Finance' },
        { value: 'legal' as Category, label: 'Legal' },
        { value: 'update' as Category, label: 'Update' },
        { value: 'newsletter' as Category, label: 'Newsletter' },
        { value: 'personal' as Category, label: 'Personal' },
        { value: 'general' as Category, label: 'General' },
      ],
    },
    {
      id: 'date',
      label: 'Date',
      value: filters.date,
      onChange: (v) => updateFilter('date', v),
      options: [
        { value: 'all', label: 'Date: Any time' },
        { value: 'week', label: 'Date: This week' },
        { value: 'today', label: 'Date: Today' },
      ],
    },
    {
      id: 'confidence',
      label: 'Confidence',
      value: filters.confidence,
      onChange: (v) => updateFilter('confidence', v),
      options: [
        { value: 'all', label: 'Confidence: Any' },
        { value: 'high', label: 'High (80%+)' },
        { value: 'medium', label: 'Medium (60–79%)' },
        { value: 'low', label: 'Needs review (<60%)' },
      ],
    },
    {
      id: 'source',
      label: 'Source',
      value: filters.source,
      onChange: (v) => updateFilter('source', v),
      options: [
        { value: 'all', label: 'Source: All' },
        { value: 'gmail', label: 'Gmail' },
        { value: 'demo', label: 'Demo workspace' },
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      <HeroBand
        size="tall"
        nav={<AssistantTopNav />}
        left={
          <div className="space-y-4">
            <div className="relative space-y-2 rounded-3xl bg-[radial-gradient(ellipse_at_25%_45%,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.12)_55%,transparent_78%)] py-1">
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="font-display text-[36px] font-semibold leading-[1.06] tracking-tight text-[var(--hero-fg)] sm:text-[52px]">
                  {getTimeGreeting()},<br />
                  {userFirstName}!
                </h1>
                <span className="glass mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {dateChip}
                </span>
              </div>

              {isLoading ? (
                <Skeleton className="h-10 max-w-md rounded-xl bg-[var(--glass-bg)]" />
              ) : briefParts ? (
                <div className="relative flex flex-wrap items-center gap-2 text-sm text-[var(--hero-muted)]">
                  <p className="max-w-xl">{briefParts.head}</p>
                  {briefParts.rest ? (
                    <button
                      type="button"
                      onClick={() => setBriefOpen((v) => !v)}
                      aria-expanded={briefOpen}
                      className="inline-flex min-h-[44px] items-center gap-0.5 px-1 text-xs font-semibold text-[var(--hero-fg)] underline underline-offset-4"
                    >
                      more
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => refreshBrief.mutate()}
                    disabled={refreshBrief.isPending}
                    aria-label="Refresh brief"
                    className="glass inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--glass-hover)] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshBrief.isPending ? 'animate-spin' : ''}`}
                    />
                  </button>
                  {briefOpen && briefParts.rest && data?.brief ? (
                    <div className="glass w-full rounded-2xl p-3 text-xs leading-relaxed text-[var(--glass-fg)]">
                      {data.brief.text}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {isLoading ? (
              <Skeleton className="h-44 w-full rounded-[20px] bg-[var(--glass-bg)]" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setWeekChartOpen((v) => !v)}
                  aria-expanded={weekChartOpen}
                  className="glass inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-medium md:hidden"
                >
                  This week
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${weekChartOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={weekChartOpen ? 'block' : 'hidden md:block'}>
                  <StackedBars
                    title="This week"
                    days={weeklyBars}
                    clientName={clientFirstName}
                    actionHref="/app/inbox/inbox"
                    onSelectOwner={(owner) => updateFilter('owner', owner)}
                  />
                </div>
              </>
            )}
          </div>
        }
        right={
          isLoading || isError || !data ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-[20px] bg-[var(--glass-bg)]" />
                <Skeleton className="h-28 rounded-[20px] bg-[var(--glass-bg)]" />
              </div>
              <Skeleton className="h-40 rounded-[20px] bg-[var(--glass-bg)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                {groveStats.map((stat) => (
                  <GlassStat key={stat.id} stat={stat} />
                ))}
              </div>
              <GlassList
                title={callList.title}
                actionHref={callList.actionHref}
                rows={callList.rows}
                emptyText={callList.emptyText}
              />
            </div>
          )
        }
      />

      {isLoading ? (
        <div className="working-panel space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-48 rounded-[18px]" />
            <Skeleton className="hidden h-48 rounded-[18px] md:block" />
            <Skeleton className="hidden h-48 rounded-[18px] xl:block" />
            <Skeleton className="hidden h-48 rounded-[18px] xl:block" />
          </div>
        </div>
      ) : isError || !data ? (
        <div className="working-panel">
          <ErrorState onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="working-panel space-y-6">
          <FilterBar
            filters={filterDefs}
            page={safePage}
            totalPages={totalPages}
            onPageChange={(p) => updateFilter('page', String(p))}
            onClearAll={clearAllFilters}
          />

          {pageCards.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No threads match these filters"
              description="Try clearing a filter or switching to All."
            />
          ) : (
            <div
              onTouchStart={handleCardTouchStart}
              onTouchEnd={handleCardTouchEnd}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {pageCards.map((card) => (
                <ThreadCard
                  key={card.id}
                  item={card}
                  actionPending={pendingCardId === card.id}
                  onOpen={(item) => item.href && navigate(item.href)}
                  onPrimaryAction={handlePrimaryAction}
                />
              ))}
            </div>
          )}

          <section aria-label="Recently sorted" className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                Recently sorted
              </h2>
              <Link
                to="/app/inbox/inbox"
                className="inline-flex min-h-[44px] items-center text-xs font-semibold text-primary hover:underline"
              >
                View inbox
              </Link>
            </div>

            {recentRows.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Inbox is clear"
                description="No recent conversations yet for this client."
              />
            ) : (
              <div className="space-y-2">
                {recentRows.map((row) => (
                  <ThreadListRow
                    key={row.id}
                    item={row}
                    ownerLabel={getOwnerShortLabel(row.owner, clientFirstName)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
