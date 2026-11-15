import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { revealDelay } from '@/lib/motion';
import '@/styles/auth.css';

export type AuthLayoutProps = {
  headline?: string;
  subline?: string;
  children: ReactNode;
};

function RelayBrand() {
  return (
    <div className="auth-brand flex items-center">
      <div className="auth-brand-tile flex shrink-0 items-center justify-center bg-[var(--logo-bg)] text-[var(--logo-fg)] shadow-sm">
        <Mail aria-hidden="true" />
      </div>
      <span
        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}
        className="auth-brand-name font-display text-white"
      >
        Relay
      </span>
    </div>
  );
}

const glassCardClasses =
  'auth-card border border-[var(--frame-border)] bg-[rgba(250,250,247,0.78)] shadow-[var(--frame-shadow)] [backdrop-filter:var(--frame-glass-blur)] [-webkit-backdrop-filter:var(--frame-glass-blur)] dark:bg-[var(--frame-glass-bg)]';

export function AuthLayout({ headline, subline, children }: AuthLayoutProps) {
  const hasHero = Boolean(headline);

  return (
    <div className="auth-shell relative h-full w-full overflow-hidden">
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
        <div className="auth-container mx-auto flex min-h-[100dvh] w-full items-center justify-center">
          {hasHero ? (
            <div className="auth-grid grid w-full items-center">
              <div data-reveal="" style={revealDelay(0)} className="auth-hero">
                <RelayBrand />
                <h1
                  style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}
                  className="auth-headline font-display text-white"
                >
                  {headline}
                </h1>
                {subline ? (
                  <p
                    style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}
                    className="auth-subline text-white/85"
                  >
                    {subline}
                  </p>
                ) : null}
              </div>

              <div data-reveal="" style={revealDelay(1)} className={`${glassCardClasses} w-full`}>
                {children}
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-[480px] flex-col items-center gap-6">
              <div data-reveal="" style={revealDelay(0)}>
                <RelayBrand />
              </div>
              <div data-reveal="" style={revealDelay(1)} className={`${glassCardClasses} w-full`}>
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
