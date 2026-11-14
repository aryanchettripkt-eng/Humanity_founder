import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Inbox, Sparkles, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import {
  useAccounts,
  useAuthorizeAccount,
  useConnectAccount,
} from '@/features/accounts/api';
import { ConnectProviderCard } from '@/features/accounts/components/ConnectProviderCard';
import { SimulatedOAuthModal } from '@/features/accounts/components/SimulatedOAuthModal';
import { SyncProgress } from '@/features/accounts/components/SyncProgress';
import { ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { useSocketEvent } from '@/lib/socket';
import type { EmailAccount, SyncProgressEvent } from '@/types/api';

type Step = 'welcome' | 'connect' | 'sync';

export function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const step = (searchParams.get('step') as Step) || 'welcome';
  const [modalProvider, setModalProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgressEvent | null>(null);

  const { data: accounts } = useAccounts();
  const connectMutation = useConnectAccount();
  const authorizeMutation = useAuthorizeAccount();

  const handleProgress = useCallback((evt: SyncProgressEvent) => {
    setProgress(evt);
  }, []);

  const handleDone = useCallback(
    (_account: EmailAccount) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Inbox synced');
      setTimeout(() => navigate('/app/today', { replace: true }), 500);
    },
    [navigate, queryClient]
  );

  useSocketEvent<SyncProgressEvent>('sync:progress', handleProgress);
  useSocketEvent<EmailAccount>('sync:done', handleDone);

  const goStep = (next: Step) => {
    setSearchParams({ step: next });
  };

  const startConnect = async (provider: 'gmail' | 'outlook') => {
    try {
      const res = await connectMutation.mutateAsync({ provider });
      setPendingAccountId(res.accountId);
      setModalProvider(provider);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start connection');
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
      goStep('sync');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Authorization failed');
    }
  };

  const handleDeny = async () => {
    if (pendingAccountId) {
      await authorizeMutation
        .mutateAsync({
          accountId: pendingAccountId,
          approved: false,
          address: 'cancelled@example.com',
        })
        .catch(() => {});
    }
    setModalProvider(null);
    setPendingAccountId(null);
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        {(['welcome', 'connect', 'sync'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={
                step === s
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground'
              }
            >
              {idx + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {idx < 2 && <span>/</span>}
          </div>
        ))}
      </div>

      {step === 'welcome' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Welcome to Relay</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your AI copilot for managing executive inboxes without guesswork.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>AI decides who needs to reply: you, your client, or nobody.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Clients get a calm, mobile-first queue synced live with you.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Nothing is ever sent without a human click.</span>
            </li>
          </ul>
          <Button className="w-full" onClick={() => goStep('connect')}>
            <span>Get started</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 'connect' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Connect a client inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an email provider to sync and classify conversations.
            </p>
          </div>
          <div className="space-y-3">
            <ConnectProviderCard
              provider="gmail"
              connectedAddress={accounts?.find((a) => a.provider === 'gmail' && a.status === 'connected')?.address}
              loading={connectMutation.isPending}
              onConnect={() => startConnect('gmail')}
            />
            <ConnectProviderCard
              provider="outlook"
              connectedAddress={accounts?.find((a) => a.provider === 'outlook' && a.status === 'connected')?.address}
              loading={connectMutation.isPending}
              onConnect={() => startConnect('outlook')}
            />
          </div>
        </div>
      )}

      {step === 'sync' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Syncing your inbox</h1>
          </div>
          <SyncProgress progress={progress} />
          {progress?.step === 'done' && (
            <Button className="w-full" onClick={() => navigate('/app/today')}>
              Open Today
            </Button>
          )}
        </div>
      )}

      {modalProvider && (
        <SimulatedOAuthModal
          open={Boolean(modalProvider)}
          provider={modalProvider}
          loading={authorizeMutation.isPending}
          onApprove={handleApprove}
          onDeny={handleDeny}
        />
      )}
    </AuthLayout>
  );
}

