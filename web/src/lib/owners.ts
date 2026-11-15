import {
  BellOff,
  CalendarDays,
  CircleAlert,
  CircleHelp,
  Crown,
  Heart,
  Info,
  Mail,
  Newspaper,
  Receipt,
  Scale,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Category, Owner } from '@/types/api';

export interface OwnerMetaItem {
  id: Owner;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  pillClass: string;
  dotClass: string;
  shortcut: string;
}

export const OWNER_META: Record<Owner, OwnerMetaItem> = {
  assistant: {
    id: 'assistant',
    label: 'Assistant',
    shortLabel: 'You',
    description: 'You can handle scheduling, vendors, or routine replies',
    icon: UserRoundCheck,
    pillClass:
      'text-sky-800 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-500/15 dark:border-sky-500/30',
    dotClass: 'bg-sky-600 dark:bg-sky-400',
    shortcut: '1',
  },
  client: {
    id: 'client',
    label: 'Client',
    shortLabel: 'Client',
    description: 'Needs your client’s personal decision or approval',
    icon: Crown,
    pillClass:
      'text-amber-900 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30',
    dotClass: 'bg-amber-600 dark:bg-amber-400',
    shortcut: '2',
  },
  none: {
    id: 'none',
    label: 'No reply',
    shortLabel: 'No reply',
    description: 'Informational, newsletter, receipt, or resolved',
    icon: BellOff,
    pillClass:
      'text-slate-700 bg-slate-100 border-slate-300 dark:text-slate-300 dark:bg-slate-500/15 dark:border-slate-500/30',
    dotClass: 'bg-slate-500 dark:bg-slate-400',
    shortcut: '3',
  },
  review: {
    id: 'review',
    label: 'Needs review',
    shortLabel: 'Review',
    description: 'Low AI confidence — quick human check needed',
    icon: CircleHelp,
    pillClass:
      'text-rose-800 bg-rose-50 border-dashed border-rose-300 dark:text-rose-300 dark:bg-rose-500/15 dark:border-rose-500/40',
    dotClass: 'bg-rose-600 dark:bg-rose-400',
    shortcut: '4',
  },
};

export const OWNER_ORDER: Owner[] = ['assistant', 'client', 'none', 'review'];

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  meeting: CalendarDays,
  action: CircleAlert,
  update: Info,
  newsletter: Newspaper,
  finance: Receipt,
  legal: Scale,
  personal: Heart,
  general: Mail,
};

