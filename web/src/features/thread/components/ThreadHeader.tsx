import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  MailOpen,
  PanelRight,
  RefreshCw,
  Reply,
  Star,
} from 'lucide-react';
import { KbdHint } from '@/components/common/KbdHint';
import { OwnerPill } from '@/components/common/OwnerPill';
import { OwnerPopover } from '@/components/common/OwnerPopover';
import { Button } from '@/components/ui/button';
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
  const senderEmail = thread.participants?.[0]?.email;

  return (
    <div className="border-b border-border bg-background px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to list"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <OwnerPopover
            current={thread.owner}
            senderEmail={senderEmail}
            onSelect={onChangeOwner}
          >
            <OwnerPill owner={thread.owner} source={thread.ownerSource} size="md" interactive />
          </OwnerPopover>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Reply" onClick={onReply}>
                <Reply className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>Draft reply</span>
              <KbdHint keys="r" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Star" onClick={onToggleStar}>
                <Star
                  className={cn(
                    'h-4 w-4',
                    thread.important && 'fill-amber-500 text-amber-500'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>Important</span>
              <KbdHint keys="s" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle unread" onClick={onToggleUnread}>
                <MailOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>Mark unread</span>
              <KbdHint keys="u" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mark done" onClick={onMarkDone}>
                <CheckCircle2
                  className={cn('h-4 w-4', thread.status === 'done' && 'text-success')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>Mark done</span>
              <KbdHint keys="d" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Archive" onClick={onArchive}>
                <Archive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>Archive</span>
              <KbdHint keys="e" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Re-analyse with AI"
                disabled={reclassifying}
                onClick={onReclassify}
              >
                <RefreshCw className={cn('h-4 w-4', reclassifying && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Re-analyse with AI</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={aiPanelOpen ? 'secondary' : 'ghost'}
                size="icon"
                aria-label="Toggle AI panel"
                onClick={onToggleAiPanel}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI Insights</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <h1 className="mt-2.5 text-lg font-semibold leading-snug text-foreground">
        {thread.subject}
      </h1>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {thread.participants?.map((p) => p.name || p.email).join(', ')}
      </p>
    </div>
  );
}

