import { cn } from '@/lib/utils';

type ConfidenceMeterProps = {
  value: number;
  className?: string;
};

export function ConfidenceMeter({ value, className }: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const filledDots = Math.max(1, Math.round(clamped * 5));

  const toneClass =
    clamped < 0.7
      ? 'bg-rose-500 dark:bg-rose-400'
      : clamped < 0.85
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-indigo-600 dark:bg-indigo-400';

  return (
    <div
      title={`AI confidence: ${pct}%`}
      className={cn('inline-flex items-center gap-2 text-xs text-muted-foreground', className)}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors',
              dot <= filledDots ? toneClass : 'bg-border'
            )}
          />
        ))}
      </div>
      <span className="tabular-nums">{pct}%</span>
    </div>
  );
}

