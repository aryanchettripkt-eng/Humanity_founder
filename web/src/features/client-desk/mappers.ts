import type { ActivityItem, HandoffState, ThreadListItem } from '@/types/api';

export type DeskFilter = {
  id: 'waiting' | 'onIt' | 'handedBack' | 'handled';
  segment: 'client' | 'assistant' | 'done';
  handoff?: Exclude<HandoffState, 'none'>;
};

/** Where each desk chip takes the list. Matches what the server does on each client action. */
export const DESK_FILTERS: DeskFilter[] = [
  { id: 'waiting', segment: 'client' },
  { id: 'onIt', segment: 'client', handoff: 'client_handling' },
  { id: 'handedBack', segment: 'assistant', handoff: 'handed_to_assistant' },
  { id: 'handled', segment: 'done', handoff: 'handled' },
];

export function deskChipLabel(id: DeskFilter['id'], client: string): string {
  switch (id) {
    case 'waiting':
      return `Waiting on ${client}`;
    case 'onIt':
      return `${client}'s on it`;
    case 'handedBack':
      return 'Handed back to you';
    case 'handled':
      return `Handled by ${client} · 7d`;
  }
}

/** Phone labels, so four chips fit without cutting words. */
export const DESK_SHORT_LABELS: Record<DeskFilter['id'], string> = {
  waiting: 'Waiting',
  onIt: 'On it',
  handedBack: 'Handed back',
  handled: 'Handled · 7d',
};

export function isDeskFilterActive(f: DeskFilter, segment: string, handoff: string | null) {
  return f.segment === segment && (f.handoff ?? null) === (handoff || null);
}

export function handledWithin(threads: ThreadListItem[], days: number, now = Date.now()): number {
  const from = now - days * 86_400_000;
  return threads.filter(
    (t) => t.handoff?.state === 'handled' && t.handoff.at && new Date(t.handoff.at).getTime() >= from
  ).length;
}

/** The newest note the client left, from a note or a hand-back with a note. */
export function latestClientNote(activity: ActivityItem[]) {
  const sorted = [...activity].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  for (const a of sorted) {
    const note = typeof a.payload?.note === 'string' ? a.payload.note.trim() : '';
    if ((a.type === 'client_note' || a.type === 'client_handoff') && note) {
      return { note, threadId: a.threadId, at: a.createdAt };
    }
  }
  return null;
}

export function handoffChipLabel(state: HandoffState | undefined, client: string): string | null {
  switch (state) {
    case 'client_handling':
      return `${client}'s on it`;
    case 'handed_to_assistant':
      return 'Handed back';
    case 'handled':
      return `Handled by ${client}`;
    default:
      return null;
  }
}

export function handoffCardTitle(state: HandoffState | undefined, client: string): string | null {
  switch (state) {
    case 'client_handling':
      return `${client} is handling this`;
    case 'handed_to_assistant':
      return `${client} handed this back to you`;
    case 'handled':
      return `${client} marked this handled`;
    default:
      return null;
  }
}
