import { Loader2, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateDraft,
  useDiscardDraft,
  usePatchDraft,
  useSendDraft,
} from '@/features/composer/api';
import { cn } from '@/lib/utils';
import type { Draft } from '@/types/api';

type DraftComposerProps = {
  threadId: string;
  draft: Draft | null;
  autoOpen?: boolean;
};

const TONES: Array<{ id: 'formal' | 'friendly' | 'brief'; label: string }> = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'brief', label: 'Brief' },
];

export function DraftComposer({ threadId, draft, autoOpen = false }: DraftComposerProps) {
  const [tone, setTone] = useState<'formal' | 'friendly' | 'brief'>(draft?.tone || 'friendly');
  const [instruction, setInstruction] = useState(draft?.instruction || '');
  const [body, setBody] = useState(draft?.body || '');
  const [confirmSend, setConfirmSend] = useState(false);

  const createDraft = useCreateDraft();
  const patchDraft = usePatchDraft();
  const sendDraft = useSendDraft();
  const discardDraft = useDiscardDraft();

  useEffect(() => {
    setBody(draft?.body || '');
    setTone(draft?.tone || 'friendly');
    setInstruction(draft?.instruction || '');
    setConfirmSend(false);
  }, [draft?.id, draft?.body, draft?.tone, draft?.instruction]);

  const handleGenerate = () => {
    createDraft.mutate({
      threadId,
      tone,
      instruction: instruction.trim() || undefined,
    });
  };

  const handleBodyBlur = () => {
    if (draft && body !== draft.body && body.trim()) {
      patchDraft.mutate({ id: draft.id, body });
    }
  };

  if (!draft && !autoOpen && !createDraft.isPending) {
    return (
      <div className="glass-card flex items-center justify-between gap-3 rounded-[20px] px-4 py-3">
        <span className="text-sm text-[var(--fg-muted)]">
          Need to reply? Generate an AI draft and review before saving.
        </span>
        <Button
          size="sm"
          onClick={handleGenerate}
          className="shrink-0 whitespace-nowrap rounded-full bg-[var(--cta-lime-bg)] text-[var(--cta-lime-fg)] hover:bg-[var(--cta-lime-hover)]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Draft with AI
        </Button>
      </div>
    );
  }

  const recipient = draft?.to?.[0]?.email || 'recipient';

  return (
    <div className="glass-card space-y-3 rounded-[20px] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                tone === t.id
                  ? 'border-transparent bg-[var(--nav-active-bg)] font-semibold text-[var(--nav-active-fg)]'
                  : 'border-[var(--pane-border)] bg-[var(--pane-bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {draft?.sourceNote ? (
        <div className="rounded-xl border border-[var(--pane-border)] bg-[var(--pane-bg)] px-3 py-2 text-xs text-[var(--fg)]">
          Drafted from client note: “{draft.sourceNote}”
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional instruction (e.g. decline politely, offer next week)…"
          className="h-9 flex-1 rounded-full border border-[var(--pane-border)] bg-[var(--pane-bg)] px-3.5 text-xs text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={createDraft.isPending}
          onClick={handleGenerate}
          className="rounded-full border-[var(--pane-border)] bg-[var(--pane-bg)] text-[var(--fg)] hover:bg-[var(--row-selected-bg)]"
        >
          {createDraft.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>{draft ? 'Regenerate' : 'Draft'}</span>
        </Button>
      </div>

      {createDraft.isPending && !draft ? (
        <div className="flex items-center gap-2 py-6 text-xs text-[var(--fg-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--grove-lime)]" />
          <span>Drafting reply…</span>
        </div>
      ) : (
        draft && (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={handleBodyBlur}
              rows={5}
              className="rounded-2xl border-[var(--pane-border)] bg-[var(--pane-bg)] text-sm leading-relaxed text-[var(--fg)]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--fg-muted)] hover:text-destructive"
                disabled={discardDraft.isPending}
                onClick={() => discardDraft.mutate({ draftId: draft.id, threadId })}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Discard
              </Button>

              {confirmSend ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--fg-muted)]">
                    Save reply for <strong className="text-[var(--fg)]">{recipient}</strong>?
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmSend(false)}
                    disabled={sendDraft.isPending}
                    className="rounded-full border-[var(--pane-border)] bg-transparent text-[var(--fg)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={sendDraft.isPending}
                    onClick={() => sendDraft.mutate({ draftId: draft.id, threadId })}
                    className="rounded-full bg-[var(--cta-lime-bg)] text-[var(--cta-lime-fg)] hover:bg-[var(--cta-lime-hover)]"
                  >
                    {sendDraft.isPending ? 'Saving…' : 'Confirm save'}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setConfirmSend(true)}
                  disabled={!body.trim()}
                  className="rounded-full bg-[var(--cta-lime-bg)] text-[var(--cta-lime-fg)] hover:bg-[var(--cta-lime-hover)]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Save reply
                </Button>
              )}
            </div>

            <p className="text-[11px] text-[var(--fg-subtle)]">
              Saved to this thread. Email delivery isn&apos;t connected yet.
            </p>
          </>
        )
      )}
    </div>
  );
}
