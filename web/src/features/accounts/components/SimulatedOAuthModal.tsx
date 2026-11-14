import { Info, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type SimulatedOAuthModalProps = {
  open: boolean;
  provider: 'gmail' | 'outlook';
  defaultAddress?: string;
  loading?: boolean;
  onApprove: (address: string) => void;
  onDeny: () => void;
};

export function SimulatedOAuthModal({
  open,
  provider,
  defaultAddress = 'priya@ramanstudio.com',
  loading = false,
  onApprove,
  onDeny,
}: SimulatedOAuthModalProps) {
  const [address, setAddress] = useState(defaultAddress);
  const providerName = provider === 'gmail' ? 'Google' : 'Microsoft';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDeny()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Info className="h-3 w-3" />
              Simulated in prototype
            </span>
          </div>
          <DialogTitle>Sign in with {providerName}</DialogTitle>
          <DialogDescription>
            Relay is requesting permission to read and organise this client inbox.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="oauth-email">
              Mailbox address
            </label>
            <Input
              id="oauth-email"
              type="email"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
            <div className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Requested permissions</span>
            </div>
            <ul className="list-disc space-y-1 pl-4">
              <li>Read email threads and metadata</li>
              <li>Create draft replies (never auto-sent)</li>
              <li>Extract meeting dates and deadlines</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onDeny} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() => onApprove(address.trim() || defaultAddress)}
              disabled={loading || !address.trim()}
            >
              {loading ? 'Authorizing…' : 'Allow & Sync'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

