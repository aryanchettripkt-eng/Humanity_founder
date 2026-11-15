import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/lib/format';
import { OWNER_META } from '@/lib/owners';
import type { ActivityItem, Owner, ThreadListItem } from '@/types/api';

type TodaySummaryPanelProps = {
  thread: ThreadListItem | null;
  activity: ActivityItem[];
  onAssignOwner: (thread: ThreadListItem, owner: Owner) => void;
};

export function TodaySummaryPanel({
  thread,
  activity,
  onAssignOwner,
}: TodaySummaryPanelProps) {
  const ownerMeta = thread ? OWNER_META[thread.owner] : null;
  const confidencePct = thread ? Math.round(thread.confidence * 100) : 0;

  return (
    <aside
      id="summary"
      aria-label="Thread summary and recent activity"
      className="rounded-[28px] bg-landing-ink p-5 text-landing-ink-foreground shadow-landing xl:sticky xl:top-6"
    >
      {thread && ownerMeta ? (
        <>
          <div className="rounded-[22px] border border-landing-ink-line bg-landing-ink-surface p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-landing-ink-muted">
              <span>{ownerMeta.label}</span>
              <span className="rounded-full bg-landing-accent px-2.5 py-0.5 text-xs font-semibold text-landing-accent-foreground tabular-nums">
                {confidencePct}%
              </span>
            </div>

            <p className="mt-2.5 line-clamp-2 text-base font-semibold text-landing-ink-foreground">
              {thread.subject}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-landing-ink-muted">
              {thread.reason || thread.snippet}
            </p>

            {thread.owner === 'review' && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(['assistant', 'client', 'none'] as Owner[]).map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    onClick={() => onAssignOwner(thread, owner)}
                    className="inline-flex h-9 items-center rounded-full border border-landing-ink-line px-3 text-xs font-medium text-landing-ink-foreground transition-colors hover:bg-landing-ink-line"
                  >
                    {OWNER_META[owner].label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3.5">
              <Link
                to={`/app/inbox/${thread.owner}/${thread.id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-landing-accent px-4 text-xs font-semibold text-landing-accent-foreground transition-opacity hover:opacity-90"
              >
                <span>Open in Inbox</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {thread.keyPoints?.length > 0 && (
            <div className="mt-4 rounded-[20px] border border-landing-ink-line bg-landing-ink-surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-landing-ink-muted">
                Key points
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-landing-ink-foreground/90">
                {thread.keyPoints.slice(0, 3).map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-accent"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[22px] border border-landing-ink-line bg-landing-ink-surface p-4 text-xs text-landing-ink-muted">
          Select any conversation card to inspect its AI summary and key points.
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-landing-accent" aria-hidden="true" />
          <h2 className="text-lg font-medium tracking-tight text-landing-ink-foreground">
            Activity
          </h2>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="mt-3 text-xs text-landing-ink-muted">No recent activity</p>
      ) : (
        <div className="mt-4 space-y-3 border-l border-landing-ink-line pl-4">
          {activity.slice(0, 5).map((item) => (
            <div key={item.id} className="relative flex items-baseline justify-between gap-2">
              <span
                aria-hidden="true"
                className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-landing-accent ring-4 ring-landing-ink"
              />
              <span className="text-xs text-landing-ink-foreground/90">
                <strong className="font-medium">{item.actor.name}</strong>{' '}
                {item.type.replace(/_/g, ' ')}
                {typeof item.payload?.subject === 'string' ? ` · ${item.payload.subject}` : ''}
              </span>
              <span className="shrink-0 text-xs text-landing-ink-muted tabular-nums">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

