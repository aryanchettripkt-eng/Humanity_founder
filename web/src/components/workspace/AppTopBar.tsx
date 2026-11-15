import { MailCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PillBar, type PillBarSlot } from '@/components/common/PillBar';
import { cn } from '@/lib/utils';

type AppTopBarProps = {
  logoHref?: string;
  dateLabel: string;
  slots: PillBarSlot[];
  emptyText?: string;
  nowTime?: string;
  nowPercent?: number;
  scheduleActionHref?: string;
  scheduleActionLabel?: string;
  scheduleActionTooltip?: string;
  scheduleActionSlot?: ReactNode;
  actions: ReactNode;
  className?: string;
};

export function AppTopBar({
  logoHref = '/',
  dateLabel,
  slots,
  emptyText = 'No dates in the next 48 hours',
  nowTime,
  nowPercent,
  scheduleActionHref,
  scheduleActionLabel,
  scheduleActionTooltip,
  scheduleActionSlot,
  actions,
  className,
}: AppTopBarProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 py-2 lg:min-h-[72px] lg:flex-nowrap',
        className
      )}
    >
      <Link
        to={logoHref}
        className="order-1 inline-flex min-h-[44px] items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight text-foreground">
          Relay
        </span>
      </Link>

      <PillBar
        ariaLabel="Extracted schedule"
        dateLabel={dateLabel}
        slots={slots}
        emptyText={emptyText}
        nowTime={nowTime}
        nowPercent={nowPercent}
        actionHref={scheduleActionHref}
        actionLabel={scheduleActionLabel}
        actionTooltip={scheduleActionTooltip}
        actionSlot={scheduleActionSlot}
        className="order-3 lg:order-2 lg:mx-3 lg:w-auto lg:flex-1"
      />

      <div className="order-2 flex items-center gap-2 lg:order-3">{actions}</div>
    </header>
  );
}

