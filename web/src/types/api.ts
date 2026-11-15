export type Owner = 'assistant' | 'client' | 'none' | 'review';
export type OwnerSource = 'ai' | 'rule' | 'manual' | 'client';
export type SegmentId =
  | 'today'
  | 'inbox'
  | 'assistant'
  | 'client'
  | 'review'
  | 'action'
  | 'waiting'
  | 'meetings'
  | 'important'
  | 'general'
  | 'none'
  | 'done'
  | 'archived';

export type Category =
  | 'meeting'
  | 'action'
  | 'update'
  | 'newsletter'
  | 'finance'
  | 'legal'
  | 'personal'
  | 'general';

export type HandoffState = 'none' | 'client_handling' | 'handed_to_assistant' | 'handled';
export type ThreadStatus = 'open' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'assistant' | 'client';
  clientId?: string;
  onboarding: {
    completed: boolean;
    tourSeen: boolean;
  };
}

export interface ClientSummary {
  id: string;
  name: string;
  firstName: string;
  email: string;
  title?: string;
  timezone?: string;
  assistantId: string;
  profile: {
    delegation: string;
    vipSenders: string[];
  };
}

export interface EmailAccount {
  id: string;
  clientId: string;
  assistantId: string;
  provider: 'gmail' | 'outlook';
  address: string;
  status: 'connecting' | 'syncing' | 'connected' | 'error' | 'disconnected';
  lastSyncedAt?: string;
  error?: string;
  simulated: boolean;
}

export interface Participant {
  name: string;
  email: string;
}

export interface ThreadEntity {
  type: 'meeting' | 'deadline' | 'date';
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
}

export interface ClassificationHistoryItem {
  at: string;
  from: string;
  to: string;
  source: string;
  reason: string;
}

export type ThreadSource = 'seed' | 'simulated' | 'gmail';

export interface HealthInfo {
  ok: boolean;
  ai: string;
  gmail?: boolean;
  googleLogin?: boolean;
}

export interface ThreadListItem {
  id: string;
  clientId: string;
  accountId: string;
  source?: ThreadSource;
  externalId?: string;
  subject: string;
  snippet: string;
  participants: Participant[];
  lastMessageAt: string;
  messageCount: number;
  lastSender: 'them' | 'us';
  unread: boolean;
  important: boolean;
  archived: boolean;
  status: ThreadStatus;
  owner: Owner;
  ownerSource: OwnerSource;
  suggestedOwner?: 'assistant' | 'client' | 'none';
  confidence: number;
  reason: string;
  clientReason?: string;
  category: Category;
  actionRequired: boolean;
  waitingOnOthers: boolean;
  summary: string;
  keyPoints: string[];
  entities: ThreadEntity[];
  reclassifiedAt?: string;
  aiStatus: 'pending' | 'done' | 'failed';
  aiModel?: string;
  history: ClassificationHistoryItem[];
  handoff: {
    state: HandoffState;
    note?: string;
    at?: string;
  };
}

export interface Message {
  id: string;
  threadId: string;
  clientId: string;
  from: Participant;
  to: Participant[];
  cc: Participant[];
  sentAt: string;
  bodyText: string;
  bodyHtml?: string;
  direction: 'inbound' | 'outbound';
  simulated: boolean;
}

export interface Draft {
  id: string;
  threadId: string;
  clientId: string;
  createdBy: 'ai' | 'user';
  tone: 'formal' | 'friendly' | 'brief';
  instruction?: string;
  sourceNote?: string;
  to: Participant[];
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'discarded';
  updatedAt?: string;
}

export interface ThreadDetail extends ThreadListItem {
  messages: Message[];
  draft: Draft | null;
}

export interface ActivityItem {
  id: string;
  clientId: string;
  actor: { type: 'client' | 'assistant' | 'ai' | 'system'; name: string };
  type:
    | 'client_handling'
    | 'client_handled'
    | 'client_handoff'
    | 'client_note'
    | 'reclassified'
    | 'owner_changed'
    | 'draft_sent'
    | 'sync_completed'
    | 'new_email';
  threadId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface UpcomingItem {
  threadId: string;
  subject: string;
  type: 'meeting' | 'deadline' | 'date';
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
}

export interface MorningBrief {
  text: string;
  generatedAt: string;
  fallback: boolean;
}

export interface DashboardSummary {
  counts: Record<string, number>;
  brief: MorningBrief;
  upcoming: UpcomingItem[];
  review: ThreadListItem[];
  recent: ThreadListItem[];
  nudges: ThreadListItem[];
  activity: ActivityItem[];
}

export interface SyncProgressEvent {
  accountId: string;
  step: 'fetching' | 'classifying' | 'extracting' | 'done';
  done: number;
  total: number;
}

