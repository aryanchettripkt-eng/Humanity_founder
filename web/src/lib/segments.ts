import {
  Archive,
  BellOff,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clock,
  Crown,
  Inbox,
  Layers,
  Star,
  Sun,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';
import type { SegmentId } from '@/types/api';

export interface SegmentConfig {
  id: SegmentId;
  label: string;
  icon: LucideIcon;
  group: 'primary' | 'owner' | 'status';
  emptyTitle: string;
  emptyDescription: string;
}

export const SEGMENTS: SegmentConfig[] = [
  {
    id: 'today',
    label: 'Today',
    icon: Sun,
    group: 'primary',
    emptyTitle: 'Nothing scheduled today',
    emptyDescription: 'Everything is clear.',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: Inbox,
    group: 'primary',
    emptyTitle: 'Inbox zero',
    emptyDescription: 'All open conversations have been handled.',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    icon: UserRoundCheck,
    group: 'owner',
    emptyTitle: 'Nothing on your plate. Nice.',
    emptyDescription: 'No open threads currently need an assistant reply.',
  },
  {
    id: 'client',
    label: 'Client',
    icon: Crown,
    group: 'owner',
    emptyTitle: 'Nothing waiting on your client.',
    emptyDescription: 'Your client has no pending decisions right now.',
  },
  {
    id: 'review',
    label: 'Needs review',
    icon: CircleHelp,
    group: 'owner',
    emptyTitle: 'AI is confident about everything right now.',
    emptyDescription: 'No low-confidence threads need a human check.',
  },
  {
    id: 'none',
    label: 'No reply',
    icon: BellOff,
    group: 'owner',
    emptyTitle: 'No informational threads',
    emptyDescription: 'Newsletters, receipts, and FYIs appear here.',
  },
  {
    id: 'action',
    label: 'Action required',
    icon: CircleAlert,
    group: 'status',
    emptyTitle: 'No action required',
    emptyDescription: 'All action items are cleared.',
  },
  {
    id: 'waiting',
    label: 'Waiting',
    icon: Clock,
    group: 'status',
    emptyTitle: 'Not waiting on anyone',
    emptyDescription: 'Sent replies awaiting a response appear here.',
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: CalendarDays,
    group: 'status',
    emptyTitle: 'No meeting threads',
    emptyDescription: 'Scheduling and calendar threads appear here.',
  },
  {
    id: 'important',
    label: 'Important',
    icon: Star,
    group: 'status',
    emptyTitle: 'No starred threads',
    emptyDescription: 'Starred conversations appear here.',
  },
  {
    id: 'general',
    label: 'General',
    icon: Layers,
    group: 'status',
    emptyTitle: 'No general updates',
    emptyDescription: 'Updates and newsletters appear here.',
  },
  {
    id: 'done',
    label: 'Done',
    icon: CheckCircle2,
    group: 'status',
    emptyTitle: 'Nothing marked done yet',
    emptyDescription: 'Completed threads appear here.',
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: Archive,
    group: 'status',
    emptyTitle: 'Archive is empty',
    emptyDescription: 'Archived conversations appear here.',
  },
];

export const SEGMENT_MAP: Record<SegmentId, SegmentConfig> = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s])
) as Record<SegmentId, SegmentConfig>;

