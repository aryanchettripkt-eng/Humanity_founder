import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SeenClientCounts = {
  assistant: number;
  client: number;
  review: number;
};

interface UiState {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  clientDeskCollapsed: boolean;
  theme: 'light' | 'dark';
  activeClientId: string | null;
  activeClientUserId: string | null;
  newThreadIds: string[];
  lastSeenCounts: Record<string, SeenClientCounts>;
  lastSeenActivityAt: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleAiPanel: () => void;
  setAiPanelOpen: (v: boolean) => void;
  toggleClientDeskCollapsed: () => void;
  setClientDeskCollapsed: (v: boolean) => void;
  toggleTheme: () => void;
  setActiveClientId: (id: string | null) => void;
  setActiveClientUserId: (id: string | null) => void;
  markNewThread: (id: string) => void;
  clearNewThread: (id: string) => void;
  setLastSeenCounts: (clientId: string, counts: SeenClientCounts) => void;
  markActivitySeen: (iso?: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      aiPanelOpen: true,
      clientDeskCollapsed: false,
      theme: 'light',
      activeClientId: null,
      activeClientUserId: null,
      newThreadIds: [],
      lastSeenCounts: {},
      lastSeenActivityAt: null,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setAiPanelOpen: (v) => set({ aiPanelOpen: v }),
      toggleClientDeskCollapsed: () =>
        set((s) => ({ clientDeskCollapsed: !s.clientDeskCollapsed })),
      setClientDeskCollapsed: (v) => set({ clientDeskCollapsed: v }),
      toggleTheme: () =>
        set((s) => ({
          theme: s.theme === 'light' ? 'dark' : 'light',
        })),
      setActiveClientId: (id) => set({ activeClientId: id }),
      setActiveClientUserId: (id) => set({ activeClientUserId: id }),
      markNewThread: (id) =>
        set((s) => ({
          newThreadIds: s.newThreadIds.includes(id) ? s.newThreadIds : [...s.newThreadIds, id],
        })),
      clearNewThread: (id) =>
        set((s) => ({
          newThreadIds: s.newThreadIds.filter((x) => x !== id),
        })),
      setLastSeenCounts: (clientId, counts) =>
        set((s) => ({
          lastSeenCounts: { ...s.lastSeenCounts, [clientId]: counts },
        })),
      markActivitySeen: (iso) =>
        set({
          lastSeenActivityAt: iso ?? new Date().toISOString(),
        }),
    }),
    {
      name: 'relay-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        aiPanelOpen: s.aiPanelOpen,
        clientDeskCollapsed: s.clientDeskCollapsed,
        theme: s.theme,
        activeClientId: s.activeClientId,
        activeClientUserId: s.activeClientUserId,
        lastSeenCounts: s.lastSeenCounts,
        lastSeenActivityAt: s.lastSeenActivityAt,
      }),
    }
  )
);

