import { CheckCircle2, Loader2 } from 'lucide-react';
import type { SyncProgressEvent } from '@/types/api';

type SyncProgressProps = {
  progress: SyncProgressEvent | null;
};

const STEP_LABELS: Record<SyncProgressEvent['step'], string> = {
  fetching: 'Fetching conversations…',
  classifying: 'Classifying who needs to reply…',
  extracting: 'Extracting dates and summaries…',
  done: 'Inbox ready',
};

export function SyncProgress({ progress }: SyncProgressProps) {
  const step = progress?.step ?? 'fetching';
  const total = progress?.total ?? 1;
  const done = progress?.done ?? 0;
  const pct = step === 'done' ? 100 : Math.min(96, Math.max(8, Math.round((done / total) * 100)));

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        {step === 'done' ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        <span>{STEP_LABELS[step]}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {done} of {total} conversations processed
      </p>
    </div>
  );
}

