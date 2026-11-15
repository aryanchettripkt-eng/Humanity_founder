import { ArrowUpRight } from 'lucide-react';
import { ConfidenceMeter } from '@/components/common/ConfidenceMeter';
import { NotchedCard } from '@/components/common/NotchedCard';
import { OwnerPill } from '@/components/common/OwnerPill';
import { SourceBadge } from '@/components/common/SourceBadge';
import { Avatar } from '@/components/workspace/Avatar';
import type { PersonCardModel } from '@/components/workspace/models';
import { cn } from '@/lib/utils';
import type { Owner } from '@/types/api';

type QuickAssignOption = {
  owner: Exclude<Owner, 'review'>;
  keyHint: string;
  label: string;
};

const QUICK_ASSIGN_OPTIONS: QuickAssignOption[] = [
  { owner: 'assistant', keyHint: '1', label: 'Assistant' },
  { owner: 'client', keyHint: '2', label: 'Client' },
  { owner: 'none', keyHint: '3', label: 'No reply' },
];

export type PersonCardProps = {
  item: PersonCardModel;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (item: PersonCardModel) => void;
  onQuickAssign?: (id: string, owner: Exclude<Owner, 'review'>) => void;
  assigningOwner?: Owner | null;
  className?: string;
};

export function PersonCard({
  item,
  selected = false,
  onSelect,
  onOpen,
  onQuickAssign,
  assigningOwner = null,
  className,
}: PersonCardProps) {
  const showAssign = Boolean(item.showQuickAssign && item.owner === 'review' && onQuickAssign);

  return (
    <NotchedCard
      selected={selected}
      className={cn(
        'flex w-full min-w-0 flex-1 flex-col justify-between p-4 transition-colors',
        onSelect && 'cursor-pointer',
        className
      )}
      notch={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpen) {
              onOpen(item);
            } else {
              onSelect?.(item.id);
            }
          }}
          aria-label={`Open ${item.name}`}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-surface text-foreground hover:bg-muted'
          )}
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      }
    >
      <div
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={() => onSelect?.(item.id)}
        onKeyDown={(e) => {
          if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect(item.id);
          }
        }}
        className="flex flex-1 flex-col justify-between gap-3 outline-none"
      >
        <div className="pr-10">
          <Avatar initials={item.initials} name={item.name} size="md" />
          <h3 className="mt-3 truncate font-display text-base font-bold tracking-tight text-foreground">
            {item.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.subtitle}
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          {showAssign ? (
            <div
              className="grid grid-cols-3 gap-1 rounded-full border border-border bg-muted/50 p-1"
              onClick={(e) => e.stopPropagation()}
            >
              {QUICK_ASSIGN_OPTIONS.map((opt) => {
                const isBusy = assigningOwner === opt.owner;
                return (
                  <button
                    key={opt.owner}
                    type="button"
                    disabled={Boolean(assigningOwner)}
                    onClick={() => onQuickAssign?.(item.id, opt.owner)}
                    className="flex h-7 items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                      {opt.keyHint}
                    </span>
                    <span className="truncate">{isBusy ? '...' : opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Source
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <SourceBadge source={item.source} />
                {item.category ? (
                  <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                    {item.category}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <OwnerPill owner={item.owner} source={item.ownerSource} />
              <ConfidenceMeter value={item.confidence} />
            </div>
          </div>
        </div>
      </div>
    </NotchedCard>
  );
}
