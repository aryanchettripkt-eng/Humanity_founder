import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { HeroStat } from '@/features/landing/sampleData';
import { cn } from '@/lib/utils';

type StatWithDeltaProps = {
  stat: HeroStat;
};

export function StatWithDelta({ stat }: StatWithDeltaProps) {
  const isUp = stat.direction === 'up';

  return (
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:gap-2.5">
      <div className="relative inline-block pr-10 sm:pr-11">
        <span className="text-3xl font-light leading-none tracking-tight text-landing-ink tabular-nums sm:text-[48px]">
          {stat.value}
        </span>
        <span
          className={cn(
            'absolute -top-2 right-0 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none tabular-nums',
            isUp
              ? 'bg-landing-delta-up text-landing-accent-foreground'
              : 'bg-landing-delta-down text-landing-delta-down-foreground'
          )}
        >
          {isUp ? (
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
          )}
          <span>{stat.delta}</span>
        </span>
      </div>
      <span className="text-xs leading-tight text-landing-muted sm:text-sm">{stat.label}</span>
    </div>
  );
}
