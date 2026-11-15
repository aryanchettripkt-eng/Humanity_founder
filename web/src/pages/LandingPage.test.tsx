import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LandingPage } from './LandingPage';

vi.mock('@/features/auth/api', () => ({
  demoLoginApi: vi.fn(),
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

  it('updates SummaryPanel when selecting a different reply card', () => {
    renderLanding();
    expect(screen.getByText('Why: Client')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Inspect Daniel Okafor's thread in Summary" }));
    expect(screen.getByText('Why: Assistant')).toBeInTheDocument();
  });

  it('filters reply cards when clicking owner filter chips', () => {
    renderLanding();
    const assistantChip = screen.getByRole('button', { name: 'Assistant' });
    fireEvent.click(assistantChip);
    expect(assistantChip).toHaveAttribute('aria-pressed', 'true');
  });
});

