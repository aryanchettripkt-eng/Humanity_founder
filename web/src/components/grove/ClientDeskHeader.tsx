import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMe } from '@/features/auth/api';
import { useActivity, useThreads } from '@/features/inbox/api';
import { formatRelativeTime, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';
import type { SegmentId } from '@/types/api';

type ClientDeskHeaderProps = {
  activeSegment: SegmentId;
  activeHandoff?: string;
  className?: string;
};

function isWithin7Days(iso?: string): boolean {
  if (!iso) return false;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= 7 * 86_400_000;
}

export function ClientDeskHeader({
  activeSegment,
  activeHandoff,
  className,
}: ClientDeskHeaderProps) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { activeClientId, clientDeskCollapsed, toggleClientDeskCollapsed } = useUiStore();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const activeClient =
    me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];
  const clientId = activeClient?.id || activeClientId || undefined;
  const clientName = activeClient?.name || 'Priya Nair';
  const clientFirstName = activeClient?.firstName || clientName.split(' ')[0] || 'Priya';

  const { data: clientList } = useThreads({ segment: 'client', clientId, pageSize: 100 });
  const { data: assistantList } = useThreads({ segment: 'assistant', clientId, pageSize: 100 });
  const { data: doneList } = useThreads({ segment: 'done', clientId, pageSize: 100 });
  const { data: activityRes } = useActivity(clientId, 20);

  const counts = useMemo(() => {
    const clientThreads = clientList?.data ?? [];
    const assistantThreads = assistantList?.data ?? [];
    const doneThreads = doneList?.data ?? [];

    return {
      waiting: clientThreads.filter((t) => t.handoff?.state !== 'handled').length,
      handling: clientThreads.filter((t) => t.handoff?.state === 'client_handling').length,
      handedBack: assistantThreads.filter(
        (t) => t.handoff?.state === 'handed_to_assistant' && t.status === 'open'
      ).length,
      handled7d: doneThreads.filter(
        (t) => t.handoff?.state === 'handled' && isWithin7Days(t.handoff?.at)
      ).length,
    };
  }, [clientList?.data, assistantList?.data, doneList?.data]);

  const latestNote = useMemo(() => {
    const items = activityRes?.data ?? [];
    return items.find((a) => a.type === 'client_note' && a.threadId);
  }, [activityRes?.data]);

  const chips = [
    {
      id: 'waiting',
      label: `Waiting on ${clientFirstName}`,
      count: counts.waiting,
      to: '/app/inbox/client',
      active: activeSegment === 'client' && !activeHandoff,
    },
    {
      id: 'handling',
      label: `${clientFirstName}'s on it`,
      count: counts.handling,
      to: '/app/inbox/client?handoff=client_handling',
      active: activeSegment === 'client' && activeHandoff === 'client_handling',
    },
    {
      id: 'handed_back',
      label: 'Handed back to you',
      count: counts.handedBack,
      to: '/app/inbox/assistant?handoff=handed_to_assistant',
      active: activeSegment === 'assistant' && activeHandoff === 'handed_to_assistant',
    },
    {
      id: 'handled_7d',
      label: `Handled by ${clientFirstName} · 7d`,
      count: counts.handled7d,
      to: '/app/inbox/done?handoff=handled',
      active: activeSegment === 'done' && activeHandoff === 'handled',
    },
  ];

  const noteText =
    typeof latestNote?.payload?.note === 'string' && latestNote.payload.note.trim()
      ? latestNote.payload.note.trim()
      : typeof latestNote?.payload?.subject === 'string'
        ? latestNote.payload.subject.trim()
        : '';

  return (
    <section aria-label={`${clientFirstName}'s desk`} className={cn('shrink-0', className)}>
      {/* Mobile (<768px): collapsed by default; tapping expands */}
      <div className="md:hidden">
        {!mobileExpanded ? (
          <div className="glass-pane flex h-11 items-center justify-between gap-2 rounded-[24px] px-3">
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(c.to)}
                  aria-label={`${c.label}: ${c.count}`}
                  className={cn(
                    'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold tabular-nums transition-colors',
                    c.active
                      ? 'border-transparent bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                      : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]'
                  )}
                >
                  <span>{c.count}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMobileExpanded(true)}
              aria-label="Expand client desk"
              aria-expanded={false}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="glass-pane space-y-3 rounded-[24px] px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-xs font-semibold text-[var(--fg)]">
                  {getInitials(clientName)}
                </div>
                <span className="font-display text-[18px] font-semibold text-[var(--fg)]">
                  {clientFirstName}&apos;s desk
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileExpanded(false)}
                aria-label="Collapse client desk"
                aria-expanded={true}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)]"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(c.to)}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors',
                    c.active
                      ? 'border-[var(--grove-lime)]/60 bg-[var(--row-selected-bg)]'
                      : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] hover:bg-[var(--row-selected-bg)]'
                  )}
                >
                  <span className="font-display text-[20px] font-bold leading-none tabular-nums text-[var(--fg)]">
                    {c.count}
                  </span>
                  <span className="truncate text-[13px] text-[var(--fg-muted)]">{c.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {latestNote && noteText ? (
                <button
                  type="button"
                  onClick={() => navigate(`/app/inbox/inbox/${latestNote.threadId}`)}
                  className="max-w-full truncate rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] px-3 py-1.5 text-xs text-[var(--fg)] hover:bg-[var(--row-selected-bg)]"
                >
                  “{noteText}” · {formatRelativeTime(latestNote.createdAt)}
                </button>
              ) : null}
              <Link
                to="/c?preview=1"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--pane-border)] px-3 text-xs font-medium text-[var(--fg)] transition-colors hover:bg-[var(--card-glass-bg)]"
              >
                <span>See what {clientFirstName} sees</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Tablet & Desktop (>=768px) */}
      <div className="hidden md:block">
        {clientDeskCollapsed ? (
          <div className="glass-pane flex h-11 items-center justify-between gap-3 rounded-[24px] px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[11px] font-semibold text-[var(--fg)]">
                {getInitials(clientName)}
              </div>
              <span className="font-display text-[15px] font-semibold text-[var(--fg)]">
                {clientFirstName}&apos;s desk
              </span>
            </div>

            <div className="flex items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  aria-label={`${c.label}: ${c.count}`}
                  onClick={() => navigate(c.to)}
                  className={cn(
                    'inline-flex h-7 items-center rounded-full border px-3 text-sm font-bold tabular-nums transition-colors',
                    c.active
                      ? 'border-transparent bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]'
                      : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] hover:bg-[var(--row-selected-bg)]'
                  )}
                >
                  {c.count}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleClientDeskCollapsed}
              aria-label="Expand client desk"
              aria-expanded={false}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] transition-colors hover:bg-[var(--row-selected-bg)]"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="glass-pane flex flex-col gap-3 rounded-[24px] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Left + Middle */}
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
              <div className="flex shrink-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-xs font-semibold text-[var(--fg)]">
                  {getInitials(clientName)}
                </div>
                <span className="font-display text-[18px] font-semibold whitespace-nowrap text-[var(--fg)]">
                  {clientFirstName}&apos;s desk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:items-center">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(c.to)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors',
                      c.active
                        ? 'border-[var(--grove-lime)]/60 bg-[var(--row-selected-bg)]'
                        : 'border-[var(--pane-border)] bg-[var(--card-glass-bg)] hover:bg-[var(--row-selected-bg)]'
                    )}
                  >
                    <span className="font-display text-[20px] font-bold leading-none tabular-nums text-[var(--fg)]">
                      {c.count}
                    </span>
                    <span className="whitespace-nowrap text-[13px] text-[var(--fg-muted)]">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Latest note + Right actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 xl:justify-end">
              {latestNote && noteText ? (
                <button
                  type="button"
                  onClick={() => navigate(`/app/inbox/inbox/${latestNote.threadId}`)}
                  className="max-w-[280px] truncate rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] px-3.5 py-1.5 text-xs text-[var(--fg)] transition-colors hover:bg-[var(--row-selected-bg)]"
                  title={noteText}
                >
                  “{noteText}” · {formatRelativeTime(latestNote.createdAt)}
                </button>
              ) : null}

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/c?preview=1"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--pane-border)] px-3.5 text-xs font-medium whitespace-nowrap text-[var(--fg)] transition-colors hover:bg-[var(--card-glass-bg)]"
                >
                  <span>See what {clientFirstName} sees</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={toggleClientDeskCollapsed}
                  aria-label="Collapse client desk"
                  aria-expanded={true}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg)] transition-colors hover:bg-[var(--row-selected-bg)]"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
