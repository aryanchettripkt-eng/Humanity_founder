import { cn } from '@/lib/utils';

export type SparklineProps = {
  values: number[];
  tone?: 'olive' | 'ink';
  label?: string;
  className?: string;
};

export function Sparkline({
  values,
  tone = 'olive',
  label = '14-day message activity',
  className,
}: SparklineProps) {
  const pts = values.length > 1 ? values : [0, ...values, 0];
  const min = Math.min(...pts);
  const max = Math.max(...pts, min + 1);
  const width = 76;
  const height = 24;

  const coords = pts
    .map((v, idx) => {
      const x = (idx / Math.max(1, pts.length - 1)) * width;
      const y = height - 3 - ((v - min) / (max - min)) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-6 w-[76px] shrink-0 overflow-visible', className)}
      role="img"
      aria-label={label}
    >
      <polyline
        fill="none"
        stroke={tone === 'olive' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

