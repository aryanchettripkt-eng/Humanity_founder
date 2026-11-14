import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/ErrorState';
import { SourceBadge } from '@/components/common/SourceBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAccounts,
  useAuthorizeAccount,
  useConnectAccount,
  useDisconnectAccount,
  useStartGmail,
  useSyncAccount,
} from '@/features/accounts/api';
import { useHealth } from '@/features/auth/api';
import { ConnectProviderCard } from '@/features/accounts/components/ConnectProviderCard';
import { SimulatedOAuthModal } from '@/features/accounts/components/SimulatedOAuthModal';
import { ApiError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { useUiStore } from '@/stores/ui';

export function SettingsAccountsPage() {
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const { data: health } = useHealth();
  const { data: accounts, isLoading, isError, refetch } = useAccounts(activeClientId);
  const connectMutation = useConnectAccount();
  const authorizeMutation = useAuthorizeAccount();
  const startGmailMutation = useStartGmail();
  const syncMutation = useSyncAccount();
  const disconnectMutation = useDisconnectAccount();

  const [modalProvider, setModalProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);

  const handleConnect = async (provider: 'gmail' | 'outlook') => {
    try {
      const res = await connectMutation.mutateAsync({ provider, clientId: activeClientId });
      setPendingAccountId(res.accountId);
      setModalProvider(provider);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to connect');
    }
  };

  const handleApprove = async (address: string) => {
    if (!pendingAccountId) return;
    try {
      await authorizeMutation.mutateAsync({
        accountId: pendingAccountId,
        approved: true,
        address,
      });
      setModalProvider(null);
      toast.success('Account connected and syncing');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Authorization failed');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Connected accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage simulated email connections for your clients.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-3">
          {accounts?.map((acc) => (
            <Card key={acc.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{acc.address}</span>
                  <SourceBadge source={acc.simulated ? 'demo' : 'gmail'} />
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {acc.provider} · {acc.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {acc.lastSyncedAt
                    ? `Last synced ${formatRelativeTime(acc.lastSyncedAt)}`
                    : 'Not synced yet'}
                  {acc.simulated ? ' · Simulated in prototype' : ' · Read-only Gmail sync'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={syncMutation.isPending || acc.status === 'disconnected'}
                  onClick={() =>
                    syncMutation.mutate(acc.id, {
                      onSuccess: () => toast.success('Sync started'),
                    })
                  }
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync now
                </Button>
                {acc.status !== 'disconnected' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={disconnectMutation.isPending}
                    onClick={() =>
                      disconnectMutation.mutate(acc.id, {
                        onSuccess: () => toast.success('Account disconnected'),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-foreground">Add a connection</h2>
        <ConnectProviderCard
          provider="gmail"
          realAvailable={Boolean(health?.gmail)}
          realLoading={startGmailMutation.isPending}
          onConnect={() => handleConnect('gmail')}
          onConnectReal={async () => {
            try {
              const res = await startGmailMutation.mutateAsync({ clientId: activeClientId });
              window.location.href = res.authUrl;
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'Could not start Gmail OAuth');
            }
          }}
        />
        <ConnectProviderCard provider="outlook" onConnect={() => handleConnect('outlook')} />
      </div>

      {modalProvider && (
        <SimulatedOAuthModal
          open={Boolean(modalProvider)}
          provider={modalProvider}
          loading={authorizeMutation.isPending}
          onApprove={handleApprove}
          onDeny={() => setModalProvider(null)}
        />
      )}
    </div>
  );
}

