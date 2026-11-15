import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PillBarSlot = {
  id: string;
  time: string;
  title: string;
  avatars?: string[];
  attendeesLabel?: string;
  href?: string;
};

type PillBarProps = {
  ariaLabel: string;
  dateLabel: string;
  slots: PillBarSlot[];
  emptyText?: string;
  nowTime?: string;
  nowPercent?: number;
  actionHref?: string;
  actionLabel?: string;
  actionTooltip?: string;
  actionSlot?: ReactNode;
  className?: string;
};

export function PillBar({
  ariaLabel,
  dateLabel,
  slots,
  emptyText = 'No dates in the next 7 days',
  nowTime,
  nowPercent,
  actionHref,
  actionLabel = 'View schedule',
  actionTooltip,
  actionSlot,
  className,
}: PillBarProps) {
  const prefersReducedMotion = useReducedMotion();

  const renderSlotTitle = (slot: PillBarSlot) => {
    const content = (
      <p className="truncate text-xs">
        <span className="font-bold">{slot.time}</span> <span>{slot.title}</span>
      </p>
    );
    if (slot.href) {
      return (
        <Link to={slot.href} className="min-w-0 truncate hover:underline">
          {content}
        </Link>
      );
    }
    return content;
  };

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-full bg-ink p-1.5 text-ink-foreground',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-surface px-3 py-2 text-xs font-medium text-ink-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-accent-lime" aria-hidden="true" />
          <span>{dateLabel}</span>
        </span>

        <div className="no-scrollbar relative flex min-w-0 flex-1 items-center overflow-x-auto rounded-full bg-accent-lime px-3 py-1.5 text-accent-lime-foreground">
          {slots.length === 0 ? (
            <p className="truncate text-xs font-medium">{emptyText}</p>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:hidden">
                {renderSlotTitle(slots[0])}
                {slots[0].avatars?.[0] && (
                  <span
                    aria-label={slots[0].attendeesLabel || slots[0].title}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-ink-foreground"
                  >
                    <span aria-hidden="true">{slots[0].avatars[0]}</span>
                  </span>
                )}
              </div>

              <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
                {slots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className={cn(
                      'flex min-w-0 flex-1 items-center justify-between gap-1.5',
                      index > 0 && 'border-l border-ink/20 pl-2'
                    )}
                  >
                    {renderSlotTitle(slot)}
                    {slot.avatars && slot.avatars.length > 0 && (
                      <div
                        role="group"
                        aria-label={slot.attendeesLabel || slot.title}
                        className="flex shrink-0 -space-x-1"
                      >
                        {slot.avatars.map((av) => (
                          <span
                            key={av}
                            aria-hidden="true"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-lime bg-ink text-xs font-semibold text-ink-foreground"
                          >
                            {av}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {nowTime && typeof nowPercent === 'number' && (
            <div
              aria-hidden="true"
              style={{ left: `${nowPercent}%` }}
              className="pointer-events-none absolute inset-y-0 hidden -translate-x-1/2 flex-col items-center md:flex"
            >
              <span className="-mt-2.5 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-ink-foreground shadow-sm">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-accent-lime"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }
                  }
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="tabular-nums">{nowTime}</span>
              </span>
              <span className="w-0.5 flex-1 bg-ink/80" />
            </div>
          )}
        </div>
      </div>

      {actionSlot ||
        (actionHref && (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={actionHref}
                aria-label={actionLabel}
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-surface text-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime lg:inline-flex"
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </TooltipTrigger>
            {actionTooltip && <TooltipContent>{actionTooltip}</TooltipContent>}
          </Tooltip>
        ))}
    </section>
  );
}

