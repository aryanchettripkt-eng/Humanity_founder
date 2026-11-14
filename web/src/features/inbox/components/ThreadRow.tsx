import { CalendarDays, Star } from 'lucide-react';
import { OwnerPill } from '@/components/common/OwnerPill';
import { OwnerPopover } from '@/components/common/OwnerPopover';
import { formatShortDate, isWithin24Hours } from '@/lib/format';
import { CATEGORY_ICONS } from '@/lib/owners';
import { cn } from '@/lib/utils';
import type { Owner, ThreadListItem } from '@/types/api';

type ThreadRowProps = {
  thread: ThreadListItem;
  selected?: boolean;
  focused?: boolean;
  isNew?: boolean;
  onSelect: () => void;
  onToggleImportant: (important: boolean) => void;
  onChangeOwner: (owner: Owner, remember: 'sender' | 'domain' | null) => void;
};

export function ThreadRow({
  thread,
  selected = false,
  focused = false,
  isNew = false,
  onSelect,
  onToggleImportant,
  onChangeOwner,
}: ThreadRowProps) {
  const sender = thread.participants?.[0];
  const senderLabel = sender?.name || sender?.email || 'Unknown';
  const CatIcon = CATEGORY_ICONS[thread.category] ?? CATEGORY_ICONS.general;
  const showReclassified = isWithin24Hours(thread.reclassifiedAt);
  const hasDate = (thread.entities?.length ?? 0) > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-1.5 border-b border-border px-3.5 py-3 transition-colors duration-150 focus:outline-none',
        selected
          ? 'bg-primary/[0.06] dark:bg-primary/[0.12]'
          : 'hover:bg-surface',
        focused && 'ring-2 ring-inset ring-ring',
        isNew && 'bg-indigo-50/70 dark:bg-indigo-500/10'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {thread.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          <span
            className={cn(
              'truncate text-sm',
              thread.unread ? 'font-semibold text-foreground' : 'font-normal text-foreground/85'
            )}
          >
            {senderLabel}
          </span>
          {thread.messageCount > 1 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              ({thread.messageCount})
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={thread.important ? 'Remove star' : 'Star conversation'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleImportant(!thread.important);
            }}
            className={cn(
              'rounded p-0.5 transition-opacity',
              thread.important
                ? 'text-amber-500 opacity-100'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground'
            )}
          >
            <Star className={cn('h-3.5 w-3.5', thread.important && 'fill-current')} />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatShortDate(thread.lastMessageAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <CatIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p
          title={thread.subject}
          className={cn(
            'truncate text-sm',
            thread.unread ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'
          )}
        >
          {thread.subject}
        </p>
      </div>

      <p className="line-clamp-1 text-xs text-muted-foreground">{thread.snippet}</p>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <div onClick={(e) => e.stopPropagation()}>
          <OwnerPopover
            current={thread.owner}
            senderEmail={sender?.email}
            onSelect={onChangeOwner}
          >
            <OwnerPill
              owner={thread.owner}
              source={thread.ownerSource}
              loading={thread.aiStatus === 'pending'}
              interactive
            />
          </OwnerPopover>
        </div>

        {showReclassified && (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
            Reclassified
          </span>
        )}

        {hasDate && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>Date</span>
          </span>
        )}
      </div>
    </div>
  );
}

