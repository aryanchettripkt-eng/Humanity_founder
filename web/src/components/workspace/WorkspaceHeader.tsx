import { ChevronDown, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatWithBadge } from '@/components/common/StatWithBadge';
import type { WorkspaceStatModel } from '@/components/workspace/models';
import { cn } from '@/lib/utils';

type WorkspaceHeaderProps = {
  eyebrow?: string;
  title: string;
  primaryLabel: string;
  primaryHint?: string;
  primaryDisabled?: boolean;
  onPrimaryAction: () => void;
  stats: WorkspaceStatModel[];
  briefText?: string;
  briefRefreshing?: boolean;
  onRefreshBrief?: () => void;
  subtitle?: string;
};

function firstSentence(text: string): { head: string; hasMore: boolean } {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  if (!match || match[0].length >= trimmed.length) {
    return { head: trimmed, hasMore: false };
  }
  return { head: match[0], hasMore: true };
}

export function WorkspaceHeader({
  eyebrow,
  title,
  primaryLabel,
  primaryHint,
  primaryDisabled = false,
  onPrimaryAction,
  stats,
  briefText,
  briefRefreshing = false,
  onRefreshBrief,
  subtitle,
}: WorkspaceHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const split = briefText ? firstSentence(briefText) : null;

  return (
    <section aria-labelledby="workspace-heading" className="pb-8 pt-2">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          {eyebrow && <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>}

          <div className="flex flex-wrap items-center gap-4">
            <h1
              id="workspace-heading"
              className="font-display text-[36px] font-extrabold uppercase leading-[0.95] tracking-tight text-foreground sm:text-[48px] lg:text-[56px]"
            >
              {title}
            </h1>
            <button
              type="button"
              disabled={primaryDisabled}
              onClick={onPrimaryAction}
              className="inline-flex h-11 items-center gap-2.5 rounded-full bg-primary pl-1.5 pr-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-surface text-accent-lime">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{primaryLabel}</span>
              {primaryHint && (
                <kbd className="hidden rounded bg-ink-surface px-1.5 py-0.5 font-mono text-xs text-ink-foreground sm:inline-block">
                  {primaryHint}
                </kbd>
              )}
            </button>
          </div>

          {subtitle && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}

          {briefText && split && (
            <div className="flex max-w-3xl items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="text-foreground">{expanded ? briefText : split.head}</span>
                {split.hasMore && (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((v) => !v)}
                    className="ml-2 inline-flex items-center gap-0.5 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    <span>{expanded ? 'less' : 'more'}</span>
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
              {onRefreshBrief && (
                <button
                  type="button"
                  aria-label="Refresh brief"
                  title="Refresh brief"
                  disabled={briefRefreshing}
                  onClick={onRefreshBrief}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RefreshCw
                    className={cn('h-3.5 w-3.5', briefRefreshing && 'animate-spin')}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-8">
          {stats.map((stat) =>
            stat.href ? (
              <Link
                key={stat.id}
                to={stat.href}
                className="rounded-2xl p-1 transition-colors hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <StatWithBadge
                  value={stat.value}
                  label={stat.label}
                  badge={stat.delta}
                  badgeTone={stat.deltaTone}
                />
              </Link>
            ) : (
              <StatWithBadge
                key={stat.id}
                value={stat.value}
                label={stat.label}
                badge={stat.delta}
                badgeTone={stat.deltaTone}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

