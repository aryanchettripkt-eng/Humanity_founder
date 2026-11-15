import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { revealDelay } from '@/lib/motion';

export type AuthLayoutProps = {
  headline?: string;
  subline?: string;
  children: ReactNode;
};

function RelayBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--logo-bg)] text-[var(--logo-fg)] shadow-sm">
        <Mail className="h-5 w-5" aria-hidden="true" />
      </div>
      <span
        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}
        className="font-display text-[24px] font-semibold leading-none tracking-tight text-white"
      >
        Relay
      </span>
    </div>
  );
}

const glassCardClasses =
  'rounded-[var(--frame-radius)] border border-[var(--frame-border)] bg-[rgba(250,250,247,0.78)] shadow-[var(--frame-shadow)] [backdrop-filter:var(--frame-glass-blur)] [-webkit-backdrop-filter:var(--frame-glass-blur)] dark:bg-[var(--frame-glass-bg)]';

export function AuthLayout({ headline, subline, children }: AuthLayoutProps) {
  const hasHero = Boolean(headline);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        aria-hidden="true"
        data-canvas=""
        style={{
          backgroundColor: 'var(--canvas-fallback)',
          backgroundImage: 'var(--canvas-image)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
        className="pointer-events-none fixed inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        data-canvas-overlay=""
        style={{ backgroundColor: 'var(--canvas-overlay)' }}
        className="pointer-events-none fixed inset-0 -z-10"
      />

      <div className="grove-scroll relative z-10 h-full w-full overflow-y-auto">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1200px] items-center justify-center px-4 py-8 md:px-8 lg:px-10">
          {hasHero ? (
            <div className="grid w-full items-center gap-8 md:grid-cols-[minmax(0,1fr)_420px] md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(480px,520px)] lg:gap-16 xl:gap-24">
              <div data-reveal="" style={revealDelay(0)} className="max-w-[520px] space-y-5">
                <RelayBrand />
                <div className="space-y-3">
                  <h1
                    style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}
                    className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-[40px] lg:text-[clamp(40px,5vw,64px)]"
                  >
                    {headline}
                  </h1>
                  {subline ? (
                    <p
                      style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}
                      className="text-[16px] leading-[1.5] text-white/80 md:text-[18px]"
                    >
                      {subline}
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                data-reveal=""
                style={revealDelay(1)}
                className={`${glassCardClasses} w-full p-6 md:w-[420px] md:px-9 md:py-10 lg:w-full lg:px-14 lg:py-12`}
              >
                {children}
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-[480px] flex-col items-center gap-6">
              <div data-reveal="" style={revealDelay(0)}>
                <RelayBrand />
              </div>
              <div
                data-reveal=""
                style={revealDelay(1)}
                className={`${glassCardClasses} w-full p-6 md:px-10 md:py-10`}
              >
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
