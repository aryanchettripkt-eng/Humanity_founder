import { ArrowUpRight, CalendarDays, Crown, Send, Sparkles } from 'lucide-react';
import { NotchedCard } from '@/components/common/NotchedCard';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SampleTask } from '@/features/landing/sampleData';
import { cn } from '@/lib/utils';

type TaskCardProps = {
  task: SampleTask;
  onTryDemo: () => void;
};

export function TaskCard({ task, onTryDemo }: TaskCardProps) {
  const isLime = Boolean(task.highlighted);

  const renderActionIcon = () => {
    if (task.actionKind === 'calendar') return <CalendarDays className="h-4 w-4" aria-hidden="true" />;
    if (task.actionKind === 'send') return <Send className="h-4 w-4" aria-hidden="true" />;
    return <Crown className="h-4 w-4" aria-hidden="true" />;
  };

  const renderTitleTile = () => {
    if (task.actionKind === 'calendar') {
      return <CalendarDays className="h-5 w-5 text-foreground" aria-hidden="true" />;
    }
    if (task.actionKind === 'send') {
      return <Sparkles className="h-5 w-5 text-foreground" aria-hidden="true" />;
    }
    return <Crown className="h-5 w-5 text-foreground" aria-hidden="true" />;
  };

  return (
    <NotchedCard
      tone={isLime ? 'lime' : 'default'}
      className="min-h-[214px] justify-between"
      notch={
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onTryDemo}
              aria-label={`Open ${task.title} in live demo`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Opens the live demo</TooltipContent>
        </Tooltip>
      }
    >
      <div className="flex items-center gap-2.5 pr-12">
        <div
          aria-hidden="true"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            isLime
              ? 'bg-ink text-ink-foreground'
              : 'border border-border bg-background text-foreground'
          )}
        >
          {task.personInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{task.person}</p>
          <p
            className={cn(
              'truncate text-xs',
              isLime ? 'text-accent-lime-foreground/80' : 'text-muted-foreground'
            )}
          >
            {task.personRole}
          </p>
        </div>
      </div>

      <div className="my-4 flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
            isLime ? 'bg-card/85' : 'bg-background'
          )}
        >
          {renderTitleTile()}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight tracking-tight">{task.title}</h3>
          {task.timeLabel && (
            <div className="mt-1.5 flex items-center gap-2">
              {task.avatars && (
                <div role="group" aria-label="Participants" className="flex -space-x-1.5">
                  {task.avatars.map((av) => (
                    <span
                      key={av}
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-lime bg-ink text-xs font-semibold text-ink-foreground"
                    >
                      {av}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-xs font-medium opacity-85 tabular-nums">
                {task.timeLabel}
              </span>
            </div>
          )}
          {task.subtitle && (
            <p
              className={cn(
                'mt-1 text-xs leading-relaxed',
                isLime ? 'text-accent-lime-foreground/80' : 'text-muted-foreground'
              )}
            >
              {task.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex h-9 items-center rounded-full px-3.5 text-xs font-medium',
            isLime
              ? 'bg-card/75 text-foreground'
              : 'border border-border bg-background text-foreground'
          )}
        >
          <span className="truncate">{task.statusLabel}</span>
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onTryDemo}
              aria-label={`${task.statusLabel} — opens the live demo`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {renderActionIcon()}
            </button>
          </TooltipTrigger>
          <TooltipContent>Opens the live demo</TooltipContent>
        </Tooltip>
      </div>
    </NotchedCard>
  );
}
