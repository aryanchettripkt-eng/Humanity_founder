import { Search, X } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SEGMENT_MAP } from '@/lib/segments';
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
  onSearchChange: (q: string) => void;
  onToggleFilter: (f: string) => void;
  onSelectThread: (id: string) => void;
  onToggleImportant: (id: string, important: boolean) => void;
  onChangeOwner: (id: string, owner: Owner, remember: 'sender' | 'domain' | null) => void;
  onRetry: () => void;
};

const FILTER_CHIPS = [
  { id: 'unread', label: 'Unread' },
  { id: 'important', label: 'Important' },
  { id: 'dated', label: 'Has date' },
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
  const segMeta = SEGMENT_MAP[segment] ?? SEGMENT_MAP.inbox;
  const SegIcon = segMeta.icon;

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="space-y-2.5 border-b border-border p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{segMeta.label}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{threads.length}</span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, body…"
            className="h-8 pl-8 pr-7 text-xs"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilters.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onToggleFilter(chip.id)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-3.5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-2 border-b border-border pb-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : threads.length === 0 ? (
          <EmptyState
            icon={SegIcon}
            title={search ? `No conversations match "${search}".` : segMeta.emptyTitle}
            description={search ? 'Try a different keyword or clear filters.' : segMeta.emptyDescription}
          />
        ) : (
          threads.map((t, index) => (
            <ThreadRow
              key={t.id}
              thread={t}
              selected={t.id === selectedId}
              focused={index === focusedIndex}
              isNew={newThreadIds.includes(t.id)}
              onSelect={() => onSelectThread(t.id)}
              onToggleImportant={(imp) => onToggleImportant(t.id, imp)}
              onChangeOwner={(owner, rem) => onChangeOwner(t.id, owner, rem)}
            />
          ))
        )}
      </div>
    </div>
  );
}

