import { Link } from 'react-router-dom';
import { OwnerPill } from '@/components/common/OwnerPill';
import { AvatarTile } from '@/components/grove/Avatar';
import type { GroveThreadRowModel } from '@/components/grove/models';
import { cn } from '@/lib/utils';

export type ThreadListRowProps = {
  item: GroveThreadRowModel;
  ownerLabel?: string;
  onSelect?: (item: GroveThreadRowModel) => void;
  className?: string;
};

export function ThreadListRow({ item, ownerLabel, onSelect, className }: ThreadListRowProps) {
  const inner = (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition-colors hover:border-foreground/20 sm:items-center',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <AvatarTile initials={item.initials} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {item.unread ? (
              <span
                aria-label="Unread"
                className="h-2 w-2 shrink-0 rounded-full bg-primary"
              />
            ) : null}
            <span className="truncate text-sm font-semibold text-foreground">
              {item.sender}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{item.subject}</p>
          <div className="mt-1.5 sm:hidden">
            <OwnerPill owner={item.owner} label={ownerLabel} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <OwnerPill owner={item.owner} label={ownerLabel} className="hidden sm:inline-flex" />
        <span className="min-w-16 whitespace-nowrap text-right text-xs text-muted-foreground tabular-nums">
          {item.timeLabel}
        </span>
      </div>
    </div>
  );

  if (item.href && !onSelect) {
    return (
      <Link to={item.href} className="block">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onSelect?.(item)} className="block w-full text-left">
      {inner}
    </button>
  );
}

