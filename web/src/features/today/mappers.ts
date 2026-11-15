import type {
  GroveBarDayModel,
  GroveListRowModel,
  GroveStatModel,
  GroveThreadCardModel,
  GroveThreadRowModel,
} from '@/components/grove/models';
import { Crown, UserRoundCheck } from 'lucide-react';
import { formatRelativeTime, formatUpcomingDate, getInitials } from '@/lib/format';
import { getOwnerShortLabel } from '@/lib/owners';
import type { SeenClientCounts } from '@/stores/ui';
import type {
  ActivityItem,
  Category,
  DashboardSummary,
  Owner,
  ThreadListItem,
  UpcomingItem,
} from '@/types/api';

export type TodayGroveFilters = {
  owner: 'all' | Owner;
  category: 'all' | Category;
  date: 'all' | 'week' | 'today';
  confidence: 'all' | 'high' | 'medium' | 'low';
  source: 'all' | 'gmail' | 'demo';
};

export type CollapsedActivity = {
  id: string;
  actorName: string;
  actorType: ActivityItem['actor']['type'];
  label: string;
  subject?: string;
  note?: string;
  createdAt: string;
  count: number;
};

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function splitFirstSentence(text: string): { head: string; rest: string } {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  if (!match || match[0].length >= trimmed.length) {
    return { head: trimmed, rest: '' };
  }
  return { head: match[0], rest: trimmed.slice(match[0].length).trim() };
}

export function extractDomain(email: string | undefined): string {
  if (!email || !email.includes('@')) return 'gmail.com';
  return email.split('@')[1] || 'gmail.com';
}

function formatDateKeyInZone(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatWeekdayInZone(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: timeZone || 'UTC',
    }).format(date);
  } catch {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
}

export function buildWeeklyBars(threads: ThreadListItem[], timeZone?: string): GroveBarDayModel[] {
  const now = new Date();
  const days: GroveBarDayModel[] = [];
  const dayMap = new Map<string, GroveBarDayModel>();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = formatDateKeyInZone(d, timeZone);
    const label = formatWeekdayInZone(d, timeZone);
    const entry: GroveBarDayModel = { key, label, assistant: 0, client: 0, none: 0 };
    days.push(entry);
    dayMap.set(key, entry);
  }

  for (const t of threads) {
    if (!t.lastMessageAt) continue;
    const parsed = new Date(t.lastMessageAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = formatDateKeyInZone(parsed, timeZone);
    const bucket = dayMap.get(key);
    if (!bucket) continue;
    if (t.owner === 'assistant') bucket.assistant += 1;
    else if (t.owner === 'client') bucket.client += 1;
    else if (t.owner === 'none') bucket.none += 1;
  }

  return days;
}

export function buildGroveStats(
  counts: Record<string, number> | undefined,
  seen: SeenClientCounts | undefined,
  clientFirstName: string,
  threads: ThreadListItem[]
): GroveStatModel[] {
  const assistant = counts?.assistant ?? 0;
  const client = counts?.client ?? 0;
  const waitingOnClient = threads.filter(
    (t) => t.owner === 'client' && t.handoff?.state !== 'handled'
  ).length;

  const diff = seen ? assistant - seen.assistant : 0;
  const assistantDelta =
    diff > 0
      ? `+${diff} since your last visit`
      : diff < 0
        ? `${diff} since your last visit`
        : `${assistant} ready for reply`;

  return [
    {
      id: 'assistant',
      label: 'For you',
      value: assistant,
      delta: assistantDelta,
      deltaTone: diff >= 0 ? 'positive' : 'neutral',
      icon: UserRoundCheck,
      href: '/app/inbox/assistant',
    },
    {
      id: 'client',
      label: `For ${clientFirstName}`,
      value: client,
      delta: `${waitingOnClient} waiting on ${clientFirstName}`,
      deltaTone: 'neutral',
      icon: Crown,
      href: '/app/inbox/client',
    },
  ];
}

export function buildNeedsYourCallList(
  review: ThreadListItem[],
  upcoming: UpcomingItem[],
  timeZone?: string
): { title: string; actionHref: string; rows: GroveListRowModel[]; emptyText: string } {
  if (review.length > 0) {
    return {
      title: 'Needs your call',
      actionHref: '/app/inbox/review',
      emptyText: 'All threads have clear owners.',
      rows: review.slice(0, 3).map((t) => {
        const sender = t.participants?.[0]?.name || t.participants?.[0]?.email || 'Contact';
        return {
          id: t.id,
          name: sender,
          initials: getInitials(sender),
          subtitle: t.subject,
          rightText: `${Math.round((t.confidence ?? 0.5) * 100)}%`,
          href: `/app/inbox/review/${t.id}`,
        };
      }),
    };
  }

  return {
    title: 'Next up',
    actionHref: '/app/inbox/inbox',
    emptyText: 'No upcoming dates extracted.',
    rows: upcoming.slice(0, 3).map((u, idx) => ({
      id: `${u.threadId}-${idx}`,
      name: u.title,
      initials: getInitials(u.title),
      subtitle: u.subject,
      rightText: formatUpcomingDate(u.startsAt, timeZone),
      href: `/app/inbox/inbox/${u.threadId}`,
    })),
  };
}

function formatCompactCardDate(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone || undefined,
    })
      .format(d)
      .replace(/\s*(AM|PM)$/i, (_, mer: string) => ` ${mer.toLowerCase()}`);
  } catch {
    return formatUpcomingDate(iso, timeZone);
  }
}

export function ctaLabelForThread(t: ThreadListItem, clientFirstName: string): string {
  if (t.owner === 'assistant') return 'Draft reply';
  if (t.owner === 'client') {
    if (!t.important && t.handoff?.state !== 'client_handling') {
      return `Move up for ${clientFirstName}`;
    }
    return `Open in ${clientFirstName}'s view`;
  }
  if (t.owner === 'review') return 'Confirm';
  return 'Open';
}

export function buildGroveThreadCards(
  threads: ThreadListItem[],
  filters: TodayGroveFilters,
  clientFirstName: string,
  timeZone?: string
): GroveThreadCardModel[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const filtered = threads.filter((t) => {
    if (filters.owner !== 'all' && t.owner !== filters.owner) return false;
    if (filters.category !== 'all' && t.category !== filters.category) return false;
    if (filters.source === 'gmail' && t.source !== 'gmail') return false;
    if (filters.source === 'demo' && t.source === 'gmail') return false;

    const conf = Math.round((t.confidence ?? 0.5) * 100);
    if (filters.confidence === 'high' && conf < 80) return false;
    if (filters.confidence === 'medium' && (conf < 60 || conf >= 80)) return false;
    if (filters.confidence === 'low' && conf >= 60) return false;

    if (filters.date !== 'all') {
      const ts = new Date(t.lastMessageAt).getTime();
      if (Number.isFinite(ts)) {
        if (filters.date === 'today' && now - ts > dayMs) return false;
        if (filters.date === 'week' && now - ts > weekMs) return false;
      }
    }
    return true;
  });

  return filtered.map((t) => {
    const sender = t.participants?.[0]?.name || t.participants?.[0]?.email || 'Contact';
    const domain = extractDomain(t.participants?.[0]?.email);
    const nextEntity = t.entities?.[0];
    const ownerLabel = getOwnerShortLabel(t.owner, clientFirstName);
    const isFresh = now - new Date(t.lastMessageAt).getTime() < 2 * dayMs;
    const msgCount = t.messageCount ?? 0;

    return {
      id: t.id,
      sender,
      initials: getInitials(sender),
      domain,
      owner: t.owner,
      ownerLabel,
      confidence: Math.round((t.confidence ?? 0.5) * 100),
      nextDateLabel: nextEntity ? formatCompactCardDate(nextEntity.startsAt, timeZone) : '—',
      series: [],
      sparkTone: t.lastSender === 'them' ? 'olive' : 'ink',
      deltaText: isFresh
        ? `${msgCount} ${msgCount === 1 ? 'msg' : 'msgs'}`
        : `quiet ${formatRelativeTime(t.lastMessageAt)}`,
      deltaDirection: isFresh ? 'up' : 'down',
      ctaLabel: ctaLabelForThread(t, clientFirstName),
      href: `/app/inbox/${t.owner === 'review' ? 'review' : 'inbox'}/${t.id}`,
      category: t.category,
    };
  });
}

export function buildGroveRecentRows(threads: ThreadListItem[]): GroveThreadRowModel[] {
  return threads.slice(0, 5).map((t) => {
    const sender = t.participants?.[0]?.name || t.participants?.[0]?.email || 'Contact';
    return {
      id: t.id,
      sender,
      initials: getInitials(sender),
      subject: t.subject,
      owner: t.owner,
      timeLabel: formatRelativeTime(t.lastMessageAt),
      unread: t.unread,
      href: `/app/inbox/inbox/${t.id}`,
    };
  });
}

export function collapseActivity(activity: ActivityItem[]): CollapsedActivity[] {
  const clientItems: CollapsedActivity[] = [];
  const otherItems: CollapsedActivity[] = [];

  for (const item of activity) {
    const label = item.type.replace(/_/g, ' ');
    const subject = typeof item.payload?.subject === 'string' ? item.payload.subject : undefined;
    const note = typeof item.payload?.note === 'string' ? item.payload.note : undefined;

    if (item.actor.type === 'client') {
      clientItems.push({
        id: item.id,
        actorName: item.actor.name,
        actorType: item.actor.type,
        label,
        subject,
        note,
        createdAt: item.createdAt,
        count: 1,
      });
      continue;
    }

    const existing = otherItems.find(
      (entry) =>
        entry.actorName === item.actor.name &&
        entry.label === label &&
        entry.subject === subject &&
        entry.actorType === 'system'
    );
    if (existing) {
      existing.count += 1;
    } else {
      otherItems.push({
        id: item.id,
        actorName: item.actor.name,
        actorType: item.actor.type,
        label,
        subject,
        note,
        createdAt: item.createdAt,
        count: 1,
      });
    }
  }

  return [...clientItems, ...otherItems].slice(0, 6);
}

export type DashboardUnused = DashboardSummary;
