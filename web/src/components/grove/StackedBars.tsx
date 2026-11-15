import { useState } from 'react';
import { GlassCard } from '@/components/grove/GlassCard';
import type { GroveBarDayModel } from '@/components/grove/models';
import type { Owner } from '@/types/api';

export type StackedBarsProps = {
  title?: string;
  days: GroveBarDayModel[];
  actionHref?: string;
  onSelectOwner?: (owner: Exclude<Owner, 'review'>) => void;
  className?: string;
};

export function StackedBars({
  title = 'This week',
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

  return (
    <GlassCard
      title={title}
      actionHref={actionHref}
      actionLabel="Open Inbox"
      rightSlot={
        <div className="hidden items-center gap-2.5 text-[11px] font-medium text-white/85 sm:flex">
          <button
            type="button"
            onClick={() => onSelectOwner?.('assistant')}
            className="inline-flex items-center gap-1 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-[#2F5D3A] ring-1 ring-white/40" />
            For you
          </button>
          <button
            type="button"
            onClick={() => onSelectOwner?.('client')}
            className="inline-flex items-center gap-1 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-[#8C7466] ring-1 ring-white/40" />
            For Priya
          </button>
          <button
            type="button"
            onClick={() => onSelectOwner?.('none')}
            className="inline-flex items-center gap-1 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-[#E8E4DE] ring-1 ring-white/40" />
            No reply
          </button>
        </div>
      }
      className={className}
    >
      <div className="flex flex-col justify-between gap-2">
        <div className="h-4 text-[11px] font-medium text-white/80">
          {hovered ? (
            <span>
              {hovered.label}: {hovered.assistant} for you · {hovered.client} for Priya ·{' '}
              {hovered.none} no reply
            </span>
          ) : (
            <span>Sorted threads across the last 7 days</span>
          )}
        </div>

        <svg
          viewBox={`0 0 ${Math.max(1, days.length) * 44} 112`}
          className="h-28 w-full overflow-visible"
          role="img"
          aria-label="Weekly sorted threads stacked bar chart"
        >
          {days.map((day, i) => {
            const x = i * 44 + 6;
            const barW = 32;
            const maxH = 86;
            const total = day.assistant + day.client + day.none;
            const scale = total > 0 ? maxH / maxTotal : 0;

            const hAssistant = day.assistant * scale;
            const hClient = day.client * scale;
            const hNone = day.none * scale;

            const yAssistant = 92 - hAssistant;
            const yClient = yAssistant - hClient;
            const yNone = yClient - hNone;

            return (
              <g
                key={day.key}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                {hNone > 0 ? (
                  <rect
                    x={x}
                    y={yNone}
                    width={barW}
                    height={Math.max(3, hNone - 1.5)}
                    rx={5}
                    fill="#E8E4DE"
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
                    fill="#8C7466"
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
                    fill="#2F5D3A"
                    onClick={() => onSelectOwner?.('assistant')}
                  />
                ) : null}
                {total === 0 ? (
                  <rect
                    x={x}
                    y={86}
                    width={barW}
                    height={6}
                    rx={3}
                    fill="rgba(255,255,255,0.22)"
                  />
                ) : null}
                <text
                  x={x + barW / 2}
                  y={108}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
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

