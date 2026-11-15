import { cn } from '@/lib/utils';

const AVATAR_TONES = [
  'bg-emerald-900/20 text-white border-white/30',
  'bg-stone-800/40 text-white border-white/30',
  'bg-amber-900/30 text-white border-white/30',
  'bg-teal-900/30 text-white border-white/30',
];

function toneIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_TONES.length;
}

export type AvatarProps = {
  name: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'glass' | 'ink' | 'surface';
  className?: string;
};

export function Avatar({
  name,
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
        : AVATAR_TONES[toneIndex(name)];

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
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-ink font-display font-semibold text-ink-foreground',
        size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm',
        className
      )}
    >
      {initials}
    </span>
  );
}

