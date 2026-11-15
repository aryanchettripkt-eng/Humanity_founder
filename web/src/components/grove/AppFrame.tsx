import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AppFrameProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
};

export function AppFrame({ children, className, frameClassName }: AppFrameProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-x-clip', className)}>
      <div
        aria-hidden="true"
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
        style={{ backgroundColor: 'var(--canvas-overlay)' }}
        className="pointer-events-none fixed inset-0 -z-10"
      />
      <div className={cn('relative z-10 flex min-h-screen w-full flex-col', frameClassName)}>
        {children}
      </div>
    </div>
  );
}

