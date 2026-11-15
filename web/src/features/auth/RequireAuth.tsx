import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts } from '@/features/accounts/api';
import { getAuthToken } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useUiStore } from '@/stores/ui';
import { useMe } from './api';

type RequireAuthProps = {
  role: 'assistant' | 'client';
  allowNoAccounts?: boolean;
  allowAssistantPreview?: boolean;
  children: ReactNode;
};

export function RequireAuth({
  role,
  allowNoAccounts = false,
  allowAssistantPreview = false,
  children,
}: RequireAuthProps) {
  const location = useLocation();
  const token = getAuthToken();
  const { data, isLoading, isError } = useMe();
  const { activeClientId, setActiveClientId } = useUiStore();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(
    undefined,
    Boolean(data?.user && data.user.role === 'assistant' && !allowNoAccounts)
  );

  useEffect(() => {
    if (token) connectSocket();
  }, [token]);

  useEffect(() => {
    if (data?.clients?.length && !activeClientId) {
      setActiveClientId(data.clients[0].id);
    }
  }, [data?.clients, activeClientId, setActiveClientId]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data?.user) {
    return <Navigate to="/login" replace />;
  }

  const isAssistantPreview =
    allowAssistantPreview &&
    role === 'client' &&
    data.user.role === 'assistant' &&
    new URLSearchParams(location.search).get('preview') === '1';

  if (data.user.role !== role && !isAssistantPreview) {
    return <Navigate to={data.user.role === 'client' ? '/c' : '/app/today'} replace />;
  }

  if (role === 'assistant' && !allowNoAccounts && !accountsLoading && accounts) {
    const hasConnected = accounts.some((a) => a.status === 'connected' || a.status === 'syncing');
    if (!hasConnected) {
      return <Navigate to="/onboarding?step=connect" replace />;
    }
  }

  return <>{children}</>;
}

