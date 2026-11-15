import type { SampleReplyThread, SampleTask } from '@/features/landing/sampleData';
import { formatRelativeTime, formatUpcomingDate, getInitials } from '@/lib/format';
import type { DashboardSummary, ThreadListItem } from '@/types/api';

export type TodayTask = SampleTask & {
  threadId: string;
  href: string;
  isCalendar?: boolean;
};

export function threadToReplyCard(thread: ThreadListItem): SampleReplyThread {
  const senderName =
    thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown sender';

  return {
    id: thread.id,
    sender: senderName,
    initials: getInitials(senderName),
    role: thread.participants?.[0]?.email || '',
    subject: thread.subject,
    source: thread.source === 'gmail' ? 'gmail' : 'demo',
    owner: thread.owner,
    confidence: thread.confidence,
    reason: thread.reason || thread.snippet,
    keyPoints:
      thread.keyPoints?.length > 0
        ? thread.keyPoints
        : [thread.summary || thread.snippet || 'No key points extracted yet.'],
    timeline: [
      {
        time: formatRelativeTime(thread.lastMessageAt),
        label: `Last message from ${thread.lastSender === 'us' ? 'you' : senderName}`,
      },
      {
        time: `${Math.round(thread.confidence * 100)}%`,
        label: `Owner: ${thread.owner} (${thread.ownerSource})`,
      },
    ],
  };
}

export function buildTodayTasks(data: DashboardSummary): TodayTask[] {
  const tasks: TodayTask[] = [];

  data.upcoming.slice(0, 2).forEach((item, index) => {
    tasks.push({
      id: `upcoming-${item.threadId}-${index}`,
      threadId: item.threadId,
      href: `/app/inbox/inbox/${item.threadId}`,
      isCalendar: true,
      highlighted: index === 0,
      person: item.subject,
      personInitials: getInitials(item.title),
      personRole: 'Extracted date',
      title: item.title,
      timeLabel: formatUpcomingDate(item.startsAt),
      statusLabel: 'Add to calendar',
      actionKind: 'calendar',
      tags: ['due-today', 'urgent'],
    });
  });

  data.nudges.slice(0, 2).forEach((thread) => {
    const sender = thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
    tasks.push({
      id: `nudge-${thread.id}`,
      threadId: thread.id,
      href: `/app/inbox/waiting/${thread.id}`,
      person: sender,
      personInitials: getInitials(sender),
      personRole: '3+ days silent',
      title: thread.subject,
      subtitle: `Sent ${formatRelativeTime(thread.lastMessageAt)}`,
      statusLabel: 'Follow up',
      actionKind: 'send',
      tags: ['waiting', 'urgent'],
    });
  });

  if (tasks.length < 3) {
    data.review.slice(0, 3 - tasks.length).forEach((thread) => {
      const sender =
        thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Contact';
      tasks.push({
        id: `review-${thread.id}`,
        threadId: thread.id,
        href: `/app/inbox/review/${thread.id}`,
        person: sender,
        personInitials: getInitials(sender),
        personRole: 'Needs review',
        title: thread.subject,
        subtitle: thread.reason || thread.snippet,
        statusLabel: 'Review owner',
        actionKind: 'handoff',
        tags: ['urgent'],
      });
    });
  }

  return tasks.slice(0, 3);
}

