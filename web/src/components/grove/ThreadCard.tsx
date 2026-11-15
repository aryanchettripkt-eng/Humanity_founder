import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarTile } from '@/components/grove/Avatar';
import { DeltaChip } from '@/components/grove/DeltaChip';
import { Sparkline } from '@/components/grove/Sparkline';
import { StatBox } from '@/components/grove/StatBox';
import type { GroveThreadCardModel } from '@/components/grove/models';
import { cn } from '@/lib/utils';

export type ThreadCardProps = {
  item: GroveThreadCardModel;
  onOpen?: (item: GroveThreadCardModel) => void;
  onPrimaryAction?: (item: GroveThreadCardModel) => void;
  className?: string;
};

const OWNER_TEXT_CLASS: Record<GroveThreadCardModel['owner'], string> = {
  assistant: 'text-grove-forest',
  client: 'text-grove-clay',
  none: 'text-muted-foreground',
  review: 'text-grove-terracotta',
};

export function ThreadCard({
  item,
  onOpen,
  onPrimaryAction,
  className,
}: ThreadCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col justify-between gap-4 rounded-[18px] border border-border bg-card p-4 transition-colors hover:border-foreground/20',
        className
      )}
    >
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

        {item.href && !onOpen ? (
          <Link
            to={item.href}
            aria-label={`Open ${item.sender}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpen?.(item)}
            aria-label={`Open ${item.sender}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <StatBox
        cells={[
          {
            label: 'Owner',
            value: item.ownerLabel,
            toneClass: OWNER_TEXT_CLASS[item.owner],
          },
          {
            label: 'Confidence',
            value: `${item.confidence}%`,
          },
          {
            label: 'Next date',
            value: item.nextDateLabel,
          },
        ]}
      />

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkline values={item.series} tone={item.sparkTone} />
          <DeltaChip text={item.deltaText} direction={item.deltaDirection} />
        </div>

        <button
          type="button"
          onClick={() => (onPrimaryAction ? onPrimaryAction(item) : onOpen?.(item))}
          className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[#4F8413] dark:hover:bg-primary/90"
        >
          {item.ctaLabel}
        </button>
      </div>
    </article>
  );
}

