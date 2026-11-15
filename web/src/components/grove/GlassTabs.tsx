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
        'inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 p-1 backdrop-blur-md',
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const itemClass = cn(
          'inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
          isActive
            ? 'bg-white text-[#1E1F1C] shadow-sm font-semibold'
            : 'text-white/90 hover:bg-white/15 hover:text-white'
        );

        const content = (
          <>
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  isActive ? 'bg-[#1E1F1C]/10 text-[#1E1F1C]' : 'bg-white/20 text-white'
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

