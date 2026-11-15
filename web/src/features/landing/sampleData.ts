import type { Owner } from '@/types/api';

export type ScheduleSlot = {
  id: string;
  time: string;
  title: string;
  avatars: string[];
};

export type HeroStat = {
  id: string;
  value: number;
  label: string;
  delta: string;
  direction: 'up' | 'down';
};

export type SampleReplyThread = {
  id: string;
  sender: string;
  initials: string;
  role: string;
  subject: string;
  source: 'gmail' | 'demo';
  owner: Owner;
  confidence: number;
  reason: string;
  keyPoints: string[];
  timeline: { time: string; label: string }[];
};

export type TaskFilterId = 'all' | 'urgent' | 'due-today' | 'waiting' | 'done';

export type SampleTask = {
  id: string;
  highlighted?: boolean;
  person: string;
  personInitials: string;
  personRole: string;
  title: string;
  subtitle?: string;
  timeLabel?: string;
  avatars?: string[];
  statusLabel: string;
  actionKind: 'calendar' | 'send' | 'handoff';
  tags: Exclude<TaskFilterId, 'all'>[];
};

export const SCHEDULE_DATE = 'Thu, Nov 15';
export const SCHEDULE_NOW_TIME = '1:45 pm';

export const SCHEDULE_SLOTS: ScheduleSlot[] = [
  { id: 'slot-1', time: '9:30', title: '9:30 Board prep · Priya', avatars: ['PR', 'AM'] },
  { id: 'slot-2', time: '2:00 pm', title: '2:00 pm Investor call', avatars: ['MC', 'PR'] },
  { id: 'slot-3', time: '4:30', title: '4:30 Contract review', avatars: ['DO'] },
];

export const HERO_STATS: HeroStat[] = [
  { id: 'sorted', value: 34, label: 'threads sorted', delta: '+12 today', direction: 'up' },
  { id: 'assistant', value: 9, label: 'for you', delta: '+3', direction: 'up' },
  { id: 'client', value: 4, label: 'for Priya', delta: '−2', direction: 'down' },
];

export const SAMPLE_THREADS: SampleReplyThread[] = [
  {
    id: 't-maya',
    sender: 'Maya Chen',
    initials: 'MC',
    role: 'VP Finance · Northstar',
    subject: 'Budget sign-off for Q1 offsite',
    source: 'gmail',
    owner: 'client',
    confidence: 0.92,
    reason: 'Priya is asked directly to approve the budget.',
    keyPoints: [
      'Final venue + travel cap is $18,400 for 14 leads.',
      'Deposit lock expires Friday at 5:00 pm.',
      'Maya needs Priya’s yes/no before wiring.',
    ],
    timeline: [
      { time: '10:15', label: 'Synced from Gmail (read-only)' },
      { time: '10:18', label: 'Classified as Client · 92% confident' },
      { time: '10:20', label: 'Added to Priya’s /c queue' },
    ],
  },
  {
    id: 't-daniel',
    sender: 'Daniel Okafor',
    initials: 'DO',
    role: 'Counsel · Okafor LLP',
    subject: 'Redlines on Series A side letter',
    source: 'gmail',
    owner: 'assistant',
    confidence: 0.89,
    reason: 'Routine scheduling and doc routing — Alex can coordinate.',
    keyPoints: [
      'Clean PDF + tracked Word doc attached.',
      'Asked for a 20-minute slot tomorrow afternoon.',
      'No commercial terms changed since Monday.',
    ],
    timeline: [
      { time: '09:40', label: 'Synced from Gmail (read-only)' },
      { time: '09:42', label: 'Classified as Assistant · 89% confident' },
      { time: '09:44', label: 'AI draft prepared for Alex' },
    ],
  },
  {
    id: 't-alex',
    sender: 'Alex Morgan',
    initials: 'AM',
    role: 'Executive assistant',
    subject: 'Board deck dry-run & catering',
    source: 'demo',
    owner: 'review',
    confidence: 0.64,
    reason: 'Mentions both travel logistics and board slides — quick check needed.',
    keyPoints: [
      'Catering headcount confirmed at 12.',
      'Unclear if Priya wants slides printed or PDF.',
      'Flagged below 70% threshold for 1-click confirm.',
    ],
    timeline: [
      { time: '11:02', label: 'Imported to demo inbox' },
      { time: '11:04', label: 'Flagged Needs review · 64% confident' },
      { time: '11:05', label: 'Ready for assistant override' },
    ],
  },
  {
    id: 't-priya',
    sender: 'Priya Raman',
    initials: 'PR',
    role: 'Client · Founder',
    subject: 'Weekly SaaS metrics digest',
    source: 'demo',
    owner: 'none',
    confidence: 0.96,
    reason: 'Automated digest with no questions or action items.',
    keyPoints: [
      'MRR up 6.4% month-over-month.',
      'Churn steady at 1.2%.',
      'Archived out of the main reply queue.',
    ],
    timeline: [
      { time: '08:10', label: 'Imported to demo inbox' },
      { time: '08:11', label: 'Classified as No reply · 96% confident' },
      { time: '08:12', label: 'Kept out of Priya’s queue' },
    ],
  },
  {
    id: 't-hotel',
    sender: 'Soraia Mendes',
    initials: 'SM',
    role: 'Events · Rosewood',
    subject: 'Hold confirmation for Board dinner',
    source: 'gmail',
    owner: 'assistant',
    confidence: 0.94,
    reason: 'Vendor asks for dietary counts and AV setup — assistant handles.',
    keyPoints: [
      'Private dining room held until Thursday.',
      'Needs final guest count by 3:00 pm.',
      'Draft reply ready in Alex’s queue.',
    ],
    timeline: [
      { time: '12:10', label: 'Synced from Gmail (read-only)' },
      { time: '12:12', label: 'Classified as Assistant · 94% confident' },
      { time: '12:14', label: 'Due date extracted: Thu 3:00 pm' },
    ],
  },
  {
    id: 't-investor',
    sender: 'Liam Patel',
    initials: 'LP',
    role: 'Partner · Beacon Ventures',
    subject: 'Quick pulse before 2:00 pm investor call',
    source: 'gmail',
    owner: 'client',
    confidence: 0.91,
    reason: 'Investor asks Priya directly for her Q4 hiring view.',
    keyPoints: [
      'Wants a 2-bullet preview ahead of 2:00 pm.',
      'Confirmed Zoom link works.',
      'Surfaced at top of Priya’s /c view.',
    ],
    timeline: [
      { time: '13:05', label: 'Synced from Gmail (read-only)' },
      { time: '13:06', label: 'Classified as Client · 91% confident' },
      { time: '13:07', label: 'Linked to 2:00 pm Investor call' },
    ],
  },
];

export const SAMPLE_TASKS: SampleTask[] = [
  {
    id: 'task-1',
    highlighted: true,
    person: 'Priya Raman',
    personInitials: 'PR',
    personRole: 'Client · Founder',
    title: 'Investor call',
    timeLabel: 'Thu 2:00 pm',
    avatars: ['MC', 'PR'],
    statusLabel: 'Added to calendar',
    actionKind: 'calendar',
    tags: ['urgent', 'due-today'],
  },
  {
    id: 'task-2',
    person: 'Alex Morgan',
    personInitials: 'AM',
    personRole: 'Executive assistant',
    title: 'Reply to Maya',
    subtitle: "Draft written in your client's tone",
    statusLabel: 'Review draft',
    actionKind: 'send',
    tags: ['due-today'],
  },
  {
    id: 'task-3',
    person: 'Priya Raman',
    personInitials: 'PR',
    personRole: 'Client hand-off',
    title: 'Waiting on Priya',
    subtitle: 'Q1 offsite budget approval',
    statusLabel: "Sent to Priya's view",
    actionKind: 'handoff',
    tags: ['waiting', 'urgent', 'done'],
  },
];

