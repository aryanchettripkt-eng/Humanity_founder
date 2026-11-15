import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import type { GlassTabItem } from '@/components/grove/GlassTabs';
import { TopNav } from '@/components/grove/TopNav';
import { useLogout, useMe } from '@/features/auth/api';
import { useSimulateEmail, useThreadCounts } from '@/features/inbox/api';
import { getInitials } from '@/lib/format';
import { useCommandStore } from '@/stores/command';
import { useUiStore } from '@/stores/ui';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export function AssistantTopNav() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const { data: me } = useMe();
  const { activeClientId, setActiveClientId, theme, toggleTheme } = useUiStore();
  const { setOpen: setPaletteOpen, openAsk } = useCommandStore();

  const validClientIds = new Set(me?.clients?.map((c) => c.id) ?? []);
  const clientId =
    (activeClientId && (!me || validClientIds.has(activeClientId))
      ? activeClientId
      : me?.clients?.[0]?.id) || undefined;

  const { data: counts } = useThreadCounts(clientId);
  const simulateEmail = useSimulateEmail();

  const tabs: GlassTabItem[] = [
    { id: 'today', label: 'Today', to: '/app/today' },
    { id: 'inbox', label: 'Inbox', to: '/app/inbox/inbox' },
    { id: 'client', label: 'Client view', to: '/c?preview=1' },
    { id: 'ask', label: 'Ask AI' },
  ];

  const activeTabId = location.pathname.startsWith('/app/inbox')
    ? 'inbox'
    : location.pathname.startsWith('/c')
      ? 'client'
      : 'today';

  const clients = (me?.clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    initials: getInitials(c.name),
    openCount: c.id === clientId ? counts?.inbox : undefined,
  }));

  const userName = me?.user.name || 'Alex Morgan';

  return (
    <TopNav
      variant="app"
      logoHref="/app/today"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={(id) => {
        if (id === 'ask') openAsk('');
      }}
      clients={clients}
      activeClientId={clientId}
      onSelectClient={(id) => {
        setActiveClientId(id);
        queryClient.invalidateQueries({ queryKey: ['threads'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }}
      userName={userName}
      userEmail={me?.user.email}
      userInitials={getInitials(userName)}
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenSearch={() => setPaletteOpen(true)}
      settingsHref="/app/settings/accounts"
      showSendTestEmail={DEMO_MODE && Boolean(clientId)}
      onSendTestEmail={() => {
        if (clientId) simulateEmail.mutate(clientId);
      }}
      onSignOut={() => {
        logout();
        navigate('/login', { replace: true });
      }}
    />
  );
}

