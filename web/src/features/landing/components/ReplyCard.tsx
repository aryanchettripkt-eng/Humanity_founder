import { ArrowUpRight } from 'lucide-react';
import { ConfidenceMeter } from '@/components/common/ConfidenceMeter';
import { NotchedCard } from '@/components/common/NotchedCard';
import { SourceBadge } from '@/components/common/SourceBadge';
import type { SampleReplyThread } from '@/features/landing/sampleData';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';

type ReplyCardProps = {
  thread: SampleReplyThread;
  selected: boolean;
  onSelect: (thread: SampleReplyThread) => void;
};

export function ReplyCard({ thread, selected, onSelect }: ReplyCardProps) {
  const ownerMeta = OWNER_META[thread.owner];
  const OwnerIcon = ownerMeta.icon;

  return (
    <NotchedCard
      tone="soft"
      selected={selected}
      className="p-4"
      notch={
        <button
          type="button"
          onClick={() => onSelect(thread)}
          aria-label={`Inspect ${thread.sender}'s thread in Summary`}
          aria-pressed={selected}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground'
          )}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      }
    >
      <div>
        <div
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-foreground"
        >
          {thread.initials}
        </div>

        <h3 className="mt-3 truncate pr-12 text-base font-semibold text-foreground">
          {thread.sender}
        </h3>
        <p className="mt-0.5 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-muted-foreground">
          {thread.subject}
        </p>
      </div>

      <div className="mt-auto space-y-2.5 border-t border-border pt-3">
        <div className="flex h-6 items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Source</span>
          <SourceBadge source={thread.source} />
        </div>

        <div className="flex min-h-[28px] items-center justify-between gap-1.5">
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
              ownerMeta.pillClass
            )}
          >
            <OwnerIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{ownerMeta.shortLabel}</span>
          </span>
          <ConfidenceMeter value={thread.confidence} className="shrink-0" />
        </div>
      </div>
    </NotchedCard>
  );
}
