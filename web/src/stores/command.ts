import { create } from 'zustand';

interface CommandState {
  open: boolean;
  askOpen: boolean;
  initialQuestion: string;
  setOpen: (v: boolean) => void;
  openAsk: (question?: string) => void;
  setAskOpen: (v: boolean) => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  open: false,
  askOpen: false,
  initialQuestion: '',
  setOpen: (v) => set({ open: v }),
  openAsk: (question = '') => set({ open: false, askOpen: true, initialQuestion: question }),
  setAskOpen: (v) => set({ askOpen: v }),
}));

