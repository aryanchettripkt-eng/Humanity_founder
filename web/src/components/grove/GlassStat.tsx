import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/grove/GlassCard';
import type { GroveStatModel } from '@/components/grove/models';
import { cn } from '@/lib/utils';

export type GlassStatProps = {
  stat: GroveStatModel;
  className?: string;
};

export function GlassStat({ stat, className }: GlassStatProps) {
  const Icon = stat.icon;

  const inner = (
    <GlassCard
      className={cn(
        'h-full transition-colors hover:bg-[var(--glass-hover)]',
        (stat.href || stat.onClick) && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--glass-muted)]">{stat.label}</span>
        {Icon ? (
          <Icon className="h-3.5 w-3.5 text-[var(--glass-muted)]" aria-hidden="true" />
        ) : null}
      </div>

      <p className="mt-2 font-display text-[36px] font-semibold leading-[40px] tracking-tight text-[var(--glass-fg)] tabular-nums sm:text-[40px] sm:leading-[44px]">
        {stat.value}
      </p>

      {stat.delta ? (
        <p
          className={cn(
            'mt-1 text-xs font-medium',
            stat.deltaTone === 'positive'
              ? 'text-[var(--delta-fg)]'
              : stat.deltaTone === 'negative'
                ? 'text-grove-terracotta'
                : 'text-[var(--glass-muted)]'
          )}
        >
          {stat.delta}
        </p>
      ) : null}
    </GlassCard>
  );

  if (stat.href) {
    return (
      <Link to={stat.href} className="block h-full rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {inner}
      </Link>
    );
  }

  if (stat.onClick) {
    return (
      <button
        type="button"
        onClick={stat.onClick}
        className="block h-full w-full rounded-[20px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </button>
    );
  }

  return inner;
}

