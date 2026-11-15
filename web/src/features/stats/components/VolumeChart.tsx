import { useEffect, useMemo, useRef, useState } from 'react';
import {
  OWNER_SERIES_VAR,
  STATS_OWNER_ORDER,
  type DayBucket,
} from '@/features/stats/mappers';
import type { Owner } from '@/types/api';

type VolumeChartProps = {
  days: DayBucket[];
  ownerLabel: (owner: Owner) => string;
  showTable?: boolean;
};

const H = 220;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;
const PAD_LEFT = 28;
const PAD_RIGHT = 18;
const GAP = 2; // surface gap between stacked segments

/** Round up so the max and the halfway tick are whole numbers. */
export function niceMax(n: number): number {
  if (n <= 4) return 4;
  const step = n <= 10 ? 2 : n <= 20 ? 4 : n <= 50 ? 10 : 20;
  return Math.ceil(n / step) * step;
}

/** Stacked bars by owner, one per day. Legend above, hover tooltip, optional table view. */
export function VolumeChart({ days, ownerLabel, showTable = false }: VolumeChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real pixel width so text and bars are never stretched.
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxW(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [showTable]);
  const maxTotal = useMemo(
    () => niceMax(Math.max(0, ...days.map((d) => STATS_OWNER_ORDER.reduce((s, o) => s + d[o], 0)))),
    [days]
  );

  const W = Math.max(240, boxW);
  const slot = (W - PAD_LEFT - PAD_RIGHT) / days.length;
  const barW = Math.min(28, slot * 0.62);
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotH - (v / maxTotal) * plotH;
  const ticks = [0, maxTotal / 2, maxTotal];
  const labelEvery = Math.max(1, Math.ceil(36 / slot));

  if (showTable) {
    return (
      <div className="grove-scroll max-h-[260px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[var(--fg-muted)]">
            <tr>
              <th className="py-1.5 pr-3 font-medium">Day</th>
              {STATS_OWNER_ORDER.map((o) => (
                <th key={o} className="py-1.5 pr-3 text-right font-medium">
                  {ownerLabel(o)}
                </th>
              ))}
              <th className="py-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="tabular-nums text-[var(--fg)]">
            {days.map((d) => (
              <tr key={d.key} className="border-t border-[var(--glass-divider)]">
                <td className="py-1.5 pr-3">{d.label}</td>
                {STATS_OWNER_ORDER.map((o) => (
                  <td key={o} className="py-1.5 pr-3 text-right">
                    {d[o]}
                  </td>
                ))}
                <td className="py-1.5 text-right font-semibold">
                  {STATS_OWNER_ORDER.reduce((s, o) => s + d[o], 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const hovered = hover !== null ? days[hover] : null;

  return (
    <div ref={boxRef} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block h-[220px] w-full"
        role="img"
        aria-label="Emails per day, stacked by who they are for"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={W - PAD_RIGHT}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--glass-divider)"
              strokeWidth={t === 0 ? 1 : 0.5}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={PAD_LEFT - 6}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--fg-subtle)"
            >
              {t}
            </text>
          </g>
        ))}

        {days.map((d, i) => {
          const cx = PAD_LEFT + slot * i + slot / 2;
          let acc = 0;
          const segs = STATS_OWNER_ORDER.filter((o) => d[o] > 0);
          return (
            <g key={d.key}>
              {/* hit target wider than the bar */}
              <rect
                x={PAD_LEFT + slot * i}
                y={PAD_TOP}
                width={slot}
                height={plotH}
                fill={hover === i ? 'var(--card-glass-bg)' : 'transparent'}
                onMouseEnter={() => setHover(i)}
              />
              {segs.map((o, si) => {
                const y0 = y(acc);
                acc += d[o];
                const y1 = y(acc);
                const isTop = si === segs.length - 1;
                const h = Math.max(0, y0 - y1 - (si > 0 ? GAP : 0));
                return (
                  <path
                    key={o}
                    pointerEvents="none"
                    fill={OWNER_SERIES_VAR[o]}
                    d={
                      isTop && h > 4
                        ? `M${cx - barW / 2},${y1 + h} v${-(h - 4)} q0,-4 4,-4 h${barW - 8} q4,0 4,4 v${h - 4} z`
                        : `M${cx - barW / 2},${y1} h${barW} v${h} h${-barW} z`
                    }
                  />
                );
              })}
              {(days.length - 1 - i) % labelEvery === 0 ? (
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--fg-subtle)"
                >
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {hovered ? (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 min-w-[170px] rounded-2xl border border-[var(--pane-border)] bg-[var(--frame-glass-bg)] p-3 text-xs text-[var(--fg)] shadow-lg backdrop-blur-xl"
          style={{
            left: `clamp(0px, calc(${((PAD_LEFT + slot * (hover ?? 0) + slot / 2) / W) * 100}% - 85px), calc(100% - 170px))`,
          }}
        >
          <p className="mb-1.5 font-semibold">{hovered.label}</p>
          {STATS_OWNER_ORDER.map((o) => (
            <p key={o} className="flex items-center justify-between gap-3 tabular-nums">
              <span className="flex items-center gap-1.5 text-[var(--fg-muted)]">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ background: OWNER_SERIES_VAR[o] }}
                />
                {ownerLabel(o)}
              </span>
              <span>{hovered[o]}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SeriesLegend({ ownerLabel }: { ownerLabel: (owner: Owner) => string }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--fg-muted)]">
      {STATS_OWNER_ORDER.map((o) => (
        <li key={o} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: OWNER_SERIES_VAR[o] }}
          />
          {ownerLabel(o)}
        </li>
      ))}
    </ul>
  );
}
