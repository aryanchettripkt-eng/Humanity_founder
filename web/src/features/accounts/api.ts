import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { EmailAccount } from '@/types/api';

export function useAccounts(clientId?: string, enabled = true) {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
  return useQuery({
    queryKey: qk.accounts.all(clientId),
    queryFn: () => apiFetch<EmailAccount[]>(`/accounts${qs}`),
    enabled,
    staleTime: 30_000,
  });
}

export function useConnectAccount() {
  return useMutation({
    mutationFn: (body: { provider: 'gmail' | 'outlook'; clientId?: string }) =>
      apiFetch<{ accountId: string; consentUrl: null; simulated: true }>('/accounts/connect', {
        method: 'POST',
        body,
      }),
  });
}

export function useStartGmail() {
  return useMutation({
    mutationFn: (body: { clientId?: string } = {}) =>
      apiFetch<{ authUrl: string }>('/accounts/gmail/start', {
        method: 'POST',
        body,
      }),
  });
}

export function useAuthorizeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      approved,
      address,
    }: {
      accountId: string;
      approved: boolean;
      address: string;
    }) =>
      apiFetch<EmailAccount>(`/accounts/${accountId}/authorize`, {
        method: 'POST',
        body: { approved, address },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
    },
  });
}

export function useSyncAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      apiFetch<{ started: boolean }>(`/accounts/${accountId}/sync`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      apiFetch<{ ok: boolean }>(`/accounts/${accountId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

