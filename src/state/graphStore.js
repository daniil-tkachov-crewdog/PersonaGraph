// Graph store (Zustand).
// The single source of truth for the graph: the fixed Admin node, all person
// nodes, and all directed edges. Every mutation the UI performs goes through an
// action here so the invariants hold in ONE place:
//   - the Admin node always exists, is never deleted, never moved;
//   - no person node is ever orphaned (each is created FROM an existing node,
//     which immediately gives it a two-way connection);
//   - every connection is a pair of directed edges (see graph/edgeModel.js).

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { DEFAULT_GROUP } from '../data/groups.js';
import { DEFAULT_CONNECTION_TYPE, PROFILE_DEFAULTS } from '../data/fieldTemplates.js';
import { makeTwoWay, directedId } from '../graph/edgeModel.js';

// The Admin node's id is a constant so every module can recognise "self".
export const ADMIN_ID = 'admin';

// Factory for the initial graph: just the Admin node, centred and alone.
// Kept as a function so "New graph" / first load start from a clean copy.
function initialGraph() {
  return {
    adminName: 'Me',
    nodes: [
      // The Admin node. `fixed` marks it un-deletable and pinned in physics.
      { id: ADMIN_ID, name: 'Me', group: 'self', fixed: true }
    ],
    edges: []
  };
}

export const useGraphStore = create((set, get) => ({
  ...initialGraph(),

  // Rename the Admin node. The label also feeds the saved filename, so we keep
  // the node's `name` and the top-level `adminName` in sync.
  setAdminName: (name) =>
    set((s) => ({
      adminName: name,
      nodes: s.nodes.map((n) => (n.id === ADMIN_ID ? { ...n, name } : n))
    })),

  // Add a person. MUST be called with the id of the node it branches from,
  // enforcing the "no orphan nodes" rule — the new person is born already
  // connected two-way (default neutral) to its origin.
  addPerson: (fromId) => {
    const origin = get().nodes.find((n) => n.id === fromId);
    if (!origin) return null; // guard: can't branch from a node that's gone
    const id = uuid();
    // Seed every profile field from the template (multi fields → [], single →
    // ''), then set the sensible non-empty defaults.
    const person = {
      id,
      ...PROFILE_DEFAULTS,
      name: 'New person',
      group: DEFAULT_GROUP,
      skills: [], // Speciality & Skills rows: { area, skill }
      notes: ''
    };
    set((s) => ({
      nodes: [...s.nodes, person],
      edges: [...s.edges, ...makeTwoWay(fromId, id, DEFAULT_CONNECTION_TYPE)]
    }));
    return id;
  },

  // Patch a person's fields. Ignores the Admin's structural flags; renaming the
  // Admin is routed through setAdminName instead to keep adminName in sync.
  updatePerson: (id, patch) => {
    if (id === ADMIN_ID && patch.name != null) {
      get().setAdminName(patch.name);
      const { name, ...rest } = patch;
      if (Object.keys(rest).length === 0) return;
      patch = rest;
    }
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n))
    }));
  },

  // Delete a person and every edge touching it. The Admin node is protected:
  // attempting to delete it is a no-op.
  deletePerson: (id) => {
    if (id === ADMIN_ID) return;
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id)
    }));
  },

  // Change the type of ONE directed edge (one arrow of a connection). The two
  // directions are edited independently, matching the two-arrow model.
  setEdgeType: (edgeId, type) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, type } : e))
    })),

  // Add a connection between two EXISTING nodes that aren't linked yet. Skips
  // any direction that already exists so we never create duplicate arrows.
  connect: (a, b, type = DEFAULT_CONNECTION_TYPE) =>
    set((s) => {
      const have = new Set(s.edges.map((e) => e.id));
      const fresh = makeTwoWay(a, b, type).filter((e) => !have.has(e.id));
      return { edges: [...s.edges, ...fresh] };
    }),

  // Remove a whole connection: BOTH directed edges between a and b (the ✕ in
  // the Network tab). Order-independent; leaves the two nodes in place.
  disconnect: (a, b) =>
    set((s) => ({
      edges: s.edges.filter(
        (e) =>
          !(e.source === a && e.target === b) && !(e.source === b && e.target === a)
      )
    })),

  // Replace the whole graph (used by "Upload Graph"). Defensive defaults keep
  // the app alive even if an older/edited file is missing pieces; the Admin
  // node is re-asserted so a malformed file can never leave us without it.
  replaceGraph: ({ adminName, nodes, edges }) => {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const hasAdmin = safeNodes.some((n) => n.id === ADMIN_ID);
    const finalNodes = hasAdmin
      ? safeNodes
      : [{ id: ADMIN_ID, name: adminName || 'Me', group: 'self', fixed: true }, ...safeNodes];
    set({
      adminName: adminName || 'Me',
      nodes: finalNodes,
      edges: Array.isArray(edges) ? edges : []
    });
  },

  // Reset to a brand-new single-Admin graph.
  resetGraph: () => set(initialGraph())
}));

// Re-export so callers building ad-hoc edges share the same id scheme.
export { directedId };
