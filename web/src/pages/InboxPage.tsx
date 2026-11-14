import { ChevronUp, Crown, ExternalLink, Inbox } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SourceBadge } from '@/components/common/SourceBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { AIPanel, MobileAISummary } from '@/features/ai/components/AIPanel';
import { DraftComposer } from '@/features/composer/components/DraftComposer';
import {
  useChangeOwner,
  usePatchThread,
  useReclassifyThread,
  useThreadDetail,
  useThreads,
  useThreadSuggestion,
} from '@/features/inbox/api';
import { ThreadList } from '@/features/inbox/components/ThreadList';
import { MessageItem } from '@/features/thread/components/MessageItem';
import { ThreadHeader } from '@/features/thread/components/ThreadHeader';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { SegmentId } from '@/types/api';

export function InboxPage() {
  const { segment = 'inbox', threadId } = useParams<{ segment?: string; threadId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { activeClientId, aiPanelOpen, toggleAiPanel, newThreadIds, clearNewThread } =
    useUiStore();

  const q = searchParams.get('q') || '';
  const filtersParam = searchParams.get('f') || '';
  const activeFilters = useMemo(
    () => (filtersParam ? filtersParam.split(',').filter(Boolean) : []),
    [filtersParam]
  );

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

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

  // Keyboard navigation (j/k, s, u, e, d, r)
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
        navigate(`/app/inbox/${segment}/${threads[next].id}?${searchParams.toString()}`);
      } else if (e.key === 'k' && threads.length > 0) {
        e.preventDefault();
        const prev = Math.max(0, focusedIndex - 1);
        setFocusedIndex(prev);
        navigate(`/app/inbox/${segment}/${threads[prev].id}?${searchParams.toString()}`);
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

  const selectThread = (id: string) => {
    const qs = searchParams.toString();
    navigate(`/app/inbox/${segment}/${id}${qs ? `?${qs}` : ''}`);
  };

  const messages = detail?.messages ?? [];
  const collapsedCount = !showAllMessages && messages.length > 3 ? messages.length - 2 : 0;
  const visibleMessages = collapsedCount > 0 ? messages.slice(-2) : messages;

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* List pane */}
      <div
        className={cn(
          'w-full shrink-0 md:w-[360px] lg:w-[380px]',
          threadId ? 'hidden md:block' : 'block'
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

      {/* Detail pane */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col bg-background',
          !threadId ? 'hidden md:flex' : 'flex'
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
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : detailError || !detail ? (
          <ErrorState onRetry={() => refetchDetail()} className="flex-1" />
        ) : (
          <>
            <ThreadHeader
              thread={detail}
              aiPanelOpen={aiPanelOpen}
              reclassifying={reclassify.isPending}
              onBack={() => navigate(`/app/inbox/${segment}`)}
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
              onToggleAiPanel={toggleAiPanel}
            />

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              <MobileAISummary
                thread={detail}
                reclassifying={reclassify.isPending}
                onReclassify={() => reclassify.mutate(detail.id)}
              />

              {detail.handoff?.state && detail.handoff.state !== 'none' && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <Crown className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium capitalize">
                      Client status: {detail.handoff.state.replace(/_/g, ' ')}
                    </p>
                    {detail.handoff.note && <p className="mt-0.5">“{detail.handoff.note}”</p>}
                  </div>
                </div>
              )}

              {collapsedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllMessages(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Show {collapsedCount} earlier messages</span>
                </button>
              )}

              <div className="space-y-3">
                {visibleMessages.map((m) => (
                  <MessageItem key={m.id} message={m} />
                ))}
              </div>

              <DraftComposer
                threadId={detail.id}
                draft={detail.draft}
                autoOpen={composerOpen}
              />

              {detail.source === 'gmail' && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <SourceBadge source="gmail" />
                    <span>Changes here stay in Relay</span>
                  </div>
                  {detail.externalId && (
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${detail.externalId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <span>Open in Gmail</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Side Panel (desktop) */}
      {detail && aiPanelOpen && (
        <div className="hidden w-[320px] shrink-0 xl:block">
          <AIPanel
            thread={detail}
            reclassifying={reclassify.isPending}
            onReclassify={() => reclassify.mutate(detail.id)}
            onSuggestion={(action) => suggestion.mutate({ id: detail.id, action })}
          />
        </div>
      )}
    </div>
  );
}

