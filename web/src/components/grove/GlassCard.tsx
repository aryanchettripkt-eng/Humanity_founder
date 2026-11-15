import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type GlassCardProps = {
  title?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function GlassCard({
  title,
  actionHref,
  actionLabel = 'Open',
  onAction,
  rightSlot,
  children,
  className,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass relative overflow-hidden rounded-[20px] p-4',
        className
      )}
    >
      <div className="relative z-10 flex h-full flex-col">
        {title || actionHref || onAction || rightSlot ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            {title ? (
              <h3 className="font-display text-base font-medium tracking-tight text-[var(--glass-fg)]">
                {title}
              </h3>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              {rightSlot}
              {actionHref ? (
                <Link
                  to={actionHref}
                  aria-label={actionLabel}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/10 text-[var(--glass-fg)] transition-colors hover:bg-white/20"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : onAction ? (
                <button
                  type="button"
                  onClick={onAction}
                  aria-label={actionLabel}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/10 text-[var(--glass-fg)] transition-colors hover:bg-white/20"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

