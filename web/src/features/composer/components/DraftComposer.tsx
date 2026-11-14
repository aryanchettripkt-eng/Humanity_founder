import { Info, Loader2, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
        <span className="text-xs text-muted-foreground">
          Need to reply? Generate an AI draft and review before sending.
        </span>
        <Button size="sm" onClick={handleGenerate}>
          <Sparkles className="h-3.5 w-3.5" />
          Draft with AI
        </Button>
      </div>
    );
  }

  const recipient = draft?.to?.[0]?.email || 'recipient';

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                tone === t.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Simulated send
        </span>
      </div>

      {draft?.sourceNote && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Drafted from client note: “{draft.sourceNote}”
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional instruction (e.g. decline politely, offer next week)…"
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={createDraft.isPending}
          onClick={handleGenerate}
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
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
              className="text-sm leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={discardDraft.isPending}
                onClick={() => discardDraft.mutate({ draftId: draft.id, threadId })}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Discard
              </Button>

              {confirmSend ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Send to <strong className="text-foreground">{recipient}</strong>?
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmSend(false)}
                    disabled={sendDraft.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={sendDraft.isPending}
                    onClick={() => sendDraft.mutate({ draftId: draft.id, threadId })}
                  >
                    {sendDraft.isPending ? 'Sending…' : 'Confirm send'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setConfirmSend(true)} disabled={!body.trim()}>
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}

