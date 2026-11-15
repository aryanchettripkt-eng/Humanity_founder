import { cn } from '@/lib/utils';

const AVATAR_TONES = [
  'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-500/30',
  'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30',
  'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/30',
  'bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/30',
  'bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/30',
];

function toneForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

type AvatarProps = {
  name: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'pastel' | 'ink';
  className?: string;
};

export function Avatar({
  name,
  initials,
  size = 'md',
  tone = 'pastel',
  className,
}: AvatarProps) {
  const sizeClass =
    size === 'sm'
      ? 'h-6 w-6 text-xs'
      : size === 'lg'
        ? 'h-11 w-11 text-sm'
        : 'h-10 w-10 text-xs';

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold',
        sizeClass,
        tone === 'ink'
          ? 'border-accent-lime bg-ink text-ink-foreground'
          : toneForName(name),
        className
      )}
    >
      {initials}
    </span>
  );
}

type AvatarStackProps = {
  items: Array<{ name: string; initials: string }>;
  label: string;
  tone?: 'pastel' | 'ink';
};

export function AvatarStack({ items, label, tone = 'ink' }: AvatarStackProps) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 -space-x-1.5">
      {items.map((item) => (
        <Avatar
          key={`${item.name}-${item.initials}`}
          name={item.name}
          initials={item.initials}
          size="sm"
          tone={tone}
          className="ring-2 ring-accent-lime"
        />
      ))}
    </div>
  );
}

