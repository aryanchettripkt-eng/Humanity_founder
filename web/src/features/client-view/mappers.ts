import type { ThreadListItem } from '@/types/api';

export type ClientQueueTab = 'all' | 'needs' | 'handling';

export const CLIENT_QUEUE_TABS: Array<{ id: ClientQueueTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'needs', label: 'Needs you' },
  { id: 'handling', label: "You're on it" },
];

export function isClientHandling(t: Pick<ThreadListItem, 'handoff'>): boolean {
  return t.handoff?.state === 'client_handling';
}

export function filterClientQueue(
  threads: ThreadListItem[],
  tab: ClientQueueTab
): ThreadListItem[] {
  if (tab === 'needs') return threads.filter((t) => !isClientHandling(t));
  if (tab === 'handling') return threads.filter((t) => isClientHandling(t));
  return threads;
}

export function clientStatusLabel(t: Pick<ThreadListItem, 'handoff'>): string {
  return isClientHandling(t) ? "You're on it" : 'Needs you';
}

/** One true sentence built from counts, e.g. "2 emails need you. You're handling 1." */
export function clientSummaryLine(threads: ThreadListItem[]): string {
  const handling = threads.filter((t) => isClientHandling(t)).length;
  const needs = threads.length - handling;
  if (threads.length === 0) return "You're all caught up. Your assistant has everything else.";
  const parts: string[] = [];
  if (needs > 0) parts.push(`${needs} ${needs === 1 ? 'email needs' : 'emails need'} you.`);
  if (handling > 0) parts.push(`You're handling ${handling}.`);
  return parts.join(' ');
}

export function senderLabel(t: Pick<ThreadListItem, 'participants'>): string {
  const p = t.participants?.[0];
  return p?.name || p?.email || 'Unknown';
}
