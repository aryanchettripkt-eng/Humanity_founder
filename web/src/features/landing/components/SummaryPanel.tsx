import { ArrowUpRight, BellOff, CheckCircle2, CircleHelp, Crown, Sparkles, UserRoundCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SampleReplyThread } from '@/features/landing/sampleData';
import { OWNER_META } from '@/lib/owners';

type SummaryPanelProps = {
  thread: SampleReplyThread;
  onTryDemo: (role: 'assistant' | 'client') => void;
};

export function SummaryPanel({ thread, onTryDemo }: SummaryPanelProps) {
  const ownerMeta = OWNER_META[thread.owner];
  const confidencePct = Math.round(thread.confidence * 100);

  const renderPreview = () => {
    if (thread.owner === 'client') {
      return (
        <>
          <div className="flex items-center justify-between text-xs text-landing-ink-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-landing-ink-foreground">
              <Crown className="h-3.5 w-3.5 text-landing-accent" aria-hidden="true" />
              <span>Client view · /c</span>
            </span>
            <span className="rounded-full bg-landing-ink-line px-2 py-0.5 text-xs text-landing-ink-foreground">
              Live sync
            </span>
          </div>

          <p className="mt-3 text-base font-semibold text-landing-ink-foreground">
            2 emails need you, Priya
          </p>
          <p className="mt-1 truncate text-xs text-landing-ink-muted">
            {thread.subject} · {thread.sender}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTryDemo('client')}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-landing-accent px-4 text-xs font-semibold text-landing-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>I&apos;ll handle it</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Opens the live demo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTryDemo('client')}
                  className="inline-flex h-11 items-center rounded-full border border-landing-ink-line px-3.5 text-xs font-medium text-landing-ink-foreground transition-colors hover:bg-landing-ink-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
                >
                  Reply with note
                </button>
              </TooltipTrigger>
              <TooltipContent>Opens the live demo</TooltipContent>
            </Tooltip>
          </div>
        </>
      );
    }

    const stateConfig =
      thread.owner === 'assistant'
        ? {
            badge: 'Assistant queue · /app',
            icon: UserRoundCheck,
            headline: "Not in Priya's queue · Alex handles it",
            cta: 'Open assistant inbox',
            role: 'assistant' as const,
          }
        : thread.owner === 'none'
          ? {
              badge: 'Filtered out · /app',
              icon: BellOff,
              headline: 'No reply needed',
              cta: 'Open live demo',
              role: 'assistant' as const,
            }
          : {
              badge: 'Below 70% threshold · /app',
              icon: CircleHelp,
              headline: 'Needs your call',
              cta: 'Review in live demo',
              role: 'assistant' as const,
            };

    const StateIcon = stateConfig.icon;

    return (
      <>
        <div className="flex items-center justify-between text-xs text-landing-ink-muted">
          <span className="inline-flex items-center gap-1.5 font-medium text-landing-ink-foreground">
            <StateIcon className="h-3.5 w-3.5 text-landing-accent" aria-hidden="true" />
            <span>{stateConfig.badge}</span>
          </span>
        </div>

        <p className="mt-3 text-base font-semibold text-landing-ink-foreground">
          {stateConfig.headline}
        </p>
        <p className="mt-1 truncate text-xs text-landing-ink-muted">
          {thread.subject} · {thread.sender}
        </p>

        <div className="mt-3.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onTryDemo(stateConfig.role)}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-landing-accent px-4 text-xs font-semibold text-landing-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
              >
                <span>{stateConfig.cta}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Opens the live demo</TooltipContent>
          </Tooltip>
        </div>
      </>
    );
  };

  return (
    <aside
      id="summary"
      aria-label="AI thread summary and client hand-off preview"
      className="rounded-[28px] bg-landing-ink p-5 text-landing-ink-foreground shadow-landing xl:sticky xl:top-6"
    >
      <div className="rounded-[22px] border border-landing-ink-line bg-landing-ink-surface p-4">
        {renderPreview()}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-landing-accent" aria-hidden="true" />
          <h2 className="text-xl font-medium tracking-tight text-landing-ink-foreground">
            Summary
          </h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onTryDemo(thread.owner === 'client' ? 'client' : 'assistant')}
              aria-label="Open full AI panel in live demo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-landing-ink-line bg-landing-ink-surface text-landing-ink-foreground transition-colors hover:bg-landing-ink-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Opens the live demo</TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-4 space-y-3 border-l border-landing-ink-line pl-4">
        {thread.timeline.map((item) => (
          <div key={item.time} className="relative flex items-baseline justify-between gap-2">
            <span
              aria-hidden="true"
              className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-landing-accent ring-4 ring-landing-ink"
            />
            <span className="text-xs text-landing-ink-foreground/90">{item.label}</span>
            <span className="shrink-0 text-xs text-landing-ink-muted tabular-nums">
              {item.time}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[20px] border border-landing-ink-line bg-landing-ink-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-landing-ink-muted">
            Key points
          </h3>
          <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-landing-ink-foreground/90">
            {thread.keyPoints.map((point) => (
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

        <div className="rounded-[20px] border border-landing-ink-line bg-landing-ink-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-landing-ink-muted">
              Why: {ownerMeta.label}
            </h3>
            <span className="rounded-full bg-landing-accent px-2.5 py-0.5 text-xs font-semibold text-landing-accent-foreground tabular-nums">
              {confidencePct}% confident
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-landing-ink-foreground/90">
            {thread.reason}
          </p>
        </div>
      </div>
    </aside>
  );
}
