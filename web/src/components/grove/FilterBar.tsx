import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GroveFilterOption } from '@/components/grove/models';
import { cn } from '@/lib/utils';

export type FilterDropdownDef<T extends string = string> = {
  id: string;
  label: string;
  value: T;
  options: GroveFilterOption<T>[];
  onChange: (value: T) => void;
};

export type FilterBarProps = {
  filters: FilterDropdownDef[];
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  onClearAll?: () => void;
  className?: string;
};

export function FilterBar({
  filters,
  page,
  totalPages,
  onPageChange,
  onClearAll,
  className,
}: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-0.5 sm:flex-wrap sm:overflow-visible">
        {filters.map((filter) => (
          <div key={filter.id} className="relative shrink-0">
            <select
              aria-label={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="h-11 appearance-none rounded-full border border-border bg-card pl-4 pr-8 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="All filters"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-ink-foreground transition-opacity hover:opacity-90"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-surface disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[60px] text-center font-display text-sm font-semibold text-foreground tabular-nums">
          {pad(safePage)} <span className="font-normal text-muted-foreground">/ {pad(safeTotal)}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotal, safePage + 1))}
          disabled={safePage >= safeTotal}
          aria-label="Next page"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-surface disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Filter threads</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              {onClearAll ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearAll();
                    setSheetOpen(false);
                  }}
                >
                  Clear all
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" size="sm" onClick={() => setSheetOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

