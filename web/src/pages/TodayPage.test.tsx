import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TodayPage } from './TodayPage';

vi.mock('@/features/auth/api', () => ({
  useMe: () => ({
    data: {
      user: { id: 'u1', name: 'Alex Morgan', email: 'alex@demo.relay', role: 'assistant' },
      clients: [{ id: 'c1', name: 'Priya Raman', timezone: 'Asia/Kolkata' }],
    },
  }),
  useLogout: () => vi.fn(),
}));

const mockCreateDraft = vi.fn();
const mockPatchThread = vi.fn();
const mockChangeOwner = vi.fn();
const mockDashboardState = {
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  data: {
    counts: { assistant: 1, client: 1, review: 1, none: 0 },
    brief: {
      text: 'Priya has one decision waiting. Alex has two drafts.',
      generatedAt: '2026-11-15T08:00:00Z',
      fallback: false,
    },
    review: [
      {
        id: 'rev-1',
        clientId: 'c1',
        accountId: 'a1',
        subject: 'Quick question',
        snippet: 'Are you free next week?',
        participants: [{ name: 'Samir Patel', email: 'samir@example.com' }],
        owner: 'review',
        ownerSource: 'ai',
        confidence: 0.55,
        reason: 'Ambiguous sender',
        category: 'general',
        actionRequired: true,
        waitingOnOthers: false,
        summary: 'Quick question.',
        keyPoints: [],
        entities: [],
        aiStatus: 'done',
        history: [],
        handoff: { state: 'none' },
        status: 'open',
        important: false,
        unread: true,
        archived: false,
        lastSender: 'them',
        lastMessageAt: new Date().toISOString(),
        messageCount: 1,
      },
    ],
    recent: [
      {
        id: 'rec-1',
        clientId: 'c1',
        accountId: 'a1',
        subject: 'Q3 Board Deck',
        snippet: 'Final sign-off needed.',
        participants: [{ name: 'James Chen', email: 'james@sequoia.com' }],
        owner: 'client',
        ownerSource: 'ai',
        confidence: 0.94,
        reason: 'Client decision required',
        category: 'action',
        actionRequired: true,
        waitingOnOthers: false,
        summary: 'Board deck sign-off.',
        keyPoints: [],
        entities: [],
        aiStatus: 'done',
        history: [],
        handoff: { state: 'none' },
        status: 'open',
        important: true,
        unread: true,
        archived: false,
        lastSender: 'them',
        lastMessageAt: new Date().toISOString(),
        messageCount: 2,
      },
      {
        id: 'rec-2',
        clientId: 'c1',
        accountId: 'a1',
        subject: 'Vendor invoice',
        snippet: 'Needs approval.',
        participants: [{ name: 'Nadia Patel', email: 'nadia@acme.com' }],
        owner: 'client',
        ownerSource: 'ai',
        confidence: 0.88,
        reason: 'Client approval required',
        category: 'finance',
        actionRequired: true,
        waitingOnOthers: false,
        summary: 'Invoice approval.',
        keyPoints: [],
        entities: [],
        aiStatus: 'done',
        history: [],
        handoff: { state: 'none' },
        status: 'open',
        important: false,
        unread: true,
        archived: false,
        lastSender: 'them',
        lastMessageAt: new Date().toISOString(),
        messageCount: 1,
      },
    ],
    nudges: [],
    upcoming: [],
    activity: [],
  },
};

vi.mock('@/features/today/api', () => ({
  useDashboard: () => mockDashboardState,
  useRefreshBrief: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/composer/api', () => ({
  useCreateDraft: () => ({ mutate: mockCreateDraft, isPending: false }),
}));

vi.mock('@/features/inbox/api', () => ({
  useThreadCounts: () => ({ data: { inbox: 2, assistant: 1, client: 1, review: 1 } }),
  useThreads: () => ({ data: { data: [], meta: { total: 0, page: 1, pageSize: 25 } } }),
  useSimulateEmail: () => ({ mutate: vi.fn(), isPending: false }),
  usePatchThread: () => ({ mutate: mockPatchThread, isPending: false }),
  useChangeOwner: () => ({ mutate: mockChangeOwner, isPending: false }),
}));

function renderToday() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter>
          <TodayPage />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('TodayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardState.isError = false;
    mockDashboardState.isLoading = false;
  });

  it('renders Grove hero, stats, weekly chart, and filters ThreadCards', () => {
    renderToday();
    expect(screen.getAllByText('This week').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Assistant queue').length).toBeGreaterThan(0);
    expect(screen.getAllByText("Priya's desk").length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Needs your call' })).toBeInTheDocument();
    expect(screen.getByText('Recently sorted')).toBeInTheDocument();

    const ownerSelect = screen.getByLabelText('Owner');
    fireEvent.change(ownerSelect, { target: { value: 'client' } });
    expect(screen.getAllByText('James Chen').length).toBeGreaterThan(0);
  });

  it('renders subject line and owner pill on clickable ThreadCards without CTA buttons', () => {
    renderToday();
    expect(screen.getAllByText('Q3 Board Deck').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Move up for Priya' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open James Chen' })).toBeInTheDocument();
  });

  it('keeps HeroBand and navigation visible in error state', () => {
    mockDashboardState.isError = true;
    renderToday();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
