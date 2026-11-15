import { ChevronUp, ExternalLink, Inbox } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SourceBadge } from '@/components/common/SourceBadge';
import { InboxRail } from '@/components/grove/InboxRail';
import { Skeleton } from '@/components/ui/skeleton';
import { AIPanel, MobileAISummary } from '@/features/ai/components/AIPanel';
import { ClientDesk } from '@/features/client-desk/components/ClientDesk';
import { HandoffCard } from '@/features/client-desk/components/HandoffCard';
import { DraftComposer } from '@/features/composer/components/DraftComposer';
import {
  useChangeOwner,
  usePatchThread,
  useReclassifyThread,
  useThreadCounts,
  useThreadDetail,
  useThreads,
  useThreadSuggestion,
} from '@/features/inbox/api';
import { ThreadList } from '@/features/inbox/components/ThreadList';
import { MessageItem } from '@/features/thread/components/MessageItem';
import { ThreadHeader } from '@/features/thread/components/ThreadHeader';
import { revealDelay } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { DeskFilter } from '@/features/client-desk/mappers';
import type { SegmentId } from '@/types/api';

export function InboxPage() {
  const { segment = 'inbox', threadId } = useParams<{ segment?: string; threadId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { activeClientId, aiPanelOpen, toggleAiPanel, newThreadIds, clearNewThread } =
    useUiStore();

  const q = searchParams.get('q') || '';
  const filtersParam = searchParams.get('f') || '';
  const handoffParam = searchParams.get('handoff');
  const activeFilters = useMemo(
    () => (filtersParam ? filtersParam.split(',').filter(Boolean) : []),
    [filtersParam]
  );

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const { data: counts } = useThreadCounts(activeClientId || undefined);
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useThreads({
    segment,
    q: q || undefined,
    filters: filtersParam || undefined,
    clientId: activeClientId || undefined,
    handoff: handoffParam || undefined,
  });

  const threads = useMemo(() => listData?.data ?? [], [listData?.data]);
  const selectedId = threadId || threads[0]?.id;

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useThreadDetail(selectedId);

  const patchThread = usePatchThread();
  const changeOwner = useChangeOwner();
  const reclassify = useReclassifyThread();
  const suggestion = useThreadSuggestion();

  useEffect(() => {
    setShowAllMessages(false);
    setComposerOpen(false);
    if (selectedId && newThreadIds.includes(selectedId)) {
      clearNewThread(selectedId);
    }
  }, [selectedId, newThreadIds, clearNewThread]);

  // Mark unread -> read on open
  useEffect(() => {
    if (detail && detail.unread) {
      patchThread.mutate({ id: detail.id, patch: { unread: false } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  // Keyboard navigation (j/k, s, u, e, d, r, o)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'j' && threads.length > 0) {
        e.preventDefault();
        const next = Math.min(threads.length - 1, Math.max(0, focusedIndex + 1));
        setFocusedIndex(next);
        const qs = searchParams.toString();
        navigate(`/app/inbox/${segment}/${threads[next].id}${qs ? `?${qs}` : ''}`);
      } else if (e.key === 'k' && threads.length > 0) {
        e.preventDefault();
        const prev = Math.max(0, focusedIndex - 1);
        setFocusedIndex(prev);
        const qs = searchParams.toString();
        navigate(`/app/inbox/${segment}/${threads[prev].id}${qs ? `?${qs}` : ''}`);
      } else if (detail) {
        if (e.key === 's') {
          patchThread.mutate({
            id: detail.id,
            patch: { important: !detail.important },
            undoPatch: { important: detail.important },
            label: detail.important ? 'Removed star' : 'Starred',
          });
        } else if (e.key === 'u') {
          patchThread.mutate({
            id: detail.id,
            patch: { unread: !detail.unread },
            undoPatch: { unread: detail.unread },
            label: detail.unread ? 'Marked read' : 'Marked unread',
          });
        } else if (e.key === 'e') {
          patchThread.mutate({
            id: detail.id,
            patch: { archived: true },
            undoPatch: { archived: false },
            label: 'Archived',
          });
        } else if (e.key === 'd') {
          const nextStatus = detail.status === 'done' ? 'open' : 'done';
          patchThread.mutate({
            id: detail.id,
            patch: { status: nextStatus },
            undoPatch: { status: detail.status },
            label: nextStatus === 'done' ? 'Marked done' : 'Reopened',
          });
        } else if (e.key === 'r') {
          e.preventDefault();
          setComposerOpen(true);
        } else if (e.key === 'o') {
          e.preventDefault();
          const cycle: Record<string, 'assistant' | 'client' | 'none'> = {
            assistant: 'client',
            client: 'none',
            none: 'assistant',
            review: 'assistant',
          };
          const nextOwner = cycle[detail.owner] ?? 'assistant';
          changeOwner.mutate({
            id: detail.id,
            owner: nextOwner,
            previousOwner: detail.owner,
          });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [threads, focusedIndex, detail, segment, searchParams, navigate, patchThread, changeOwner]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const toggleFilter = (f: string) => {
    const next = activeFilters.includes(f)
      ? activeFilters.filter((x) => x !== f)
      : [...activeFilters, f];
    updateParam('f', next.join(','));
  };

  const selectSegment = (seg: SegmentId) => {
    if (seg === 'today') {
      navigate('/app/today');
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('handoff');
    const qs = next.toString();
    navigate(`/app/inbox/${seg}${qs ? `?${qs}` : ''}`);
  };

  // A desk chip opens its segment with the handoff filter; clicking the active chip clears it.
  const selectDeskFilter = (f: DeskFilter, active: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (active || !f.handoff) next.delete('handoff');
    else next.set('handoff', f.handoff);
    const qs = next.toString();
    navigate(`/app/inbox/${f.segment}${qs ? `?${qs}` : ''}`);
  };

  const openDraft = () => {
    setComposerOpen(true);
    const el = document.getElementById('inbox-composer');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
  };

  const selectThread = (id: string) => {
    const qs = searchParams.toString();
    navigate(`/app/inbox/${segment}/${id}${qs ? `?${qs}` : ''}`);
  };

  const messages = detail?.messages ?? [];
  const collapsedCount = !showAllMessages && messages.length > 3 ? messages.length - 2 : 0;
  const visibleMessages = collapsedCount > 0 ? messages.slice(-2) : messages;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4">
    <ClientDesk
      segment={segment}
      handoff={handoffParam}
      onFilter={selectDeskFilter}
      onOpenThread={(id) => navigate(`/app/inbox/inbox/${id}`)}
      className={cn(threadId && 'hidden lg:flex')}
    />
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:gap-4">
      {/* Segment rail: horizontal chips on mobile (<768 when list visible), vertical 72px rail on >=768 */}
      <div
        data-reveal=""
        style={revealDelay(1)}
        className={cn('shrink-0 md:min-h-0', threadId ? 'hidden md:flex' : 'flex')}
      >
        <InboxRail
          activeSegment={segment as SegmentId}
          counts={counts as Partial<Record<SegmentId, number>> | undefined}
          onSelectSegment={selectSegment}
        />
      </div>

      {/* List column (360-380px) */}
      <div
        data-reveal=""
        style={revealDelay(2)}
        className={cn(
          'min-h-0 w-full shrink-0 md:w-[360px] lg:w-[380px]',
          threadId ? 'hidden lg:flex lg:flex-col' : 'flex flex-1 flex-col lg:flex-none'
        )}
      >
        <ThreadList
          segment={segment as SegmentId}
          threads={threads}
          isLoading={listLoading}
          isError={listError}
          selectedId={selectedId}
          focusedIndex={focusedIndex}
          search={q}
          activeFilters={activeFilters}
          newThreadIds={newThreadIds}
          onSearchChange={(val) => updateParam('q', val)}
          onToggleFilter={toggleFilter}
          onSelectThread={selectThread}
          onToggleImportant={(id, important) =>
            patchThread.mutate({
              id,
              patch: { important },
              undoPatch: { important: !important },
              label: important ? 'Starred' : 'Removed star',
            })
          }
          onChangeOwner={(id, owner, remember) => {
            const current = threads.find((t) => t.id === id)?.owner;
            changeOwner.mutate({ id, owner, remember, previousOwner: current });
          }}
          onRetry={() => refetchList()}
        />
      </div>

      {/* Reading column (flex) */}
      <div
        data-reveal=""
        style={revealDelay(3)}
        className={cn(
          'glass-pane flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          !threadId ? 'hidden lg:flex' : 'flex'
        )}
      >
        {!selectedId ? (
          <EmptyState
            icon={Inbox}
            title="Select a conversation"
            description="Choose a thread from the list to read messages, AI insights, and drafts."
            className="flex-1"
          />
        ) : detailLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-72 rounded-xl bg-[var(--card-glass-bg)]" />
            <Skeleton className="h-4 w-48 rounded-lg bg-[var(--card-glass-bg)]" />
            <Skeleton className="h-40 w-full rounded-[20px] bg-[var(--card-glass-bg)]" />
          </div>
        ) : detailError || !detail ? (
          <ErrorState onRetry={() => refetchDetail()} className="flex-1" />
        ) : (
          <>
            <ThreadHeader
              thread={detail}
              aiPanelOpen={aiPanelOpen}
              reclassifying={reclassify.isPending}
              onBack={() => {
                const qs = searchParams.toString();
                navigate(`/app/inbox/${segment}${qs ? `?${qs}` : ''}`);
              }}
              onChangeOwner={(owner, remember) =>
                changeOwner.mutate({
                  id: detail.id,
                  owner,
                  remember,
                  previousOwner: detail.owner,
                })
              }
              onToggleStar={() =>
                patchThread.mutate({
                  id: detail.id,
                  patch: { important: !detail.important },
                  undoPatch: { important: detail.important },
                  label: detail.important ? 'Removed star' : 'Starred',
                })
              }
              onToggleUnread={() =>
                patchThread.mutate({
                  id: detail.id,
                  patch: { unread: !detail.unread },
                  undoPatch: { unread: detail.unread },
                  label: detail.unread ? 'Marked read' : 'Marked unread',
                })
              }
              onArchive={() =>
                patchThread.mutate({
                  id: detail.id,
                  patch: { archived: true },
                  undoPatch: { archived: false },
                  label: 'Archived',
                })
              }
              onMarkDone={() => {
                const nextStatus = detail.status === 'done' ? 'open' : 'done';
                patchThread.mutate({
                  id: detail.id,
                  patch: { status: nextStatus },
                  undoPatch: { status: detail.status },
                  label: nextStatus === 'done' ? 'Marked done' : 'Reopened',
                });
              }}
              onReply={() => setComposerOpen(true)}
              onReclassify={() => reclassify.mutate(detail.id)}
              onToggleAiPanel={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1280) {
                  setAiDrawerOpen((v) => !v);
                } else {
                  toggleAiPanel();
                }
              }}
            />

            <div
              key={detail.id}
              data-reveal="fade"
              className="grove-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-5 sm:p-6"
            >
              <MobileAISummary
                thread={detail}
                reclassifying={reclassify.isPending}
                onReclassify={() => reclassify.mutate(detail.id)}
                onSuggestion={(action) => suggestion.mutate({ id: detail.id, action })}
              />

              <HandoffCard thread={detail} onOpenDraft={openDraft} />

              {collapsedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAllMessages(true)}
                  className="glass-card flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Show {collapsedCount} earlier messages</span>
                </button>
              ) : null}

              <div className="space-y-3">
                {visibleMessages.map((m) => (
                  <MessageItem key={m.id} message={m} />
                ))}
              </div>

              {detail.source === 'gmail' ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-divider)] pt-3 text-xs text-[var(--fg-muted)]">
                  <div className="flex items-center gap-2">
                    <SourceBadge source="gmail" />
                    <span>Changes here stay in Relay</span>
                  </div>
                  {detail.externalId ? (
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${detail.externalId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--fg)] hover:underline"
                    >
                      <span>Open in Gmail</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Docked DraftComposer at bottom of reading column */}
            <div id="inbox-composer" className="shrink-0 border-t border-[var(--glass-divider)] p-4 sm:px-6">
              <DraftComposer
                threadId={detail.id}
                draft={detail.draft}
                autoOpen={composerOpen}
              />
            </div>
          </>
        )}
      </div>

      {/* AI insights column (>=1280 desktop) */}
      {detail && aiPanelOpen ? (
        <div
          data-reveal=""
          style={revealDelay(4)}
          className="hidden min-h-0 w-[320px] shrink-0 xl:flex xl:flex-col"
        >
          <AIPanel
            thread={detail}
            reclassifying={reclassify.isPending}
            onReclassify={() => reclassify.mutate(detail.id)}
            onSuggestion={(action) => suggestion.mutate({ id: detail.id, action })}
          />
        </div>
      ) : null}

      {/* AI insights slide-over drawer (768–1279) */}
      {detail && aiDrawerOpen ? (
        <div className="motion-drawer fixed inset-y-4 right-4 z-50 hidden w-[340px] max-w-[calc(100vw-2rem)] md:block xl:hidden">
          <AIPanel
            thread={detail}
            reclassifying={reclassify.isPending}
            onReclassify={() => reclassify.mutate(detail.id)}
            onSuggestion={(action) => suggestion.mutate({ id: detail.id, action })}
            onClose={() => setAiDrawerOpen(false)}
            className="border-[var(--frame-border)] bg-[#F7F7F4]/95 shadow-2xl backdrop-blur-2xl dark:bg-[#1E1F1C]/95"
          />
        </div>
      ) : null}
    </div>
    </div>
  );
}
