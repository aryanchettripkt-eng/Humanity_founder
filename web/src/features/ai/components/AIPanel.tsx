import { AlertTriangle, CalendarPlus, History, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ConfidenceMeter } from '@/components/common/ConfidenceMeter';
import { OwnerPill } from '@/components/common/OwnerPill';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, formatUpcomingDate } from '@/lib/format';
import { OWNER_META } from '@/lib/owners';
import type { ThreadDetail } from '@/types/api';

type AIPanelProps = {
  thread: ThreadDetail;
  reclassifying?: boolean;
  onReclassify: () => void;
  onSuggestion: (action: 'apply' | 'dismiss') => void;
};

export function AIPanel({
  thread,
  reclassifying = false,
  onReclassify,
  onSuggestion,
}: AIPanelProps) {
  const ownerMeta = OWNER_META[thread.owner] ?? OWNER_META.review;
  const suggestedMeta = thread.suggestedOwner ? OWNER_META[thread.suggestedOwner] : null;

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto border-l border-border bg-surface p-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>AI Insights</span>
        </div>
        {thread.aiModel && thread.aiModel !== 'seed' && (
          <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {thread.aiModel}
          </span>
        )}
      </div>

      {thread.aiStatus === 'failed' && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>AI unavailable — flagged for review</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs"
            disabled={reclassifying}
            onClick={onReclassify}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {suggestedMeta && thread.ownerSource !== 'ai' && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
          <p className="font-medium text-foreground">
            AI suggests <span className="font-semibold">{suggestedMeta.label}</span> now
          </p>
          <p className="mt-1 text-muted-foreground">
            Your manual assignment is kept unless you apply this change.
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => onSuggestion('apply')}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => onSuggestion('dismiss')}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-2 rounded-xl border border-border bg-card p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Why {ownerMeta.label}?
          </span>
          {thread.ownerSource === 'ai' && <ConfidenceMeter value={thread.confidence} />}
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {thread.ownerSource === 'ai'
            ? thread.reason || 'No classification reason recorded yet.'
            : thread.history?.[thread.history.length - 1]?.reason ||
              (thread.ownerSource === 'client'
                ? 'Updated by client.'
                : thread.ownerSource === 'rule'
                  ? 'Matched sender rule.'
                  : 'Set manually.')}
        </p>
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>Source: {thread.ownerSource}</span>
          {thread.suggestedOwner && thread.owner === 'review' && (
            <span>Guess: {OWNER_META[thread.suggestedOwner]?.label}</span>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Summary
        </h3>
        <p className="text-sm leading-relaxed text-foreground">
          {thread.summary || thread.snippet}
        </p>
        {thread.keyPoints?.length > 0 && (
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {thread.keyPoints.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Extracted dates
        </h3>
        {thread.entities?.length > 0 ? (
          <div className="space-y-2">
            {thread.entities.map((ent, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-2.5 text-xs"
              >
                <div>
                  <p className="font-medium text-foreground">{ent.title}</p>
                  <p className="text-muted-foreground">{formatUpcomingDate(ent.startsAt)}</p>
                  {ent.location && <p className="text-muted-foreground">{ent.location}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => toast.success(`Added "${ent.title}" to calendar (simulated)`)}
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No dates detected in this thread.</p>
        )}
      </section>

      {thread.history?.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            <span>Ownership history</span>
          </div>
          <div className="space-y-2">
            {[...thread.history].reverse().map((h, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <OwnerPill owner={h.from as ThreadDetail['owner']} size="sm" />
                  <span className="text-muted-foreground">→</span>
                  <OwnerPill owner={h.to as ThreadDetail['owner']} size="sm" />
                  <span className="ml-auto text-muted-foreground">
                    {formatRelativeTime(h.at)}
                  </span>
                </div>
                {h.reason && <p className="mt-1 text-muted-foreground">{h.reason}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}

/** Collapsible AI Insights summary shown above messages on mobile / tablet (< xl). */
export function MobileAISummary({
  thread,
  reclassifying = false,
  onReclassify,
}: Pick<AIPanelProps, 'thread' | 'reclassifying' | 'onReclassify'>) {
  const ownerMeta = OWNER_META[thread.owner] ?? OWNER_META.review;
  return (
    <details className="xl:hidden rounded-xl border border-border bg-surface p-3 text-xs" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium text-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>AI Insights · Why {ownerMeta.label}</span>
        </span>
        <ConfidenceMeter value={thread.confidence} />
      </summary>
      <div className="mt-2.5 space-y-2 border-t border-border pt-2.5 text-xs">
        <p className="leading-relaxed text-foreground">
          {thread.reason || 'No classification reason recorded yet.'}
        </p>
        {(thread.summary || thread.snippet) && (
          <p className="leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">Summary: </strong>
            {thread.summary || thread.snippet}
          </p>
        )}
        {thread.entities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {thread.entities.map((ent, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-foreground"
              >
                <CalendarPlus className="h-3 w-3 text-primary" />
                {ent.title}: {formatUpcomingDate(ent.startsAt)}
              </span>
            ))}
          </div>
        )}
        {thread.aiStatus === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={reclassifying}
            onClick={onReclassify}
          >
            <RefreshCw className="h-3 w-3" />
            Retry AI
          </Button>
        )}
      </div>
    </details>
  );
}


