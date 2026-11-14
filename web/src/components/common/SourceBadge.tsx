import { cn } from '@/lib/utils';

type SourceBadgeProps = {
  source?: 'gmail' | 'demo' | 'seed' | 'simulated';
  className?: string;
};

export function SourceBadge({ source = 'demo', className }: SourceBadgeProps) {
  const isLive = source === 'gmail';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        isLive
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-border bg-surface text-muted-foreground',
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-success' : 'bg-muted-foreground/60')}
      />
      <span>{isLive ? 'Live' : 'Demo'}</span>
    </span>
  );
}

