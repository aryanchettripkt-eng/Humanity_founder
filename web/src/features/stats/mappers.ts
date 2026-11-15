import type { ActivityItem, Category, Owner, ThreadListItem } from '@/types/api';

export type StatsRange = 7 | 30;

export const STATS_OWNER_ORDER: Owner[] = ['assistant', 'client', 'none', 'review'];

/** Categorical series colour per owner (validated palette, see globals.css --series-*). */
export const OWNER_SERIES_VAR: Record<Owner, string> = {
  assistant: 'var(--series-1)',
  client: 'var(--series-2)',
  none: 'var(--series-3)',
  review: 'var(--series-4)',
};

const DAY = 86_400_000;

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function inRange(threads: ThreadListItem[], range: StatsRange, now = new Date()) {
  const from = startOfDay(now) - (range - 1) * DAY;
  return threads.filter((t) => new Date(t.lastMessageAt).getTime() >= from);
}

export type DayBucket = { key: string; label: string; date: number } & Record<Owner, number>;

/** One bucket per day for the last `range` days (oldest first), split by current owner. */
export function volumeByDay(
  threads: ThreadListItem[],
  range: StatsRange,
  now = new Date()
): DayBucket[] {
  const today = startOfDay(now);
  const buckets: DayBucket[] = [];
  for (let i = range - 1; i >= 0; i -= 1) {
    const date = today - i * DAY;
    const d = new Date(date);
    buckets.push({
      key: d.toISOString().slice(0, 10),
      date,
      label:
        range <= 7
          ? d.toLocaleDateString(undefined, { weekday: 'short' })
          : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      assistant: 0,
      client: 0,
      none: 0,
      review: 0,
    });
  }
  for (const t of threads) {
    const day = startOfDay(new Date(t.lastMessageAt));
    const idx = Math.round((day - buckets[0].date) / DAY);
    if (idx >= 0 && idx < buckets.length) buckets[idx][t.owner] += 1;
  }
  return buckets;
}

export function countBy<K extends string>(
  items: ThreadListItem[],
  key: (t: ThreadListItem) => K
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const t of items) {
    const k = key(t);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export type SortingStats = {
  total: number;
  /** AI's call was never changed by hand. */
  keptAsSorted: number;
  /** At least one manual owner change. */
  correctedByYou: number;
  /** Sorted by a remembered sender/domain rule. */
  byYourRules: number;
  /** Went through "Needs your call" at some point, or is there now. */
  neededYourCall: number;
};

export function sortingStats(threads: ThreadListItem[]): SortingStats {
  let keptAsSorted = 0;
  let correctedByYou = 0;
  let byYourRules = 0;
  let neededYourCall = 0;
  for (const t of threads) {
    const history = t.history ?? [];
    const manual = history.some((h) => h.source === 'manual') || t.ownerSource === 'manual';
    if (manual) correctedByYou += 1;
    else if (t.ownerSource === 'rule') byYourRules += 1;
    else keptAsSorted += 1;
    if (t.owner === 'review' || history.some((h) => h.to === 'review' || h.from === 'review')) {
      neededYourCall += 1;
    }
  }
  return { total: threads.length, keptAsSorted, correctedByYou, byYourRules, neededYourCall };
}

export const CONFIDENCE_BUCKETS = [
  { id: 'lt50', label: 'Under 50%', min: 0, max: 0.5 },
  { id: '50', label: '50–69%', min: 0.5, max: 0.7 },
  { id: '70', label: '70–89%', min: 0.7, max: 0.9 },
  { id: '90', label: '90% and up', min: 0.9, max: 1.01 },
] as const;

/** Confidence comes as 0–1 or 0–100 depending on the source; normalise to 0–1. */
export function normaliseConfidence(c: number): number {
  if (!Number.isFinite(c)) return 0;
  return c > 1 ? c / 100 : c;
}

export function confidenceBuckets(threads: ThreadListItem[]) {
  const ai = threads.filter((t) => t.ownerSource === 'ai');
  return CONFIDENCE_BUCKETS.map((b) => ({
    id: b.id,
    label: b.label,
    value: ai.filter((t) => {
      const c = normaliseConfidence(t.confidence);
      return c >= b.min && c < b.max;
    }).length,
  }));
}

export const CATEGORY_LABELS: Record<Category, string> = {
  meeting: 'Meetings',
  action: 'Action needed',
  update: 'Updates',
  newsletter: 'Newsletters',
  finance: 'Finance',
  legal: 'Legal',
  personal: 'Personal',
  general: 'General',
};

export function handoffStats(threads: ThreadListItem[]) {
  return {
    handling: threads.filter((t) => t.handoff?.state === 'client_handling').length,
    handedBack: threads.filter((t) => t.handoff?.state === 'handed_to_assistant').length,
    handled: threads.filter((t) => t.handoff?.state === 'handled').length,
  };
}

export function pct(part: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

/**
 * One plain-language line per activity item. Wording follows D20: a reply is
 * saved, not sent, and nothing here says the client was notified.
 */
export function activityLine(a: ActivityItem): { text: string; detail?: string } {
  const who = a.actor.name || 'Someone';
  const subject = typeof a.payload?.subject === 'string' ? a.payload.subject : undefined;
  const note = typeof a.payload?.note === 'string' ? a.payload.note : undefined;
  switch (a.type) {
    case 'client_handling':
      return { text: `${who} is handling it`, detail: subject };
    case 'client_handled':
      return { text: `${who} marked it handled`, detail: subject };
    case 'client_handoff':
      return { text: `${who} handed it back to you`, detail: note ? `“${note}”` : subject };
    case 'client_note':
      return { text: `${who} added a note`, detail: note ? `“${note}”` : subject };
    case 'reclassified':
      return { text: 'The AI sorted it again', detail: subject };
    case 'owner_changed':
      return { text: `${who} changed who it's for`, detail: subject };
    case 'draft_sent':
      return { text: `${who} saved a reply`, detail: subject };
    case 'sync_completed':
      return { text: 'Inbox synced' };
    case 'new_email':
      return { text: 'New email arrived', detail: subject };
    default:
      return { text: String(a.type).replace(/_/g, ' '), detail: subject };
  }
}
