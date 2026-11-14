import { CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ConnectProviderCardProps = {
  provider: 'gmail' | 'outlook';
  connectedAddress?: string;
  loading?: boolean;
  onConnect: () => void;
};

export function ConnectProviderCard({
  provider,
  connectedAddress,
  loading = false,
  onConnect,
}: ConnectProviderCardProps) {
  const isGmail = provider === 'gmail';
  const title = isGmail ? 'Google Gmail' : 'Microsoft Outlook';
  const subtitle = isGmail
    ? 'Read-only inbox & thread sync for Google Workspace'
    : 'Read-only inbox & calendar sync for Microsoft 365';

  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {connectedAddress ? `Connected as ${connectedAddress}` : subtitle}
          </p>
        </div>
      </div>

      {connectedAddress ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Connected
        </span>
      ) : (
        <Button size="sm" onClick={onConnect} disabled={loading}>
          {loading ? 'Opening…' : 'Connect'}
        </Button>
      )}
    </Card>
  );
}

