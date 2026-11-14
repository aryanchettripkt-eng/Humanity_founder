import { WifiOff } from 'lucide-react';
import { useSocketConnected } from '@/lib/socket';

export function OfflineBanner() {
  const connected = useSocketConnected();
  if (connected) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>Realtime connection paused — reconnecting automatically…</span>
    </div>
  );
}

