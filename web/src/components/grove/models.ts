import type { LucideIcon } from 'lucide-react';
import type { Category, Owner } from '@/types/api';

export type GroveStatModel = {
  id: string;
  label: string;
  value: number | string;
  delta?: string;
  deltaTone?: 'positive' | 'neutral' | 'negative';
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
};

export type GroveListRowModel = {
  id: string;
  name: string;
  initials: string;
  subtitle: string;
  rightText: string;
  href?: string;
  onClick?: () => void;
};

export type GroveBarDayModel = {
  key: string;
  label: string;
  assistant: number;
  client: number;
  none: number;
};

export type GroveThreadCardModel = {
  id: string;
  sender: string;
  initials: string;
  domain: string;
  subject?: string;
  owner: Owner;
  ownerLabel: string;
  confidence: number;
  nextDateLabel: string;
  series: number[];
  sparkTone: 'olive' | 'ink';
  deltaText: string;
  deltaDirection: 'up' | 'down';
  ctaLabel: string;
  href?: string;
  category?: Category;
};

export type GroveThreadRowModel = {
  id: string;
  sender: string;
  initials: string;
  subject: string;
  owner: Owner;
  timeLabel: string;
  unread: boolean;
  href?: string;
};

export type GroveFilterOption<T extends string = string> = {
  value: T;
  label: string;
};

