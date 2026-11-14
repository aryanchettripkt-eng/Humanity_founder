import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getAuthToken, setAuthToken } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useUiStore } from '@/stores/ui';
import type { ClientSummary, HealthInfo, User } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getGoogleLoginUrl(): string {
  return `${API_URL}/auth/google/start`;
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthInfo>('/health'),
    staleTime: 60_000,
    retry: false,
  });
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  clients: ClientSummary[];
}

export async function loginApi(body: { email: string; password: string }): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body });
  setAuthToken(res.token);
  connectSocket();
  return res;
}

export async function signupApi(body: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/signup', { method: 'POST', body });
  setAuthToken(res.token);
  connectSocket();
  return res;
}

export async function demoLoginApi(role: 'assistant' | 'client'): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/demo', { method: 'POST', body: { role } });
  setAuthToken(res.token);
  connectSocket();
  return res;
}

export function useMe() {
  const hasToken = Boolean(getAuthToken());
  return useQuery({
    queryKey: qk.auth.me(),
    queryFn: async () => {
      const data = await apiFetch<MeResponse>('/auth/me');
      const ui = useUiStore.getState();
      const validIds = new Set(data.clients.map((c) => c.id));
      if (
        ui.activeClientUserId !== data.user.id ||
        (ui.activeClientId && !validIds.has(ui.activeClientId))
      ) {
        ui.setActiveClientId(data.clients[0]?.id ?? null);
        ui.setActiveClientUserId(data.user.id);
      }
      return data;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    setAuthToken(null);
    disconnectSocket();
    useUiStore.getState().setActiveClientId(null);
    useUiStore.getState().setActiveClientUserId(null);
    queryClient.clear();
  };
}

