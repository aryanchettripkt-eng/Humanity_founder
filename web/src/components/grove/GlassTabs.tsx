import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type GlassTabItem<T extends string = string> = {
  id: T;
  label: string;
  to?: string;
  badge?: number;
};

export type GlassTabsProps<T extends string = string> = {
  items: GlassTabItem<T>[];
  activeId: T;
  onChange?: (id: T) => void;
  ariaLabel?: string;
  className?: string;
};

export function GlassTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  ariaLabel = 'Primary navigation',
  className,
}: GlassTabsProps<T>) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--nav-pill-border)] bg-[var(--nav-pill-bg)] p-1 backdrop-blur-xl',
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const itemClass = cn(
          'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)] shadow-sm font-semibold'
            : 'text-[var(--hero-muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--hero-fg)]'
        );

        const content = (
          <>
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-foreground/10 text-[var(--nav-active-fg)]'
                    : 'bg-[var(--glass-hover)] text-[var(--hero-fg)]'
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </>
        );

        if (item.to) {
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={itemClass}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange?.(item.id)}
            className={itemClass}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}

