import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChipRowItem<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

type ChipRowProps<T extends string> = {
  items: ChipRowItem<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
};

export function ChipRow<T extends string>({
  items,
  value,
  onChange,
  className,
}: ChipRowProps<T>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
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
              'inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border border-border bg-card font-semibold text-foreground shadow-sm'
                : 'border border-border bg-transparent font-medium text-muted-foreground hover:bg-card/70 hover:text-foreground'
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

