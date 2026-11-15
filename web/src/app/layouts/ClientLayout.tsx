import { Outlet, useSearchParams } from 'react-router-dom';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { AppFrame } from '@/components/grove/AppFrame';
import { BottomTabBar } from '@/components/grove/BottomTabBar';
import { useMe } from '@/features/auth/api';
import { AskPanel } from '@/features/command/AskPanel';
import { CommandPalette } from '@/features/command/CommandPalette';
import { useCommandStore } from '@/stores/command';

/** Same glass shell as the assistant app. The page renders its own hero (nav + greeting). */
export function ClientLayout() {
  const { data: me } = useMe();
  const [searchParams] = useSearchParams();
  const { openAsk } = useCommandStore();
  const isPreview = me?.user.role === 'assistant' && searchParams.get('preview') === '1';

  return (
    <AppFrame>
      <OfflineBanner />
      <Outlet />
      {isPreview ? (
        <>
          <BottomTabBar onOpenAsk={() => openAsk('')} />
          <CommandPalette />
          <AskPanel />
        </>
      ) : null}
    </AppFrame>
  );
}
