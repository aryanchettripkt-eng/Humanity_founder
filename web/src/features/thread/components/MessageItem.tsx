import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { formatFullDateTime, formatRelativeTime, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/api';

type MessageItemProps = {
  message: Message;
  defaultCollapsed?: boolean;
};

export function MessageItem({ message, defaultCollapsed = false }: MessageItemProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const senderName = message.from?.name || message.from?.email || 'Unknown';
  const isOutbound = message.direction === 'outbound';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-colors',
        isOutbound && 'border-l-4 border-l-primary'
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCollapsed((c) => !c)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-3"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-foreground border border-border">
            {getInitials(senderName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">{senderName}</span>
              {isOutbound && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Sent
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{message.from?.email}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span title={formatFullDateTime(message.sentAt)}>
            {formatRelativeTime(message.sentAt)}
          </span>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 max-w-[72ch] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {message.bodyText}
        </div>
      )}
    </div>
  );
}

