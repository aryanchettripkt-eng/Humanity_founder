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
  chartColor: string;
  shortcut: string;
}

export const OWNER_META: Record<Owner, OwnerMetaItem> = {
  assistant: {
    id: 'assistant',
    label: 'Assistant',
    shortLabel: 'For you',
    description: 'You can handle scheduling, vendors, or routine replies',
    icon: UserRoundCheck,
    pillClass:
      'text-grove-forest bg-grove-forest/10 border-grove-forest/25 dark:text-emerald-300 dark:bg-grove-forest/20 dark:border-grove-forest/40',
    dotClass: 'bg-grove-forest',
    chartColor: 'var(--chart-assistant)',
    shortcut: '1',
  },
  client: {
    id: 'client',
    label: 'Client',
    shortLabel: 'For client',
    description: 'Needs your client’s personal decision or approval',
    icon: Crown,
    pillClass:
      'text-grove-clay bg-grove-clay/10 border-grove-clay/25 dark:text-stone-300 dark:bg-grove-clay/20 dark:border-grove-clay/40',
    dotClass: 'bg-grove-clay',
    chartColor: 'var(--chart-client)',
    shortcut: '2',
  },
  none: {
    id: 'none',
    label: 'No reply',
    shortLabel: 'No reply',
    description: 'Informational, newsletter, receipt, or resolved',
    icon: BellOff,
    pillClass:
      'text-foreground bg-grove-linen border-border dark:text-stone-200 dark:bg-grove-linen/60 dark:border-border',
    dotClass: 'bg-muted-foreground',
    chartColor: 'var(--chart-none)',
    shortcut: '3',
  },
  review: {
    id: 'review',
    label: 'Needs review',
    shortLabel: 'Needs your call',
    description: 'Low AI confidence — quick human check needed',
    icon: CircleHelp,
    pillClass:
      'text-grove-terracotta bg-grove-terracotta/10 border-dashed border-grove-terracotta/40 dark:text-orange-300 dark:bg-grove-terracotta/20 dark:border-grove-terracotta/50',
    dotClass: 'bg-grove-terracotta',
    chartColor: 'hsl(var(--grove-terracotta))',
    shortcut: '4',
  },
};

export const OWNER_ORDER: Owner[] = ['assistant', 'client', 'none', 'review'];

export function getOwnerShortLabel(owner: Owner, clientFirstName?: string): string {
  if (owner === 'client' && clientFirstName) {
    return `For ${clientFirstName}`;
  }
  return OWNER_META[owner].shortLabel;
}

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

