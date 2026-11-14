import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { EmailAccount } from '@/types/api';

export function AccountStatusBadge({ account }: { account?: EmailAccount }) {
  if (!account) {
    return (
      <Link
        to="/app/settings/accounts"
        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-background"
      >
        <span className="h-2 w-2 rounded-full bg-border" />
        <span>No account connected</span>
      </Link>
    );
  }

  const isSyncing = account.status === 'syncing';
  const isError = account.status === 'error' || account.status === 'disconnected';

  return (
    <Link
      to="/app/settings/accounts"
      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-background"
    >
      <div className="flex min-w-0 items-center gap-2">
        {isSyncing ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
        ) : (
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isError ? 'bg-destructive' : 'bg-success'
            )}
          />
        )}
        <span className="truncate">{account.address}</span>
      </div>
      <span className="shrink-0 capitalize">{account.provider}</span>
    </Link>
  );
}

