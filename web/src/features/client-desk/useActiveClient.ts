import { useMe } from '@/features/auth/api';
import { useUiStore } from '@/stores/ui';

/** The client the assistant is working for right now, and their first name for labels. */
export function useActiveClient() {
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId);
  const client =
    me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0] ?? undefined;
  return {
    client,
    clientId: client?.id,
    firstName: client?.name.split(' ')[0] || 'Client',
  };
}
