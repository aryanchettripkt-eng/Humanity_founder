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
        'relative overflow-hidden rounded-[20px] border border-white/35 bg-white/15 p-4 text-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.28)] backdrop-blur-xl',
        className
      )}
    >
      {/* 10% dark tint layer so AA contrast holds on any image */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/15" />

      <div className="relative z-10 flex h-full flex-col">
        {title || actionHref || onAction || rightSlot ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            {title ? (
              <h3 className="font-display text-base font-medium tracking-tight text-white">
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
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : onAction ? (
                <button
                  type="button"
                  onClick={onAction}
                  aria-label={actionLabel}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
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

