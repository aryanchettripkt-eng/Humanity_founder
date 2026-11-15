import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatWithBadgeProps = {
  value: number | string;
  label: string;
  badge?: string;
  badgeTone?: 'up' | 'down';
  className?: string;
};

export function StatWithBadge({
  value,
  label,
  badge,
  badgeTone = 'up',
  className,
}: StatWithBadgeProps) {
  const isUp = badgeTone === 'up';

  return (
    <div
      className={cn(
        'flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:gap-2.5',
        className
      )}
    >
      <div className={cn('relative inline-block', badge ? 'pr-10 sm:pr-11' : undefined)}>
        <span className="text-3xl font-light leading-none tracking-tight text-foreground tabular-nums sm:text-[48px]">
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              'absolute -top-2 right-0 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none tabular-nums',
              isUp
                ? 'bg-accent-lime text-accent-lime-foreground'
                : 'bg-delta-down text-delta-down-foreground'
            )}
          >
            {isUp ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
            )}
            <span>{badge}</span>
          </span>
        )}
      </div>
      <span className="text-xs leading-tight text-muted-foreground sm:text-sm">{label}</span>
    </div>
  );
}

