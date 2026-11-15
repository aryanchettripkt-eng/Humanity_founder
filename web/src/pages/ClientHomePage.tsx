import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MessageSquarePlus, Send, UserRoundCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { useClientAction, useClientQueue } from '@/features/client-view/api';
import { formatShortDate } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { useCallback } from 'react';

export function ClientHomePage() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: queue, isLoading, isError, refetch } = useClientQueue();
  const actionMutation = useClientAction();

  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const syncQueue = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.client.queue() });
  }, [queryClient]);

  useSocketEvent('thread:created', syncQueue);
  useSocketEvent('thread:updated', syncQueue);

  const firstName = me?.user.name.split(' ')[0] || 'there';
  const count = queue?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Good morning, {firstName}.
        </h1>
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? 'Nothing needs your decision right now.'
            : `${count} ${count === 1 ? 'thing needs' : 'things need'} you.`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : count === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={CheckCircle2}
            title="You're all caught up."
            description="Your assistant will handle everything else."
          />
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {queue?.map((t) => {
              const isHandling = t.handoff?.state === 'client_handling';
              const sender = t.participants?.[0]?.name || t.participants?.[0]?.email;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">{sender}</p>
                        <Link
                          to={`/c/thread/${t.id}`}
                          className="mt-0.5 block text-base font-semibold text-foreground hover:underline"
                        >
                          {t.subject}
                        </Link>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatShortDate(t.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/90">
                      {t.summary || t.snippet}
                    </p>

                    {(t.clientReason || t.reason) && (
                      <p className="rounded-lg bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                        <strong>Why you:</strong> {t.clientReason || t.reason}
                      </p>
                    )}

                    {isHandling && (
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        You&apos;re on it
                      </span>
                    )}

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                      {isHandling ? (
                        <Button
                          size="lg"
                          className="min-h-[44px] w-full whitespace-nowrap sm:w-auto sm:flex-1"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({ threadId: t.id, action: 'handled' })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Mark handled
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="default"
                          className="min-h-[44px] w-full whitespace-nowrap sm:w-auto sm:flex-1"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({ threadId: t.id, action: 'handling' })
                          }
                        >
                          I&apos;ll handle it
                        </Button>
                      )}

                      <Button
                        size="lg"
                        variant="secondary"
                        className="min-h-[44px] w-full whitespace-nowrap border border-border sm:w-auto sm:flex-1"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({ threadId: t.id, action: 'handoff' })
                        }
                      >
                        <UserRoundCheck className="h-4 w-4 shrink-0" />
                        Assistant take over
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="min-h-[44px] w-full whitespace-nowrap sm:w-auto"
                        onClick={() => {
                          setNoteOpenId(noteOpenId === t.id ? null : t.id);
                          setNoteText('');
                        }}
                      >
                        <MessageSquarePlus className="h-4 w-4" />
                        Reply with a note
                      </Button>
                    </div>

                    {noteOpenId === t.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!noteText.trim()) return;
                          actionMutation.mutate(
                            { threadId: t.id, action: 'note', note: noteText.trim() },
                            {
                              onSuccess: () => {
                                setNoteOpenId(null);
                                setNoteText('');
                              },
                            }
                          );
                        }}
                        className="flex gap-2 pt-1"
                      >
                        <Input
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="e.g. Say yes, but push to Friday…"
                          className="min-h-[44px]"
                        />
                        <Button
                          type="submit"
                          size="lg"
                          className="min-h-[44px]"
                          disabled={actionMutation.isPending || !noteText.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

