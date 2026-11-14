import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OWNER_META, OWNER_ORDER } from '@/lib/owners';
import { cn } from '@/lib/utils';
import type { Owner } from '@/types/api';
import { KbdHint } from './KbdHint';

type OwnerPopoverProps = {
  current: Owner;
  senderEmail?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (owner: Owner, remember: 'sender' | 'domain' | null) => void;
  children: ReactNode;
};

export function OwnerPopover({
  current,
  senderEmail,
  open: controlledOpen,
  onOpenChange,
  onSelect,
  children,
}: OwnerPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [rememberSender, setRememberSender] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const handleChoose = (owner: Owner) => {
    const remember = rememberSender && owner !== 'review' ? 'sender' : null;
    onSelect(owner, remember);
    setRememberSender(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          const match = OWNER_ORDER.find((o) => OWNER_META[o].shortcut === e.key);
          if (match) {
            e.preventDefault();
            handleChoose(match);
          }
        }}
      >
        <div className="mb-1.5 px-2 pt-1 text-xs font-medium text-muted-foreground">
          Who needs to reply?
        </div>
        <div className="space-y-0.5">
          {OWNER_ORDER.map((owner) => {
            const meta = OWNER_META[owner];
            const Icon = meta.icon;
            const selected = current === owner;
            return (
              <button
                key={owner}
                type="button"
                onClick={() => handleChoose(owner)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface',
                  selected && 'bg-surface'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    meta.pillClass
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{meta.label}</span>
                    <div className="flex items-center gap-1.5">
                      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      <KbdHint keys={meta.shortcut} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {senderEmail && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 border-t border-border px-2 pt-2.5 pb-1 text-xs text-muted-foreground">
            <Checkbox
              checked={rememberSender}
              onCheckedChange={(v) => setRememberSender(Boolean(v))}
            />
            <span className="truncate">Always do this for {senderEmail}</span>
          </label>
        )}
      </PopoverContent>
    </Popover>
  );
}

