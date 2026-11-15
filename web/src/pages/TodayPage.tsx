import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { OwnerPopover } from '@/components/common/OwnerPopover';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { HeroBand } from '@/components/grove/HeroBand';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { useCreateDraft } from '@/features/composer/api';
import { useChangeOwner, usePatchThread, useThreadCounts, useThreads } from '@/features/inbox/api';
import { useDashboard } from '@/features/today/api';
import {
  buildTodaySummary,
  confirmPillLabel,
  ctaLabelForThread,
  filterThreadsForTodayTab,
  getTimeGreeting,
  statusChipLabel,
  type TodayTabId,
} from '@/features/today/mappers';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { Owner, ThreadListItem } from '@/types/api';

const VALID_TABS: TodayTabId[] = ['needs_action', 'assistant', 'client', 'all'];

export function TodayPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;

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

  const createDraft = useCreateDraft();
  const patchThread = usePatchThread();
  const changeOwner = useChangeOwner();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const rawTab = searchParams.get('tab') as TodayTabId | null;
  const activeTab: TodayTabId = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'needs_action';

  const setActiveTab = (tab: TodayTabId) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'needs_action') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

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

  const reviewThreads = data?.review ?? [];
  const reviewCount = counts?.review ?? reviewThreads.length;
  const assistantCount = counts?.assistant ?? data?.counts?.assistant ?? 0;
  const clientCount = counts?.client ?? data?.counts?.client ?? 0;

  const summaryLine = buildTodaySummary(reviewCount, clientCount, clientFirstName);
  const visibleCards = useMemo(
    () => filterThreadsForTodayTab(allThreads, activeTab).slice(0, 4),
    [allThreads, activeTab]
  );

  const handleConfirmSuggested = (t: ThreadListItem) => {
    if (!t.suggestedOwner || t.suggestedOwner === 'none') return;
    setPendingId(t.id);
    changeOwner.mutate(
      {
        id: t.id,
        owner: t.suggestedOwner,
        previousOwner: t.owner,
      },
      { onSettled: () => setPendingId(null) }
    );
  };

  const handleChooseOwner = (
    threadId: string,
    owner: Owner,
    remember: 'sender' | 'domain' | null
  ) => {
    setPendingId(threadId);
    changeOwner.mutate(
      {
        id: threadId,
        owner,
        remember,
        previousOwner: 'review',
      },
      { onSettled: () => setPendingId(null) }
    );
  };

  const handleCardAction = (t: ThreadListItem) => {
    setPendingId(t.id);

    if (t.owner === 'assistant') {
      createDraft.mutate(
        { threadId: t.id, tone: 'formal' },
        {
          onSuccess: () => {
            toast.success('Draft ready');
            navigate(`/app/inbox/inbox/${t.id}`);
          },
          onSettled: () => setPendingId(null),
        }
      );
      return;
    }

    if (t.owner === 'client') {
      if (!t.important && t.handoff?.state !== 'client_handling') {
        patchThread.mutate(
          {
            id: t.id,
            patch: { important: true },
            undoPatch: { important: false },
            label: `Moved to the top of ${clientFirstName}'s queue`,
          },
          { onSettled: () => setPendingId(null) }
        );
      } else {
        setPendingId(null);
        navigate('/c?preview=1');
      }
      return;
    }

    if (t.owner === 'review') {
      changeOwner.mutate(
        {
          id: t.id,
          owner: t.suggestedOwner ?? 'assistant',
          previousOwner: 'review',
        },
        { onSettled: () => setPendingId(null) }
      );
      return;
    }

    setPendingId(null);
    navigate(`/app/inbox/inbox/${t.id}`);
  };

  const tabs: { id: TodayTabId; label: string }[] = [
    { id: 'needs_action', label: 'Needs action' },
    { id: 'assistant', label: 'You' },
    { id: 'client', label: clientFirstName },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="flex flex-col">
      <HeroBand
        size="tall"
        nav={<AssistantTopNav />}
        bottom={
          <div className="space-y-6">
            <div className="space-y-2">
              <h1
                style={{ textShadow: 'var(--hero-text-shadow)' }}
                className="font-display text-[clamp(36px,4.4vw,64px)] font-semibold leading-[1.05] tracking-tight text-[var(--hero-fg)]"
              >
                {getTimeGreeting()}, {userFirstName}
              </h1>
              {isLoading ? (
                <Skeleton className="h-6 w-72 rounded-lg bg-[var(--hero-card-bg)]" />
              ) : (
                <p className="text-base text-[var(--hero-muted)] md:text-[18px]">
                  {summaryLine}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
              <section
                aria-labelledby="needs-your-call-heading"
                className="glass rounded-[20px] p-6"
              >
                <h2
                  id="needs-your-call-heading"
                  className="font-display text-[32px] font-semibold leading-tight tracking-tight text-[var(--hero-fg)]"
                >
                  Needs your call
                </h2>

                {isLoading ? (
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl bg-[var(--hero-card-bg)]" />
                    <Skeleton className="h-14 w-full rounded-xl bg-[var(--hero-card-bg)]" />
                    <Skeleton className="h-14 w-full rounded-xl bg-[var(--hero-card-bg)]" />
                  </div>
                ) : reviewThreads.length === 0 ? (
                  <p className="mt-3 text-base text-[var(--hero-muted)]">
                    Nothing needs your call.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 divide-y divide-[var(--glass-divider)]">
                      {reviewThreads.slice(0, 3).map((t) => {
                        const sender =
                          t.participants?.[0]?.name ||
                          t.participants?.[0]?.email ||
                          'Contact';
                        const hasSuggestion =
                          Boolean(t.suggestedOwner) && t.suggestedOwner !== 'none';
                        const pillText = confirmPillLabel(
                          t.suggestedOwner,
                          clientFirstName
                        );

                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                          >
                            <Link
                              to={`/app/inbox/review/${t.id}`}
                              className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <p className="truncate font-display text-[20px] font-semibold leading-snug text-[var(--hero-fg)]">
                                {sender}
                              </p>
                              <p className="truncate text-base text-[var(--hero-muted)]">
                                {t.subject}
                              </p>
                            </Link>

                            {hasSuggestion ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmSuggested(t)}
                                disabled={pendingId === t.id}
                                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--cta-lime-bg)] px-4 py-2 text-base font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] disabled:opacity-50"
                              >
                                {pillText}
                              </button>
                            ) : (
                              <OwnerPopover
                                current={t.owner}
                                senderEmail={t.participants?.[0]?.email}
                                onSelect={(owner, remember) =>
                                  handleChooseOwner(t.id, owner, remember)
                                }
                              >
                                <button
                                  type="button"
                                  disabled={pendingId === t.id}
                                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--cta-lime-bg)] px-4 py-2 text-base font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] disabled:opacity-50"
                                >
                                  Choose
                                </button>
                              </OwnerPopover>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {reviewThreads.length > 3 ? (
                      <Link
                        to="/app/inbox/review"
                        className="mt-4 inline-flex items-center text-base font-medium text-[var(--hero-muted)] transition-colors hover:text-[var(--hero-fg)]"
                      >
                        +{reviewThreads.length - 3} more
                      </Link>
                    ) : null}
                  </>
                )}
              </section>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6">
                <Link
                  to="/app/inbox/assistant"
                  className="glass flex flex-col justify-between rounded-[20px] p-5 transition-colors hover:bg-[var(--glass-hover)] sm:p-6"
                >
                  <span className="font-display text-[20px] font-semibold leading-snug text-[var(--hero-fg)] sm:text-[24px]">
                    You reply
                  </span>
                  {isLoading ? (
                    <Skeleton className="mt-3 h-12 w-20 rounded-xl bg-[var(--hero-card-bg)]" />
                  ) : (
                    <span className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight text-[var(--hero-fg)] tabular-nums md:text-[56px]">
                      {assistantCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/app/inbox/client"
                  className="glass flex flex-col justify-between rounded-[20px] p-5 transition-colors hover:bg-[var(--glass-hover)] sm:p-6"
                >
                  <span className="font-display text-[20px] font-semibold leading-snug text-[var(--hero-fg)] sm:text-[24px]">
                    Waiting on {clientFirstName}
                  </span>
                  {isLoading ? (
                    <Skeleton className="mt-3 h-12 w-20 rounded-xl bg-[var(--hero-card-bg)]" />
                  ) : (
                    <span className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight text-[var(--hero-fg)] tabular-nums md:text-[56px]">
                      {clientCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        }
      />

      <div className="working-panel mx-[clamp(16px,2.5vw,32px)] mb-[clamp(16px,2.5vw,32px)] space-y-6">
        <div
          role="tablist"
          aria-label="Filter threads"
          className="no-scrollbar flex items-center gap-6 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'min-h-[44px] shrink-0 whitespace-nowrap pb-1 text-[20px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-2 block h-1 w-full rounded-[2px] transition-colors',
                    isActive ? 'bg-[var(--cta-lime-bg)]' : 'bg-transparent'
                  )}
                />
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-48 rounded-[20px]" />
            <Skeleton className="h-48 rounded-[20px]" />
            <Skeleton className="h-48 rounded-[20px]" />
            <Skeleton className="h-48 rounded-[20px]" />
          </div>
        ) : isError || !data ? (
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-base text-muted-foreground">
              Couldn&apos;t load your workspace.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex min-h-[44px] items-center rounded-full border-[1.5px] border-[var(--btn-outline-border)] px-5 py-2 text-base font-semibold text-[var(--btn-outline-fg)] transition-colors hover:bg-[var(--btn-outline-hover)]"
            >
              Retry
            </button>
          </div>
        ) : visibleCards.length === 0 ? (
          <div className="space-y-3 py-4">
            <p className="text-base text-muted-foreground">Nothing here.</p>
            <Link
              to="/app/inbox/inbox"
              className="inline-flex items-center gap-1 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all in Inbox →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {visibleCards.map((t) => {
                const sender =
                  t.participants?.[0]?.name ||
                  t.participants?.[0]?.email ||
                  'Contact';
                const href = `/app/inbox/${t.owner === 'review' ? 'review' : 'inbox'}/${t.id}`;
                const ctaLabel = ctaLabelForThread(t, clientFirstName);
                const isReview = t.owner === 'review';

                return (
                  <article
                    key={t.id}
                    className="flex flex-col justify-between gap-5 rounded-[20px] border border-[var(--card-border)] bg-[var(--card-bg)] p-6"
                  >
                    <div className="min-w-0">
                      <Link to={href} className="block min-w-0">
                        <h3 className="truncate font-display text-[24px] font-semibold leading-snug text-foreground">
                          {sender}
                        </h3>
                        <p className="mt-1 truncate text-base text-muted-foreground">
                          {t.subject}
                        </p>
                      </Link>
                      <span className="mt-3 inline-flex w-fit items-center rounded-full bg-[var(--chip-bg)] px-3 py-1 text-base font-medium text-[var(--chip-fg)]">
                        {statusChipLabel(t.owner, clientFirstName)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCardAction(t)}
                      disabled={pendingId === t.id}
                      className={cn(
                        'min-h-[44px] w-full rounded-full px-4 py-2.5 text-base font-semibold transition-colors disabled:opacity-50',
                        isReview
                          ? 'bg-[var(--cta-lime-bg)] text-[var(--cta-lime-fg)] hover:bg-[var(--cta-lime-hover)]'
                          : 'border-[1.5px] border-[var(--btn-outline-border)] bg-transparent text-[var(--btn-outline-fg)] hover:bg-[var(--btn-outline-hover)]'
                      )}
                    >
                      {ctaLabel}
                    </button>
                  </article>
                );
              })}
            </div>

            <div>
              <Link
                to="/app/inbox/inbox"
                className="inline-flex items-center gap-1 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all in Inbox →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
