import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TOUR_STEPS = [
  {
    title: '1. Who replies — at a glance',
    body: 'Relay sorts every thread into You (Assistant), Client, No reply, or Needs review, with a confidence score and plain-English reason.',
  },
  {
    title: '2. Ask AI & shortcuts (⌘K)',
    body: 'Press ⌘K (or Ctrl+K) to jump anywhere, ask natural-language questions about your inbox, or use j/k/s/u/e/d/r/o on any thread.',
  },
  {
    title: '3. Live assistant ↔ client sync',
    body: 'Threads owned by your client appear on their calm /c view. Any handoff or note updates both screens in real time.',
  },
];

export function GuidedTour() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);

  if (searchParams.get('tour') !== '1') return null;

  const dismiss = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('tour');
    setSearchParams(next, { replace: true });
    setStepIndex(0);
  };

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Relay quick tour"
      className="fixed bottom-16 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-xl lg:bottom-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Quick tour ({stepIndex + 1}/{TOUR_STEPS.length})</span>
        </div>
        <button
          type="button"
          aria-label="Close tour"
          onClick={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <h2 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={dismiss}>
          Skip
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => (isLast ? dismiss() : setStepIndex((i) => i + 1))}
        >
          {isLast ? 'Done' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
