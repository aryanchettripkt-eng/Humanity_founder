import type { PillBarSlot } from '@/components/common/PillBar';
import { formatRelativeTime, formatUpcomingDate, getInitials } from '@/lib/format';
import type { ActivityItem, DashboardSummary, UpcomingItem } from '@/types/api';

export type TodayTaskFilter = 'all' | 'dates' | 'follow-ups' | 'client';

export type TodayTaskItem = {
  id: string;
  threadId: string;
  href: string;
  kind: 'date' | 'nudge' | 'client';
  highlighted?: boolean;
  person: string;
  initials: string;
  role: string;
  title: string;
  subtitle?: string;
  timeLabel?: string;
  statusLabel: string;
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

export function buildScheduleSlots(
  upcoming: UpcomingItem[],
  timeZone?: string
): PillBarSlot[] {
  return upcoming.slice(0, 3).map((item, index) => ({
    id: `slot-${item.threadId}-${index}`,
    time: formatUpcomingDate(item.startsAt, timeZone),
    title: item.title,
    href: `/app/inbox/inbox/${item.threadId}`,
  }));
}

export function buildTodayTasks(
  data: DashboardSummary,
  timeZone?: string
): TodayTaskItem[] {
  const tasks: TodayTaskItem[] = [];

  data.upcoming.slice(0, 2).forEach((item, index) => {
    tasks.push({
      id: `upcoming-${item.threadId}-${index}`,
      threadId: item.threadId,
      href: `/app/inbox/inbox/${item.threadId}`,
      kind: 'date',
      highlighted: index === 0,
      person: item.subject,
      initials: getInitials(item.title),
      role: 'Extracted date',
      title: item.title,
      timeLabel: formatUpcomingDate(item.startsAt, timeZone),
      statusLabel: 'Add to calendar',
    });
  });

  data.nudges.slice(0, 2).forEach((thread) => {
    const sender = thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
    tasks.push({
      id: `nudge-${thread.id}`,
      threadId: thread.id,
      href: `/app/inbox/waiting/${thread.id}`,
      kind: 'nudge',
      highlighted: tasks.length === 0,
      person: sender,
      initials: getInitials(sender),
      role: '3+ days silent',
      title: thread.subject,
      subtitle: `Sent ${formatRelativeTime(thread.lastMessageAt)}`,
      statusLabel: 'Follow up',
    });
  });

  data.recent
    .filter((t) => t.owner === 'client')
    .slice(0, 2)
    .forEach((thread) => {
      const sender =
        thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
      tasks.push({
        id: `client-${thread.id}`,
        threadId: thread.id,
        href: `/app/inbox/client/${thread.id}`,
        kind: 'client',
        highlighted: tasks.length === 0,
        person: sender,
        initials: getInitials(sender),
        role: 'Client hand-off',
        title: thread.subject,
        subtitle: thread.clientReason || thread.reason || thread.snippet,
        statusLabel: 'Waiting on client',
      });
    });

  return tasks;
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
