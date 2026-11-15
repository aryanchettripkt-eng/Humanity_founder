import { useState } from 'react';
import { GlassCard } from '@/components/grove/GlassCard';
import type { GroveBarDayModel } from '@/components/grove/models';
import { getOwnerShortLabel, OWNER_META } from '@/lib/owners';
import type { Owner } from '@/types/api';

export type StackedBarsProps = {
  title?: string;
  clientName?: string;
  days: GroveBarDayModel[];
  actionHref?: string;
  onSelectOwner?: (owner: Exclude<Owner, 'review'>) => void;
  className?: string;
};

export function StackedBars({
  title = 'This week',
  clientName = 'client',
  days,
  actionHref,
  onSelectOwner,
  className,
}: StackedBarsProps) {
  const [hovered, setHovered] = useState<GroveBarDayModel | null>(null);
  const maxTotal = Math.max(
    1,
    ...days.map((d) => d.assistant + d.client + d.none)
  );

  const assistantLabel = getOwnerShortLabel('assistant', clientName);
  const clientLabel = getOwnerShortLabel('client', clientName);
  const noneLabel = getOwnerShortLabel('none', clientName);

  return (
    <GlassCard
      title={title}
      actionHref={actionHref}
      actionLabel="Open Inbox"
      rightSlot={
        <div className="hidden items-center gap-2 text-[11px] font-medium text-[var(--glass-muted)] sm:flex">
          <button
            type="button"
            onClick={() => onSelectOwner?.('assistant')}
            className="inline-flex min-h-[44px] items-center gap-1 px-1.5 hover:text-[var(--glass-fg)]"
          >
            <span
              className="h-2 w-2 rounded-full ring-1 ring-[var(--glass-border)]"
              style={{ backgroundColor: OWNER_META.assistant.chartColor }}
            />
            {assistantLabel}
          </button>
          <button
            type="button"
            onClick={() => onSelectOwner?.('client')}
            className="inline-flex min-h-[44px] items-center gap-1 px-1.5 hover:text-[var(--glass-fg)]"
          >
            <span
              className="h-2 w-2 rounded-full ring-1 ring-[var(--glass-border)]"
              style={{ backgroundColor: OWNER_META.client.chartColor }}
            />
            {clientLabel}
          </button>
          <button
            type="button"
            onClick={() => onSelectOwner?.('none')}
            className="inline-flex min-h-[44px] items-center gap-1 px-1.5 hover:text-[var(--glass-fg)]"
          >
            <span
              className="h-2 w-2 rounded-full ring-1 ring-[var(--glass-border)]"
              style={{ backgroundColor: OWNER_META.none.chartColor }}
            />
            {noneLabel}
          </button>
        </div>
      }
      className={className}
    >
      <div className="flex flex-col justify-between gap-2">
        <div aria-live="polite" className="min-h-[16px] text-[11px] font-medium text-[var(--glass-muted)]">
          {hovered ? (
            <span>
              {hovered.label}: {hovered.assistant} {assistantLabel.toLowerCase()} ·{' '}
              {hovered.client} {clientLabel.toLowerCase()} · {hovered.none}{' '}
              {noneLabel.toLowerCase()}
            </span>
          ) : (
            <span>Sorted threads across the last 7 days</span>
          )}
        </div>

        <svg
          viewBox={`0 0 ${Math.max(1, days.length) * 44} 126`}
          className="h-32 w-full overflow-visible"
          role="img"
          aria-label="Weekly sorted threads stacked bar chart"
        >
          {days.map((day, i) => {
            const x = i * 44 + 6;
            const barW = 32;
            const maxH = 102;
            const total = day.assistant + day.client + day.none;
            const scale = total > 0 ? maxH / maxTotal : 0;

            const hAssistant = day.assistant * scale;
            const hClient = day.client * scale;
            const hNone = day.none * scale;

            const yAssistant = 106 - hAssistant;
            const yClient = yAssistant - hClient;
            const yNone = yClient - hNone;

            return (
              <g
                key={day.key}
                tabIndex={0}
                role="button"
                aria-label={`${day.label}: ${day.assistant} ${assistantLabel}, ${day.client} ${clientLabel}, ${day.none} ${noneLabel}`}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(day)}
                onBlur={() => setHovered(null)}
                className="cursor-pointer focus:outline-none"
              >
                {hNone > 0 ? (
                  <rect
                    x={x}
                    y={yNone}
                    width={barW}
                    height={Math.max(3, hNone - 1.5)}
                    rx={5}
                    fill={OWNER_META.none.chartColor}
                    onClick={() => onSelectOwner?.('none')}
                  />
                ) : null}
                {hClient > 0 ? (
                  <rect
                    x={x}
                    y={yClient}
                    width={barW}
                    height={Math.max(3, hClient - 1.5)}
                    rx={5}
                    fill={OWNER_META.client.chartColor}
                    onClick={() => onSelectOwner?.('client')}
                  />
                ) : null}
                {hAssistant > 0 ? (
                  <rect
                    x={x}
                    y={yAssistant}
                    width={barW}
                    height={Math.max(3, hAssistant)}
                    rx={5}
                    fill={OWNER_META.assistant.chartColor}
                    onClick={() => onSelectOwner?.('assistant')}
                  />
                ) : null}
                {total === 0 ? (
                  <rect
                    x={x}
                    y={100}
                    width={barW}
                    height={6}
                    rx={3}
                    fill="var(--chart-empty)"
                  />
                ) : null}
                <text
                  x={x + barW / 2}
                  y={122}
                  textAnchor="middle"
                  fill="var(--glass-muted)"
                  fontSize="10"
                  fontWeight="500"
                >
                  {day.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </GlassCard>
  );
}
