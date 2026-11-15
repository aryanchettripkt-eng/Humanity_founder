import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  SCHEDULE_DATE,
  SCHEDULE_NOW_TIME,
  SCHEDULE_SLOTS,
} from '@/features/landing/sampleData';
import { cn } from '@/lib/utils';

type LandingTopBarProps = {
  demoLoading: 'assistant' | 'client' | null;
  onDemoLogin: (role: 'assistant' | 'client') => void;
};

export function LandingTopBar({ demoLoading, onDemoLogin }: LandingTopBarProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pb-6 lg:flex-nowrap">
      <Link
        to="/"
        className="order-1 inline-flex min-h-[44px] items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-landing-ink text-landing-ink-foreground">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold tracking-tight text-landing-ink">Relay</span>
      </Link>

      <section
        aria-label="Today's extracted schedule"
        className="order-3 flex w-full items-center justify-between gap-2 rounded-full bg-landing-ink p-1.5 text-landing-ink-foreground lg:order-2 lg:mx-4 lg:w-auto lg:flex-1"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-landing-ink-surface px-3 py-2 text-xs font-medium text-landing-ink-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-landing-accent" aria-hidden="true" />
            <span>{SCHEDULE_DATE}</span>
          </span>

          <div className="relative flex min-w-0 flex-1 items-center rounded-full bg-landing-accent px-3 py-1.5 text-landing-accent-foreground">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:hidden">
              <p className="truncate text-xs">
                <span className="font-bold">{SCHEDULE_SLOTS[0].time}</span>{' '}
                <span>{SCHEDULE_SLOTS[0].title}</span>
              </p>
              <span
                aria-label={SCHEDULE_SLOTS[0].attendeesLabel}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-landing-ink text-xs font-semibold text-landing-ink-foreground"
              >
                <span aria-hidden="true">{SCHEDULE_SLOTS[0].avatars[0]}</span>
              </span>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
              {SCHEDULE_SLOTS.map((slot, index) => (
                <div
                  key={slot.id}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-between gap-1.5',
                    index > 0 && 'border-l border-landing-ink/20 pl-2'
                  )}
                >
                  <p className="truncate text-xs">
                    <span className="font-bold">{slot.time}</span> <span>{slot.title}</span>
                  </p>
                  <div
                    role="group"
                    aria-label={slot.attendeesLabel}
                    className="flex shrink-0 -space-x-1"
                  >
                    {slot.avatars.map((av) => (
                      <span
                        key={av}
                        aria-hidden="true"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-landing-accent bg-landing-ink text-xs font-semibold text-landing-ink-foreground"
                      >
                        {av}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-[54%] hidden -translate-x-1/2 flex-col items-center md:flex"
            >
              <span className="-mt-2.5 inline-flex items-center gap-1 rounded-full bg-landing-ink px-2 py-0.5 text-xs font-medium text-landing-ink-foreground shadow-sm">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-landing-accent"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }
                  }
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="tabular-nums">{SCHEDULE_NOW_TIME}</span>
              </span>
              <span className="w-0.5 flex-1 bg-landing-ink/80" />
            </div>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="#your-day"
              aria-label="Jump to Your day tasks"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-landing-ink-surface text-landing-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent lg:inline-flex"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Extracted from emails (UpcomingRail)</TooltipContent>
        </Tooltip>
      </section>

      <div className="order-2 flex items-center gap-2 lg:order-3">
        <Link
          to="/login"
          className="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium text-landing-muted transition-colors hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink"
        >
          Log in
        </Link>

        <button
          type="button"
          disabled={demoLoading !== null}
          onClick={() => onDemoLogin('assistant')}
          className="hidden h-11 items-center justify-center rounded-full bg-landing-ink px-4 text-sm font-medium text-landing-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2 disabled:opacity-60 sm:inline-flex"
        >
          {demoLoading === 'assistant' ? 'Signing in…' : 'Try the demo'}
        </button>
      </div>
    </header>
  );
}
