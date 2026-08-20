// GraphCanvas — the interactive graph surface, in two modes.
//
// "none" mode (default): the Obsidian-style force graph. Every store node/edge
// is drawn, laid out as clique circles (see cliqueLayout) and refined by the
// cola physics. Positions are preserved across edits via incremental diffing.
//
// grouping modes (country / city / relation / importance): people are bucketed
// by one attribute (see groupLayout) and each bucket is drawn as a single
// collapsible BUBBLE around the Admin. Clicking a bubble expands it — the circle
// grows and reveals the hidden member nodes, connected as usual; clicking the
// faint expanded backdrop collapses it again. Physics is off here so the grouped
// view stays clean and deterministic.
//
// Look lives in cytoscapeStyles.js; geometry constants come from the Graph
// Formula settings so the user can tune the layout.

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { useGraphStore, ADMIN_ID } from '../state/graphStore.js';
import { useSettingsStore } from '../state/settingsStore.js';
import { cytoscapeStyles } from './cytoscapeStyles.js';
import { registerPhysics, buildColaOptions, pinAdmin } from './physics.js';
import { computeSeedPositions, ringRadius } from './cliqueLayout.js';
import { groupPeople } from './groupLayout.js';

// A signature of the graph's STRUCTURE (which nodes/edges exist), ignoring
// labels/types — used to re-seed the circle layout only when the shape changes.
function structureSignature(nodes, edges) {
  return `${nodes.map((n) => n.id).sort().join(',')}|${edges.map((e) => e.id).sort().join(',')}`;
}

// Store node → Cytoscape element (used for the Admin and real people).
function toNodeEl(n) {
  return {
    group: 'nodes',
    data: { id: n.id, label: n.name || 'Unnamed' },
    classes: n.id === ADMIN_ID ? 'admin' : ''
  };
}

// Store edge (already directed) → Cytoscape element.
function toEdgeEl(e) {
  return { group: 'edges', data: { id: e.id, source: e.source, target: e.target, type: e.type } };
}

export default function GraphCanvas({ onOpenPerson, onOpenEdge }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const layoutRef = useRef(null); // running cola layout (stopped before re-run)
  const sigRef = useRef(''); // last structure signature seeded (none mode)
  const modeRef = useRef('none'); // current grouping mode
  const expandedRef = useRef(new Set()); // group keys currently expanded
  const formulaRef = useRef(useSettingsStore.getState().formula);

  useEffect(() => {
    registerPhysics();
    const cy = cytoscape({
      container: containerRef.current,
      style: cytoscapeStyles,
      elements: [],
      minZoom: 0.15,
      maxZoom: 4,
      wheelSensitivity: 0.9
    });
    cyRef.current = cy;

    const center = () => ({ x: cy.width() / 2, y: cy.height() / 2 });

    // --- none mode: seed clique circles, then run physics -----------------
    const seedCircles = () => {
      const { nodes, edges } = useGraphStore.getState();
      const f = formulaRef.current;
      const pos = computeSeedPositions({
        nodes,
        edges,
        adminId: ADMIN_ID,
        center: center(),
        edgeLen: f.edgeLength,
        clusterGap: f.clusterGap
      });
      cy.batch(() => {
        for (const [id, p] of pos) {
          const el = cy.getElementById(id);
          if (!el.empty()) el.position(p);
        }
      });
      pinAdmin(cy, ADMIN_ID);
    };

    const runPhysics = () => {
      layoutRef.current?.stop();
      layoutRef.current = null;
      if (!formulaRef.current.physics) {
        pinAdmin(cy, ADMIN_ID);
        return;
      }
      layoutRef.current = cy.layout(buildColaOptions(formulaRef.current));
      layoutRef.current.run();
    };

    // Full rebuild of the ungrouped graph from the store.
    const renderNone = () => {
      layoutRef.current?.stop();
      const { nodes, edges } = useGraphStore.getState();
      cy.elements().remove();
      cy.add([...nodes.map(toNodeEl), ...edges.map(toEdgeEl)]);
      seedCircles();
      sigRef.current = structureSignature(nodes, edges);
      runPhysics();
    };

    // --- grouping modes: bubbles are real physics nodes -------------------
    // A collapsed group is a single node (styled like a normal node) that stands
    // in for everyone inside it. An expanded group is a compound container whose
    // children are the real member nodes. Edges are resolved to whichever end is
    // visible: two people in different collapsed groups yield ONE bubble↔bubble
    // edge; a visible member wired to someone in a collapsed group yields a
    // member↔bubble edge; two visible members yield a normal edge. Everything is
    // then laid out (seeded as clique circles) and run through the same cola
    // physics as ungrouped nodes, so bubbles drag and settle like nodes.
    const renderGrouped = () => {
      layoutRef.current?.stop();
      layoutRef.current = null;
      const { nodes, edges, adminName } = useGraphStore.getState();
      const f = formulaRef.current;
      const groups = groupPeople(nodes, modeRef.current);
      const c = center();
      const K = groups.length;
      const slotR = K === 0 ? 0 : f.groupRingRadius;

      // personId → its group key (for edge resolution).
      const groupOf = new Map();
      groups.forEach((g) => g.ids.forEach((id) => groupOf.set(id, g.key)));
      const bubbleId = (key) => `grp:${key}`;
      const isExpanded = (key) => expandedRef.current.has(key);
      // Resolve a person to the node that represents them right now.
      const rep = (personId) => {
        if (personId === ADMIN_ID) return ADMIN_ID;
        const gk = groupOf.get(personId);
        if (!gk) return personId;
        return isExpanded(gk) ? personId : bubbleId(gk);
      };

      cy.elements().remove();
      cy.add({ group: 'nodes', data: { id: ADMIN_ID, label: adminName || 'Me' }, classes: 'admin' });
      cy.getElementById(ADMIN_ID).position(c);

      // Add group nodes (collapsed bubble) or compound container + members, and
      // seed positions so the physics starts clean.
      groups.forEach((g, i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, K);
        const slot =
          K <= 1 ? { x: c.x, y: c.y - slotR } : { x: c.x + slotR * Math.cos(a), y: c.y + slotR * Math.sin(a) };

        if (isExpanded(g.key)) {
          // Compound parent (auto-sizes around its children) + member nodes.
          cy.add({
            group: 'nodes',
            data: { id: bubbleId(g.key), label: `${g.label} · ${g.ids.length}`, groupKey: g.key },
            classes: 'group expanded'
          });
          const r = ringRadius(g.ids.length, f.edgeLength);
          g.ids.forEach((id, j) => {
            const node = nodes.find((n) => n.id === id);
            cy.add({ group: 'nodes', data: { id, label: node?.name || 'Unnamed', parent: bubbleId(g.key) } });
            const t = -Math.PI / 2 + (2 * Math.PI * j) / g.ids.length;
            const p = g.ids.length === 1 ? slot : { x: slot.x + r * Math.cos(t), y: slot.y + r * Math.sin(t) };
            cy.getElementById(id).position(p);
          });
        } else {
          cy.add({
            group: 'nodes',
            data: { id: bubbleId(g.key), label: `${g.label} · ${g.ids.length}`, groupKey: g.key },
            classes: 'group'
          });
          cy.getElementById(bubbleId(g.key)).position(slot);
        }
      });

      // Resolve + dedupe edges by unordered representative pair.
      const seen = new Set();
      for (const e of edges) {
        const rs = rep(e.source);
        const rt = rep(e.target);
        if (rs === rt) continue; // internal to one collapsed bubble, or self
        const key = rs < rt ? `${rs}|${rt}` : `${rt}|${rs}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const aggregate = rs.startsWith('grp:') || rt.startsWith('grp:');
        cy.add({
          group: 'edges',
          data: { id: `ge:${key}`, source: rs, target: rt, type: e.type },
          classes: aggregate ? 'agg' : ''
        });
      }

      pinAdmin(cy, ADMIN_ID);
      // Same physics as ungrouped: run cola over the reduced graph.
      layoutRef.current = cy.layout(buildColaOptions(f));
      layoutRef.current.run();
    };

    // Toggle a group's expanded state (from a bubble tap) and re-render.
    const toggleGroup = (key) => {
      if (expandedRef.current.has(key)) expandedRef.current.delete(key);
      else expandedRef.current.add(key);
      renderGrouped();
    };

    // --- Initial render ----------------------------------------------------
    const settings = useSettingsStore.getState();
    modeRef.current = settings.graphMode;
    formulaRef.current = settings.formula;
    if (modeRef.current === 'none') renderNone();
    else renderGrouped();

    // --- Interaction wiring (bound once; survives element rebuilds) --------
    cy.on('tap', 'node', (evt) => {
      const el = evt.target;
      if (el.hasClass('group')) toggleGroup(el.data('groupKey'));
      else onOpenPerson(el.id());
    });
    cy.on('tap', 'edge', (evt) => onOpenEdge(evt.target.id()));
    const onResize = () => (modeRef.current === 'none' ? pinAdmin(cy, ADMIN_ID) : renderGrouped());
    cy.on('resize', onResize);

    // --- React to graph (store) changes -----------------------------------
    const unsubGraph = useGraphStore.subscribe((state) => {
      if (modeRef.current !== 'none') {
        renderGrouped();
        return;
      }
      // none mode: incremental diff so positions/physics are preserved.
      const wantNodes = new Map(state.nodes.map((n) => [n.id, n]));
      const wantEdges = new Map(state.edges.map((e) => [e.id, e]));
      cy.batch(() => {
        cy.nodes().forEach((el) => wantNodes.has(el.id()) || el.remove());
        cy.edges().forEach((el) => wantEdges.has(el.id()) || el.remove());
        for (const [id, n] of wantNodes) {
          const el = cy.getElementById(id);
          if (el.empty()) cy.add(toNodeEl(n));
          else if (el.data('label') !== (n.name || 'Unnamed')) el.data('label', n.name || 'Unnamed');
        }
        for (const [id, e] of wantEdges) {
          const el = cy.getElementById(id);
          if (el.empty()) cy.add(toEdgeEl(e));
          else if (el.data('type') !== e.type) el.data('type', e.type);
        }
      });
      const sig = structureSignature(state.nodes, state.edges);
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        seedCircles();
      } else {
        pinAdmin(cy, ADMIN_ID);
      }
      runPhysics();
    });

    // --- React to settings (mode / formula) changes -----------------------
    const unsubSettings = useSettingsStore.subscribe((s) => {
      const modeChanged = s.graphMode !== modeRef.current;
      const formulaChanged = JSON.stringify(s.formula) !== JSON.stringify(formulaRef.current);
      if (!modeChanged && !formulaChanged) return;
      formulaRef.current = s.formula;
      if (modeChanged) {
        modeRef.current = s.graphMode;
        expandedRef.current = new Set();
      }
      if (modeRef.current === 'none') renderNone();
      else renderGrouped();
    });

    return () => {
      unsubGraph();
      unsubSettings();
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step the zoom by a factor, anchored at the canvas centre.
  const zoomBy = (factor) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  return (
    <>
      <div ref={containerRef} className="graph-canvas" />
      <div className="zoom-controls">
        <button className="zoom-btn" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
          +
        </button>
        <button className="zoom-btn" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
          −
        </button>
      </div>
    </>
  );
}
