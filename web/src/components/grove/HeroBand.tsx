import { useState, type ReactNode } from 'react';
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
  const [imgFailed, setImgFailed] = useState(false);

  const heightClass =
    size === 'short'
      ? 'min-h-[210px] md:min-h-[220px]'
      : size === 'split'
        ? 'min-h-[380px] h-full'
        : 'min-h-[320px] md:min-h-[380px]';

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden text-white',
        heightClass,
        className
      )}
    >
      {/* Layered moss / stone / mist CSS fallback (DESIGN_V2 §1) */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 90% at 15% 15%, #55644C 0%, transparent 55%), radial-gradient(95% 85% at 88% 20%, #7C8771 0%, transparent 52%), radial-gradient(100% 90% at 60% 95%, #384434 0%, transparent 60%), linear-gradient(135deg, #434E3D 0%, #6A7262 48%, #2E372B 100%)',
        }}
      />

      {/* Optional nature hero image */}
      {!imgFailed ? (
        <img
          src="/hero/grove.webp"
          alt=""
          aria-hidden="true"
          {...({ fetchpriority: 'high' } as Record<string, string>)}
          onError={() => setImgFailed(true)}
          className="motion-safe:animate-[heroZoom_1.2s_ease-out_forwards] absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* Top 20% dark gradient for nav contrast; 45% overlay in dark mode */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/25 dark:bg-black/45"
      />

      <div className="relative z-10 flex h-full flex-col justify-between gap-6 px-4 pb-6 pt-4 sm:px-6 md:px-8">
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

