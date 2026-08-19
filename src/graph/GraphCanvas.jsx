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

    // --- grouping modes: bubbles around the Admin, expandable -------------
    const renderGrouped = (animateKey = null) => {
      layoutRef.current?.stop();
      layoutRef.current = null;
      const { nodes, edges, adminName } = useGraphStore.getState();
      const f = formulaRef.current;
      const groups = groupPeople(nodes, modeRef.current);
      const c = center();
      const K = groups.length;
      const slotR = K === 0 ? 0 : f.groupRingRadius;

      cy.elements().remove();
      cy.add({ group: 'nodes', data: { id: ADMIN_ID, label: adminName || 'Me' }, classes: 'admin' });

      const visible = new Set([ADMIN_ID]);
      const revealed = []; // {id, slot, target} for the group being expanded

      groups.forEach((g, i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, K);
        const slot =
          K <= 1
            ? { x: c.x, y: c.y - slotR }
            : { x: c.x + slotR * Math.cos(a), y: c.y + slotR * Math.sin(a) };

        if (expandedRef.current.has(g.key)) {
          // Faint expanded backdrop (also the click target to collapse).
          const r = ringRadius(g.ids.length, f.edgeLength);
          const backdrop = 2 * r + 90;
          cy.add({
            group: 'nodes',
            data: { id: `grp:${g.key}`, label: `${g.label} · ${g.ids.length}`, diam: backdrop, groupKey: g.key },
            classes: 'group expanded'
          });
          cy.getElementById(`grp:${g.key}`).position(slot).ungrabify();
          // Member nodes on a circle inside the backdrop.
          g.ids.forEach((id, j) => {
            const t = -Math.PI / 2 + (2 * Math.PI * j) / g.ids.length;
            const target = g.ids.length === 1 ? slot : { x: slot.x + r * Math.cos(t), y: slot.y + r * Math.sin(t) };
            const node = nodes.find((n) => n.id === id);
            cy.add(toNodeEl(node));
            cy.getElementById(id).position(target);
            visible.add(id);
            if (g.key === animateKey) revealed.push({ id, slot, target });
          });
        } else {
          // Collapsed bubble: one disc for the whole bucket.
          const diam = f.bubbleSize + Math.min(80, g.ids.length * 6);
          cy.add({
            group: 'nodes',
            data: { id: `grp:${g.key}`, label: `${g.label}\n${g.ids.length}`, diam, groupKey: g.key },
            classes: 'group'
          });
          cy.getElementById(`grp:${g.key}`).position(slot).ungrabify();
        }
      });

      cy.getElementById(ADMIN_ID).position(c).ungrabify();
      // Edges only between two currently-visible real nodes (keeps it clean).
      for (const e of edges) {
        if (visible.has(e.source) && visible.has(e.target)) cy.add(toEdgeEl(e));
      }
      pinAdmin(cy, ADMIN_ID);

      // Reveal animation: members grow out from the bubble's centre.
      if (revealed.length) {
        for (const { id, slot, target } of revealed) {
          const el = cy.getElementById(id);
          el.position(slot);
          el.style('opacity', 0);
          el.animate({ position: target, style: { opacity: 1 } }, { duration: f.expandMs, easing: 'ease-out' });
        }
      }
    };

    // Toggle a group's expanded state (from a bubble tap).
    const toggleGroup = (key) => {
      if (expandedRef.current.has(key)) {
        expandedRef.current.delete(key);
        renderGrouped(); // collapse instantly
      } else {
        expandedRef.current.add(key);
        renderGrouped(key); // expand with reveal animation
      }
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
