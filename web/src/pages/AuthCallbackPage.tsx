import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { useMe } from '@/features/auth/api';
import { setAuthToken } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { connectSocket } from '@/lib/socket';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tokenReady, setTokenReady] = useState(false);

  const errorCode = searchParams.get('error');
  const { data: me, isError: meError } = useMe();

  useEffect(() => {
    if (errorCode) return;
    const hash = window.location.hash || '';
    const match = hash.match(/token=([^&]+)/);
    if (match?.[1]) {
      const token = decodeURIComponent(match[1]);
      setAuthToken(token);
      connectSocket();
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      setTokenReady(true);
    }
  }, [errorCode, queryClient]);

  useEffect(() => {
    if (!tokenReady || !me?.user) return;
    if (me.user.role === 'client') {
      navigate('/c', { replace: true });
    } else if (!me.user.onboarding.completed && me.clients.length === 0) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/app/today', { replace: true });
    }
  }, [tokenReady, me, navigate]);

  if (errorCode || meError) {
    const message =
      errorCode === 'access_denied'
        ? 'Google sign-in was cancelled.'
        : errorCode === 'state_invalid'
          ? 'Your sign-in session expired. Please try again.'
          : 'Could not complete Google sign-in. Please try again or use the demo inbox.';
    return (
      <AuthLayout>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Sign-in interrupted</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing you in with Google…</p>
      </div>
    </AuthLayout>
  );
}

