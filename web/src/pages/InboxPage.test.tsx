import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InboxPage } from './InboxPage';

const mockPatch = vi.fn();
const mockChangeOwner = vi.fn();
const mockReclassify = vi.fn();
const mockSuggestion = vi.fn();

const mockThread = {
  id: 't1',
  clientId: 'c1',
  accountId: 'a1',
  subject: 'Series B counsel intro',
  snippet: 'Ready to schedule Friday at 11am.',
  participants: [{ name: 'Elena Ortiz', email: 'elena@goodwin.com' }],
  owner: 'assistant' as const,
  ownerSource: 'ai' as const,
  confidence: 0.92,
  reason: 'Scheduling request for assistant',
  category: 'meeting' as const,
  actionRequired: true,
  waitingOnOthers: false,
  summary: 'Elena wants to schedule the counsel intro.',
  keyPoints: ['Friday at 11am'],
  entities: [
    {
      type: 'meeting' as const,
      title: 'Counsel intro',
      startsAt: '2026-11-20T11:00:00.000Z',
    },
  ],
  aiStatus: 'done' as const,
  history: [],
  handoff: { state: 'none' as const },
  status: 'open' as const,
  important: false,
  unread: false,
  archived: false,
  lastSender: 'them' as const,
  lastMessageAt: new Date().toISOString(),
  messageCount: 1,
};

const mockDetail = {
  ...mockThread,
  messages: [
    {
      id: 'm1',
      threadId: 't1',
      direction: 'inbound' as const,
      from: { name: 'Elena Ortiz', email: 'elena@goodwin.com' },
      to: [{ name: 'Priya Raman', email: 'priya@relay.demo' }],
      sentAt: new Date().toISOString(),
      bodyText: 'Can we meet Friday at 11am?',
    },
  ],
  draft: {
    id: 'd1',
    threadId: 't1',
    clientId: 'c1',
    tone: 'friendly' as const,
    body: 'Hi Elena, Friday at 11am works great.',
    to: [{ name: 'Elena Ortiz', email: 'elena@goodwin.com' }],
    status: 'draft' as const,
  },
};

vi.mock('@/features/inbox/api', () => ({
  useThreadCounts: () => ({ data: { inbox: 2, important: 1, waiting: 0, done: 0, archived: 0 } }),
  useThreads: () => ({
    data: { data: [mockThread], meta: { total: 1, page: 1, pageSize: 25 } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useThreadDetail: () => ({
    data: mockDetail,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePatchThread: () => ({ mutate: mockPatch, isPending: false }),
  useChangeOwner: () => ({ mutate: mockChangeOwner, isPending: false }),
  useReclassifyThread: () => ({ mutate: mockReclassify, isPending: false }),
  useThreadSuggestion: () => ({ mutate: mockSuggestion, isPending: false }),
}));

vi.mock('@/features/composer/api', () => ({
  useCreateDraft: () => ({ mutate: vi.fn(), isPending: false }),
  usePatchDraft: () => ({ mutate: vi.fn(), isPending: false }),
  useSendDraft: () => ({ mutate: vi.fn(), isPending: false }),
  useDiscardDraft: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderInbox(initialEntry = '/app/inbox/inbox/t1') {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/app/inbox/:segment/:threadId?" element={<InboxPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('InboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 4-column glass inbox with rail, list, reading pane, AI insights, and truthful composer copy', () => {
    renderInbox();
    expect(screen.getAllByRole('navigation', { name: 'Inbox segments' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getAllByText('Series B counsel intro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI INSIGHTS').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Save reply/i })).toBeInTheDocument();
    expect(screen.queryByText(/Simulated send/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(simulated\)/i)).not.toBeInTheDocument();
  });

  it('supports keyboard shortcuts s, d, e, and o', () => {
    renderInbox();
    fireEvent.keyDown(window, { key: 's' });
    expect(mockPatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', patch: { important: true } })
    );

    fireEvent.keyDown(window, { key: 'd' });
    expect(mockPatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', patch: { status: 'done' } })
    );

    fireEvent.keyDown(window, { key: 'e' });
    expect(mockPatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', patch: { archived: true } })
    );

    fireEvent.keyDown(window, { key: 'o' });
    expect(mockChangeOwner).toHaveBeenCalledWith({
      id: 't1',
      owner: 'client',
      previousOwner: 'assistant',
    });
  });
});
