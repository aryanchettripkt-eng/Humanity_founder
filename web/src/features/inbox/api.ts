import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, apiFetchList, ApiError } from '@/lib/api';
import { OWNER_META } from '@/lib/owners';
import { qk } from '@/lib/queryKeys';
import type { Owner, ThreadDetail, ThreadListItem } from '@/types/api';

export function useThreads(params: {
  segment: string;
  q?: string;
  filters?: string;
  account?: string;
  clientId?: string;
  handoff?: string;
}) {
  const sp = new URLSearchParams();
  if (params.clientId) sp.set('clientId', params.clientId);
  if (params.segment) sp.set('segment', params.segment);
  if (params.q) sp.set('q', params.q);
  if (params.filters) sp.set('filters', params.filters);
  if (params.account) sp.set('account', params.account);
  if (params.handoff) sp.set('handoff', params.handoff);

  return useQuery({
    queryKey: qk.threads.list(params),
    queryFn: () => apiFetchList<ThreadListItem>(`/threads?${sp.toString()}`),
    staleTime: 30_000,
  });
}

export function useThreadCounts(clientId?: string) {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
  return useQuery({
    queryKey: qk.threads.counts(clientId),
    queryFn: () => apiFetch<Record<string, number>>(`/threads/counts${qs}`),
    staleTime: 30_000,
  });
}

export function useThreadDetail(id?: string) {
  return useQuery({
    queryKey: qk.threads.detail(id || ''),
    queryFn: () => apiFetch<ThreadDetail>(`/threads/${id}`),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function usePatchThread() {
  const queryClient = useQueryClient();

  const mutateFn = ({
    id,
    patch,
  }: {
    id: string;
    patch: Partial<Pick<ThreadListItem, 'unread' | 'important' | 'archived' | 'status'>>;
    undoPatch?: Partial<Pick<ThreadListItem, 'unread' | 'important' | 'archived' | 'status'>>;
    label?: string;
  }) => apiFetch<ThreadListItem>(`/threads/${id}`, { method: 'PATCH', body: patch });

  return useMutation({
    mutationFn: mutateFn,
    onSuccess: (updated, vars) => {
      queryClient.setQueryData<ThreadDetail | undefined>(qk.threads.detail(vars.id), (old) =>
        old ? { ...old, ...updated } : old
      );
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (vars.label && vars.undoPatch) {
        const undo = vars.undoPatch;
        toast.success(vars.label, {
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              apiFetch<ThreadListItem>(`/threads/${vars.id}`, {
                method: 'PATCH',
                body: undo,
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: qk.threads.all() });
                queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              });
            },
          },
        });
      }
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Update failed');
    },
  });
}

export function useChangeOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      owner,
      remember,
    }: {
      id: string;
      owner: Owner;
      remember?: 'sender' | 'domain' | null;
      previousOwner?: Owner;
    }) =>
      apiFetch<ThreadListItem>(`/threads/${id}/owner`, {
        method: 'PATCH',
        body: { owner, remember: remember ?? null },
      }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: qk.threads.detail(vars.id) });
      const prevDetail = queryClient.getQueryData<ThreadDetail>(qk.threads.detail(vars.id));
      if (prevDetail) {
        queryClient.setQueryData<ThreadDetail>(qk.threads.detail(vars.id), {
          ...prevDetail,
          owner: vars.owner,
          ownerSource: 'manual',
          suggestedOwner: undefined,
        });
      }
      return { prevDetail };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prevDetail) {
        queryClient.setQueryData(qk.threads.detail(vars.id), ctx.prevDetail);
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not change owner');
    },
    onSuccess: (updated, vars) => {
      queryClient.setQueryData<ThreadDetail | undefined>(qk.threads.detail(vars.id), (old) =>
        old ? { ...old, ...updated } : old
      );
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const prev = vars.previousOwner;
      const label = `Assigned to ${OWNER_META[vars.owner].label}`;
      toast.success(label, {
        duration: 5000,
        ...(prev && prev !== vars.owner
          ? {
              action: {
                label: 'Undo',
                onClick: () => {
                  apiFetch(`/threads/${vars.id}/owner`, {
                    method: 'PATCH',
                    body: { owner: prev, remember: null },
                  }).then(() => {
                    queryClient.invalidateQueries({ queryKey: qk.threads.all() });
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  });
                },
              },
            }
          : {}),
      });
    },
  });
}

export function useReclassifyThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<ThreadDetail>(`/threads/${id}/reclassify`, { method: 'POST' }),
    onSuccess: (updated, id) => {
      queryClient.setQueryData(qk.threads.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Re-analysed conversation');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Re-analysis failed');
    },
  });
}

export function useThreadSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'apply' | 'dismiss' }) =>
      apiFetch<ThreadListItem>(`/threads/${id}/suggestion`, {
        method: 'POST',
        body: { action },
      }),
    onSuccess: (updated, vars) => {
      queryClient.setQueryData<ThreadDetail | undefined>(qk.threads.detail(vars.id), (old) =>
        old ? { ...old, ...updated } : old
      );
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSimulateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId?: string) =>
      apiFetch<ThreadListItem>('/demo/simulate-email', {
        method: 'POST',
        body: clientId ? { clientId } : {},
      }),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`New email: ${thread.subject}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not simulate email');
    },
  });
}

