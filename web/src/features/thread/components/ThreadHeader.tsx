import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Mail,
  MailOpen,
  PanelRight,
  RefreshCw,
  Reply,
  Star,
} from 'lucide-react';
import { OwnerPill } from '@/components/common/OwnerPill';
import { OwnerPopover } from '@/components/common/OwnerPopover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Owner, ThreadDetail } from '@/types/api';

type ThreadHeaderProps = {
  thread: ThreadDetail;
  aiPanelOpen: boolean;
  reclassifying?: boolean;
  onBack?: () => void;
  onChangeOwner: (owner: Owner, remember: 'sender' | 'domain' | null) => void;
  onToggleStar: () => void;
  onToggleUnread: () => void;
  onArchive: () => void;
  onMarkDone: () => void;
  onReply: () => void;
  onReclassify: () => void;
  onToggleAiPanel: () => void;
};

export function ThreadHeader({
  thread,
  aiPanelOpen,
  reclassifying = false,
  onBack,
  onChangeOwner,
  onToggleStar,
  onToggleUnread,
  onArchive,
  onMarkDone,
  onReply,
  onReclassify,
  onToggleAiPanel,
}: ThreadHeaderProps) {
  const sender = thread.participants?.[0];
  const participantsLabel = thread.participants
    .map((p) => (p.name ? `${p.name} <${p.email}>` : p.email))
    .join(', ');

  const iconBtnClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] transition-colors hover:bg-[var(--row-selected-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

  return (
    <header className="shrink-0 border-b border-[var(--glass-divider)] px-5 pb-4 pt-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to list"
              className={cn(iconBtnClass, 'lg:hidden')}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}

          <OwnerPopover
            current={thread.owner}
            senderEmail={sender?.email}
            onSelect={onChangeOwner}
          >
            <span>
              <OwnerPill
                owner={thread.owner}
                source={thread.ownerSource}
                size="md"
                interactive
                loading={thread.aiStatus === 'pending'}
              />
            </span>
          </OwnerPopover>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Reply"
                onClick={onReply}
                className={iconBtnClass}
              >
                <Reply className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Reply (r)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={thread.important ? 'Remove star' : 'Star'}
                onClick={onToggleStar}
                className={iconBtnClass}
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    thread.important && 'fill-amber-400 text-amber-400'
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{thread.important ? 'Remove star (s)' : 'Star (s)'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={thread.unread ? 'Mark read' : 'Mark unread'}
                onClick={onToggleUnread}
                className={iconBtnClass}
              >
                {thread.unread ? (
                  <MailOpen className="h-4 w-4" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {thread.unread ? 'Mark read (u)' : 'Mark unread (u)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={thread.status === 'done' ? 'Reopen' : 'Mark done'}
                onClick={onMarkDone}
                className={cn(
                  iconBtnClass,
                  thread.status === 'done' && 'border-[var(--grove-lime)]/50 text-[var(--grove-lime)]'
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {thread.status === 'done' ? 'Reopen (d)' : 'Mark done (d)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Archive"
                onClick={onArchive}
                className={iconBtnClass}
              >
                <Archive className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Archive (e)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Re-analyse with AI"
                disabled={reclassifying}
                onClick={onReclassify}
                className={iconBtnClass}
              >
                <RefreshCw className={cn('h-4 w-4', reclassifying && 'animate-spin')} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Re-analyse with AI</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Toggle AI panel"
                aria-pressed={aiPanelOpen}
                onClick={onToggleAiPanel}
                className={cn(
                  iconBtnClass,
                  'hidden md:flex',
                  aiPanelOpen && 'bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)] border-transparent'
                )}
              >
                <PanelRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Toggle AI panel</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <h2 className="mt-4 font-display text-[26px] font-semibold leading-tight tracking-tight text-[var(--fg)]">
        {thread.subject}
      </h2>
      {participantsLabel ? (
        <p className="mt-1 truncate text-[15px] text-[var(--fg-muted)]">{participantsLabel}</p>
      ) : null}
    </header>
  );
}
