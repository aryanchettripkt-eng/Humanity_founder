import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { ThreadDetail, ThreadListItem } from '@/types/api';

export function useClientQueue() {
  return useQuery({
    queryKey: qk.client.queue(),
    queryFn: () => apiFetch<ThreadListItem[]>('/client/queue'),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useClientThread(id?: string) {
  return useQuery({
    queryKey: qk.client.detail(id || ''),
    queryFn: () => apiFetch<ThreadDetail>(`/client/threads/${id}`),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useClientAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      threadId,
      action,
      note,
    }: {
      threadId: string;
      action: 'handling' | 'handled' | 'handoff' | 'note';
      note?: string;
    }) =>
      apiFetch<ThreadListItem>(`/client/threads/${threadId}/action`, {
        method: 'POST',
        body: { action, note },
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.client.queue() });
      const msg =
        vars.action === 'handling'
          ? 'Marked as handling'
          : vars.action === 'handled'
            ? 'Marked handled'
            : 'Sent to your assistant';
      toast.success(msg);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    },
  });
}

