import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeltaChipProps = {
  text: string;
  direction: 'up' | 'down';
  className?: string;
};

export function DeltaChip({ text, direction, className }: DeltaChipProps) {
  const isUp = direction === 'up';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
        isUp
          ? 'bg-primary/15 text-primary'
          : 'bg-delta-down text-delta-down-foreground',
        className
      )}
    >
      {isUp ? (
        <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>{text}</span>
    </span>
  );
}

