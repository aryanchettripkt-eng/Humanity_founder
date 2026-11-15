import { WifiOff } from 'lucide-react';
import { useSocketConnected } from '@/lib/socket';

export function OfflineBanner() {
  const connected = useSocketConnected();
  if (connected) return null;

  return (
    <div
      role="status"
      className="glass fixed left-1/2 top-4 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg md:top-20"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>You&apos;re offline. Changes will sync when you&apos;re back.</span>
    </div>
  );
}

