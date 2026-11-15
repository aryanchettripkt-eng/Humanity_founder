import { cn } from '@/lib/utils';

export type StatBoxCell = {
  label: string;
  labelTitle?: string;
  ariaLabel?: string;
  value: string;
  toneClass?: string;
  allowWrap?: boolean;
};

export type StatBoxProps = {
  cells: [StatBoxCell, StatBoxCell, StatBoxCell];
  className?: string;
};

export function StatBox({ cells, className }: StatBoxProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1.1fr_0.9fr_1.1fr] gap-2 rounded-xl bg-[var(--statbox-bg)] px-3 py-2.5',
        className
      )}
    >
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0">
          <p
            title={cell.labelTitle}
            aria-label={cell.ariaLabel}
            className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            {cell.label}
          </p>
          <p
            className={cn(
              'mt-0.5 font-display text-xs font-semibold text-foreground tabular-nums',
              cell.allowWrap ? 'line-clamp-2 leading-tight' : 'truncate',
              cell.toneClass
            )}
          >
            {cell.value}
          </p>
        </div>
      ))}
    </div>
  );
}

