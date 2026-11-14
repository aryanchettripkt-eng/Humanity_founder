import { ArrowUpRight, Loader2, Send, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAskAI } from '@/features/command/api';
import { useCommandStore } from '@/stores/command';
import { useUiStore } from '@/stores/ui';

const EXAMPLES = [
  'Show me emails that need my attention',
  'What am I waiting for a response on?',
  "Which emails require the client's attention?",
];

export function AskPanel() {
  const { askOpen, setAskOpen, initialQuestion } = useCommandStore();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const askMutation = useAskAI();

  useEffect(() => {
    if (askOpen && initialQuestion) {
      setQuestion(initialQuestion);
      askMutation.mutate({ clientId: activeClientId, question: initialQuestion });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askOpen, initialQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate({ clientId: activeClientId, question: question.trim() });
  };

  return (
    <Dialog open={askOpen} onOpenChange={setAskOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Ask your inbox</span>
          </DialogTitle>
          <DialogDescription>
            Ask a question and jump directly to cited threads.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What am I waiting on?"
          />
          <Button type="submit" disabled={askMutation.isPending || !question.trim()}>
            {askMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQuestion(ex);
                askMutation.mutate({ clientId: activeClientId, question: ex });
              }}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>

        {askMutation.isError && (
          <p className="mt-4 text-xs text-destructive">Could not reach AI. Please try again.</p>
        )}

        {askMutation.data && (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-3.5 text-sm">
            <p className="leading-relaxed text-foreground">{askMutation.data.answer}</p>
            {askMutation.data.threadIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {askMutation.data.threadIds.map((id, idx) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setAskOpen(false);
                      navigate(`/app/inbox/inbox/${id}`);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                  >
                    <span>Thread #{idx + 1}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

