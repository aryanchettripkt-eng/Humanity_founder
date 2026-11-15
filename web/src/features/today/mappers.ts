import type { PillBarSlot } from '@/components/common/PillBar';
import type {
  FocusPanelModel,
  PersonCardModel,
  TaskCardModel,
  WorkspaceStatModel,
} from '@/components/workspace/models';
import { formatRelativeTime, formatUpcomingDate, getInitials } from '@/lib/format';
import { OWNER_META } from '@/lib/owners';
import type { SeenClientCounts } from '@/stores/ui';
import type {
  ActivityItem,
  DashboardSummary,
  ThreadListItem,
  UpcomingItem,
} from '@/types/api';

export type TodayPersonFilter = 'all' | 'review' | 'assistant' | 'client' | 'none';
export type TodayTaskFilter = 'all' | 'dates' | 'follow-ups' | 'client';

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

export function buildScheduleSlots(
  upcoming: UpcomingItem[],
  timeZone?: string
): PillBarSlot[] {
  const now = Date.now();
  const in48h = now + 48 * 60 * 60 * 1000;
  const within48h = upcoming.filter((item) => {
    const t = new Date(item.startsAt).getTime();
    return Number.isFinite(t) && t >= now - 60 * 60 * 1000 && t <= in48h;
  });
  const source = within48h.length > 0 ? within48h : upcoming;

  return source.slice(0, 5).map((item, index) => ({
    id: `slot-${item.threadId}-${index}`,
    time: formatUpcomingDate(item.startsAt, timeZone),
    title: item.title,
    avatars: [getInitials(item.subject || item.title)],
    href: `/app/inbox/inbox/${item.threadId}`,
  }));
}

export function buildWorkspaceStats(
  counts: Record<string, number> | undefined,
  seen: SeenClientCounts | undefined
): WorkspaceStatModel[] {
  const assistant = counts?.assistant ?? 0;
  const client = counts?.client ?? 0;
  const review = counts?.review ?? 0;

  const diff = (curr: number, prev: number | undefined): string | undefined => {
    if (prev === undefined) return undefined;
    const d = curr - prev;
    if (d === 0) return undefined;
    return d > 0 ? `+${d}` : `${d}`;
  };

  const tone = (curr: number, prev: number | undefined): 'up' | 'down' | undefined => {
    if (prev === undefined || curr === prev) return undefined;
    return curr > prev ? 'up' : 'down';
  };

  return [
    {
      id: 'assistant',
      value: assistant,
      label: 'Needs you',
      delta: diff(assistant, seen?.assistant),
      deltaTone: tone(assistant, seen?.assistant),
      href: '/app/inbox/assistant',
    },
    {
      id: 'client',
      value: client,
      label: 'Client',
      delta: diff(client, seen?.client),
      deltaTone: tone(client, seen?.client),
      href: '/app/inbox/client',
    },
    {
      id: 'review',
      value: review,
      label: 'Review',
      delta: diff(review, seen?.review),
      deltaTone: tone(review, seen?.review),
      href: '/app/inbox/review',
    },
  ];
}

function getThreadSource(_t: ThreadListItem): 'gmail' | 'demo' {
  return 'gmail';
}

export function buildPersonCards(
  data: DashboardSummary,
  filter: TodayPersonFilter = 'all'
): PersonCardModel[] {
  const seen = new Set<string>();
  const combined: ThreadListItem[] = [];

  for (const t of [...data.review, ...data.recent]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    combined.push(t);
  }

  const filtered =
    filter === 'all' ? combined : combined.filter((t) => t.owner === filter);

  return filtered.slice(0, 6).map((t) => {
    const sender = t.participants?.[0]?.name || t.participants?.[0]?.email || 'Contact';
    return {
      id: t.id,
      name: sender,
      initials: getInitials(sender),
      subtitle: t.subject,
      source: getThreadSource(t),
      category: t.category,
      owner: t.owner,
      ownerSource: t.ownerSource,
      confidence: Math.round((t.confidence ?? 0.5) * 100),
      href: `/app/inbox/${t.owner === 'review' ? 'review' : 'inbox'}/${t.id}`,
      showQuickAssign: t.owner === 'review',
    };
  });
}

const TASK_STATUS_OPTIONS = [
  { id: 'open', label: 'Action required' },
  { id: 'done', label: 'Mark done' },
];

export function buildTaskCards(
  data: DashboardSummary,
  timeZone?: string,
  filter: TodayTaskFilter = 'all'
): TaskCardModel[] {
  const tasks: TaskCardModel[] = [];

  if (filter === 'all' || filter === 'dates') {
    data.upcoming.slice(0, 2).forEach((item, index) => {
      tasks.push({
        id: `upcoming-${item.threadId}-${index}`,
        threadId: item.threadId,
        person: item.subject,
        initials: getInitials(item.title),
        role: 'Extracted date',
        title: item.title,
        iconKind: 'calendar',
        dateLabel: formatUpcomingDate(item.startsAt, timeZone),
        avatars: [getInitials(item.subject || item.title)],
        statusLabel: 'Action required',
        statusOptions: TASK_STATUS_OPTIONS,
        primaryLabel: 'Open thread',
        highlighted: index === 0,
        href: `/app/inbox/inbox/${item.threadId}`,
      });
    });
  }

  if (filter === 'all' || filter === 'follow-ups') {
    data.nudges.slice(0, 2).forEach((thread) => {
      const sender =
        thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
      tasks.push({
        id: `nudge-${thread.id}`,
        threadId: thread.id,
        person: sender,
        initials: getInitials(sender),
        role: '3+ days silent',
        title: thread.subject,
        iconKind: 'clock',
        dateLabel: `Sent ${formatRelativeTime(thread.lastMessageAt)}`,
        statusLabel: 'Waiting',
        statusOptions: TASK_STATUS_OPTIONS,
        primaryLabel: 'Follow up',
        highlighted: tasks.length === 0 && filter !== 'all',
        href: `/app/inbox/waiting/${thread.id}`,
      });
    });
  }

  if (filter === 'all' || filter === 'client') {
    data.recent
      .filter((t) => t.owner === 'client')
      .slice(0, 2)
      .forEach((thread) => {
        const sender =
          thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
        tasks.push({
          id: `client-${thread.id}`,
          threadId: thread.id,
          person: sender,
          initials: getInitials(sender),
          role: 'Client hand-off',
          title: thread.subject,
          iconKind: 'crown',
          statusLabel: 'Waiting on client',
          statusOptions: TASK_STATUS_OPTIONS,
          primaryLabel: 'Open thread',
          highlighted: tasks.length === 0 && filter !== 'all',
          href: `/app/inbox/client/${thread.id}`,
        });
      });
  }

  return tasks.slice(0, 6);
}

export function buildFocusPanelModel(
  selectedId: string | null,
  data: DashboardSummary,
  timeZone?: string
): FocusPanelModel | null {
  const allThreads = [...data.review, ...data.recent, ...data.nudges];
  const thread =
    (selectedId ? allThreads.find((t) => t.id === selectedId) : undefined) ??
    allThreads[0];
  if (!thread) return null;

  const sender =
    thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
  const meta = OWNER_META[thread.owner];

  const keyPoints = [
    thread.summary || thread.snippet || 'No summary extracted yet.',
    ...(thread.reason ? [`Reason: ${thread.reason}`] : []),
  ];

  const datesForThread = data.upcoming
    .filter((u) => u.threadId === thread.id)
    .map((u, idx) => ({
      id: `${u.threadId}-${idx}`,
      title: u.title,
      dateLabel: formatUpcomingDate(u.startsAt, timeZone),
    }));

  const timeline = data.activity
    .slice(0, 3)
    .map((act) => ({
      time: formatRelativeTime(act.createdAt),
      label: `${act.actor.name}: ${act.type.replace(/_/g, ' ')}`,
    }));

  const isClientQueue = thread.owner === 'client';

  return {
    id: thread.id,
    owner: thread.owner,
    ownerLabel: meta.label,
    confidence: Math.round((thread.confidence ?? 0.5) * 100),
    reason: thread.reason || thread.clientReason || 'Classified automatically by Relay.',
    subject: thread.subject,
    sender,
    keyPoints,
    timeline,
    dates: datesForThread,
    href: `/app/inbox/inbox/${thread.id}`,
    phonePreview: {
      badge: isClientQueue ? 'In client queue' : 'Handled by assistant',
      headline: thread.subject,
      subline: thread.clientReason || thread.summary || thread.snippet,
      lastAction: formatRelativeTime(thread.lastMessageAt),
      isClientQueue,
    },
  };
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
