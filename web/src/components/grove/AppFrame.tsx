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
        'relative min-h-screen w-full overflow-x-clip bg-[var(--canvas-fallback)] p-0 md:bg-cover md:bg-fixed md:bg-center md:px-[80px] md:py-[40px] md:[background-image:var(--canvas-image)]',
        className
      )}
    >
      <div
        className={cn(
          'relative z-10 flex min-h-screen w-full flex-col overflow-hidden bg-[var(--frame-bg)] backdrop-blur-xl md:min-h-[calc(100vh-80px)] md:rounded-[28px] md:border md:border-[var(--frame-border)] md:shadow-[var(--frame-shadow)]',
          frameClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

