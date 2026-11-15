import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'pill';
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', variant = 'default', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        variant === 'pill'
          ? 'flex h-[52px] w-full rounded-full border border-[var(--card-glass-border)] bg-[var(--card-glass-bg)] px-6 text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-bg)] dark:focus-visible:ring-[var(--grove-lime)] disabled:cursor-not-allowed disabled:opacity-50'
          : 'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

