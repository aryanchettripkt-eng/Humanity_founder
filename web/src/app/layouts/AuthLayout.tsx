import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grove-scroll flex h-full flex-col items-center justify-center overflow-y-auto bg-surface px-4 py-12">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Inbox className="h-5 w-5" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">Relay</span>
      </div>
      <div
        data-reveal=""
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        {children}
      </div>
    </div>
  );
}

