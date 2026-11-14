import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-md focus:outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

