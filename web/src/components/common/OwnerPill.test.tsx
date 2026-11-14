import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OWNER_META, OWNER_ORDER } from '@/lib/owners';
import { OwnerPill } from './OwnerPill';

describe('OwnerPill', () => {
  it('renders every owner label from OWNER_META', () => {
    for (const owner of OWNER_ORDER) {
      const { unmount } = render(<OwnerPill owner={owner} />);
      expect(screen.getByText(OWNER_META[owner].label)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders loading shimmer when loading=true', () => {
    render(<OwnerPill owner="assistant" loading />);
    expect(screen.getByLabelText('Classifying owner')).toBeInTheDocument();
  });
});

