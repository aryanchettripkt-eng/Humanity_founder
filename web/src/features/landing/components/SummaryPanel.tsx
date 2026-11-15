import { ArrowUpRight, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import type { SampleReplyThread } from '@/features/landing/sampleData';
import { OWNER_META } from '@/lib/owners';

type SummaryPanelProps = {
  thread: SampleReplyThread;
  onTryClientDemo: () => void;
};

export function SummaryPanel({ thread, onTryClientDemo }: SummaryPanelProps) {
  const ownerMeta = OWNER_META[thread.owner];
  const confidencePct = Math.round(thread.confidence * 100);

  return (
    <aside
      id="summary"
      aria-label="AI thread summary and client hand-off preview"
      className="rounded-[28px] bg-landing-ink p-5 text-landing-ink-foreground shadow-2xl xl:sticky xl:top-6"
    >
      <div className="rounded-[22px] border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-300">
            <Crown className="h-3.5 w-3.5 text-landing-accent" aria-hidden="true" />
            <span>Client view · /c</span>
          </span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
            Live sync
          </span>
        </div>

        <p className="mt-3 text-base font-semibold text-white">2 emails need you, Priya</p>
        <p className="mt-1 truncate text-xs text-zinc-400">
          {thread.subject} · {thread.sender}
        </p>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onTryClientDemo}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-landing-accent px-3.5 text-xs font-semibold text-landing-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>I&apos;ll handle it</span>
          </button>
          <button
            type="button"
            onClick={onTryClientDemo}
            className="inline-flex h-9 items-center rounded-full border border-zinc-700 px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
          >
            Reply with note
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-landing-accent" aria-hidden="true" />
          <h2 className="text-xl font-medium tracking-tight text-white">Summary</h2>
        </div>
        <button
          type="button"
          onClick={onTryClientDemo}
          aria-label="Open full AI panel in live demo"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 space-y-3 border-l border-zinc-800 pl-4">
        {thread.timeline.map((item) => (
          <div key={item.time} className="relative flex items-baseline justify-between gap-2">
            <span
              aria-hidden="true"
              className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-landing-accent ring-4 ring-landing-ink"
            />
            <span className="text-xs text-zinc-300">{item.label}</span>
            <span className="shrink-0 text-[11px] text-zinc-500 tabular-nums">{item.time}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[20px] border border-zinc-800 bg-zinc-900/90 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Key points
          </h3>
          <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-zinc-200">
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

        <div className="rounded-[20px] border border-zinc-800 bg-zinc-900/90 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Why: {ownerMeta.label}
            </h3>
            <span className="rounded-full bg-landing-accent px-2 py-0.5 text-[11px] font-semibold text-landing-accent-foreground tabular-nums">
              {confidencePct}% confident
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-200">{thread.reason}</p>
        </div>
      </div>
    </aside>
  );
}

