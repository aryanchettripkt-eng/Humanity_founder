export const qk = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  accounts: {
    all: (clientId?: string) => ['accounts', { clientId: clientId ?? null }] as const,
  },
  threads: {
    all: () => ['threads'] as const,
    list: (params: {
      segment?: string;
      q?: string;
      filters?: string;
      handoff?: string;
      account?: string;
      clientId?: string;
      pageSize?: number;
    }) => ['threads', 'list', params] as const,
    counts: (clientId?: string) => ['threads', 'counts', { clientId: clientId ?? null }] as const,
    detail: (id: string) => ['threads', 'detail', id] as const,
  },
  dashboard: {
    summary: (clientId?: string) => ['dashboard', 'summary', { clientId: clientId ?? null }] as const,
  },
  activity: {
    list: (clientId?: string) => ['activity', 'list', { clientId: clientId ?? null }] as const,
  },
  client: {
    queue: () => ['client', 'queue'] as const,
    detail: (id: string) => ['client', 'detail', id] as const,
  },
};

