import { CalendarPlus, MessageSquareQuote, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadIcsEvent } from '@/lib/ics';
import { formatUpcomingDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ThreadListItem } from '@/types/api';

type ClientGlanceProps = {
  thread: ThreadListItem;
  /** "column" is the right-hand pane (≥1280); "inline" is the card inside the reading pane. */
  variant?: 'column' | 'inline';
  className?: string;
};

/** The client's version of AI insights: summary, key points, dates and their own note. No assistant-only controls. */
export function ClientGlance({ thread, variant = 'column', className }: ClientGlanceProps) {
  const sections = (
    <>
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
          Summary
        </h3>
        <p className="text-base leading-relaxed text-[var(--fg)]">
          {thread.summary || thread.snippet}
        </p>
        {thread.keyPoints?.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
            {thread.keyPoints.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
          Dates
        </h3>
        {thread.entities?.length > 0 ? (
          <div className="space-y-2">
            {thread.entities.map((ent, idx) => (
              <div
                key={`${ent.title}-${idx}`}
                className="glass-card flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[18px] p-3 text-sm"
              >
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium text-[var(--fg)]">{ent.title}</p>
                  <p className="text-[var(--fg-muted)]">{formatUpcomingDate(ent.startsAt)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadIcsEvent({
                      title: ent.title,
                      startsAt: ent.startsAt,
                      endsAt: ent.endsAt,
                      location: ent.location,
                    })
                  }
                  className="h-8 shrink-0 rounded-full border-[var(--pane-border)] bg-[var(--pane-bg)] px-2.5 text-xs text-[var(--fg)] hover:bg-[var(--row-selected-bg)]"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Add to calendar</span>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--fg-muted)]">No dates in this email.</p>
        )}
      </section>

      {thread.handoff?.note ? (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
            <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden="true" />
            Your note
          </h3>
          <p className="glass-card rounded-[18px] p-3 text-sm text-[var(--fg)]">
            “{thread.handoff.note}”
          </p>
        </section>
      ) : null}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('glass-card space-y-4 rounded-[20px] p-5', className)}>{sections}</div>
    );
  }

  return (
    <div className={cn('glass-pane flex h-full min-h-0 flex-col overflow-hidden', className)}>
      <div className="flex shrink-0 items-center gap-2 px-5 pb-3 pt-5">
        <Sparkles className="h-4 w-4 text-[var(--grove-lime)]" aria-hidden="true" />
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.06em] text-[var(--fg)]">
          At a glance
        </h2>
      </div>
      <div className="grove-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5">
        {sections}
      </div>
    </div>
  );
}
