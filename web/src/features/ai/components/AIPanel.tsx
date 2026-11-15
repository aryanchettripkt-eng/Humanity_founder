import { AlertTriangle, CalendarPlus, History, RefreshCw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { ConfidenceMeter } from '@/components/common/ConfidenceMeter';
import { OwnerPill } from '@/components/common/OwnerPill';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatRelativeTime, formatUpcomingDate } from '@/lib/format';
import { downloadIcsEvent } from '@/lib/ics';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';
import type { ThreadDetail } from '@/types/api';

type AIPanelProps = {
  thread: ThreadDetail;
  clientFirstName?: string;
  reclassifying?: boolean;
  onReclassify: () => void;
  onSuggestion: (action: 'apply' | 'dismiss') => void;
  onClose?: () => void;
  className?: string;
};

export function AIPanel({
  thread,
  clientFirstName = 'Client',
  reclassifying = false,
  onReclassify,
  onSuggestion,
  onClose,
  className,
}: AIPanelProps) {
  const ownerMeta = OWNER_META[thread.owner] ?? OWNER_META.review;
  const suggestedMeta = thread.suggestedOwner ? OWNER_META[thread.suggestedOwner] : null;

  return (
    <aside
      className={cn(
        'glass-pane flex h-full min-h-0 flex-col gap-4 overflow-hidden p-5 text-sm text-[var(--fg)]',
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.06em] text-[var(--fg)]">
          <Sparkles className="h-4 w-4 text-[var(--grove-lime)]" aria-hidden="true" />
          <span>AI INSIGHTS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReclassify}
            disabled={reclassifying}
            aria-label="Re-analyse with AI"
            title="Re-analyse with AI"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] transition-colors hover:bg-[var(--row-selected-bg)] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', reclassifying && 'animate-spin')} />
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI panel"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] transition-colors hover:bg-[var(--row-selected-bg)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grove-scroll min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
      {thread.aiStatus === 'failed' ? (
        <div className="rounded-[20px] border border-warning/40 bg-warning/10 p-4 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>AI unavailable — flagged for review</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2.5 h-8 rounded-full text-xs"
            disabled={reclassifying}
            onClick={onReclassify}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      ) : null}

      {suggestedMeta && thread.ownerSource !== 'ai' ? (
        <div className="glass-card rounded-[20px] p-4 text-xs">
          <p className="font-medium text-[var(--fg)]">
            AI suggests <span className="font-semibold">{suggestedMeta.label}</span> now
          </p>
          <p className="mt-1 text-[var(--fg-muted)]">
            Your manual assignment is kept unless you apply this change.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => onSuggestion('apply')}
              className="h-8 rounded-full bg-[var(--cta-lime-bg)] text-xs text-[var(--cta-lime-fg)] hover:bg-[var(--cta-lime-hover)]"
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-xs text-[var(--fg-muted)]"
              onClick={() => onSuggestion('dismiss')}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {/* Why {owner}? card */}
      <section className="glass-card space-y-2.5 rounded-[20px] p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[var(--fg)]">
            Why {ownerMeta.label}?
          </span>
          {thread.ownerSource === 'ai' ? (
            <ConfidenceMeter value={thread.confidence} className="text-[var(--fg-muted)]" />
          ) : null}
        </div>
        <p className="text-[16px] leading-relaxed text-[var(--fg)]">
          {thread.ownerSource === 'ai'
            ? thread.reason || 'No classification reason recorded yet.'
            : thread.history?.[thread.history.length - 1]?.reason ||
              (thread.ownerSource === 'client'
                ? 'Updated by client.'
                : thread.ownerSource === 'rule'
                  ? 'Matched sender rule.'
                  : 'Set manually.')}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--fg-muted)]">
          <span>Source: {thread.ownerSource}</span>
          {thread.suggestedOwner && thread.owner === 'review' ? (
            <span>Guess: {OWNER_META[thread.suggestedOwner]?.label}</span>
          ) : null}
        </div>
        {thread.suggestedOwner && thread.owner === 'review' ? (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onSuggestion('apply')}
              className="h-8 rounded-full bg-[var(--cta-lime-bg)] text-xs font-semibold text-[var(--cta-lime-fg)] hover:bg-[var(--cta-lime-hover)]"
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSuggestion('dismiss')}
              className="h-8 rounded-full border-[var(--pane-border)] bg-transparent text-xs text-[var(--fg)]"
            >
              Dismiss
            </Button>
          </div>
        ) : null}
      </section>

      {/* Why {client} (shown to client) */}
      {thread.owner === 'client' && thread.clientReason ? (
        <section className="space-y-1.5">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Why {clientFirstName}
          </h3>
          <p className="text-[15px] leading-relaxed text-[var(--fg)]">{thread.clientReason}</p>
        </section>
      ) : null}

      {/* Summary */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Summary
        </h3>
        <p className="text-[16px] leading-relaxed text-[var(--fg)]">
          {thread.summary || thread.snippet}
        </p>
        {thread.keyPoints?.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--fg-muted)]">
            {thread.keyPoints.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Extracted dates */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Extracted dates
        </h3>
        {thread.entities?.length > 0 ? (
          <div className="space-y-2">
            {thread.entities.map((ent, idx) => (
              <div
                key={idx}
                className="glass-card flex items-start justify-between gap-2 rounded-[16px] p-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--fg)]">{ent.title}</p>
                  <p className="text-[var(--fg-muted)]">{formatUpcomingDate(ent.startsAt)}</p>
                  {ent.location ? (
                    <p className="text-[var(--fg-subtle)]">{ent.location}</p>
                  ) : null}
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
          <p className="text-sm text-[var(--fg-muted)]">No dates detected in this thread.</p>
        )}
      </section>

      {/* Ownership history */}
      {thread.history?.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            <History className="h-3.5 w-3.5" />
            <span>Ownership history</span>
          </div>
          <div className="space-y-2">
            {[...thread.history].reverse().map((h, i) => (
              <div key={i} className="glass-card rounded-[16px] p-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <OwnerPill owner={h.from as ThreadDetail['owner']} size="sm" />
                  <span className="text-[var(--fg-subtle)]">→</span>
                  <OwnerPill owner={h.to as ThreadDetail['owner']} size="sm" />
                  <span className="ml-auto text-[var(--fg-subtle)]">
                    {formatRelativeTime(h.at)}
                  </span>
                </div>
                {h.reason ? <p className="mt-1.5 text-[var(--fg-muted)]">{h.reason}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </aside>
  );
}

/** Compact AI Insights summary shown above messages on mobile (<768px) with a bottom sheet. */
export function MobileAISummary({
  thread,
  clientFirstName = 'Client',
  reclassifying = false,
  onReclassify,
  onSuggestion,
}: Pick<
  AIPanelProps,
  'thread' | 'clientFirstName' | 'reclassifying' | 'onReclassify' | 'onSuggestion'
>) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const ownerMeta = OWNER_META[thread.owner] ?? OWNER_META.review;

  return (
    <>
      <div className="glass-card rounded-[20px] p-4 text-sm md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--fg)]">
            <Sparkles className="h-4 w-4 text-[var(--grove-lime)]" aria-hidden="true" />
            <span>Why {ownerMeta.label}</span>
          </span>
          <ConfidenceMeter value={thread.confidence} className="text-[var(--fg-muted)]" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          {thread.summary || thread.reason || thread.snippet}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="text-xs font-semibold text-[var(--fg)] underline underline-offset-4"
          >
            More insights
          </button>
          {thread.aiStatus === 'failed' ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full text-xs"
              disabled={reclassifying}
              onClick={onReclassify}
            >
              <RefreshCw className="h-3 w-3" />
              Retry AI
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[24px] border-[var(--frame-border)] bg-[var(--frame-glass-bg)] p-0 text-[var(--fg)] backdrop-blur-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>AI Insights</DialogTitle>
          </DialogHeader>
          <AIPanel
            thread={thread}
            clientFirstName={clientFirstName}
            reclassifying={reclassifying}
            onReclassify={onReclassify}
            onSuggestion={onSuggestion}
            className="border-none bg-transparent"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
