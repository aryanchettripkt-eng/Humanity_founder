import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
  PenLine,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import {
  useAccounts,
  useAuthorizeAccount,
  useCompleteGmail,
  useConnectAccount,
  useStartGmail,
} from '@/features/accounts/api';
import { useHealth } from '@/features/auth/api';
import { ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { useSocketEvent } from '@/lib/socket';
import { cn } from '@/lib/utils';
import type { EmailAccount, SyncProgressEvent } from '@/types/api';

type Step = 'welcome' | 'connect' | 'sync';

const STEPS: { id: Step; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'connect', label: 'Connect' },
  { id: 'sync', label: 'Sync' },
];

const HERO: Record<Step, { headline: string; subline: string }> = {
  welcome: {
    headline: 'Welcome to Relay.',
    subline: 'Every email, sorted by who needs to reply: you, your client, or nobody.',
  },
  connect: {
    headline: 'Bring in the inbox.',
    subline: 'Try it with sample emails first, or connect a real Gmail account.',
  },
  sync: {
    headline: 'Almost there.',
    subline: 'Relay is reading each email and working out who needs to reply.',
  },
};

const POINTS = [
  { icon: Sparkles, text: 'AI sorts every email: for you, for your client, or no reply needed.' },
  { icon: Users, text: 'Your client gets their own short queue of what needs them.' },
  { icon: PenLine, text: 'Replies are drafted for you to edit and save. Relay never emails anyone on its own.' },
];

const SYNC_LABELS: Record<SyncProgressEvent['step'], string> = {
  fetching: 'Fetching emails…',
  classifying: 'Working out who needs to reply…',
  extracting: 'Finding dates and writing summaries…',
  done: 'All sorted',
};

const DEMO_ADDRESS = 'priya@ramanstudio.com';

const LIME_BTN =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--cta-lime-bg)] font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-[var(--grove-lime)]';
const OUTLINE_BTN =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] font-semibold text-[var(--fg)] transition-colors hover:bg-[var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-[var(--grove-lime)]';

export function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const step = (searchParams.get('step') as Step) || 'welcome';
  const accountIdParam = searchParams.get('accountId');
  const oauthError = searchParams.get('error');
  const [progress, setProgress] = useState<SyncProgressEvent | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { data: health } = useHealth();
  const { data: accounts } = useAccounts(undefined, true, step === 'sync' ? 2000 : false);
  const connectMutation = useConnectAccount();
  const authorizeMutation = useAuthorizeAccount();
  const startGmailMutation = useStartGmail();
  const completeGmailMutation = useCompleteGmail();
  const connectHandledRef = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('connect');
    if (!code || connectHandledRef.current === code) return;
    connectHandledRef.current = code;
    completeGmailMutation.mutate(
      { code },
      {
        onSuccess: (account) => {
          setSearchParams({ step: 'sync', accountId: account.id }, { replace: true });
        },
        onError: (err) => {
          setSyncError(err instanceof ApiError ? err.message : 'Could not complete Gmail connection');
        },
      }
    );
  }, [searchParams, setSearchParams, completeGmailMutation]);

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
      setTimeout(() => navigate('/app/today?tour=1', { replace: true }), 500);
    },
    [navigate, queryClient]
  );

  useSocketEvent<SyncProgressEvent>('sync:progress', handleProgress);
  useSocketEvent<EmailAccount>('sync:done', handleDone);

  // Fallback polling completion in case redirect happened after socket sync:done fired
  useEffect(() => {
    if (step !== 'sync' || !accounts?.length) return;
    const target = accountIdParam
      ? accounts.find((a) => a.id === accountIdParam)
      : accounts.find((a) => a.status === 'connected' || a.status === 'error');
    if (!target) return;
    if (target.status === 'connected' && progress?.step !== 'done') {
      handleDone(target);
    } else if (target.status === 'error' && !syncError) {
      setSyncError(target.error || 'Sync failed');
    }
  }, [step, accounts, accountIdParam, progress?.step, syncError, handleDone]);

  const goStep = (next: Step) => {
    setSearchParams({ step: next });
  };

  const syncPct =
    progress?.step === 'done'
      ? 100
      : Math.min(96, Math.max(8, Math.round(((progress?.done ?? 0) / (progress?.total || 1)) * 100)));

  // Demo inbox: load the sample emails straight away (no pretend sign-in screen).
  const startDemo = async () => {
    try {
      const res = await connectMutation.mutateAsync({ provider: 'gmail' });
      await authorizeMutation.mutateAsync({
        accountId: res.accountId,
        approved: true,
        address: DEMO_ADDRESS,
      });
      goStep('sync');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load the demo inbox');
    }
  };

  const startRealGmail = async () => {
    try {
      const res = await startGmailMutation.mutateAsync({});
      window.location.href = res.authUrl;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start Gmail sign-in');
    }
  };

  const demoBusy = connectMutation.isPending || authorizeMutation.isPending;
  const connected =
    accounts?.find((a) => a.status === 'connected' && !a.simulated) ||
    accounts?.find((a) => a.status === 'connected');
  const canSwitchFromDemo = Boolean(connected?.simulated && health?.gmail);
  const hero = HERO[step] ?? HERO.welcome;

  return (
    <AuthLayout headline={hero.headline} subline={hero.subline}>
      <ol aria-label="Setup steps" className="onb-steps flex items-center">
        {STEPS.map((s, idx) => {
          const current = s.id === step;
          const done = STEPS.findIndex((x) => x.id === step) > idx;
          return (
            <li key={s.id} className="flex items-center">
              <span
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'onb-step inline-flex items-center rounded-full border font-medium',
                  current
                    ? 'border-transparent bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                    : 'border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] text-[var(--fg-muted)]'
                )}
              >
                {done ? (
                  <Check className="onb-step-icon" aria-hidden="true" />
                ) : (
                  <span className="tabular-nums">{idx + 1}</span>
                )}
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 'welcome' && (
        <>
          <h2 className="auth-title onb-title text-[var(--fg)]">Let&apos;s set up Relay</h2>
          <ul className="onb-points">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start">
                <span className="onb-point-icon flex shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                  <p.icon aria-hidden="true" />
                </span>
                <span className="text-[var(--fg)]">{p.text}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => goStep('connect')}
            className={cn(LIME_BTN, 'auth-submit onb-cta w-full')}
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}

      {step === 'connect' && (
        <>
          <h2 className="auth-title onb-title text-[var(--fg)]">Connect an inbox</h2>
          <p className="onb-lead text-[var(--fg-muted)]">
            Start with the demo inbox, or connect a real Gmail account.
          </p>

          {oauthError && (
            <div role="alert" className="onb-alert rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]">
              {oauthError === 'not_test_user'
                ? "Google didn't allow this account yet. Real Gmail only works for approved test accounts during the beta. You can use the demo inbox instead."
                : oauthError === 'account_mismatch'
                  ? 'That Gmail belongs to a different Google account. You can only connect the inbox of the account you signed in with.'
                  : "Google sign-in didn't finish. Try again, or use the demo inbox."}
            </div>
          )}

          {connected && canSwitchFromDemo ? (
            <div className="onb-options">
              <div className="onb-option flex flex-col rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start">
                  <span className="onb-option-icon flex shrink-0 items-center justify-center rounded-full border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]">
                    <Mail aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="onb-option-title text-[var(--fg)]">Switch to your Gmail</p>
                    <p className="onb-option-body text-[var(--fg-muted)]">
                      You&apos;re on the demo inbox. Connect the Gmail you signed in with and the
                      sample emails are removed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startRealGmail}
                  disabled={startGmailMutation.isPending}
                  className={cn(LIME_BTN, 'onb-option-btn')}
                >
                  {startGmailMutation.isPending ? 'Opening Google…' : 'Connect Gmail'}
                </button>
              </div>
              <div className="onb-option flex flex-col rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start">
                  <span className="onb-option-icon flex shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                    <Inbox aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="onb-option-title text-[var(--fg)]">Keep the demo inbox</p>
                    <p className="onb-option-body truncate text-[var(--fg-muted)]">{connected.address}</p>
                  </div>
                </div>
                <button type="button" onClick={() => navigate('/app/today')} className={cn(OUTLINE_BTN, 'onb-option-btn')}>
                  Open Today
                </button>
              </div>
            </div>
          ) : connected ? (
            <div className="onb-option flex items-center rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)]">
              <span className="onb-option-icon flex shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                <CheckCircle2 aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="onb-option-title text-[var(--fg)]">Connected</p>
                <p className="onb-option-body truncate text-[var(--fg-muted)]">{connected.address}</p>
              </div>
              <button type="button" onClick={() => navigate('/app/today')} className={cn(LIME_BTN, 'onb-option-btn')}>
                Open Today
              </button>
            </div>
          ) : (
            <div className="onb-options">
              <div className="onb-option flex flex-col rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start">
                  <span className="onb-option-icon flex shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                    <Inbox aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="onb-option-title text-[var(--fg)]">Demo inbox</p>
                    <p className="onb-option-body text-[var(--fg-muted)]">
                      Sample emails for Priya, ready in seconds.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startDemo}
                  disabled={demoBusy || startGmailMutation.isPending}
                  className={cn(LIME_BTN, 'onb-option-btn')}
                >
                  {demoBusy ? 'Loading…' : 'Use demo inbox'}
                </button>
              </div>

              {health?.gmail ? (
                <div className="onb-option flex flex-col rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start">
                    <span className="onb-option-icon flex shrink-0 items-center justify-center rounded-full border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]">
                      <Mail aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="onb-option-title flex flex-wrap items-center gap-2 text-[var(--fg)]">
                        Gmail
                        <span className="onb-badge rounded-full border border-[var(--card-glass-border)] font-medium text-[var(--fg-muted)]">
                          Beta
                        </span>
                      </p>
                      <p className="onb-option-body text-[var(--fg-muted)]">
                        Read-only. Relay sorts your email and never changes anything in Gmail.
                        Works for approved test accounts for now.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={startRealGmail}
                    disabled={demoBusy || startGmailMutation.isPending}
                    className={cn(OUTLINE_BTN, 'onb-option-btn')}
                  >
                    {startGmailMutation.isPending ? 'Opening Google…' : 'Connect Gmail'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <button
            type="button"
            onClick={() => goStep('welcome')}
            className="onb-back inline-flex items-center gap-1.5 font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        </>
      )}

      {step === 'sync' && (
        <>
          <h2 className="auth-title onb-title text-[var(--fg)]">
            {progress?.step === 'done' ? 'Your inbox is ready' : 'Sorting your inbox'}
          </h2>
          <div className="onb-sync">
            <div className="flex items-center gap-2.5 font-medium text-[var(--fg)]">
              {progress?.step === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--chip-fg)] dark:text-[var(--grove-lime)]" aria-hidden="true" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--fg-muted)]" aria-hidden="true" />
              )}
              <span>{SYNC_LABELS[progress?.step ?? 'fetching']}</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={syncPct}
              className="onb-bar w-full overflow-hidden rounded-full bg-[var(--card-glass-bg)]"
            >
              <div
                className="h-full rounded-full bg-[var(--cta-lime-bg)] transition-all duration-300"
                style={{ width: `${syncPct}%` }}
              />
            </div>
            <p className="text-sm tabular-nums text-[var(--fg-muted)]">
              {progress ? `${progress.done} of ${progress.total} emails sorted` : 'Starting…'}
            </p>
          </div>

          {syncError && (
            <div role="alert" className="onb-alert rounded-2xl border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]">
              <p>{syncError}</p>
              <button type="button" onClick={() => goStep('connect')} className={cn(OUTLINE_BTN, 'onb-option-btn mt-3')}>
                Back to connect
              </button>
            </div>
          )}

          {progress?.step === 'done' && (
            <button
              type="button"
              onClick={() => navigate('/app/today?tour=1')}
              className={cn(LIME_BTN, 'auth-submit onb-cta w-full')}
            >
              Open Today
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </AuthLayout>
  );
}
