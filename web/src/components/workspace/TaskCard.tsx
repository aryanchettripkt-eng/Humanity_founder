import { useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Clock,
  Crown,
  Mail,
  Sparkles,
} from 'lucide-react';
import { NotchedCard } from '@/components/common/NotchedCard';
import { Avatar, AvatarStack } from '@/components/workspace/Avatar';
import type { TaskCardModel } from '@/components/workspace/models';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  calendar: Calendar,
  sparkles: Sparkles,
  crown: Crown,
  clock: Clock,
} as const;

export type TaskCardProps = {
  item: TaskCardModel;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (item: TaskCardModel) => void;
  onPrimaryAction?: (item: TaskCardModel) => void;
  onStatusChange?: (item: TaskCardModel, statusId: string) => void;
  className?: string;
};

export function TaskCard({
  item,
  selected = false,
  onSelect,
  onOpen,
  onPrimaryAction,
  onStatusChange,
  className,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const TileIcon = ICON_MAP[item.iconKind] ?? Mail;
  const hasMenu = Boolean(item.statusOptions && item.statusOptions.length > 0 && onStatusChange);

  return (
    <NotchedCard
      tone={item.highlighted ? 'lime' : 'default'}
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
          aria-label={`Open ${item.title}`}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
            item.highlighted
              ? 'border-zinc-900/15 bg-white text-zinc-950 hover:bg-zinc-100'
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
        className="flex flex-1 flex-col justify-between gap-4 outline-none"
      >
        <div className="flex items-center gap-2.5 pr-10">
          <Avatar initials={item.initials} name={item.person} size="sm" />
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-xs font-semibold',
                item.highlighted ? 'text-zinc-950' : 'text-foreground'
              )}
            >
              {item.person}
            </p>
            <p
              className={cn(
                'truncate text-[11px]',
                item.highlighted ? 'text-zinc-700' : 'text-muted-foreground'
              )}
            >
              {item.role}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              item.highlighted
                ? 'bg-zinc-950/10 text-zinc-950'
                : 'bg-muted text-foreground'
            )}
          >
            <TileIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3
              className={cn(
                'line-clamp-2 font-display text-sm font-bold leading-snug tracking-tight',
                item.highlighted ? 'text-zinc-950' : 'text-foreground'
              )}
            >
              {item.title}
            </h3>
            {item.dateLabel || (item.avatars && item.avatars.length > 0) ? (
              <div className="mt-1.5 flex items-center gap-2">
                {item.avatars && item.avatars.length > 0 ? (
                  <AvatarStack
                    items={item.avatars.slice(0, 3).map((initials) => ({ name: initials, initials }))}
                    label={`${item.title} participants`}
                  />
                ) : null}
                {item.dateLabel ? (
                  <span
                    className={cn(
                      'truncate text-[11px] font-medium',
                      item.highlighted ? 'text-zinc-800' : 'text-muted-foreground'
                    )}
                  >
                    {item.dateLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-2 pt-1">
          {hasMenu ? (
            <div className="relative min-w-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                className={cn(
                  'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
                  item.highlighted
                    ? 'border-zinc-950/15 bg-white/80 text-zinc-950 hover:bg-white'
                    : 'border-border bg-muted/60 text-foreground hover:bg-muted'
                )}
              >
                <span className="truncate">{item.statusLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute bottom-10 left-0 z-20 min-w-[150px] rounded-2xl border border-border bg-surface p-1 shadow-lg"
                >
                  {item.statusOptions?.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange?.(item, opt.id);
                      }}
                      className="flex w-full items-center rounded-xl px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <span
              className={cn(
                'inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium',
                item.highlighted
                  ? 'border-zinc-950/15 bg-white/80 text-zinc-950'
                  : 'border-border bg-muted/60 text-foreground'
              )}
            >
              {item.statusLabel}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction?.(item);
            }}
            aria-label={item.primaryLabel}
            title={item.primaryLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition-transform hover:scale-105"
          >
            <Mail className="h-4 w-4" />
          </button>
        </div>
      </div>
    </NotchedCard>
  );
}
