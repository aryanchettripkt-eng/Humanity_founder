import { AnimatePresence, m } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { EASE_OUT } from '@/lib/motion';
import { SEGMENTS } from '@/lib/segments';
import { cn } from '@/lib/utils';
import type { Owner, SegmentId, ThreadListItem } from '@/types/api';
import { ThreadRow } from './ThreadRow';

type ThreadListProps = {
  segment: SegmentId;
  threads: ThreadListItem[];
  isLoading: boolean;
  isError: boolean;
  selectedId?: string;
  focusedIndex: number;
  search: string;
  activeFilters: string[];
  newThreadIds: string[];
  onSearchChange: (val: string) => void;
  onToggleFilter: (filter: string) => void;
  onSelectThread: (id: string) => void;
  onToggleImportant: (id: string, important: boolean) => void;
  onChangeOwner: (id: string, owner: Owner, remember: 'sender' | 'domain' | null) => void;
  onRetry: () => void;
};

const FILTER_CHIPS = [
  { id: 'unread', label: 'Unread' },
  { id: 'important', label: 'Important' },
  { id: 'hasDate', label: 'Has date' },
];

export function ThreadList({
  segment,
  threads,
  isLoading,
  isError,
  selectedId,
  focusedIndex,
  search,
  activeFilters,
  newThreadIds,
  onSearchChange,
  onToggleFilter,
  onSelectThread,
  onToggleImportant,
  onChangeOwner,
  onRetry,
}: ThreadListProps) {
  const segConfig = SEGMENTS.find((s) => s.id === segment) ?? SEGMENTS[1];

  return (
    <div className="glass-pane flex h-full min-h-0 flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 space-y-3 border-b border-[var(--glass-divider)] px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-[20px] font-semibold leading-tight text-[var(--fg)]">
            {segConfig.label}
          </h2>
          <span className="text-sm font-medium tabular-nums text-[var(--fg-muted)]">
            {threads.length}
          </span>
        </div>

        {/* Search pill */}
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--fg-subtle)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, body…"
            aria-label="Search threads"
            className="h-10 w-full rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] pl-10 pr-9 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[var(--fg-muted)] hover:bg-[var(--pane-bg)] hover:text-[var(--fg)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilters.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleFilter(chip.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-transparent bg-[var(--nav-active-bg)] font-semibold text-[var(--nav-active-fg)]'
                    : 'border-[var(--pane-border)] bg-transparent text-[var(--fg-muted)] hover:bg-[var(--card-glass-bg)] hover:text-[var(--fg)]'
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable rows */}
      <div className="grove-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="space-y-2.5 p-3">
            <Skeleton className="h-24 w-full rounded-[18px] bg-[var(--card-glass-bg)]" />
            <Skeleton className="h-24 w-full rounded-[18px] bg-[var(--card-glass-bg)]" />
            <Skeleton className="h-24 w-full rounded-[18px] bg-[var(--card-glass-bg)]" />
            <Skeleton className="h-24 w-full rounded-[18px] bg-[var(--card-glass-bg)]" />
          </div>
        ) : isError ? (
          <ErrorState onRetry={onRetry} className="py-12" />
        ) : threads.length === 0 ? (
          <EmptyState
            icon={segConfig.icon}
            title={search || activeFilters.length > 0 ? 'No matching threads' : segConfig.emptyTitle}
            description={
              search || activeFilters.length > 0
                ? 'Try clearing your search or filter chips.'
                : segConfig.emptyDescription
            }
            className="py-12"
          />
        ) : (
          // Keyed by the view, so switching segment, search or filters swaps the list at
          // once; rows that leave or arrive while you watch (archive, live mail) animate.
          <div key={`${segment}|${search}|${activeFilters.join(',')}`} className="space-y-0.5">
            <AnimatePresence initial={false}>
            {threads.map((t, idx) => (
              <m.div
                key={t.id}
                layout="position"
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
              >
              <ThreadRow
                thread={t}
                selected={t.id === selectedId}
                focused={idx === focusedIndex}
                isNew={newThreadIds.includes(t.id)}
                onSelect={() => onSelectThread(t.id)}
                onToggleImportant={(imp) => onToggleImportant(t.id, imp)}
                onChangeOwner={(owner, remember) => onChangeOwner(t.id, owner, remember)}
              />
              </m.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
