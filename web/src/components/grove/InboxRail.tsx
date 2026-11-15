import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SEGMENTS } from '@/lib/segments';
import { cn } from '@/lib/utils';
import type { SegmentId } from '@/types/api';

const PRIMARY_RAIL_IDS: SegmentId[] = ['inbox', 'important', 'waiting', 'done', 'archived'];

export type InboxRailProps = {
  activeSegment: SegmentId;
  counts?: Partial<Record<SegmentId, number>>;
  onSelectSegment: (id: SegmentId) => void;
};

export function InboxRail({ activeSegment, counts, onSelectSegment }: InboxRailProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primarySegments = PRIMARY_RAIL_IDS.map((id) => SEGMENTS.find((s) => s.id === id)).filter(
    (s): s is NonNullable<typeof s> => Boolean(s)
  );
  const moreSegments = SEGMENTS.filter((s) => !PRIMARY_RAIL_IDS.includes(s.id));
  const isMoreActive = moreSegments.some((s) => s.id === activeSegment);

  return (
    <>
      {/* Mobile horizontal scrollable segment chips (<768px) */}
      <nav
        aria-label="Inbox segments"
        className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto pb-3 md:hidden"
      >
        {SEGMENTS.map((seg) => {
          const Icon = seg.icon;
          const isActive = activeSegment === seg.id;
          const count = counts?.[seg.id] ?? 0;

          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => onSelectSegment(seg.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-transparent bg-[#141512] text-white'
                  : 'border-[var(--pane-border)] bg-[var(--pane-bg)] text-[var(--fg)] hover:bg-[var(--card-glass-bg)]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{seg.label}</span>
              {count > 0 ? (
                <span
                  aria-label={`${count} threads`}
                  className="h-2 w-2 rounded-full bg-[var(--grove-lime)]"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Desktop/tablet vertical glass rail (>=768px) */}
      <nav
        aria-label="Inbox segments"
        className="glass-pane hidden w-[72px] shrink-0 flex-col items-center gap-3 self-stretch rounded-[36px] py-3 md:flex"
      >
        {primarySegments.map((seg) => {
          const Icon = seg.icon;
          const isActive = activeSegment === seg.id;
          const count = counts?.[seg.id] ?? 0;

          return (
            <button
              key={seg.id}
              type="button"
              title={seg.label}
              aria-label={seg.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectSegment(seg.id)}
              className={cn(
                'relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-transparent bg-[#141512] text-white shadow-sm'
                  : 'border-[var(--nav-pill-border)] bg-[var(--nav-circle-bg)] text-[var(--fg)] hover:bg-[var(--card-glass-bg)]'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {count > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--grove-lime)]"
                />
              ) : null}
            </button>
          );
        })}

        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="More segments"
              aria-label="More segments"
              aria-expanded={moreOpen}
              className={cn(
                'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isMoreActive
                  ? 'border-transparent bg-[#141512] text-white shadow-sm'
                  : 'border-[var(--nav-pill-border)] bg-[var(--nav-circle-bg)] text-[var(--fg)] hover:bg-[var(--card-glass-bg)]'
              )}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-56 rounded-2xl border-[var(--frame-border)] bg-[var(--frame-glass-bg)] p-1.5 text-[var(--fg)] backdrop-blur-2xl"
          >
            <div className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              More segments
            </div>
            <div className="mt-1 space-y-0.5">
              {moreSegments.map((seg) => {
                const Icon = seg.icon;
                const isActive = activeSegment === seg.id;
                const count = counts?.[seg.id] ?? 0;

                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onSelectSegment(seg.id);
                    }}
                    className={cn(
                      'flex min-h-[40px] w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-[var(--row-selected-bg)] font-semibold text-[var(--fg)]'
                        : 'text-[var(--fg)] hover:bg-[var(--card-glass-bg)]'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-[var(--fg-muted)]" aria-hidden="true" />
                      <span>{seg.label}</span>
                    </span>
                    {count > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-[var(--fg-muted)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--grove-lime)]" />
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </>
  );
}

