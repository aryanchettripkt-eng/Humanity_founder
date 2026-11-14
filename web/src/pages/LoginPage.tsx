import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Crown, UserRoundCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { GoogleButton } from '@/components/common/GoogleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { demoLoginApi, getGoogleLoginUrl, loginApi, useHealth } from '@/features/auth/api';
import { ApiError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [demoLoading, setDemoLoading] = useState<'assistant' | 'client' | null>(null);
  const { data: health } = useHealth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await loginApi(values);
      queryClient.clear();
      navigate(res.user.role === 'client' ? '/c' : '/app/today', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Login failed');
    }
  };

  const handleDemo = async (role: 'assistant' | 'client') => {
    setDemoLoading(role);
    try {
      await demoLoginApi(role);
      queryClient.clear();
      navigate(role === 'client' ? '/c' : '/app/today', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Know in seconds who needs to reply — you, your client, or nobody.
        </p>
      </div>

      <div className="mb-6 space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Try the demo in one click
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={demoLoading !== null}
            onClick={() => handleDemo('assistant')}
            className="justify-start"
          >
            <UserRoundCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{demoLoading === 'assistant' ? 'Signing in…' : 'Assistant (Alex)'}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={demoLoading !== null}
            onClick={() => handleDemo('client')}
            className="justify-start"
          >
            <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>{demoLoading === 'client' ? 'Signing in…' : 'Client (Priya)'}</span>
          </Button>
        </div>
        {health?.googleLogin && (
          <div className="mt-2">
            <GoogleButton
              onClick={() => {
                window.location.href = getGoogleLoginUrl();
              }}
            />
          </div>
        )}
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" placeholder="alex@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        New assistant?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

