import { pct } from '@/features/stats/mappers';

export type BarListItem = {
  id: string;
  label: string;
  value: number;
  /** CSS colour for the bar; defaults to the first series colour. */
  color?: string;
};

type BarListProps = {
  items: BarListItem[];
  total?: number;
  emptyText?: string;
};

/**
 * Horizontal bars with the label and value as text (never only colour).
 * Bars are scaled to the largest item; the % is of `total` (or the sum).
 */
export function BarList({ items, total, emptyText = 'No data yet.' }: BarListProps) {
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);
  const max = Math.max(1, ...items.map((i) => i.value));
  if (sum === 0) return <p className="text-sm text-[var(--fg-muted)]">{emptyText}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} title={`${item.label}: ${item.value} (${pct(item.value, sum)})`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-[var(--fg)]">{item.label}</span>
            <span className="shrink-0 tabular-nums text-[var(--fg-muted)]">
              <span className="font-semibold text-[var(--fg)]">{item.value}</span> ·{' '}
              {pct(item.value, sum)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--card-glass-bg)]">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${item.value === 0 ? 0 : Math.max(3, (item.value / max) * 100)}%`,
                background: item.color ?? 'var(--series-1)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
