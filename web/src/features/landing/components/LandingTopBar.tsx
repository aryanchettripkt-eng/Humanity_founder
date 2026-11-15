import { MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PillBar } from '@/components/common/PillBar';
import {
  SCHEDULE_DATE,
  SCHEDULE_NOW_PERCENT,
  SCHEDULE_NOW_TIME,
  SCHEDULE_SLOTS,
} from '@/features/landing/sampleData';

type LandingTopBarProps = {
  demoLoading: 'assistant' | 'client' | null;
  onDemoLogin: (role: 'assistant' | 'client') => void;
};

export function LandingTopBar({ demoLoading, onDemoLogin }: LandingTopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pb-6 lg:flex-nowrap">
      <Link
        to="/"
        className="order-1 inline-flex min-h-[44px] items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">Relay</span>
      </Link>

      <PillBar
        ariaLabel="Today's extracted schedule"
        dateLabel={SCHEDULE_DATE}
        slots={SCHEDULE_SLOTS}
        nowTime={SCHEDULE_NOW_TIME}
        nowPercent={SCHEDULE_NOW_PERCENT}
        actionHref="#your-day"
        actionLabel="Jump to Your day tasks"
        actionTooltip="Extracted from emails (UpcomingRail)"
        className="order-3 lg:order-2 lg:mx-4 lg:w-auto lg:flex-1"
      />

      <div className="order-2 flex items-center gap-2 lg:order-3">
        <Link
          to="/login"
          className="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Log in
        </Link>

        <button
          type="button"
          disabled={demoLoading !== null}
          onClick={() => onDemoLogin('assistant')}
          className="hidden h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:inline-flex"
        >
          {demoLoading === 'assistant' ? 'Signing in…' : 'Try the demo'}
        </button>
      </div>
    </header>
  );
}
