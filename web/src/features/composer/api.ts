import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Draft, ThreadDetail } from '@/types/api';

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      threadId,
      tone,
      instruction,
    }: {
      threadId: string;
      tone: 'formal' | 'friendly' | 'brief';
      instruction?: string;
    }) =>
      apiFetch<Draft>(`/threads/${threadId}/drafts`, {
        method: 'POST',
        body: { tone, instruction },
      }),
    onSuccess: (draft, vars) => {
      queryClient.setQueryData<ThreadDetail | undefined>(qk.threads.detail(vars.threadId), (old) =>
        old ? { ...old, draft } : old
      );
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not generate draft');
    },
  });
}

export function usePatchDraft() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiFetch<Draft>(`/drafts/${id}`, { method: 'PATCH', body: { body } }),
  });
}

export function useSendDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId }: { draftId: string; threadId: string }) =>
      apiFetch<ThreadDetail>(`/drafts/${draftId}/send`, { method: 'POST' }),
    onSuccess: (updated, vars) => {
      queryClient.setQueryData(qk.threads.detail(vars.threadId), updated);
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Sent (simulated in prototype)');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Send failed');
    },
  });
}

export function useDiscardDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId }: { draftId: string; threadId: string }) =>
      apiFetch<{ ok: boolean }>(`/drafts/${draftId}`, { method: 'DELETE' }),
    onSuccess: (_res, vars) => {
      queryClient.setQueryData<ThreadDetail | undefined>(qk.threads.detail(vars.threadId), (old) =>
        old ? { ...old, draft: null } : old
      );
      toast.success('Draft discarded');
    },
  });
}

