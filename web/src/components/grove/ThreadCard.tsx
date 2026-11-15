import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OwnerPill } from '@/components/common/OwnerPill';
import { AvatarTile } from '@/components/grove/Avatar';
import { DeltaChip } from '@/components/grove/DeltaChip';
import type { GroveThreadCardModel } from '@/components/grove/models';
import { cn } from '@/lib/utils';

export type ThreadCardProps = {
  item: GroveThreadCardModel;
  onOpen?: (item: GroveThreadCardModel) => void;
  className?: string;
};

export function ThreadCard({
  item,
  onOpen,
  className,
}: ThreadCardProps) {
  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarTile initials={item.initials} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-[18px] font-semibold leading-[24px] tracking-tight text-foreground">
              {item.sender}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{item.domain}</p>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-[var(--statbox-bg)] group-hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <p className="truncate text-sm font-medium text-foreground/90">
        {item.subject || item.domain}
      </p>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <DeltaChip text={item.deltaText} direction={item.deltaDirection} />
          <OwnerPill owner={item.owner} label={item.ownerLabel} size="sm" />
        </div>
      </div>
    </>
  );

  const cardClass = cn(
    'group flex h-full w-full flex-col justify-between gap-3.5 rounded-[18px] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-left transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className
  );

  if (item.href && !onOpen) {
    return (
      <Link to={item.href} aria-label={`Open ${item.sender}`} className={cardClass}>
        {cardBody}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      aria-label={`Open ${item.sender}`}
      className={cardClass}
    >
      {cardBody}
    </button>
  );
}

