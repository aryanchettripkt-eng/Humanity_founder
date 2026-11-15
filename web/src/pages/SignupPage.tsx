import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { GoogleButton } from '@/components/common/GoogleButton';
import { Input } from '@/components/ui/input';
import { getGoogleLoginUrl, signupApi, useHealth } from '@/features/auth/api';
import { ApiError } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: health } = useHealth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await signupApi(values);
      queryClient.clear();
      navigate('/onboarding?step=welcome', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Signup failed');
    }
  };

  const formErrorIds =
    [
      errors.name && 'signup-name-error',
      errors.email && 'signup-email-error',
      errors.password && 'signup-password-error',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <AuthLayout
      headline="Set up your desk."
      subline="Bring in a client's inbox and see in seconds who needs to reply."
    >
      <h2 className="font-display text-[32px] font-medium leading-tight text-[var(--fg)] sm:text-[36px]">
        Create your account
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-describedby={formErrorIds}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="mb-2 block text-[14px] font-medium text-[var(--fg)]" htmlFor="name">
            Full name
          </label>
          <Input
            id="name"
            variant="pill"
            autoComplete="name"
            placeholder="Alex Morgan"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'signup-name-error' : undefined}
            {...register('name')}
          />
          {errors.name ? (
            <p id="signup-name-error" className="mt-1.5 text-[13px] text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-[var(--fg)]" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            variant="pill"
            autoComplete="email"
            placeholder="alex@studio.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="signup-email-error" className="mt-1.5 text-[13px] text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-2 block text-[14px] font-medium text-[var(--fg)]"
            htmlFor="password"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            variant="pill"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'signup-password-error' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="signup-password-error" className="mt-1.5 text-[13px] text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--cta-lime-bg)] text-[16px] font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-[var(--grove-lime)]"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {health?.googleLogin ? (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--glass-divider)]" aria-hidden="true" />
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
              OR CONTINUE WITH
            </span>
            <span className="h-px flex-1 bg-[var(--glass-divider)]" aria-hidden="true" />
          </div>
          <GoogleButton
            variant="glass"
            label="Google"
            onClick={() => {
              window.location.href = getGoogleLoginUrl();
            }}
          />
        </>
      ) : null}

      <p className="mt-6 text-center text-[14px] text-[var(--fg-muted)]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-[var(--cta-bg)] hover:underline dark:text-[var(--grove-lime)]"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
