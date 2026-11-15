import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  id: string;
  title: string;
  countLabel: string;
  liveText?: string;
  className?: string;
};

export function SectionHeader({
  id,
  title,
  countLabel,
  liveText,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-3', className)}>
      <div className="flex flex-wrap items-baseline gap-3">
        <h2
          id={id}
          className="font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl"
        >
          {title}
        </h2>
        <span className="border-b-2 border-foreground pb-0.5 text-sm font-medium text-foreground tabular-nums">
          {countLabel}
        </span>
      </div>
      {liveText && (
        <span className="sr-only" aria-live="polite">
          {liveText}
        </span>
      )}
    </div>
  );
}

