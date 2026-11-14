import { cn } from '@/lib/utils';

type KbdHintProps = {
  keys: string;
  className?: string;
};

export function KbdHint({ keys, className }: KbdHintProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground',
        className
      )}
    >
      {keys}
    </kbd>
  );
}

