import { useQuery } from '@tanstack/react-query';
import { useThreadCounts } from '@/features/inbox/api';
import { useActivityFeed } from '@/features/stats/api';
import { apiFetchList } from '@/lib/api';
import type { ThreadListItem } from '@/types/api';
import { handledWithin, latestClientNote } from './mappers';

function listUrl(clientId: string, segment: string, handoff: string, pageSize: number) {
  const sp = new URLSearchParams({ clientId, segment, handoff, pageSize: String(pageSize) });
  return `/threads?${sp.toString()}`;
}

/**
 * Numbers for the client's desk strip in the Inbox. All come from the server:
 * the owner counts, plus the threads list filtered by handoff state.
 */
export function useClientDesk(clientId?: string) {
  const counts = useThreadCounts(clientId);
  const handoffs = useQuery({
    // Under 'threads' so the layout's socket invalidation refreshes it.
    queryKey: ['threads', 'desk', { clientId: clientId ?? null }],
    enabled: Boolean(clientId),
    staleTime: 30_000,
    queryFn: async () => {
      const id = clientId as string;
      const [onIt, back, handled] = await Promise.all([
        apiFetchList<ThreadListItem>(listUrl(id, 'client', 'client_handling', 1)),
        apiFetchList<ThreadListItem>(listUrl(id, 'assistant', 'handed_to_assistant', 1)),
        apiFetchList<ThreadListItem>(listUrl(id, 'done', 'handled', 100)),
      ]);
      return {
        onIt: onIt.meta?.total ?? onIt.data.length,
        handedBack: back.meta?.total ?? back.data.length,
        handled7d: handledWithin(handled.data, 7),
      };
    },
  });
  const activity = useActivityFeed(clientId, 20);

  return {
    waiting: counts.data?.client,
    onIt: handoffs.data?.onIt,
    handedBack: handoffs.data?.handedBack,
    handled7d: handoffs.data?.handled7d,
    latestNote: latestClientNote(activity.data ?? []),
    isLoading: counts.isLoading || handoffs.isLoading,
  };
}
