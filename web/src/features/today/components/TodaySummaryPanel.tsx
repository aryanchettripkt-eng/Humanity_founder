import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collapseActivity } from '@/features/today/mappers';
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
  const collapsedActivity = collapseActivity(activity);

  return (
    <aside
      aria-label="Thread summary and recent activity"
      className="h-fit rounded-[24px] bg-ink p-5 text-ink-foreground shadow-sm xl:sticky xl:top-6"
    >
      {thread && ownerMeta ? (
        <>
          <div className="rounded-[20px] border border-ink-line bg-ink-surface p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
              <span>{ownerMeta.label}</span>
              <span className="rounded-full bg-accent-lime px-2.5 py-0.5 text-xs font-semibold text-accent-lime-foreground tabular-nums">
                {confidencePct}%
              </span>
            </div>

            <p className="mt-2.5 line-clamp-2 text-base font-semibold text-ink-foreground">
              {thread.subject}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
              {thread.reason || thread.snippet}
            </p>

            {thread.owner === 'review' && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(['assistant', 'client', 'none'] as Owner[]).map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    onClick={() => onAssignOwner(thread, owner)}
                    className="inline-flex h-9 items-center rounded-full border border-ink-line px-3 text-xs font-medium text-ink-foreground transition-colors hover:bg-ink-line"
                  >
                    {OWNER_META[owner].label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3.5">
              <Link
                to={`/app/inbox/${thread.owner}/${thread.id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-accent-lime px-4 text-xs font-semibold text-accent-lime-foreground transition-opacity hover:opacity-90"
              >
                <span>Open in Inbox</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {thread.keyPoints?.length > 0 && (
            <div className="mt-4 rounded-[20px] border border-ink-line bg-ink-surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Key points
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-ink-foreground/90">
                {thread.keyPoints.slice(0, 3).map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-lime"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[20px] border border-ink-line bg-ink-surface p-4 text-xs text-ink-muted">
          Select a thread below to inspect its AI summary and key points.
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-lime" aria-hidden="true" />
        <h2 className="text-lg font-medium tracking-tight text-ink-foreground">Activity</h2>
      </div>

      {collapsedActivity.length === 0 ? (
        <p className="mt-3 text-xs text-ink-muted">No recent activity</p>
      ) : (
        <div className="mt-4 space-y-3 border-l border-ink-line pl-4">
          {collapsedActivity.map((item) => (
            <div key={item.id} className="relative flex items-baseline justify-between gap-2">
              <span
                aria-hidden="true"
                className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-lime ring-4 ring-ink"
              />
              <span className="text-xs text-ink-foreground/90">
                <strong className="font-medium">{item.actorName}</strong> {item.label}
                {item.subject ? ` · ${item.subject}` : ''}
                {item.count > 1 ? ` ×${item.count}` : ''}
              </span>
              <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
