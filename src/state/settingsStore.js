// Settings store (Zustand) with lightweight localStorage persistence.
// Holds cross-cutting UI/app settings that must survive reloads: the active
// top-level view, the sidebar folded state, the chosen sync folder, the active
// graph grouping mode, and the editable "Graph Formula" (geometry knobs).
// Persistence is hand-rolled (not zustand/middleware) to keep the dependency
// surface small and the behaviour obvious.

import { create } from 'zustand';

const STORAGE_KEY = 'personagraph.settings';

// Default geometry parameters for the graph layout. Every layout constant the
// user might want to tune lives here so the Settings → Graph Formula tab can
// drive the canvas. Units are canvas pixels unless noted.
export const DEFAULT_FORMULA = {
  edgeLength: 150, // polygon side / spring length between adjacent nodes
  nodeSpacing: 12, // extra repulsion padding between nodes
  clusterGap: 90, // gap between separate clique circles
  groupRingRadius: 340, // radius of the ring that grouped bubbles sit on
  bubbleSize: 96, // collapsed group-bubble diameter
  physics: true, // run the live force simulation in "None" mode
  expandMs: 420 // group expand/reveal animation duration (ms)
};

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

  // Active graph grouping mode: 'none' | 'country' | 'city' | 'relation' |
  // 'importance'. Not persisted — always start ungrouped.
  graphMode: 'none',

  // Sidebar fold, sync folder, and the graph formula ARE persisted.
  sidebarFolded: persisted.sidebarFolded ?? false,
  syncFolder: persisted.syncFolder ?? null,
  // Merge persisted formula over defaults so new keys appear for old users.
  formula: { ...DEFAULT_FORMULA, ...(persisted.formula || {}) },

  setView: (view) => set({ view }),

  setGraphMode: (graphMode) => set({ graphMode }),

  toggleSidebar: () =>
    set((s) => {
      const next = { sidebarFolded: !s.sidebarFolded };
      persist({ ...get(), ...next });
      return next;
    }),

  setSyncFolder: (folder) => {
    persist({ ...get(), syncFolder: folder });
    set({ syncFolder: folder });
  },

  // Patch one or more formula fields and persist.
  setFormula: (patch) => {
    const formula = { ...get().formula, ...patch };
    persist({ ...get(), formula });
    set({ formula });
  },

  // Restore all geometry knobs to their defaults.
  resetFormula: () => {
    const formula = { ...DEFAULT_FORMULA };
    persist({ ...get(), formula });
    set({ formula });
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
        syncFolder: state.syncFolder,
        formula: state.formula
      })
    );
  } catch {
    // Non-fatal: settings just won't persist this session.
  }
}
