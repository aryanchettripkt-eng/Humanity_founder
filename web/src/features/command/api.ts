import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface AskResponse {
  answer: string;
  threadIds: string[];
  action?: { type: 'draft'; threadId: string };
}

export function useAskAI() {
  return useMutation({
    mutationFn: (body: { clientId?: string; question: string; threadId?: string }) =>
      apiFetch<AskResponse>('/ai/ask', { method: 'POST', body }),
  });
}

