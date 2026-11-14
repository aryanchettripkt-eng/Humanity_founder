import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { GoogleButton } from '@/components/common/GoogleButton';
import { Button } from '@/components/ui/button';
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

  return (
    <AuthLayout>
      <div className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Create your assistant account</h1>
        <p className="text-sm text-muted-foreground">
          Connect a client inbox in under a minute (simulated for prototype).
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="name">
            Full name
          </label>
          <Input id="name" placeholder="Alex Morgan" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" placeholder="alex@studio.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" placeholder="At least 6 characters" {...register('password')} />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Continue'}
        </Button>
      </form>

      {health?.googleLogin && (
        <div className="mt-3">
          <GoogleButton
            onClick={() => {
              window.location.href = getGoogleLoginUrl();
            }}
          />
        </div>
      )}

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

