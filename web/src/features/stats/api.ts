import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchList } from '@/lib/api';
import type { ActivityItem, ThreadListItem } from '@/types/api';

const SEGMENTS = ['inbox', 'done', 'archived'] as const;
const PAGE_SIZE = 100;

export type StatsThreads = {
  threads: ThreadListItem[];
  /** How many threads exist across the segments, which can exceed what was fetched. */
  total: number;
};

/** Latest 100 threads from open, done and archived, de-duplicated. Stats are computed from these. */
export function useStatsThreads(clientId?: string) {
  return useQuery({
    queryKey: ['stats', 'threads', { clientId: clientId ?? null }],
    queryFn: async (): Promise<StatsThreads> => {
      const results = await Promise.all(
        SEGMENTS.map((segment) => {
          const sp = new URLSearchParams({ segment, pageSize: String(PAGE_SIZE) });
          if (clientId) sp.set('clientId', clientId);
          return apiFetchList<ThreadListItem>(`/threads?${sp.toString()}`);
        })
      );
      const byId = new Map<string, ThreadListItem>();
      let total = 0;
      for (const r of results) {
        total += Math.max(r.meta?.total ?? 0, r.data.length);
        for (const t of r.data) byId.set(t.id, t);
      }
      return { threads: [...byId.values()], total };
    },
    staleTime: 60_000,
  });
}

export function useActivityFeed(clientId?: string, limit = 20) {
  const sp = new URLSearchParams({ limit: String(limit) });
  if (clientId) sp.set('clientId', clientId);
  return useQuery({
    queryKey: ['activity', 'list', { clientId: clientId ?? null, limit }],
    queryFn: () => apiFetch<ActivityItem[]>(`/activity?${sp.toString()}`),
    staleTime: 30_000,
  });
}
