import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AppFrameProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
};

export function AppFrame({ children, className, frameClassName }: AppFrameProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen w-full overflow-x-clip bg-background p-0 md:p-6',
        className
      )}
    >
      {/* Decorative canvas circles behind the frame (DESIGN_V2 §1) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 -top-24 hidden h-[420px] w-[420px] rounded-full border border-white/40 md:block dark:border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-32 -right-20 hidden h-[500px] w-[500px] rounded-full border border-white/40 md:block dark:border-white/10"
      />

      <div
        className={cn(
          'relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col overflow-hidden bg-surface shadow-[0_24px_60px_-24px_rgba(30,31,28,0.22)] md:min-h-[calc(100vh-3rem)] md:rounded-[28px]',
          frameClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

