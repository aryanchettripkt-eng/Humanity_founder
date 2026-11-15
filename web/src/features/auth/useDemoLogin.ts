import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { demoLoginApi } from '@/features/auth/api';
import { ApiError } from '@/lib/api';

export function useDemoLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [demoLoading, setDemoLoading] = useState<'assistant' | 'client' | null>(null);

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

  return { demoLoading, handleDemo };
}

