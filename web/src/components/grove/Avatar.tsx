import { cn } from '@/lib/utils';

export type AvatarProps = {
  name?: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'glass' | 'ink' | 'surface';
  className?: string;
};

export function Avatar({
  initials,
  size = 'md',
  tone = 'glass',
  className,
}: AvatarProps) {
  const sizeClass =
    size === 'sm'
      ? 'h-7 w-7 text-[11px]'
      : size === 'lg'
        ? 'h-10 w-10 text-xs'
        : 'h-8 w-8 text-xs';

  const toneClass =
    tone === 'ink'
      ? 'bg-ink text-ink-foreground border-ink-line'
      : tone === 'surface'
        ? 'bg-surface text-foreground border-border'
        : 'bg-[var(--avatar-tile-bg)] text-[var(--avatar-tile-fg)] border-[var(--glass-border)]';

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold',
        sizeClass,
        toneClass,
        className
      )}
    >
      {initials}
    </span>
  );
}

export type AvatarTileProps = {
  initials: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function AvatarTile({ initials, size = 'md', className }: AvatarTileProps) {
  return (
    <span
      aria-hidden="true"
      style={{ borderRadius: 'var(--avatar-tile-radius)' }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-[var(--avatar-tile-bg)] font-display font-semibold text-[var(--avatar-tile-fg)]',
        size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm',
        className
      )}
    >
      {initials}
    </span>
  );
}

