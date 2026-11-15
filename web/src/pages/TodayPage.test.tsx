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
}));

vi.mock('@/features/today/api', () => ({
  useDashboard: () => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      brief: {
        text: 'Priya has one decision waiting. Alex has two drafts.',
        generatedAt: '2026-11-15T08:00:00Z',
      },
      review: [
        {
          id: 'rev-1',
          subject: 'Quick question',
          snippet: 'Are you free next week?',
          participants: [{ name: 'Samir Patel', email: 'samir@example.com' }],
          owner: 'review',
          ownerSource: 'ai',
          confidence: 0.55,
          reason: 'Ambiguous sender',
          category: 'general',
          status: 'action_required',
          important: false,
          unread: true,
          archived: false,
          lastMessageAt: '2026-11-15T07:00:00Z',
          messageCount: 1,
        },
      ],
      recent: [
        {
          id: 'rec-1',
          subject: 'Q3 Board Deck',
          snippet: 'Final sign-off needed.',
          participants: [{ name: 'James Chen', email: 'james@sequoia.com' }],
          owner: 'client',
          ownerSource: 'ai',
          confidence: 0.94,
          reason: 'Client decision required',
          category: 'important',
          status: 'action_required',
          important: true,
          unread: true,
          archived: false,
          lastMessageAt: '2026-11-15T06:00:00Z',
          messageCount: 2,
        },
      ],
      nudges: [],
      upcoming: [
        {
          threadId: 'rec-1',
          subject: 'Q3 Board Deck',
          title: 'Board deck sign-off',
          startsAt: new Date(Date.now() + 3600_000).toISOString(),
        },
      ],
      activity: [],
    },
  }),
  useRefreshBrief: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/inbox/api', () => ({
  useThreadCounts: () => ({ data: { assistant: 1, client: 1, review: 1 } }),
  useChangeOwner: () => ({ mutate: vi.fn(), isPending: false }),
  usePatchThread: () => ({ mutate: vi.fn(), isPending: false }),
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
  });

  it('renders workspace header, grid, and filters cards by chip', () => {
    renderToday();
    expect(screen.getByRole('heading', { name: "PRIYA'S INBOX" })).toBeInTheDocument();
    expect(screen.getByText('2 shown')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Client' }));
    expect(screen.getByText('1 shown')).toBeInTheDocument();
    expect(screen.getAllByText('James Chen').length).toBeGreaterThan(0);
  });
});

