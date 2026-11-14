import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { DashboardSummary, MorningBrief } from '@/types/api';

export function useDashboard(clientId?: string) {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
  return useQuery({
    queryKey: qk.dashboard.summary(clientId),
    queryFn: () => apiFetch<DashboardSummary>(`/dashboard${qs}`),
    staleTime: 30_000,
  });
}

export function useRefreshBrief(clientId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<MorningBrief>('/ai/brief/refresh', {
        method: 'POST',
        body: clientId ? { clientId } : {},
      }),
    onSuccess: (brief) => {
      queryClient.setQueryData<DashboardSummary | undefined>(
        qk.dashboard.summary(clientId),
        (old) => (old ? { ...old, brief } : old)
      );
      toast.success('Brief refreshed');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not refresh brief');
    },
  });
}

