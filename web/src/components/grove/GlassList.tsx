import { Link } from 'react-router-dom';
import { Avatar } from '@/components/grove/Avatar';
import { GlassCard } from '@/components/grove/GlassCard';
import type { GroveListRowModel } from '@/components/grove/models';

export type GlassListProps = {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  rows: GroveListRowModel[];
  emptyText?: string;
  onRowClick?: (row: GroveListRowModel) => void;
  className?: string;
};

export function GlassList({
  title,
  actionHref,
  actionLabel = 'View all',
  rows,
  emptyText = 'All caught up.',
  onRowClick,
  className,
}: GlassListProps) {
  return (
    <GlassCard
      title={title}
      actionHref={actionHref}
      actionLabel={actionLabel}
      className={className}
    >
      {rows.length === 0 ? (
        <p className="py-3 text-xs font-medium text-[var(--glass-muted)]">{emptyText}</p>
      ) : (
        <div className="divide-y divide-[var(--glass-divider)]">
          {rows.map((row) => {
            const content = (
              <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={row.name} initials={row.initials} size="sm" tone="glass" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--glass-fg)]">{row.name}</p>
                    <p className="truncate text-[11px] text-[var(--glass-muted)]">{row.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 font-display text-xs font-semibold text-[var(--glass-fg)] tabular-nums">
                  {row.rightText}
                </span>
              </div>
            );

            if (row.href) {
              return (
                <Link
                  key={row.id}
                  to={row.href}
                  className="block rounded-lg transition-colors hover:bg-[var(--glass-hover)]"
                >
                  {content}
                </Link>
              );
            }

            if (onRowClick || row.onClick) {
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => (row.onClick ? row.onClick() : onRowClick?.(row))}
                  className="block w-full rounded-lg text-left transition-colors hover:bg-[var(--glass-hover)]"
                >
                  {content}
                </button>
              );
            }

            return <div key={row.id}>{content}</div>;
          })}
        </div>
      )}
    </GlassCard>
  );
}

