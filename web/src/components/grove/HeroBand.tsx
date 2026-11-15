import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type HeroBandProps = {
  size?: 'tall' | 'short' | 'split';
  nav?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  bottom?: ReactNode;
  className?: string;
};

export function HeroBand({
  size = 'tall',
  nav,
  left,
  right,
  bottom,
  className,
}: HeroBandProps) {
  const heightClass =
    size === 'short'
      ? 'min-h-[120px]'
      : size === 'split'
        ? 'min-h-[380px] h-full'
        : '';

  return (
    <section
      className={cn(
        'relative w-full shrink-0 text-[var(--fg)]',
        heightClass,
        className
      )}
    >
      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-between gap-5 p-[clamp(16px,2.5vw,32px)]',
          size === 'short' && 'pb-4'
        )}
      >
        {nav ? <div>{nav}</div> : null}

        {(left || right) ? (
          <div className="grid grid-cols-1 items-end gap-5 xl:grid-cols-[1.15fr_1fr]">
            <div className="min-w-0">{left}</div>
            {right ? <div className="min-w-0">{right}</div> : null}
          </div>
        ) : null}

        {bottom ? <div>{bottom}</div> : null}
      </div>
    </section>
  );
}

