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
      ? 'min-h-[180px] md:min-h-[200px]'
      : size === 'split'
        ? 'min-h-[380px] h-full'
        : 'min-h-[320px] md:min-h-[360px]';

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden text-[var(--hero-fg)]',
        heightClass,
        className
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 px-[clamp(16px,8.5vw,160px)] pb-7 pt-4">
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

