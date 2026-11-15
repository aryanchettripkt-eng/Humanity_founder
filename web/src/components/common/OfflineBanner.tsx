import { WifiOff } from 'lucide-react';
import { useSocketConnected } from '@/lib/socket';

export function OfflineBanner() {
  const connected = useSocketConnected();
  if (connected) return null;

  return (
    <div
      role="status"
      style={{ backgroundColor: 'var(--toast-bg)', color: 'var(--toast-fg)' }}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md md:bottom-6"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>You&apos;re offline. Changes will sync when you&apos;re back.</span>
    </div>
  );
}

