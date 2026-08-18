// Settings store (Zustand) with lightweight localStorage persistence.
// Holds cross-cutting UI/app settings that must survive reloads: the active
// top-level view (graph/settings/account), the sidebar folded state, and the
// chosen sync folder. Persistence is hand-rolled (not zustand/middleware) to
// keep the dependency surface small and the behaviour obvious.

import { create } from 'zustand';

const STORAGE_KEY = 'personagraph.settings';

// Load persisted settings once at startup. Wrapped in try/catch because
// localStorage can be unavailable or hold corrupt JSON — we fall back to
// defaults rather than crash the app on boot.
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const persisted = loadPersisted();

export const useSettingsStore = create((set, get) => ({
  // Which top-level page is showing. Not persisted deliberately — the app
  // should always open on the graph.
  view: 'graph',

  // Sidebar fold state and the sync folder ARE persisted (see persist() below).
  sidebarFolded: persisted.sidebarFolded ?? false,
  syncFolder: persisted.syncFolder ?? null,

  setView: (view) => set({ view }),

  toggleSidebar: () =>
    set((s) => {
      const next = { sidebarFolded: !s.sidebarFolded };
      persist({ ...get(), ...next });
      return next;
    }),

  setSyncFolder: (folder) => {
    persist({ ...get(), syncFolder: folder });
    set({ syncFolder: folder });
  }
}));

// Write only the persistable slice back to localStorage. Kept out of the store
// object so it isn't mistaken for an action.
function persist(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sidebarFolded: state.sidebarFolded,
        syncFolder: state.syncFolder
      })
    );
  } catch {
    // Non-fatal: settings just won't persist this session.
  }
}
