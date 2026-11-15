import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CLIENT_QUEUE_TABS,
  clientStatusLabel,
  isClientHandling,
  senderLabel,
  type ClientQueueTab,
} from '@/features/client-view/mappers';
import { formatRelativeTime } from '@/lib/format';
import { CATEGORY_ICONS } from '@/lib/owners';
import { cn } from '@/lib/utils';
import type { ThreadListItem } from '@/types/api';

type ClientQueueListProps = {
  threads: ThreadListItem[];
  total: number;
  tab: ClientQueueTab;
  onTabChange: (tab: ClientQueueTab) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

/** Left column of the client view: the client's queue, styled like the Inbox list. */
export function ClientQueueList({
  threads,
  total,
  tab,
  onTabChange,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry,
}: ClientQueueListProps) {
  return (
    <div className="glass-pane flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-[var(--glass-divider)] px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-[20px] font-semibold leading-tight text-[var(--fg)]">
            Your queue
          </h2>
          <span className="text-sm font-medium tabular-nums text-[var(--fg-muted)]">{total}</span>
        </div>
        <div role="tablist" aria-label="Filter your queue" className="flex flex-wrap gap-1.5">
          {CLIENT_QUEUE_TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(t.id)}
                className={cn(
                  'min-h-[32px] rounded-full border px-3 text-xs font-medium transition-colors',
                  active
                    ? 'border-transparent bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                    : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] hover:bg-[var(--pane-bg)]'
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grove-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="space-y-2.5 p-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[18px] bg-[var(--card-glass-bg)]" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={onRetry} className="py-12" />
        ) : threads.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={tab === 'handling' ? "You're not handling anything" : "You're all caught up"}
            description="Your assistant will handle everything else."
            className="py-12"
          />
        ) : (
          threads.map((t) => {
            const selected = t.id === selectedId;
            const CatIcon = CATEGORY_ICONS[t.category] ?? CATEGORY_ICONS.general;
            const handling = isClientHandling(t);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'block w-full px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'rounded-[18px] bg-[var(--row-selected-bg)]'
                    : 'border-b border-[var(--glass-divider)] hover:rounded-[18px] hover:border-transparent hover:bg-[var(--card-glass-bg)]'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[17px] font-semibold leading-snug text-[var(--fg)]">
                    {senderLabel(t)}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[var(--fg-subtle)]">
                    {formatRelativeTime(t.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <CatIcon
                    className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]"
                    aria-hidden="true"
                  />
                  <p className="truncate text-[15px] font-medium text-[var(--fg)]">{t.subject}</p>
                </div>
                <p className="mt-0.5 truncate text-[14px] text-[var(--fg-muted)]">
                  {t.clientReason || t.summary || t.snippet}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      handling
                        ? 'border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg-muted)]'
                        : 'bg-[var(--chip-bg)] text-[var(--chip-fg)]'
                    )}
                  >
                    {clientStatusLabel(t)}
                  </span>
                  {t.important ? (
                    <span className="rounded-full border border-[var(--pane-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--fg-muted)]">
                      Important
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
