import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  theme: 'light' | 'dark';
  activeClientId: string | null;
  newThreadIds: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleAiPanel: () => void;
  setAiPanelOpen: (v: boolean) => void;
  toggleTheme: () => void;
  setActiveClientId: (id: string | null) => void;
  markNewThread: (id: string) => void;
  clearNewThread: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      aiPanelOpen: true,
      theme: 'light',
      activeClientId: null,
      newThreadIds: [],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setAiPanelOpen: (v) => set({ aiPanelOpen: v }),
      toggleTheme: () =>
        set((s) => ({
          theme: s.theme === 'light' ? 'dark' : 'light',
        })),
      setActiveClientId: (id) => set({ activeClientId: id }),
      markNewThread: (id) =>
        set((s) => ({
          newThreadIds: s.newThreadIds.includes(id) ? s.newThreadIds : [...s.newThreadIds, id],
        })),
      clearNewThread: (id) =>
        set((s) => ({
          newThreadIds: s.newThreadIds.filter((x) => x !== id),
        })),
    }),
    {
      name: 'relay-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        aiPanelOpen: s.aiPanelOpen,
        theme: s.theme,
        activeClientId: s.activeClientId,
      }),
    }
  )
);

