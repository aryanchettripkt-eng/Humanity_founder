import { CalendarDays, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { FilterBar, type FilterDropdownDef } from '@/components/grove/FilterBar';
import { GlassList } from '@/components/grove/GlassList';
import { GlassStat } from '@/components/grove/GlassStat';
import { HeroBand } from '@/components/grove/HeroBand';
import { StackedBars } from '@/components/grove/StackedBars';
import { ThreadCard } from '@/components/grove/ThreadCard';
import { ThreadListRow } from '@/components/grove/ThreadListRow';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { useThreadCounts, useThreads } from '@/features/inbox/api';
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
import { useUiStore } from '@/stores/ui';
import type { Category, Owner } from '@/types/api';

const PAGE_SIZE = 4;

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

  const [briefOpen, setBriefOpen] = useState(false);

  const filters = useMemo<TodayGroveFilters>(
    () => ({
      owner: (searchParams.get('owner') as TodayGroveFilters['owner']) || 'all',
      category: (searchParams.get('category') as TodayGroveFilters['category']) || 'all',
      date: (searchParams.get('date') as TodayGroveFilters['date']) || 'all',
      confidence: (searchParams.get('confidence') as TodayGroveFilters['confidence']) || 'all',
      source: (searchParams.get('source') as TodayGroveFilters['source']) || 'all',
    }),
    [searchParams]
  );
  const pageParam = Math.max(1, Number(searchParams.get('page') || '1') || 1);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || (key === 'page' && value === '1')) next.delete(key);
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

  const weeklyBars = useMemo(() => buildWeeklyBars(allThreads), [allThreads]);

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

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const safePage = Math.min(pageParam, totalPages);
  const pageCards = cards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const recentRows = useMemo(
    () => buildGroveRecentRows(data?.recent ?? allThreads),
    [data?.recent, allThreads]
  );

  const briefParts = data?.brief?.text ? splitFirstSentence(data.brief.text) : null;
  const dateChip = new Date().toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <Skeleton className="h-[340px] w-full rounded-[24px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-44 rounded-[18px]" />
          <Skeleton className="h-44 rounded-[18px]" />
          <Skeleton className="h-44 rounded-[18px]" />
          <Skeleton className="h-44 rounded-[18px]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <HeroBand
        size="tall"
        nav={<AssistantTopNav />}
        left={
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="font-display text-[36px] font-semibold leading-[1.06] tracking-tight text-white sm:text-[52px]">
                  {getTimeGreeting()},<br />
                  {userFirstName}!
                </h1>
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {dateChip}
                </span>
              </div>

              {briefParts ? (
                <div className="relative flex flex-wrap items-center gap-2 text-sm text-white/85">
                  <p className="max-w-xl">{briefParts.head}</p>
                  {briefParts.rest ? (
                    <button
                      type="button"
                      onClick={() => setBriefOpen((v) => !v)}
                      aria-expanded={briefOpen}
                      className="inline-flex items-center gap-0.5 text-xs font-semibold text-white underline underline-offset-4"
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
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${refreshBrief.isPending ? 'animate-spin' : ''}`}
                    />
                  </button>
                  {briefOpen && briefParts.rest ? (
                    <div className="w-full rounded-2xl border border-white/30 bg-black/45 p-3 text-xs leading-relaxed text-white backdrop-blur-xl">
                      {data.brief.text}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <StackedBars
              title="This week"
              days={weeklyBars}
              actionHref="/app/inbox/inbox"
              onSelectOwner={(owner) => updateFilter('owner', owner)}
            />
          </div>
        }
        right={
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
        }
      />

      <div className="space-y-6 bg-surface px-4 py-6 sm:px-6 md:px-8">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pageCards.map((card) => (
              <ThreadCard
                key={card.id}
                item={card}
                onOpen={(item) => item.href && navigate(item.href)}
                onPrimaryAction={(item) => item.href && navigate(item.href)}
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
              className="text-xs font-semibold text-primary hover:underline"
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
                <ThreadListRow key={row.id} item={row} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
