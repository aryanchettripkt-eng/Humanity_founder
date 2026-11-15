import { Crown, LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/features/auth/api';

export function ClientLayout() {
  const { data } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      <OfflineBanner />
      <header className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-[560px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Relay</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{data?.user.name}</span>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Sign out"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="grove-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[560px] px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

