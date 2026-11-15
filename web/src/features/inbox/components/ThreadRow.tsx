import { CalendarDays, Star } from 'lucide-react';
import { OwnerPill } from '@/components/common/OwnerPill';
import { OwnerPopover } from '@/components/common/OwnerPopover';
import { formatRelativeTime, isWithin24Hours } from '@/lib/format';
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
        'group cursor-pointer px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'rounded-[18px] bg-[var(--row-selected-bg)]'
          : 'border-b border-[var(--glass-divider)] hover:rounded-[18px] hover:border-transparent hover:bg-[var(--card-glass-bg)]',
        focused && !selected && 'ring-1 ring-[var(--grove-lime)]/60',
        isNew && 'ring-1 ring-[var(--grove-lime)]/50'
      )}
    >
      {/* Line 1: lime unread dot + sender, star + time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {thread.unread ? (
            <span
              aria-label="Unread"
              className="h-2 w-2 shrink-0 rounded-full bg-[var(--grove-lime)]"
            />
          ) : null}
          <span
            className={cn(
              'truncate text-[17px] leading-snug text-[var(--fg)]',
              thread.unread ? 'font-semibold' : 'font-medium'
            )}
          >
            {senderLabel}
          </span>
          {thread.messageCount > 1 ? (
            <span className="shrink-0 text-xs tabular-nums text-[var(--fg-subtle)]">
              ({thread.messageCount})
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {thread.important ? (
            <button
              type="button"
              aria-label="Remove star"
              onClick={(e) => {
                e.stopPropagation();
                onToggleImportant(false);
              }}
              className="rounded p-0.5 text-amber-400 transition-transform hover:scale-110"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Star thread"
              onClick={(e) => {
                e.stopPropagation();
                onToggleImportant(true);
              }}
              className="rounded p-0.5 text-[var(--fg-subtle)] opacity-0 transition-opacity hover:text-amber-400 group-hover:opacity-100"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-xs tabular-nums text-[var(--fg-subtle)]">
            {formatRelativeTime(thread.lastMessageAt)}
          </span>
        </div>
      </div>

      {/* Line 2: category icon + subject */}
      <div className="mt-1 flex items-center gap-1.5">
        <CatIcon className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]" aria-hidden="true" />
        <p className="truncate text-[15px] font-medium text-[var(--fg)]">{thread.subject}</p>
      </div>

      {/* Line 3: snippet */}
      <p className="mt-0.5 truncate text-[14px] text-[var(--fg-muted)]">{thread.snippet}</p>

      {/* Line 4: owner pill + Date chip */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <OwnerPopover
          current={thread.owner}
          senderEmail={sender?.email}
          onSelect={onChangeOwner}
        >
          <span>
            <OwnerPill
              owner={thread.owner}
              source={thread.ownerSource}
              size="sm"
              interactive
              loading={thread.aiStatus === 'pending'}
            />
          </span>
        </OwnerPopover>

        {hasDate ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--fg-muted)]">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            Date
          </span>
        ) : null}

        {showReclassified ? (
          <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--chip-fg)]">
            Reclassified
          </span>
        ) : null}
      </div>
    </div>
  );
}
