import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';

export function formatShortDate(iso: string | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function formatRelativeTime(iso: string | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatFullDateTime(iso: string | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'EEE, MMM d, yyyy · h:mm a');
}

export function formatUpcomingDate(iso: string | Date, timeZone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const tz = timeZone || undefined;
  const dayKey = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);

  const targetKey = dayKey(d);
  if (targetKey === dayKey(now)) return `Today, ${timeStr}`;
  if (targetKey === dayKey(tomorrow)) return `Tomorrow, ${timeStr}`;

  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
  return `${dateStr}, ${timeStr}`;
}

export function getInitials(nameOrEmail: string): string {
  const clean = nameOrEmail.trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function isWithin24Hours(iso?: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 24 * 60 * 60 * 1000;
}

