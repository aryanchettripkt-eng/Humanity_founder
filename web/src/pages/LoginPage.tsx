import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Crown, UserRoundCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { GoogleButton } from '@/components/common/GoogleButton';
import { Input } from '@/components/ui/input';
import { getGoogleLoginUrl, loginApi, useHealth } from '@/features/auth/api';
import { useDemoLogin } from '@/features/auth/useDemoLogin';
import { ApiError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { demoLoading, handleDemo } = useDemoLogin();
  const { data: health } = useHealth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await loginApi(values);
      queryClient.clear();
      navigate(res.user.role === 'client' ? '/c' : '/app/today', {
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Login failed');
    }
  };

  const formErrorIds =
    [errors.email && 'login-email-error', errors.password && 'login-password-error']
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <AuthLayout
      headline="Welcome back."
      subline="Get to replies faster. One place for you, your client, and every conversation."
    >
      <h2 className="auth-title text-[var(--fg)]">Sign in</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-describedby={formErrorIds}
        className="auth-form"
      >
        <div>
          <label className="auth-label text-[var(--fg)]" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            variant="pill"
            className="auth-input"
            autoComplete="email"
            placeholder="alex@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="login-email-error" className="auth-field-error text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="auth-label text-[var(--fg)]" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            variant="pill"
            className="auth-input"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="login-password-error" className="auth-field-error text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="auth-check flex items-center">
          <input
            id="remember"
            type="checkbox"
            {...register('remember')}
            className="cursor-pointer rounded border border-[var(--card-glass-border)] accent-[var(--cta-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] dark:accent-[var(--grove-lime)] dark:focus-visible:ring-[var(--grove-lime)]"
          />
          <label htmlFor="remember" className="cursor-pointer select-none text-[var(--fg-muted)]">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-submit flex w-full items-center justify-center rounded-full bg-[var(--cta-lime-bg)] font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-[var(--grove-lime)]"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="auth-divider flex items-center">
        <span className="h-px flex-1 bg-[var(--glass-divider)]" aria-hidden="true" />
        <span className="font-medium uppercase text-[var(--fg-subtle)]">
          OR CONTINUE WITH
        </span>
        <span className="h-px flex-1 bg-[var(--glass-divider)]" aria-hidden="true" />
      </div>

      <div className="auth-alt">
        {health?.googleLogin ? (
          <div className="auth-alt-google">
            <GoogleButton
              variant="glass"
              label="Google"
              onClick={() => {
                window.location.href = getGoogleLoginUrl();
              }}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="auth-eyebrow font-medium uppercase text-[var(--fg-subtle)]">Try the demo</p>
          <div className="auth-alt-grid grid grid-cols-1 min-[400px]:grid-cols-2">
            <button
              type="button"
              disabled={demoLoading !== null}
              onClick={() => handleDemo('assistant')}
              className="auth-alt-btn flex items-center justify-center gap-2 rounded-full border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] px-4 font-medium text-[var(--fg)] transition-colors hover:bg-[var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-[var(--grove-lime)]"
            >
              <UserRoundCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {demoLoading === 'assistant' ? 'Signing in…' : 'Assistant (Alex)'}
              </span>
            </button>
            <button
              type="button"
              disabled={demoLoading !== null}
              onClick={() => handleDemo('client')}
              className="auth-alt-btn flex items-center justify-center gap-2 rounded-full border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] px-4 font-medium text-[var(--fg)] transition-colors hover:bg-[var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-[var(--grove-lime)]"
            >
              <Crown className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {demoLoading === 'client' ? 'Signing in…' : 'Client (Priya)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <p className="auth-footer text-center text-[var(--fg-muted)]">
        New to Relay?{' '}
        <Link
          to="/signup"
          className="font-medium text-[var(--cta-bg)] hover:underline dark:text-[var(--grove-lime)]"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
