import { cn } from '@/lib/utils';

export type StatBoxCell = {
  label: string;
  value: string;
  toneClass?: string;
};

export type StatBoxProps = {
  cells: [StatBoxCell, StatBoxCell, StatBoxCell];
  className?: string;
};

export function StatBox({ cells, className }: StatBoxProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-2 rounded-xl bg-surface px-3 py-2.5',
        className
      )}
    >
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {cell.label}
          </p>
          <p
            className={cn(
              'mt-0.5 truncate font-display text-xs font-semibold text-foreground tabular-nums',
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

