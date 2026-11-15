import { ChevronDown, ChevronUp, Eye, Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/grove/Avatar';
import { useClientDesk } from '@/features/client-desk/api';
import {
  DESK_FILTERS,
  DESK_SHORT_LABELS,
  deskChipLabel,
  isDeskFilterActive,
  type DeskFilter,
} from '@/features/client-desk/mappers';
import { useActiveClient } from '@/features/client-desk/useActiveClient';
import { formatRelativeTime, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';

type ClientDeskProps = {
  segment: string;
  handoff: string | null;
  onFilter: (f: DeskFilter, active: boolean) => void;
  onOpenThread: (id: string) => void;
  className?: string;
};

function usePhone() {
  const q = '(max-width: 767px)';
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [phone, setPhone] = useState(() => supported && window.matchMedia(q).matches);
  useEffect(() => {
    if (!supported) return;
    const mq = window.matchMedia(q);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [supported]);
  return phone;
}

/**
 * The client's side of the inbox, as a strip above the Inbox columns (G9.3b):
 * what waits on them, what they're on, what they handed back and handled,
 * their latest note, and a link to preview their view.
 */
export function ClientDesk({ segment, handoff, onFilter, onOpenThread, className }: ClientDeskProps) {
  const { client, clientId, firstName } = useActiveClient();
  const desk = useClientDesk(clientId);
  const phone = usePhone();
  const stored = useUiStore((s) => s.clientDeskCollapsed);
  const setCollapsed = useUiStore((s) => s.setClientDeskCollapsed);
  const collapsed = stored ?? phone;

  if (!client) return null;

  const values: Record<DeskFilter['id'], number | undefined> = {
    waiting: desk.waiting,
    onIt: desk.onIt,
    handedBack: desk.handedBack,
    handled: desk.handled7d,
  };
  const num = (v: number | undefined) => (v === undefined ? '–' : v);

  const toggle = (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      aria-expanded={!collapsed}
      aria-label={collapsed ? `Show ${firstName}'s desk` : `Hide ${firstName}'s desk`}
      className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--glass-hover)]"
    >
      {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
    </button>
  );

  if (collapsed) {
    return (
      <section
        aria-label={`${firstName}'s desk`}
        className={cn(
          'glass-pane flex h-[52px] shrink-0 items-center gap-2 !rounded-[24px] px-3 md:px-4',
          className
        )}
      >
        <Avatar name={client.name} initials={getInitials(client.name)} size="sm" />
        <span className="hidden shrink-0 font-display text-[15px] font-semibold text-[var(--fg)] sm:inline">
          {firstName}&apos;s desk
        </span>
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {DESK_FILTERS.map((f) => {
            const active = isDeskFilterActive(f, segment, handoff);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(f, active)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] transition-colors',
                  active
                    ? 'border-transparent bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                    : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg-muted)] hover:bg-[var(--glass-hover)]'
                )}
              >
                <span className={cn('font-display text-[15px] font-bold tabular-nums', !active && 'text-[var(--fg)]')}>
                  {num(values[f.id])}
                </span>
                <span className="sm:hidden">{DESK_SHORT_LABELS[f.id]}</span>
                <span className="hidden sm:inline">{deskChipLabel(f.id, firstName)}</span>
              </button>
            );
          })}
        </div>
        {toggle}
      </section>
    );
  }

  const note = desk.latestNote;

  return (
    <section
      aria-label={`${firstName}'s desk`}
      className={cn(
        'glass-pane flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 !rounded-[24px] px-4 py-3.5 md:px-5 md:py-4',
        className
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <Avatar name={client.name} initials={getInitials(client.name)} />
        <h2 className="font-display text-[18px] font-semibold text-[var(--fg)]">
          {firstName}&apos;s desk
        </h2>
      </div>

      <div className="order-last grid w-full grid-cols-2 gap-2 md:grid-cols-4 min-[1600px]:order-none min-[1600px]:w-auto min-[1600px]:flex-none">
        {DESK_FILTERS.map((f) => {
          const active = isDeskFilterActive(f, segment, handoff);
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(f, active)}
              className={cn(
                'flex min-h-[44px] min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors',
                active
                  ? 'border-transparent bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                  : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] hover:bg-[var(--glass-hover)]'
              )}
            >
              <span className="font-display text-[20px] font-bold leading-none tabular-nums">
                {num(values[f.id])}
              </span>
              <span
                className={cn(
                  'truncate text-[13px]',
                  active ? 'text-[var(--nav-active-fg)]' : 'text-[var(--fg-muted)]'
                )}
              >
                <span className="sm:hidden">{DESK_SHORT_LABELS[f.id]}</span>
                <span className="hidden sm:inline">{deskChipLabel(f.id, firstName)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 basis-[240px] items-center gap-2">
        {note ? (
          <button
            type="button"
            onClick={() => note.threadId && onOpenThread(note.threadId)}
            disabled={!note.threadId}
            title={note.note}
            className="glass flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-full px-3.5 text-left text-sm transition-colors hover:bg-[var(--glass-hover)]"
          >
            <Quote className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]" aria-hidden="true" />
            <span className="min-w-0 truncate text-[var(--fg)]">“{note.note}”</span>
            <span className="shrink-0 text-[var(--fg-subtle)]">· {formatRelativeTime(note.at)}</span>
          </button>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-[var(--fg-muted)]">
            No notes from {firstName} yet.
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/c?preview=1"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-[1.5px] border-[var(--btn-outline-border)] px-4 text-sm font-semibold text-[var(--btn-outline-fg)] transition-colors hover:bg-[var(--btn-outline-hover)]"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">See what {firstName} sees</span>
          <span className="sm:hidden">Preview</span>
        </Link>
        {toggle}
      </div>
    </section>
  );
}
