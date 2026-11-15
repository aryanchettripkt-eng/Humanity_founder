import { Crown, Undo2 } from 'lucide-react';
import { handoffChipLabel } from '@/features/client-desk/mappers';
import { useActiveClient } from '@/features/client-desk/useActiveClient';
import { cn } from '@/lib/utils';
import type { HandoffState } from '@/types/api';

/** Small chip on a list row that shows what the client did with the email. */
export function HandoffChip({ state }: { state?: HandoffState }) {
  const { firstName } = useActiveClient();
  const label = handoffChipLabel(state, firstName);
  if (!label) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        state === 'client_handling' && 'bg-[var(--chip-bg)] text-[var(--chip-fg)]',
        state === 'handed_to_assistant' &&
          'border border-[var(--btn-outline-border)] text-[var(--fg)]',
        state === 'handled' &&
          'border border-[var(--pane-border)] bg-[var(--card-glass-bg)] text-[var(--fg-muted)]'
      )}
    >
      {state === 'handed_to_assistant' ? (
        <Undo2 className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Crown className="h-3 w-3" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}
