import type { Category, Owner, OwnerSource } from '@/types/api';

export type PersonCardModel = {
  id: string;
  name: string;
  initials: string;
  subtitle: string;
  source: 'gmail' | 'demo';
  category?: Category;
  owner: Owner;
  ownerSource?: OwnerSource;
  confidence: number;
  href?: string;
  showQuickAssign?: boolean;
};

export type TaskStatusOption = {
  id: string;
  label: string;
};

export type TaskCardModel = {
  id: string;
  threadId?: string;
  person: string;
  initials: string;
  role: string;
  title: string;
  iconKind: 'calendar' | 'sparkles' | 'crown' | 'clock';
  dateLabel?: string;
  avatars?: string[];
  statusLabel: string;
  statusOptions?: TaskStatusOption[];
  primaryLabel: string;
  highlighted?: boolean;
  href?: string;
};

export type FocusPanelModel = {
  id: string;
  owner: Owner;
  ownerLabel: string;
  confidence: number;
  reason: string;
  subject: string;
  sender: string;
  keyPoints: string[];
  timeline: Array<{ time: string; label: string }>;
  dates?: Array<{ id: string; title: string; dateLabel: string }>;
  href?: string;
  phonePreview: {
    badge: string;
    headline: string;
    subline: string;
    lastAction?: string;
    isClientQueue: boolean;
  };
};

export type WorkspaceStatModel = {
  id: string;
  value: number;
  label: string;
  delta?: string;
  deltaTone?: 'up' | 'down';
  href?: string;
};

