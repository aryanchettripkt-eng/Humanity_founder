import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { HeroStat } from '@/features/landing/sampleData';
import { cn } from '@/lib/utils';

type StatWithDeltaProps = {
  stat: HeroStat;
};

export function StatWithDelta({ stat }: StatWithDeltaProps) {
  const isUp = stat.direction === 'up';

  return (
    <div className="flex items-start gap-2">
      <div className="relative flex items-baseline gap-2">
        <span className="text-3xl font-light leading-none tracking-tight text-landing-ink tabular-nums sm:text-[48px]">
          {stat.value}
        </span>
        <span className="max-w-[76px] text-xs leading-tight text-zinc-600 sm:max-w-none sm:text-sm">
          {stat.label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 self-start rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            isUp
              ? 'bg-landing-delta-up text-landing-accent-foreground'
              : 'bg-landing-delta-down text-rose-950'
          )}
        >
          {isUp ? (
            <ArrowUpRight className="h-2.5 w-2.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          <span>{stat.delta}</span>
        </span>
      </div>
    </div>
  );
}

