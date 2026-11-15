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
        'glass-card rounded-[20px] px-6 py-5 transition-colors',
        isOutbound && 'border-l-4 border-l-[var(--grove-lime)]'
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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--pane-bg)] text-xs font-semibold text-[var(--fg)]">
            {getInitials(senderName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[17px] font-semibold text-[var(--fg)]">
                {senderName}
              </span>
              {isOutbound ? (
                <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--chip-fg)]">
                  Sent
                </span>
              ) : null}
            </div>
            <p className="truncate text-[13px] text-[var(--fg-muted)]">{message.from?.email}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--fg-subtle)]">
          <span title={formatFullDateTime(message.sentAt)}>
            {formatRelativeTime(message.sentAt)}
          </span>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {!collapsed ? (
        <div className="mt-4 max-w-[760px] whitespace-pre-wrap text-[16px] leading-[1.6] text-[var(--fg)]">
          {message.bodyText}
        </div>
      ) : null}
    </div>
  );
}
