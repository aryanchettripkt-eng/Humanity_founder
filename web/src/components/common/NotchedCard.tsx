import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NotchedCardProps = {
  tone?: 'default' | 'soft' | 'lime';
  selected?: boolean;
  notch?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function NotchedCard({
  tone = 'default',
  selected = false,
  notch,
  children,
  className,
}: NotchedCardProps) {
  return (
    <article
      className={cn(
        'relative flex w-full flex-1 flex-col rounded-[24px] p-5 transition-all duration-200',
        tone === 'lime' && 'bg-accent-lime text-accent-lime-foreground',
        tone === 'soft' &&
          (selected
            ? 'border border-foreground/40 bg-card shadow-sm'
            : 'border border-border bg-card/80 hover:bg-card'),
        tone === 'default' &&
          (selected
            ? 'border border-foreground/40 bg-card shadow-sm'
            : 'border border-border bg-card'),
        className
      )}
    >
      {notch && (
        <div className="absolute -right-px -top-px rounded-bl-[24px] bg-background pb-1.5 pl-1.5">
          {notch}
        </div>
      )}
      {children}
    </article>
  );
}

