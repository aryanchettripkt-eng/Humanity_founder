import { CheckCircle2, MessageSquarePlus, Send, UserRoundCheck } from 'lucide-react';
import { useState } from 'react';
import { isClientHandling } from '@/features/client-view/mappers';
import { cn } from '@/lib/utils';
import type { ThreadListItem } from '@/types/api';

export type ClientAction = 'handling' | 'handled' | 'handoff' | 'note';

type ClientActionBarProps = {
  thread: ThreadListItem;
  pending: boolean;
  /** Assistant previewing the client view: show what the client sees, but nothing is clickable. */
  readOnly?: boolean;
  clientFirstName: string;
  onAction: (action: ClientAction, note?: string) => void;
};

const primary =
  'inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--cta-lime-bg)] px-5 text-base font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] disabled:opacity-50';
const outline =
  'inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-[var(--btn-outline-border)] px-5 text-base font-semibold text-[var(--btn-outline-fg)] transition-colors hover:bg-[var(--btn-outline-hover)] disabled:opacity-50';

/** Docked at the bottom of the reading pane, like the Inbox composer. One lime action, the rest outline. */
export function ClientActionBar({
  thread,
  pending,
  readOnly = false,
  clientFirstName,
  onAction,
}: ClientActionBarProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const handling = isClientHandling(thread);

  if (readOnly) {
    return (
      <p className="text-sm text-[var(--fg-muted)]">
        Preview only. {clientFirstName} sees{' '}
        <strong className="font-semibold text-[var(--fg)]">
          {handling ? 'Mark handled' : "I'll handle it"}
        </strong>
        , <strong className="font-semibold text-[var(--fg)]">Assistant take over</strong> and{' '}
        <strong className="font-semibold text-[var(--fg)]">Reply with a note</strong> here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap">
        {handling ? (
          <button
            type="button"
            className={cn(primary, 'col-span-2')}
            disabled={pending}
            onClick={() => onAction('handled')}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Mark handled
          </button>
        ) : (
          <button
            type="button"
            className={cn(primary, 'col-span-2')}
            disabled={pending}
            onClick={() => onAction('handling')}
          >
            I&apos;ll handle it
          </button>
        )}
        <button
          type="button"
          className={outline}
          disabled={pending}
          onClick={() => onAction('handoff')}
        >
          <UserRoundCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Assistant take over</span>
          <span className="sm:hidden">Hand off</span>
        </button>
        <button
          type="button"
          className={cn(outline, noteOpen && 'bg-[var(--btn-outline-hover)]')}
          aria-expanded={noteOpen}
          onClick={() => {
            setNoteOpen((v) => !v);
            setNote('');
          }}
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Reply with a note</span>
          <span className="sm:hidden">Add a note</span>
        </button>
      </div>

      {noteOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = note.trim();
            if (!text) return;
            onAction('note', text);
            setNoteOpen(false);
            setNote('');
          }}
          className="flex gap-2"
        >
          <label htmlFor={`client-note-${thread.id}`} className="sr-only">
            Note for your assistant
          </label>
          <input
            id={`client-note-${thread.id}`}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Say yes, but push to Friday…"
            className="h-12 min-w-0 flex-1 rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] px-5 text-base text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            aria-label="Send note to your assistant"
            disabled={pending || !note.trim()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--cta-lime-bg)] text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)] disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      ) : null}
    </div>
  );
}
