import { Search, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterChipItem<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

type FilterChipsProps<T extends string> = {
  items: FilterChipItem<T>[];
  value: T;
  onChange: (next: T) => void;
};

export function FilterChips<T extends string>({ items, value, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-landing-line bg-landing-card text-landing-muted"
      >
        <Search className="h-4 w-4" />
      </span>

      <span
        aria-hidden="true"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-landing-line bg-landing-card text-landing-muted"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </span>

      {items.map((item) => {
        const active = value === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink',
              active
                ? 'border border-landing-line bg-landing-card font-semibold text-landing-ink shadow-sm'
                : 'border border-landing-line bg-transparent font-medium text-landing-muted hover:bg-landing-card/70 hover:text-landing-ink'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
