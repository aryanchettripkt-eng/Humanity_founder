import { CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ConnectProviderCardProps = {
  provider: 'gmail' | 'outlook';
  connectedAddress?: string;
  loading?: boolean;
  demoAvailable?: boolean;
  realAvailable?: boolean;
  realLoading?: boolean;
  onConnect: () => void;
  onConnectReal?: () => void;
};

export function ConnectProviderCard({
  provider,
  connectedAddress,
  loading = false,
  demoAvailable = true,
  realAvailable = false,
  realLoading = false,
  onConnect,
  onConnectReal,
}: ConnectProviderCardProps) {
  const isGmail = provider === 'gmail';
  const showDual = isGmail && realAvailable && !connectedAddress && Boolean(onConnectReal);
  const title = isGmail ? 'Google Gmail' : 'Microsoft Outlook';
  const subtitle = isGmail
    ? showDual
      ? 'Read-only. Your emails are analysed by AI to sort them. Nothing is sent or changed in Gmail.'
      : 'Sample inbox & thread sync (simulated in prototype)'
    : 'Simulated Outlook inbox & calendar preview';

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {!connectedAddress && !showDual && (
              <span className="rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Simulated
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {connectedAddress ? `Connected as ${connectedAddress}` : subtitle}
          </p>
          {showDual && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Works for approved test accounts while Google reviews the app.
            </p>
          )}
        </div>
      </div>

      {connectedAddress ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Connected
        </span>
      ) : showDual ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {demoAvailable && (
            <Button size="sm" onClick={onConnect} disabled={loading || realLoading}>
              {loading ? 'Opening…' : 'Use demo inbox'}
            </Button>
          )}
          <Button
            size="sm"
            variant={demoAvailable ? 'outline' : 'default'}
            onClick={onConnectReal}
            disabled={loading || realLoading}
          >
            {realLoading ? 'Redirecting…' : 'Connect real Gmail (beta)'}
          </Button>
        </div>
      ) : (
        <Button size="sm" className="shrink-0" onClick={onConnect} disabled={loading}>
          {loading ? 'Opening…' : 'Connect'}
        </Button>
      )}
    </Card>
  );
}

