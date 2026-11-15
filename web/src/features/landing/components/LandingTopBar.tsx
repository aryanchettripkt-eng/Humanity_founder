import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Bell, CalendarDays, MailCheck } from 'lucide-react';
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

      <div
        aria-label="Extracted schedule from your client's inbox"
        className="order-3 flex w-full items-center justify-between gap-2 rounded-full bg-landing-ink p-1.5 text-landing-ink-foreground lg:order-2 lg:w-auto lg:max-w-[740px] lg:flex-1"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden whitespace-nowrap pl-3 text-xs font-medium text-zinc-200 sm:inline-block">
            Your day
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100">
            <CalendarDays className="h-3.5 w-3.5 text-landing-accent" aria-hidden="true" />
            <span>{SCHEDULE_DATE}</span>
          </span>

          <div className="relative flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden rounded-full bg-landing-accent px-3 py-1.5 text-landing-accent-foreground">
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <span className="truncate text-xs font-semibold">{SCHEDULE_SLOTS[0].title}</span>
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-landing-ink text-[10px] font-semibold text-landing-ink-foreground">
                {SCHEDULE_SLOTS[0].avatars[0]}
              </span>
            </div>

            <div className="hidden min-w-0 flex-1 items-center justify-between gap-3 md:flex">
              {SCHEDULE_SLOTS.map((slot, index) => (
                <div
                  key={slot.id}
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    index === 1 && 'border-l border-landing-ink/20 pl-2.5'
                  )}
                >
                  <span className="truncate text-[11px] font-semibold">{slot.title}</span>
                  <div className="flex shrink-0 -space-x-1">
                    {slot.avatars.map((av) => (
                      <span
                        key={av}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-landing-accent bg-landing-ink text-[9px] font-semibold text-landing-ink-foreground"
                      >
                        {av}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden shrink-0 items-center gap-1 rounded-full bg-landing-ink px-2 py-0.5 text-[10px] font-medium text-landing-ink-foreground sm:inline-flex">
              <motion.span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-landing-accent"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="tabular-nums">{SCHEDULE_NOW_TIME}</span>
            </div>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="#your-day"
              aria-label="Jump to Your day tasks"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-100 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent lg:inline-flex"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Extracted from emails (UpcomingRail)</TooltipContent>
        </Tooltip>
      </div>

      <div className="order-2 flex items-center gap-2 lg:order-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="#who-replies"
              aria-label="3 new sorted threads"
              className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-landing-ink transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink sm:inline-flex"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-landing-accent ring-2 ring-white" />
            </a>
          </TooltipTrigger>
          <TooltipContent>3 new emails sorted this morning</TooltipContent>
        </Tooltip>

        <Link
          to="/login"
          className="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium text-zinc-700 transition-colors hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink"
        >
          Log in
        </Link>

        <button
          type="button"
          disabled={demoLoading !== null}
          onClick={() => onDemoLogin('assistant')}
          className="inline-flex h-11 items-center justify-center rounded-full bg-landing-ink px-4 text-sm font-medium text-landing-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {demoLoading === 'assistant' ? 'Signing in…' : 'Try the demo'}
        </button>
      </div>
    </header>
  );
}

