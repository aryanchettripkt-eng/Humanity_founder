import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { GuidedTour } from '@/components/common/GuidedTour';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { AppFrame } from '@/components/grove/AppFrame';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { BottomTabBar } from '@/components/grove/BottomTabBar';
import { HeroBand } from '@/components/grove/HeroBand';
import { useMe } from '@/features/auth/api';
import { AskPanel } from '@/features/command/AskPanel';
import { CommandPalette } from '@/features/command/CommandPalette';
import { qk } from '@/lib/queryKeys';
import { useSocketEvent } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { useCommandStore } from '@/stores/command';
import { useUiStore } from '@/stores/ui';
import type { ActivityItem, ThreadListItem } from '@/types/api';

export function AssistantLayout() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { data: me } = useMe();
  const { activeClientId, markNewThread } = useUiStore();
  const { openAsk } = useCommandStore();

  const validClientIds = new Set(me?.clients?.map((c) => c.id) ?? []);
  const clientId =
    (activeClientId && (!me || validClientIds.has(activeClientId))
      ? activeClientId
      : me?.clients?.[0]?.id) || undefined;

  const onThreadCreated = useCallback(
    (t: ThreadListItem) => {
      markNewThread(t.id);
      queryClient.invalidateQueries({ queryKey: qk.threads.all() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    [markNewThread, queryClient]
  );

  const onThreadUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.threads.all() });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const onCountsChanged = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.threads.counts(clientId) });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [clientId, queryClient]);

  const onActivityNew = useCallback(
    (act: ActivityItem) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (act.actor.type === 'client') {
        toast.info(`${act.actor.name}: ${act.type.replace(/_/g, ' ')}`);
      }
    },
    [queryClient]
  );

  useSocketEvent<ThreadListItem>('thread:created', onThreadCreated);
  useSocketEvent('thread:updated', onThreadUpdated);
  useSocketEvent('counts:changed', onCountsChanged);
  useSocketEvent<ActivityItem>('activity:new', onActivityNew);
  useSocketEvent('draft:created', onThreadUpdated);

  const isToday = location.pathname === '/app/today';
  const isInbox = location.pathname.startsWith('/app/inbox');
  const pageTitle = location.pathname.startsWith('/app/settings') ? 'Settings' : 'Inbox';

  return (
    <AppFrame>
      <OfflineBanner />

      {/* Pages that render their own HeroBand (TodayPage) embed AssistantTopNav inside it */}
      {!isToday ? (
        <HeroBand
          size="short"
          nav={<AssistantTopNav />}
          left={
            <h1
              style={{ textShadow: 'var(--hero-text-shadow)' }}
              className="font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-[var(--fg)] md:text-[48px]"
            >
              {pageTitle}
            </h1>
          }
        />
      ) : null}

      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isInbox
            ? 'overflow-hidden px-[clamp(16px,2.5vw,32px)] pb-[clamp(16px,2.5vw,32px)]'
            : isToday
              ? 'overflow-hidden'
              : 'grove-scroll overflow-y-auto'
        )}
      >
        {!isToday && !isInbox ? (
          <div className="mx-[clamp(16px,2.5vw,32px)] mb-[clamp(16px,2.5vw,32px)] flex min-h-0 flex-1 flex-col">
            <div className="working-panel flex min-h-0 flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <BottomTabBar onOpenAsk={() => openAsk('')} />
      <CommandPalette />
      <AskPanel />
      <GuidedTour />
    </AppFrame>
  );
}
