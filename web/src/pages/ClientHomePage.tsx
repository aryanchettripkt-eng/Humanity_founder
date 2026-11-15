import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Crown, Inbox } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { HeroBand } from '@/components/grove/HeroBand';
import { TopNav } from '@/components/grove/TopNav';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout, useMe } from '@/features/auth/api';
import { ClientActionBar, type ClientAction } from '@/features/client-view/components/ClientActionBar';
import { ClientGlance } from '@/features/client-view/components/ClientGlance';
import { ClientQueueList } from '@/features/client-view/components/ClientQueueList';
import { useClientAction, useClientQueue, useClientThread } from '@/features/client-view/api';
import {
  clientStatusLabel,
  clientSummaryLine,
  filterClientQueue,
  isClientHandling,
  type ClientQueueTab,
} from '@/features/client-view/mappers';
import { useThreadDetail, useThreads } from '@/features/inbox/api';
import { getTimeGreeting } from '@/features/today/mappers';
import { MessageItem } from '@/features/thread/components/MessageItem';
import { getInitials } from '@/lib/format';
import { qk } from '@/lib/queryKeys';
import { useSocketEvent } from '@/lib/socket';
import { useThemeToggle } from '@/lib/useThemeToggle';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';

/**
 * Client view (/c and /c/thread/:threadId): the client's queue in the same glass
 * shell as the assistant Inbox. List | reading pane | at-a-glance column.
 * With ?preview=1 an assistant sees the same screen read-only.
 */
export function ClientHomePage() {
  const { threadId } = useParams<{ threadId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const { data: me } = useMe();
  const { activeClientId, theme } = useUiStore();
  const toggleTheme = useThemeToggle();

  const isPreview = me?.user.role === 'assistant' && searchParams.get('preview') === '1';
  const qs = isPreview ? '?preview=1' : '';

  const activeClient = me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];
  const clientFirstName = isPreview
    ? activeClient?.name.split(' ')[0] || 'Client'
    : me?.user.name.split(' ')[0] || 'there';

  // Queue: the client's own endpoint, or the assistant's "client" segment in preview.
  const clientQueue = useClientQueue(!isPreview);
  const previewQueue = useThreads({
    clientId: isPreview ? activeClient?.id : undefined,
    segment: 'client',
  });
  const queueQuery = isPreview ? previewQueue : clientQueue;
  const queue = useMemo(
    () => (isPreview ? previewQueue.data?.data : clientQueue.data) ?? [],
    [isPreview, previewQueue.data, clientQueue.data]
  );

  const [tab, setTab] = useState<ClientQueueTab>('all');
  const visible = useMemo(() => filterClientQueue(queue, tab), [queue, tab]);
  const selectedId = threadId || visible[0]?.id;

  // Detail: the client endpoint, or the assistant detail in preview.
  const clientDetail = useClientThread(isPreview ? undefined : selectedId);
  const previewDetail = useThreadDetail(isPreview ? selectedId : undefined);
  const detailQuery = isPreview ? previewDetail : clientDetail;
  const detail = detailQuery.data;

  const action = useClientAction();

  const sync = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.client.queue() });
    if (selectedId) queryClient.invalidateQueries({ queryKey: qk.client.detail(selectedId) });
  }, [queryClient, selectedId]);
  useSocketEvent('thread:created', sync);
  useSocketEvent('thread:updated', sync);

  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [selectedId]);

  const openThread = (id: string) => navigate(`/c/thread/${id}${qs}`);
  const backToList = () => navigate(`/c${qs}`);

  const runAction = (kind: ClientAction, note?: string) => {
    if (!detail) return;
    const leavesQueue = kind !== 'handling';
    action.mutate(
      { threadId: detail.id, action: kind, note },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: qk.client.detail(detail.id) });
          if (leavesQueue) {
            const next = queue.find((t) => t.id !== detail.id);
            navigate(next ? `/c/thread/${next.id}${qs}` : `/c${qs}`, { replace: true });
          }
        },
      }
    );
  };

  const messages = detail?.messages ?? [];
  const collapsed = !showAll && messages.length > 3 ? messages.length - 2 : 0;
  const visibleMessages = collapsed > 0 ? messages.slice(-2) : messages;

  const nav = isPreview ? (
    <AssistantTopNav />
  ) : (
    <TopNav
      variant="app"
      logoHref="/c"
      tabs={[]}
      activeTabId=""
      settingsHref={null}
      userName={me?.user.name || 'You'}
      userEmail={me?.user.email}
      userInitials={getInitials(me?.user.name || 'You')}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSignOut={() => {
        logout();
        navigate('/login', { replace: true });
      }}
    />
  );

  return (
    <>
      <HeroBand
        size="short"
        nav={nav}
        left={
          <div className={cn('space-y-2', threadId && 'hidden lg:block')}>
            {isPreview ? (
              <div className="glass inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full px-4 py-2 text-sm">
                <Crown className="h-4 w-4 text-[var(--grove-lime)]" aria-hidden="true" />
                <span className="font-medium">You&apos;re previewing {clientFirstName}&apos;s view</span>
                <Link
                  to="/app/today"
                  className="font-semibold underline underline-offset-4 hover:text-[var(--grove-lime)]"
                >
                  Exit preview
                </Link>
              </div>
            ) : null}
            <h1
              style={{ textShadow: 'var(--hero-text-shadow)' }}
              className="font-display text-[32px] font-semibold leading-[1.05] tracking-tight text-[var(--fg)] md:text-[48px]"
            >
              {getTimeGreeting()}, {clientFirstName}
            </h1>
            <p className="text-base text-[var(--fg-muted)] md:text-lg">
              {queueQuery.isLoading ? ' ' : clientSummaryLine(queue)}
            </p>
          </div>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-[clamp(16px,2.5vw,32px)] pb-[clamp(16px,2.5vw,32px)]">
        <div data-stagger="" className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-4">
          {/* Queue list */}
          <div
            className={cn(
              'min-h-0 w-full shrink-0 lg:w-[360px] xl:w-[380px]',
              threadId ? 'hidden lg:flex lg:flex-col' : 'flex flex-1 flex-col lg:flex-none'
            )}
          >
            <ClientQueueList
              threads={visible}
              total={queue.length}
              tab={tab}
              onTabChange={setTab}
              selectedId={selectedId}
              onSelect={openThread}
              isLoading={queueQuery.isLoading}
              isError={queueQuery.isError}
              onRetry={() => queueQuery.refetch()}
            />
          </div>

          {/* Reading pane */}
          <div
            className={cn(
              'glass-pane min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
              threadId ? 'flex' : 'hidden lg:flex'
            )}
          >
            {!selectedId ? (
              <EmptyState
                icon={Inbox}
                title="Nothing to read"
                description="When your assistant needs your call, the email shows up here."
                className="flex-1"
              />
            ) : detailQuery.isLoading ? (
              <div className="space-y-4 p-6">
                <Skeleton className="h-7 w-72 rounded-xl bg-[var(--card-glass-bg)]" />
                <Skeleton className="h-4 w-48 rounded-lg bg-[var(--card-glass-bg)]" />
                <Skeleton className="h-40 w-full rounded-[20px] bg-[var(--card-glass-bg)]" />
              </div>
            ) : detailQuery.isError || !detail ? (
              <ErrorState onRetry={() => detailQuery.refetch()} className="flex-1" />
            ) : (
              <>
                <div className="shrink-0 space-y-3 border-b border-[var(--glass-divider)] px-5 pb-4 pt-5 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={backToList}
                        aria-label="Back to your queue"
                        className="glass flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-sm font-medium',
                          isClientHandling(detail)
                            ? 'border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg-muted)]'
                            : 'bg-[var(--chip-bg)] text-[var(--chip-fg)]'
                        )}
                      >
                        {clientStatusLabel(detail)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display text-[22px] font-semibold leading-tight text-[var(--fg)] md:text-[26px]">
                      {detail.subject}
                    </h2>
                    <p className="mt-1 truncate text-[15px] text-[var(--fg-muted)]">
                      {detail.participants
                        ?.map((p) => p.name || p.email)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>

                <div className="grove-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
                  {detail.clientReason ? (
                    <div className="glass-card flex items-start gap-3 rounded-[20px] p-4">
                      <Crown
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--grove-lime)]"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
                          Why you
                        </p>
                        <p className="mt-1 text-base text-[var(--fg)]">{detail.clientReason}</p>
                      </div>
                    </div>
                  ) : null}

                  <ClientGlance thread={detail} variant="inline" className="xl:hidden" />

                  {collapsed > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="glass-card flex w-full items-center justify-center rounded-full py-2 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    >
                      Show {collapsed} earlier messages
                    </button>
                  ) : null}

                  {visibleMessages.map((m) => (
                    <MessageItem key={m.id} message={m} />
                  ))}
                </div>

                <div className="shrink-0 border-t border-[var(--glass-divider)] p-4 sm:px-6">
                  <ClientActionBar
                    thread={detail}
                    pending={action.isPending}
                    readOnly={isPreview}
                    clientFirstName={clientFirstName}
                    onAction={runAction}
                  />
                </div>
              </>
            )}
          </div>

          {/* At a glance (≥1280) */}
          {detail ? (
            <div className="hidden min-h-0 w-[320px] shrink-0 xl:flex xl:flex-col">
              <ClientGlance thread={detail} />
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
