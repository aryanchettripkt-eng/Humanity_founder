import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type LandingFooterProps = {
  demoLoading: 'assistant' | 'client' | null;
  onDemoLogin: (role: 'assistant' | 'client') => void;
};

export function LandingFooter({ demoLoading, onDemoLogin }: LandingFooterProps) {
  return (
    <footer className="mt-8 rounded-[28px] bg-landing-ink p-6 text-landing-ink-foreground sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-landing-ink-foreground sm:text-4xl">
            STOP GUESSING WHO REPLIES
          </h2>
          <p className="text-sm text-landing-ink-muted">
            Jump straight into the seeded workspace as Alex (assistant) or Priya (client).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={demoLoading !== null}
            onClick={() => onDemoLogin('assistant')}
            className="inline-flex h-11 items-center justify-center rounded-full bg-landing-accent px-6 text-sm font-semibold text-landing-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent disabled:opacity-60"
          >
            {demoLoading === 'assistant' ? 'Signing in…' : 'Try as assistant'}
          </button>

          <button
            type="button"
            disabled={demoLoading !== null}
            onClick={() => onDemoLogin('client')}
            className="inline-flex h-11 items-center justify-center rounded-full border border-landing-ink-line px-6 text-sm font-medium text-landing-ink-foreground transition-colors hover:bg-landing-ink-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent disabled:opacity-60"
          >
            {demoLoading === 'client' ? 'Signing in…' : 'Try as client'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1.5 border-t border-landing-ink-line pt-4 text-xs text-landing-ink-muted">
        <span>Simulated in prototype: sample inbox, sending, new mail button</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="About simulated prototype features"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-landing-ink-muted transition-colors hover:bg-landing-ink-surface hover:text-landing-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Demo mode uses seeded threads and simulated sending. Read-only Gmail sync (beta) is
            available for approved test accounts.
          </TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
}
