import { Search, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  searchTooltip?: string;
  filterTooltip?: string;
};

export function FilterChips<T extends string>({
  items,
  value,
  onChange,
  searchTooltip = 'Full search & ⌘K available in live demo',
  filterTooltip = 'Filters by unread, important & dated in app',
}: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={searchTooltip}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{searchTooltip}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={filterTooltip}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{filterTooltip}</TooltipContent>
      </Tooltip>

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
                ? 'border border-zinc-200/80 bg-white font-semibold text-landing-ink shadow-sm'
                : 'border border-zinc-200 bg-transparent font-medium text-zinc-600 hover:bg-white/70 hover:text-landing-ink'
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

