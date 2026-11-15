import { Crown, PenLine } from 'lucide-react';
import { handoffCardTitle } from '@/features/client-desk/mappers';
import { useActiveClient } from '@/features/client-desk/useActiveClient';
import { formatRelativeTime } from '@/lib/format';
import type { ThreadDetail } from '@/types/api';

/** Top of the reading pane: what the client did with this email, and their note. */
export function HandoffCard({
  thread,
  onOpenDraft,
}: {
  thread: ThreadDetail;
  onOpenDraft: () => void;
}) {
  const { firstName } = useActiveClient();
  const title = handoffCardTitle(thread.handoff?.state, firstName);
  if (!title) return null;
  const note = thread.handoff.note;
  const draftFromNote = Boolean(thread.draft?.sourceNote && thread.draft.status === 'draft');

  return (
    <div className="glass-card flex items-start gap-3 rounded-[20px] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)]">
        <Crown className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold text-[var(--fg)]">
          {title}
          {thread.handoff.at ? (
            <span className="text-sm font-normal text-[var(--fg-subtle)]">
              {formatRelativeTime(thread.handoff.at)}
            </span>
          ) : null}
        </p>
        {note ? <p className="mt-1 text-[15px] text-[var(--fg)]">“{note}”</p> : null}
        {draftFromNote ? (
          <button
            type="button"
            onClick={onOpenDraft}
            className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[var(--cta-lime-bg)] px-4 text-sm font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)]"
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Open draft
          </button>
        ) : null}
      </div>
    </div>
  );
}
