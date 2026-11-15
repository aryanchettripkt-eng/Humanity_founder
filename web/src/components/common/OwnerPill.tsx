import { Bot, Check, SlidersHorizontal, Sparkles } from 'lucide-react';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';
import type { Owner, OwnerSource } from '@/types/api';

export type OwnerPillProps = {
  owner: Owner;
  source?: OwnerSource;
  label?: string;
  size?: 'sm' | 'md';
  loading?: boolean;
  interactive?: boolean;
  hideLabelOnSmall?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

const SOURCE_ICON: Partial<Record<OwnerSource, { icon: typeof Bot; label: string }>> = {
  rule: { icon: SlidersHorizontal, label: 'Set by rule' },
  manual: { icon: Check, label: 'Set manually' },
  client: { icon: Sparkles, label: 'Set by client' },
};

export function OwnerPill({
  owner,
  source,
  label,
  size = 'sm',
  loading = false,
  interactive = false,
  hideLabelOnSmall = false,
  className,
  onClick,
}: OwnerPillProps) {
  const meta = OWNER_META[owner] ?? OWNER_META.review;
  const Icon = meta.icon;
  const sourceInfo = source ? SOURCE_ICON[source] : undefined;
  const SourceIcon = sourceInfo?.icon;

  if (loading) {
    return (
      <span
        aria-label="Classifying owner"
        className={cn(
          'inline-flex items-center rounded-full border border-border bg-surface animate-pulse',
          size === 'sm' ? 'h-5 w-16' : 'h-7 w-24',
          className
        )}
      />
    );
  }

  const content = (
    <>
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', 'shrink-0')} />
      <span className={cn(hideLabelOnSmall && 'hidden sm:inline')}>{label ?? meta.label}</span>
      {SourceIcon && (
        <span title={sourceInfo.label} className="opacity-70">
          <SourceIcon className="h-2.5 w-2.5" />
        </span>
      )}
    </>
  );

  const classes = cn(
    'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none transition-colors duration-150 select-none',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
    meta.pillClass,
    interactive && 'cursor-pointer hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className
  );

  if (interactive) {
    return (
      <button
        type="button"
        aria-label={`Reply owner: ${meta.label}. Click to change`}
        onClick={onClick}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return (
    <span aria-label={`Reply owner: ${meta.label}`} className={classes}>
      {content}
    </span>
  );
}

