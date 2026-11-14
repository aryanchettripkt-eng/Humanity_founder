import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from 'date-fns';

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

export function formatUpcomingDate(iso: string | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
  return format(d, 'EEE MMM d, h:mm a');
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

