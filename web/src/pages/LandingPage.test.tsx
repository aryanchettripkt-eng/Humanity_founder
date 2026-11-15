import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { demoLoginApi } from '@/features/auth/api';
import { LandingPage } from './LandingPage';

vi.mock('@/features/auth/api', () => ({
  demoLoginApi: vi.fn().mockResolvedValue({ token: 'tok', user: { id: '1', role: 'assistant' } }),
}));

beforeAll(() => {
  if (!('IntersectionObserver' in globalThis)) {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }
  if (!window.matchMedia) {
    window.matchMedia = (() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.classList.remove('dark');
});

function renderLanding() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('LandingPage', () => {
  it('renders hero, sections, summary panel, and footer CTA', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: 'WHO REPLIES?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who needs to reply' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your day' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'STOP GUESSING WHO REPLIES' })).toBeInTheDocument();
  });

  it('updates SummaryPanel preview and timeline when selecting a different reply card', () => {
    renderLanding();
    expect(screen.getByText('2 emails need you, Priya')).toBeInTheDocument();
    expect(screen.getByText('Why: Client')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: "Inspect Daniel Okafor's thread in Summary" }));
    expect(screen.getByText("Not in Priya's queue · Alex handles it")).toBeInTheDocument();
    expect(screen.getByText('Why: Assistant')).toBeInTheDocument();
    expect(screen.queryByText('2 emails need you, Priya')).not.toBeInTheDocument();
  });

  it('filters reply cards and updates the thread count', async () => {
    renderLanding();
    expect(screen.getByText('4 of 6 threads')).toBeInTheDocument();

    const clientChip = screen.getByRole('button', { name: 'Client' });
    fireEvent.click(clientChip);

    expect(clientChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 threads')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Liam Patel')).toBeInTheDocument();
    });
  });

  it('shows empty state and 0 count when a filter matches no tasks', async () => {
    renderLanding();
    expect(screen.getByText('3 tasks')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('0 tasks')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Nothing marked done yet.')).toBeInTheDocument();
    });
  });

  it('calls demoLoginApi with the right role from CTA buttons', async () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Try as assistant' }));
    await waitFor(() => {
      expect(demoLoginApi).toHaveBeenCalledWith('assistant');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Try as client' }));
    await waitFor(() => {
      expect(demoLoginApi).toHaveBeenCalledWith('client');
    });
  });

  it('forces light mode on html while mounted and restores dark class on unmount', () => {
    document.documentElement.classList.add('dark');
    const { unmount } = renderLanding();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    unmount();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
