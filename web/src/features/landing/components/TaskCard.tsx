import { ArrowUpRight, Bell, CalendarDays, ChevronDown, Crown, Send, Sparkles } from 'lucide-react';
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
      return <CalendarDays className="h-5 w-5 text-landing-ink" aria-hidden="true" />;
    }
    if (task.actionKind === 'send') {
      return <Sparkles className="h-5 w-5 text-landing-ink" aria-hidden="true" />;
    }
    return <Crown className="h-5 w-5 text-landing-ink" aria-hidden="true" />;
  };

  return (
    <article
      className={cn(
        'relative flex min-h-[214px] min-w-[276px] snap-start flex-col justify-between rounded-[28px] p-5 sm:min-w-0',
        isLime
          ? 'bg-landing-accent text-landing-accent-foreground'
          : 'border border-zinc-200/80 bg-white text-landing-ink'
      )}
    >
      <div className="absolute -right-px -top-px flex items-center gap-1.5 rounded-bl-[24px] bg-landing-surface pb-1.5 pl-1.5">
        <button
          type="button"
          onClick={onTryDemo}
          aria-label={`Reminder for ${task.title}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-landing-ink transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onTryDemo}
          aria-label={`Open ${task.title} in live demo`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-landing-ink transition-colors hover:bg-landing-ink hover:text-landing-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 pr-24">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            isLime
              ? 'bg-landing-ink text-landing-ink-foreground'
              : 'border border-zinc-200 bg-zinc-100 text-landing-ink'
          )}
        >
          {task.personInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{task.person}</p>
          <p
            className={cn(
              'truncate text-xs',
              isLime ? 'text-landing-ink/75' : 'text-zinc-600'
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
            isLime ? 'bg-white/85' : 'bg-zinc-100'
          )}
        >
          {renderTitleTile()}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight tracking-tight">{task.title}</h3>
          {task.timeLabel && (
            <div className="mt-1.5 flex items-center gap-2">
              {task.avatars && (
                <div className="flex -space-x-1.5">
                  {task.avatars.map((av) => (
                    <span
                      key={av}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-landing-accent bg-landing-ink text-[9px] font-semibold text-landing-ink-foreground"
                    >
                      {av}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-xs font-medium text-landing-ink/80 tabular-nums">
                {task.timeLabel}
              </span>
            </div>
          )}
          {task.subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">{task.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onTryDemo}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink',
            isLime
              ? 'bg-white/75 text-landing-ink hover:bg-white'
              : 'border border-zinc-200 bg-zinc-50 text-landing-ink hover:bg-zinc-100'
          )}
        >
          <span className="truncate">{task.statusLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onTryDemo}
          aria-label={task.statusLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-landing-ink text-landing-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2"
        >
          {renderActionIcon()}
        </button>
      </div>
    </article>
  );
}

