import { ArrowUpRight } from 'lucide-react';
import { ConfidenceMeter } from '@/components/common/ConfidenceMeter';
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
    <article
      className={cn(
        'relative flex min-w-[252px] snap-start flex-col justify-between rounded-[24px] border p-4 transition-all duration-200 sm:min-w-0',
        selected
          ? 'border-landing-ink/30 bg-white shadow-sm'
          : 'border-zinc-200/80 bg-zinc-100/90 hover:bg-white/90'
      )}
    >
      <div className="absolute -right-px -top-px rounded-bl-[24px] bg-landing-surface pb-1.5 pl-1.5">
        <button
          type="button"
          onClick={() => onSelect(thread)}
          aria-label={`Inspect ${thread.sender}'s thread in Summary`}
          aria-pressed={selected}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink',
            selected
              ? 'border-landing-ink bg-landing-ink text-landing-ink-foreground'
              : 'border-zinc-200 bg-white text-landing-ink hover:bg-landing-ink hover:text-landing-ink-foreground'
          )}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-landing-ink">
          {thread.initials}
        </div>

        <h3 className="mt-3 truncate pr-10 text-base font-semibold text-landing-ink">
          {thread.sender}
        </h3>
        <p className="mt-0.5 line-clamp-2 min-h-[32px] text-xs leading-4 text-zinc-600">
          {thread.subject}
        </p>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-zinc-200/70 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-zinc-500">Source</span>
          <SourceBadge source={thread.source} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
              ownerMeta.pillClass
            )}
          >
            <OwnerIcon className="h-3 w-3" aria-hidden="true" />
            <span>{ownerMeta.label}</span>
          </span>
          <ConfidenceMeter value={thread.confidence} />
        </div>
      </div>
    </article>
  );
}

