import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getAuthToken, setAuthToken } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { ClientSummary, User } from '@/types/api';

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
    queryFn: () => apiFetch<MeResponse>('/auth/me'),
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
    queryClient.clear();
  };
}

